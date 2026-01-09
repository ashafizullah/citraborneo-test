const express = require('express')
const router = express.Router()
const { pool } = require('../db')
const { authenticateToken, authorizeAdmin } = require('../middleware/auth')

// Get all departments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*,
             COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      GROUP BY d.id
      ORDER BY d.name ASC
    `)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data departemen',
      error: error.message
    })
  }
})

// Get single department
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT d.*,
              COUNT(e.id) as employee_count
       FROM departments d
       LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
       WHERE d.id = $1
       GROUP BY d.id`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Departemen tidak ditemukan'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data departemen',
      error: error.message
    })
  }
})

// Create department
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama departemen wajib diisi'
      })
    }

    const result = await pool.query(
      'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    )

    res.status(201).json({
      success: true,
      message: 'Departemen berhasil ditambahkan',
      data: result.rows[0]
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Nama departemen sudah ada'
      })
    }
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan departemen',
      error: error.message
    })
  }
})

// Update department
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama departemen wajib diisi'
      })
    }

    const result = await pool.query(
      `UPDATE departments SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [name, description, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Departemen tidak ditemukan'
      })
    }

    res.json({
      success: true,
      message: 'Departemen berhasil diupdate',
      data: result.rows[0]
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Nama departemen sudah ada'
      })
    }
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate departemen',
      error: error.message
    })
  }
})

// Delete department
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'DELETE FROM departments WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Departemen tidak ditemukan'
      })
    }

    res.json({
      success: true,
      message: 'Departemen berhasil dihapus'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus departemen',
      error: error.message
    })
  }
})

module.exports = router
