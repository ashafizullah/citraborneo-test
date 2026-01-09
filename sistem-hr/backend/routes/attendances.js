const express = require('express')
const router = express.Router()
const { pool } = require('../db')
const { authenticateToken, authorizeAdmin } = require('../middleware/auth')

// Get all attendances (admin) or own attendances (employee)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { employee_id, start_date, end_date, status } = req.query
    let query = `
      SELECT a.*, e.name as employee_name, e.employee_code
      FROM attendances a
      JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `
    const params = []

    // If not admin, only show own attendances
    if (req.user.role !== 'admin' && req.user.employee_id) {
      params.push(req.user.employee_id)
      query += ` AND a.employee_id = $${params.length}`
    } else if (employee_id) {
      params.push(employee_id)
      query += ` AND a.employee_id = $${params.length}`
    }

    if (start_date) {
      params.push(start_date)
      query += ` AND a.date >= $${params.length}`
    }

    if (end_date) {
      params.push(end_date)
      query += ` AND a.date <= $${params.length}`
    }

    if (status) {
      params.push(status)
      query += ` AND a.status = $${params.length}`
    }

    query += ' ORDER BY a.date DESC, a.created_at DESC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data absensi',
      error: error.message
    })
  }
})

// Check in
router.post('/check-in', authenticateToken, async (req, res) => {
  try {
    const { employee_id } = req.body
    const targetEmployeeId = req.user.role === 'admin' ? employee_id : req.user.employee_id

    if (!targetEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID tidak ditemukan'
      })
    }

    const today = new Date().toISOString().split('T')[0]
    const currentTime = new Date().toTimeString().split(' ')[0]

    // Check if already checked in today
    const existCheck = await pool.query(
      'SELECT id, check_in FROM attendances WHERE employee_id = $1 AND date = $2',
      [targetEmployeeId, today]
    )

    if (existCheck.rows.length > 0 && existCheck.rows[0].check_in) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah check-in hari ini'
      })
    }

    let result
    if (existCheck.rows.length > 0) {
      result = await pool.query(
        `UPDATE attendances SET check_in = $1, status = 'present', updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 RETURNING *`,
        [currentTime, existCheck.rows[0].id]
      )
    } else {
      result = await pool.query(
        `INSERT INTO attendances (employee_id, date, check_in, status)
         VALUES ($1, $2, $3, 'present') RETURNING *`,
        [targetEmployeeId, today, currentTime]
      )
    }

    res.json({
      success: true,
      message: 'Check-in berhasil',
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal check-in',
      error: error.message
    })
  }
})

// Check out
router.post('/check-out', authenticateToken, async (req, res) => {
  try {
    const { employee_id } = req.body
    const targetEmployeeId = req.user.role === 'admin' ? employee_id : req.user.employee_id

    if (!targetEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID tidak ditemukan'
      })
    }

    const today = new Date().toISOString().split('T')[0]
    const currentTime = new Date().toTimeString().split(' ')[0]

    const existCheck = await pool.query(
      'SELECT id, check_in, check_out FROM attendances WHERE employee_id = $1 AND date = $2',
      [targetEmployeeId, today]
    )

    if (existCheck.rows.length === 0 || !existCheck.rows[0].check_in) {
      return res.status(400).json({
        success: false,
        message: 'Anda belum check-in hari ini'
      })
    }

    if (existCheck.rows[0].check_out) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah check-out hari ini'
      })
    }

    const result = await pool.query(
      `UPDATE attendances SET check_out = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [currentTime, existCheck.rows[0].id]
    )

    res.json({
      success: true,
      message: 'Check-out berhasil',
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal check-out',
      error: error.message
    })
  }
})

// Create attendance record (admin only)
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { employee_id, date, check_in, check_out, status, notes } = req.body

    if (!employee_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID dan tanggal wajib diisi'
      })
    }

    const result = await pool.query(
      `INSERT INTO attendances (employee_id, date, check_in, check_out, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employee_id, date, check_in, check_out, status || 'present', notes]
    )

    res.status(201).json({
      success: true,
      message: 'Data absensi berhasil ditambahkan',
      data: result.rows[0]
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Data absensi untuk tanggal ini sudah ada'
      })
    }
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data absensi',
      error: error.message
    })
  }
})

// Update attendance (admin only)
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { check_in, check_out, status, notes } = req.body

    const result = await pool.query(
      `UPDATE attendances SET check_in = $1, check_out = $2, status = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [check_in, check_out, status, notes, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data absensi tidak ditemukan'
      })
    }

    res.json({
      success: true,
      message: 'Data absensi berhasil diupdate',
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate data absensi',
      error: error.message
    })
  }
})

// Delete attendance (admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'DELETE FROM attendances WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data absensi tidak ditemukan'
      })
    }

    res.json({
      success: true,
      message: 'Data absensi berhasil dihapus'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data absensi',
      error: error.message
    })
  }
})

// Export attendances to CSV
router.get('/export/csv', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { employee_id, start_date, end_date, status } = req.query
    let query = `
      SELECT a.date, a.check_in, a.check_out, a.status, a.notes,
             e.employee_code, e.name as employee_name
      FROM attendances a
      JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `
    const params = []

    if (employee_id) {
      params.push(employee_id)
      query += ` AND a.employee_id = $${params.length}`
    }

    if (start_date) {
      params.push(start_date)
      query += ` AND a.date >= $${params.length}`
    }

    if (end_date) {
      params.push(end_date)
      query += ` AND a.date <= $${params.length}`
    }

    if (status) {
      params.push(status)
      query += ` AND a.status = $${params.length}`
    }

    query += ' ORDER BY a.date DESC, e.employee_code ASC'

    const result = await pool.query(query, params)

    // Build CSV
    const headers = ['Tanggal', 'Kode Karyawan', 'Nama Karyawan', 'Check In', 'Check Out', 'Status', 'Catatan']
    const csvRows = [headers.join(',')]

    const statusLabels = {
      present: 'Hadir',
      absent: 'Tidak Hadir',
      late: 'Terlambat',
      leave: 'Cuti'
    }

    for (const row of result.rows) {
      const values = [
        new Date(row.date).toLocaleDateString('id-ID'),
        row.employee_code,
        `"${(row.employee_name || '').replace(/"/g, '""')}"`,
        row.check_in || '-',
        row.check_out || '-',
        statusLabels[row.status] || row.status,
        `"${(row.notes || '').replace(/"/g, '""')}"`
      ]
      csvRows.push(values.join(','))
    }

    const csv = csvRows.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=absensi_${new Date().toISOString().split('T')[0]}.csv`)
    res.send('\uFEFF' + csv)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal export data absensi',
      error: error.message
    })
  }
})

// Get today's attendance status
router.get('/today/status', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.employee_id

    if (!employeeId) {
      return res.json({
        success: true,
        data: null,
        message: 'User tidak terhubung dengan data karyawan'
      })
    }

    const today = new Date().toISOString().split('T')[0]
    const result = await pool.query(
      'SELECT * FROM attendances WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    )

    res.json({
      success: true,
      data: result.rows[0] || null
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil status absensi',
      error: error.message
    })
  }
})

module.exports = router
