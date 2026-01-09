const request = require('supertest')
const app = require('../app')
const { pool } = require('../db')

describe('Items API', () => {
  // Helper to clean and seed test data
  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE items RESTART IDENTITY CASCADE')
  })

  describe('GET /api/items', () => {
    it('should return all items', async () => {
      // Seed test data
      await pool.query(
        "INSERT INTO items (item_name, stock, unit) VALUES ('Item 1', 10, 'Pcs'), ('Item 2', 5, 'Roll')"
      )

      const response = await request(app)
        .get('/api/items')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0].item_name).toBe('Item 1')
      expect(response.body.data[1].item_name).toBe('Item 2')
    })

    it('should return empty array when no items', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(0)
    })
  })

  describe('GET /api/items/:id', () => {
    it('should return single item', async () => {
      const result = await pool.query(
        "INSERT INTO items (item_name, stock, unit) VALUES ('Test Item', 10, 'Pcs') RETURNING *"
      )
      const itemId = result.rows[0].id

      const response = await request(app)
        .get(`/api/items/${itemId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.item_name).toBe('Test Item')
      expect(response.body.data.stock).toBe(10)
    })

    it('should return 404 if item not found', async () => {
      const response = await request(app)
        .get('/api/items/999')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Barang tidak ditemukan')
    })
  })

  describe('POST /api/items', () => {
    it('should create new item', async () => {
      const newItem = { item_name: 'New Item', stock: 15, unit: 'Pcs' }

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Barang berhasil ditambahkan')
      expect(response.body.data.item_name).toBe('New Item')
      expect(response.body.data.stock).toBe(15)

      // Verify in database
      const dbResult = await pool.query('SELECT * FROM items WHERE item_name = $1', ['New Item'])
      expect(dbResult.rows).toHaveLength(1)
    })

    it('should return 400 if required fields missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ item_name: 'Test' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Nama barang, stok, dan satuan wajib diisi')
    })

    it('should return 400 if stock is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ item_name: 'Test', unit: 'Pcs' })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should handle stock value of 0', async () => {
      const newItem = { item_name: 'Zero Stock Item', stock: 0, unit: 'Pcs' }

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.stock).toBe(0)
    })
  })

  describe('POST /api/items/sync', () => {
    it('should sync items from external API - insert new items', async () => {
      const externalItems = [
        { id: 100, item_name: 'External Item 1', stock: 10, unit: 'Pcs' },
        { id: 101, item_name: 'External Item 2', stock: 5, unit: 'Roll' }
      ]

      const response = await request(app)
        .post('/api/items/sync')
        .send({ items: externalItems })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('2 barang baru disinkronkan')
      expect(response.body.synced).toBe(2)

      // Verify in database
      const dbResult = await pool.query('SELECT * FROM items ORDER BY external_id')
      expect(dbResult.rows).toHaveLength(2)
      expect(dbResult.rows[0].external_id).toBe(100)
      expect(dbResult.rows[1].external_id).toBe(101)
    })

    it('should sync items - update existing items', async () => {
      // Insert item with external_id first
      await pool.query(
        "INSERT INTO items (item_name, stock, unit, external_id) VALUES ('Old Name', 5, 'Pcs', 100)"
      )

      const externalItems = [
        { id: 100, item_name: 'Updated Name', stock: 20, unit: 'Box' }
      ]

      const response = await request(app)
        .post('/api/items/sync')
        .send({ items: externalItems })
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify update in database
      const dbResult = await pool.query('SELECT * FROM items WHERE external_id = $1', [100])
      expect(dbResult.rows[0].item_name).toBe('Updated Name')
      expect(dbResult.rows[0].stock).toBe(20)
      expect(dbResult.rows[0].unit).toBe('Box')
    })

    it('should return 400 if items array is invalid', async () => {
      const response = await request(app)
        .post('/api/items/sync')
        .send({ items: 'invalid' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Data items tidak valid')
    })

    it('should handle empty array', async () => {
      const response = await request(app)
        .post('/api/items/sync')
        .send({ items: [] })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.synced).toBe(0)
    })
  })

  describe('PUT /api/items/:id', () => {
    it('should update existing item', async () => {
      const result = await pool.query(
        "INSERT INTO items (item_name, stock, unit) VALUES ('Original', 10, 'Pcs') RETURNING *"
      )
      const itemId = result.rows[0].id

      const updatedItem = { item_name: 'Updated Item', stock: 20, unit: 'Box' }

      const response = await request(app)
        .put(`/api/items/${itemId}`)
        .send(updatedItem)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Barang berhasil diupdate')
      expect(response.body.data.item_name).toBe('Updated Item')

      // Verify in database
      const dbResult = await pool.query('SELECT * FROM items WHERE id = $1', [itemId])
      expect(dbResult.rows[0].stock).toBe(20)
      expect(dbResult.rows[0].unit).toBe('Box')
    })

    it('should return 404 if item not found', async () => {
      const response = await request(app)
        .put('/api/items/999')
        .send({ item_name: 'Test', stock: 10, unit: 'Pcs' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Barang tidak ditemukan')
    })

    it('should return 400 if required fields missing', async () => {
      const result = await pool.query(
        "INSERT INTO items (item_name, stock, unit) VALUES ('Test', 10, 'Pcs') RETURNING *"
      )
      const itemId = result.rows[0].id

      const response = await request(app)
        .put(`/api/items/${itemId}`)
        .send({ item_name: 'Test' })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/items/:id', () => {
    it('should delete item', async () => {
      const result = await pool.query(
        "INSERT INTO items (item_name, stock, unit) VALUES ('To Delete', 10, 'Pcs') RETURNING *"
      )
      const itemId = result.rows[0].id

      const response = await request(app)
        .delete(`/api/items/${itemId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Barang berhasil dihapus')

      // Verify deletion
      const dbResult = await pool.query('SELECT * FROM items WHERE id = $1', [itemId])
      expect(dbResult.rows).toHaveLength(0)
    })

    it('should return 404 if item not found', async () => {
      const response = await request(app)
        .delete('/api/items/999')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Barang tidak ditemukan')
    })
  })
})

describe('Health Check API', () => {
  it('should return OK status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)

    expect(response.body.status).toBe('OK')
    expect(response.body.message).toBe('Server is running')
  })
})
