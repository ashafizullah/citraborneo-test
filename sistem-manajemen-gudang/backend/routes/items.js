const express = require('express')
const router = express.Router()
const { pool } = require('../db')

// Get all items with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ''
    const offset = (page - 1) * limit

    let whereClause = ''
    const params = []

    if (search) {
      params.push(`%${search}%`)
      whereClause = `WHERE item_name ILIKE $${params.length}`
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM items ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limit)

    // Get items with pagination
    const dataParams = [...params, limit, offset]
    const result = await pool.query(
      `SELECT * FROM items ${whereClause} ORDER BY id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams
    )

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data barang',
      error: error.message
    })
  }
})

// Get single item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data barang',
      error: error.message
    })
  }
})

// Create new item
router.post('/', async (req, res) => {
  try {
    const { item_name, stock, unit } = req.body

    if (!item_name || stock === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang, stok, dan satuan wajib diisi'
      })
    }

    const result = await pool.query(
      'INSERT INTO items (item_name, stock, unit) VALUES ($1, $2, $3) RETURNING *',
      [item_name, stock, unit]
    )

    res.status(201).json({
      success: true,
      message: 'Barang berhasil ditambahkan',
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan barang',
      error: error.message
    })
  }
})

// Sync items from external API
router.post('/sync', async (req, res) => {
  try {
    const { items } = req.body

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Data items tidak valid'
      })
    }

    let syncedCount = 0
    for (const item of items) {
      // Check if item with external_id already exists
      const existing = await pool.query(
        'SELECT id FROM items WHERE external_id = $1',
        [item.id]
      )

      if (existing.rows.length === 0) {
        // Insert new item
        await pool.query(
          'INSERT INTO items (item_name, stock, unit, external_id) VALUES ($1, $2, $3, $4)',
          [item.item_name, item.stock, item.unit, item.id]
        )
        syncedCount++
      } else {
        // Update existing item
        await pool.query(
          'UPDATE items SET item_name = $1, stock = $2, unit = $3, updated_at = CURRENT_TIMESTAMP WHERE external_id = $4',
          [item.item_name, item.stock, item.unit, item.id]
        )
      }
    }

    res.json({
      success: true,
      message: `${syncedCount} barang baru disinkronkan`,
      synced: syncedCount
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menyinkronkan data',
      error: error.message
    })
  }
})

// Update item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { item_name, stock, unit } = req.body

    if (!item_name || stock === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang, stok, dan satuan wajib diisi'
      })
    }

    const result = await pool.query(
      'UPDATE items SET item_name = $1, stock = $2, unit = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [item_name, stock, unit, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan'
      })
    }

    res.json({
      success: true,
      message: 'Barang berhasil diupdate',
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate barang',
      error: error.message
    })
  }
})

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan'
      })
    }

    res.json({
      success: true,
      message: 'Barang berhasil dihapus'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus barang',
      error: error.message
    })
  }
})

module.exports = router
