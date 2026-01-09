const express = require('express')
const router = express.Router()
const { pool } = require('../db')
const { authenticateToken, authorizeAdmin } = require('../middleware/auth')

// Get all positions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { department_id } = req.query
    let query = `
      SELECT p.*, d.name as department_name,
             COUNT(e.id) as employee_count
      FROM positions p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN employees e ON p.id = e.position_id AND e.status = 'active'
    `
    const params = []

    if (department_id) {
      params.push(department_id)
      query += ` WHERE p.department_id = $${params.length}`
    }

    query += ' GROUP BY p.id, d.name ORDER BY p.name ASC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jabatan',
      error: error.message
    })
  }
})

// Get single position
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT p.*, d.name as department_name
       FROM positions p
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE p.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jabatan tidak ditemukan'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jabatan',
      error: error.message
    })
  }
})

// Create position
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { name, department_id, description } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama jabatan wajib diisi'
      })
    }

    const result = await pool.query(
      'INSERT INTO positions (name, department_id, description) VALUES ($1, $2, $3) RETURNING *',
      [name, department_id || null, description]
    )

    res.status(201).json({
      success: true,
      message: 'Jabatan berhasil ditambahkan',
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan jabatan',
      error: error.message
    })
  }
})

// Update position
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, department_id, description } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama jabatan wajib diisi'
      })
    }

    const result = await pool.query(
      `UPDATE positions SET name = $1, department_id = $2, description = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [name, department_id || null, description, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jabatan tidak ditemukan'
      })
    }

    res.json({
      success: true,
      message: 'Jabatan berhasil diupdate',
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate jabatan',
      error: error.message
    })
  }
})

// Delete position
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'DELETE FROM positions WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jabatan tidak ditemukan'
      })
    }

    res.json({
      success: true,
      message: 'Jabatan berhasil dihapus'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus jabatan',
      error: error.message
    })
  }
})

module.exports = router
