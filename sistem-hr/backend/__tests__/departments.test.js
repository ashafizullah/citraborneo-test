const request = require('supertest')
const app = require('../app')
const { pool } = require('../db')
const { generateTestToken, generateEmployeeToken } = require('./helpers')

describe('Departments API', () => {
  let adminToken
  let employeeToken

  beforeAll(() => {
    adminToken = generateTestToken()
    employeeToken = generateEmployeeToken()
  })

  describe('GET /api/departments', () => {
    it('should return all departments', async () => {
      const response = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBeGreaterThanOrEqual(1)
      expect(response.body.data[0]).toHaveProperty('name')
    })

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/departments')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/departments/:id', () => {
    it('should return single department', async () => {
      const response = await request(app)
        .get(`/api/departments/${global.testData.departmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Test Department')
    })

    it('should return 404 if department not found', async () => {
      const response = await request(app)
        .get('/api/departments/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/departments', () => {
    it('should create new department (admin only)', async () => {
      const newDept = { name: 'New Test Department', description: 'Test description' }

      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newDept)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Departemen berhasil ditambahkan')

      // Verify in database
      const dbResult = await pool.query('SELECT * FROM departments WHERE name = $1', ['New Test Department'])
      expect(dbResult.rows.length).toBe(1)

      // Cleanup
      await pool.query('DELETE FROM departments WHERE name = $1', ['New Test Department'])
    })

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'No name' })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 if department name already exists', async () => {
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Department', description: 'Duplicate' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Nama departemen sudah ada')
    })

    it('should return 403 if not admin', async () => {
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Test', description: 'Test' })
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/departments/:id', () => {
    it('should update department (admin only)', async () => {
      // Create a department to update
      const createResult = await pool.query(
        "INSERT INTO departments (name, description) VALUES ('Dept To Update', 'Original') RETURNING id"
      )
      const deptId = createResult.rows[0].id

      const response = await request(app)
        .put(`/api/departments/${deptId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Department', description: 'Updated description' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Departemen berhasil diupdate')

      // Verify in database
      const dbResult = await pool.query('SELECT * FROM departments WHERE id = $1', [deptId])
      expect(dbResult.rows[0].name).toBe('Updated Department')

      // Cleanup
      await pool.query('DELETE FROM departments WHERE id = $1', [deptId])
    })

    it('should return 404 if department not found', async () => {
      const response = await request(app)
        .put('/api/departments/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test', description: 'Test' })
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/departments/:id', () => {
    it('should delete department (admin only)', async () => {
      // Create a department to delete
      const createResult = await pool.query(
        "INSERT INTO departments (name, description) VALUES ('Dept To Delete', 'Delete me') RETURNING id"
      )
      const deptId = createResult.rows[0].id

      const response = await request(app)
        .delete(`/api/departments/${deptId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Departemen berhasil dihapus')

      // Verify deletion
      const dbResult = await pool.query('SELECT * FROM departments WHERE id = $1', [deptId])
      expect(dbResult.rows.length).toBe(0)
    })

    it('should return 404 if department not found', async () => {
      const response = await request(app)
        .delete('/api/departments/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })

    it('should return 403 if not admin', async () => {
      const response = await request(app)
        .delete(`/api/departments/${global.testData.departmentId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })
})
