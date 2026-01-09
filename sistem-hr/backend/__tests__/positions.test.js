const request = require('supertest')
const app = require('../app')
const { pool } = require('../db')
const { generateTestToken, generateEmployeeToken } = require('./helpers')

describe('Positions API', () => {
  let adminToken
  let employeeToken

  beforeAll(() => {
    adminToken = generateTestToken()
    employeeToken = generateEmployeeToken()
  })

  describe('GET /api/positions', () => {
    it('should return all positions', async () => {
      const response = await request(app)
        .get('/api/positions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBeGreaterThanOrEqual(1)
    })

    it('should filter positions by department_id', async () => {
      const response = await request(app)
        .get(`/api/positions?department_id=${global.testData.departmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /api/positions/:id', () => {
    it('should return single position', async () => {
      const response = await request(app)
        .get(`/api/positions/${global.testData.positionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Test Position')
    })

    it('should return 404 if position not found', async () => {
      const response = await request(app)
        .get('/api/positions/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/positions', () => {
    it('should create new position (admin only)', async () => {
      const newPosition = {
        name: 'New Test Position',
        department_id: global.testData.departmentId,
        description: 'Test position'
      }

      const response = await request(app)
        .post('/api/positions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newPosition)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Jabatan berhasil ditambahkan')

      // Cleanup
      await pool.query('DELETE FROM positions WHERE name = $1', ['New Test Position'])
    })

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/positions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ department_id: 1 })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 403 if not admin', async () => {
      const response = await request(app)
        .post('/api/positions')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Test', department_id: 1 })
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/positions/:id', () => {
    it('should update position (admin only)', async () => {
      // Create position to update
      const createResult = await pool.query(
        'INSERT INTO positions (name, department_id, description) VALUES ($1, $2, $3) RETURNING id',
        ['Position To Update', global.testData.departmentId, 'Original']
      )
      const posId = createResult.rows[0].id

      const response = await request(app)
        .put(`/api/positions/${posId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Position', department_id: global.testData.departmentId, description: 'Updated' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Jabatan berhasil diupdate')

      // Cleanup
      await pool.query('DELETE FROM positions WHERE id = $1', [posId])
    })

    it('should return 404 if position not found', async () => {
      const response = await request(app)
        .put('/api/positions/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test', department_id: 1 })
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/positions/:id', () => {
    it('should delete position (admin only)', async () => {
      // Create position to delete
      const createResult = await pool.query(
        'INSERT INTO positions (name, department_id, description) VALUES ($1, $2, $3) RETURNING id',
        ['Position To Delete', global.testData.departmentId, 'Delete me']
      )
      const posId = createResult.rows[0].id

      const response = await request(app)
        .delete(`/api/positions/${posId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Jabatan berhasil dihapus')
    })

    it('should return 404 if position not found', async () => {
      const response = await request(app)
        .delete('/api/positions/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })
})
