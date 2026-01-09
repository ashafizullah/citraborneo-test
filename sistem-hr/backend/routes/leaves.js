const express = require('express')
const router = express.Router()
const { pool } = require('../db')
const { authenticateToken, authorizeAdmin } = require('../middleware/auth')

// Get all leaves
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { employee_id, status, start_date, end_date } = req.query
    let query = `
      SELECT l.*, e.name as employee_name, e.employee_code,
             u.name as approved_by_name
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      LEFT JOIN users u ON l.approved_by = u.id
      WHERE 1=1
    `
    const params = []

    // If not admin, only show own leaves
    if (req.user.role !== 'admin' && req.user.employee_id) {
      params.push(req.user.employee_id)
      query += ` AND l.employee_id = $${params.length}`
    } else if (employee_id) {
      params.push(employee_id)
      query += ` AND l.employee_id = $${params.length}`
    }

    if (status) {
      params.push(status)
      query += ` AND l.status = $${params.length}`
    }

    if (start_date) {
      params.push(start_date)
      query += ` AND l.start_date >= $${params.length}`
    }

    if (end_date) {
      params.push(end_date)
      query += ` AND l.end_date <= $${params.length}`
    }

    query += ' ORDER BY l.created_at DESC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data cuti',
      error: error.message
    })
  }
})

// Export leaves to CSV
router.get('/export/csv', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { employee_id, status, start_date, end_date } = req.query
    let query = `
      SELECT l.leave_type, l.start_date, l.end_date, l.reason, l.status,
             l.created_at, l.approved_at,
             e.employee_code, e.name as employee_name,
             u.name as approved_by_name
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      LEFT JOIN users u ON l.approved_by = u.id
      WHERE 1=1
    `
    const params = []

    if (employee_id) {
      params.push(employee_id)
      query += ` AND l.employee_id = $${params.length}`
    }

    if (status) {
      params.push(status)
      query += ` AND l.status = $${params.length}`
    }

    if (start_date) {
      params.push(start_date)
      query += ` AND l.start_date >= $${params.length}`
    }

    if (end_date) {
      params.push(end_date)
      query += ` AND l.end_date <= $${params.length}`
    }

    query += ' ORDER BY l.created_at DESC'

    const result = await pool.query(query, params)

    // Build CSV
    const headers = ['Kode Karyawan', 'Nama Karyawan', 'Jenis Cuti', 'Tanggal Mulai', 'Tanggal Selesai', 'Alasan', 'Status', 'Tanggal Pengajuan', 'Diproses Oleh', 'Tanggal Diproses']
    const csvRows = [headers.join(',')]

    const leaveTypeLabels = {
      annual: 'Cuti Tahunan',
      sick: 'Cuti Sakit',
      maternity: 'Cuti Melahirkan',
      unpaid: 'Cuti Tanpa Gaji',
      other: 'Lainnya'
    }

    const statusLabels = {
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak'
    }

    for (const row of result.rows) {
      const values = [
        row.employee_code,
        `"${(row.employee_name || '').replace(/"/g, '""')}"`,
        leaveTypeLabels[row.leave_type] || row.leave_type,
        new Date(row.start_date).toLocaleDateString('id-ID'),
        new Date(row.end_date).toLocaleDateString('id-ID'),
        `"${(row.reason || '').replace(/"/g, '""')}"`,
        statusLabels[row.status] || row.status,
        new Date(row.created_at).toLocaleDateString('id-ID'),
        row.approved_by_name || '-',
        row.approved_at ? new Date(row.approved_at).toLocaleDateString('id-ID') : '-'
      ]
      csvRows.push(values.join(','))
    }

    const csv = csvRows.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=cuti_${new Date().toISOString().split('T')[0]}.csv`)
    res.send('\uFEFF' + csv)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal export data cuti',
      error: error.message
    })
  }
})

// Get single leave
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT l.*, e.name as employee_name, e.employee_code,
              u.name as approved_by_name
       FROM leaves l
       JOIN employees e ON l.employee_id = e.id
       LEFT JOIN users u ON l.approved_by = u.id
       WHERE l.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data cuti tidak ditemukan'
      })
    }

    // Check authorization
    const leave = result.rows[0]
    if (req.user.role !== 'admin' && leave.employee_id !== req.user.employee_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke data ini'
      })
    }

    res.json({
      success: true,
      data: leave
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data cuti',
      error: error.message
    })
  }
})

// Create leave request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body

    // Use own employee_id if not admin
    const targetEmployeeId = req.user.role === 'admin'
      ? employee_id
      : req.user.employee_id

    if (!targetEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID tidak ditemukan'
      })
    }

    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Jenis cuti, tanggal mulai, dan tanggal selesai wajib diisi'
      })
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal mulai tidak boleh lebih dari tanggal selesai'
      })
    }

    const result = await pool.query(
      `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [targetEmployeeId, leave_type, start_date, end_date, reason]
    )

    res.status(201).json({
      success: true,
      message: 'Pengajuan cuti berhasil dibuat',
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal membuat pengajuan cuti',
      error: error.message
    })
  }
})

// Approve/Reject leave (admin only)
router.put('/:id/approve', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus approved atau rejected'
      })
    }

    // Check if leave exists and is pending
    const leaveCheck = await pool.query(
      'SELECT status FROM leaves WHERE id = $1',
      [id]
    )

    if (leaveCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data cuti tidak ditemukan'
      })
    }

    if (leaveCheck.rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cuti ini sudah diproses sebelumnya'
      })
    }

    const result = await pool.query(
      `UPDATE leaves SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [status, req.user.id, id]
    )

    res.json({
      success: true,
      message: `Cuti berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`,
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memproses cuti',
      error: error.message
    })
  }
})

// Update leave (only if pending)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { leave_type, start_date, end_date, reason } = req.body

    // Check if leave exists and is pending
    const leaveCheck = await pool.query(
      'SELECT employee_id, status FROM leaves WHERE id = $1',
      [id]
    )

    if (leaveCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data cuti tidak ditemukan'
      })
    }

    const leave = leaveCheck.rows[0]

    // Check authorization
    if (req.user.role !== 'admin' && leave.employee_id !== req.user.employee_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk mengubah data ini'
      })
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cuti yang sudah diproses tidak dapat diubah'
      })
    }

    const result = await pool.query(
      `UPDATE leaves SET leave_type = $1, start_date = $2, end_date = $3, reason = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [leave_type, start_date, end_date, reason, id]
    )

    res.json({
      success: true,
      message: 'Data cuti berhasil diupdate',
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate data cuti',
      error: error.message
    })
  }
})

// Delete leave (only if pending)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if leave exists and is pending
    const leaveCheck = await pool.query(
      'SELECT employee_id, status FROM leaves WHERE id = $1',
      [id]
    )

    if (leaveCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data cuti tidak ditemukan'
      })
    }

    const leave = leaveCheck.rows[0]

    // Check authorization
    if (req.user.role !== 'admin' && leave.employee_id !== req.user.employee_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menghapus data ini'
      })
    }

    if (leave.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cuti yang sudah diproses tidak dapat dihapus'
      })
    }

    await pool.query('DELETE FROM leaves WHERE id = $1', [id])

    res.json({
      success: true,
      message: 'Data cuti berhasil dihapus'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data cuti',
      error: error.message
    })
  }
})

module.exports = router
