const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const { pool } = require('../db')
const { authenticateToken, authorizeAdmin } = require('../middleware/auth')

// Get all employees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, department_id, status } = req.query
    let query = `
      SELECT e.*, d.name as department_name, p.name as position_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE 1=1
    `
    const params = []

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (e.name ILIKE $${params.length} OR e.employee_code ILIKE $${params.length} OR e.email ILIKE $${params.length})`
    }

    if (department_id) {
      params.push(department_id)
      query += ` AND e.department_id = $${params.length}`
    }

    if (status) {
      params.push(status)
      query += ` AND e.status = $${params.length}`
    }

    query += ' ORDER BY e.created_at DESC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data karyawan',
      error: error.message
    })
  }
})

// Get single employee
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT e.*, d.name as department_name, p.name as position_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE e.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Karyawan tidak ditemukan'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data karyawan',
      error: error.message
    })
  }
})

// Create employee
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const {
      employee_code,
      name,
      email,
      phone,
      address,
      date_of_birth,
      hire_date,
      department_id,
      position_id,
      create_user_account,
      password
    } = req.body

    if (!employee_code || !name || !email || !hire_date) {
      return res.status(400).json({
        success: false,
        message: 'Kode karyawan, nama, email, dan tanggal masuk wajib diisi'
      })
    }

    // Check duplicate employee_code or email
    const duplicateCheck = await client.query(
      'SELECT id FROM employees WHERE employee_code = $1 OR email = $2',
      [employee_code, email]
    )

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Kode karyawan atau email sudah digunakan'
      })
    }

    // Insert employee
    const employeeResult = await client.query(
      `INSERT INTO employees
       (employee_code, name, email, phone, address, date_of_birth, hire_date, department_id, position_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [employee_code, name, email, phone, address, date_of_birth, hire_date, department_id || null, position_id || null]
    )

    const employee = employeeResult.rows[0]

    // Create user account if requested
    if (create_user_account && password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      await client.query(
        `INSERT INTO users (email, password, name, role, employee_id)
         VALUES ($1, $2, $3, 'employee', $4)`,
        [email, hashedPassword, name, employee.id]
      )
    }

    await client.query('COMMIT')

    res.status(201).json({
      success: true,
      message: 'Karyawan berhasil ditambahkan',
      data: employee
    })
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan karyawan',
      error: error.message
    })
  } finally {
    client.release()
  }
})

// Update employee
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const {
      employee_code,
      name,
      email,
      phone,
      address,
      date_of_birth,
      hire_date,
      department_id,
      position_id,
      status
    } = req.body

    // Check if employee exists
    const existCheck = await pool.query(
      'SELECT id FROM employees WHERE id = $1',
      [id]
    )

    if (existCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Karyawan tidak ditemukan'
      })
    }

    // Check duplicate employee_code or email
    const duplicateCheck = await pool.query(
      'SELECT id FROM employees WHERE (employee_code = $1 OR email = $2) AND id != $3',
      [employee_code, email, id]
    )

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Kode karyawan atau email sudah digunakan'
      })
    }

    const result = await pool.query(
      `UPDATE employees SET
       employee_code = $1, name = $2, email = $3, phone = $4, address = $5,
       date_of_birth = $6, hire_date = $7, department_id = $8, position_id = $9,
       status = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [employee_code, name, email, phone, address, date_of_birth, hire_date, department_id || null, position_id || null, status, id]
    )

    res.json({
      success: true,
      message: 'Data karyawan berhasil diupdate',
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate karyawan',
      error: error.message
    })
  }
})

// Export employees to CSV
router.get('/export/csv', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { department_id, status } = req.query
    let query = `
      SELECT e.employee_code, e.name, e.email, e.phone, e.address,
             e.date_of_birth, e.hire_date, e.status,
             d.name as department_name, p.name as position_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE 1=1
    `
    const params = []

    if (department_id) {
      params.push(department_id)
      query += ` AND e.department_id = $${params.length}`
    }

    if (status) {
      params.push(status)
      query += ` AND e.status = $${params.length}`
    }

    query += ' ORDER BY e.employee_code ASC'

    const result = await pool.query(query, params)

    // Build CSV
    const headers = ['Kode Karyawan', 'Nama', 'Email', 'Telepon', 'Alamat', 'Tanggal Lahir', 'Tanggal Masuk', 'Departemen', 'Jabatan', 'Status']
    const csvRows = [headers.join(',')]

    for (const row of result.rows) {
      const values = [
        row.employee_code,
        `"${(row.name || '').replace(/"/g, '""')}"`,
        row.email,
        row.phone || '',
        `"${(row.address || '').replace(/"/g, '""')}"`,
        row.date_of_birth ? new Date(row.date_of_birth).toLocaleDateString('id-ID') : '',
        row.hire_date ? new Date(row.hire_date).toLocaleDateString('id-ID') : '',
        row.department_name || '',
        row.position_name || '',
        row.status === 'active' ? 'Aktif' : 'Tidak Aktif'
      ]
      csvRows.push(values.join(','))
    }

    const csv = csvRows.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=karyawan_${new Date().toISOString().split('T')[0]}.csv`)
    res.send('\uFEFF' + csv) // BOM for Excel UTF-8 support
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal export data karyawan',
      error: error.message
    })
  }
})

// Delete employee
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'DELETE FROM employees WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Karyawan tidak ditemukan'
      })
    }

    res.json({
      success: true,
      message: 'Karyawan berhasil dihapus'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus karyawan',
      error: error.message
    })
  }
})

module.exports = router
