const request = require('supertest')
const app = require('../app')
const { pool } = require('../db')
const { generateTestToken, generateEmployeeToken } = require('./helpers')

describe('Employees API', () => {
  let adminToken
  let employeeToken

  beforeAll(() => {
    adminToken = generateTestToken()
    employeeToken = generateEmployeeToken()
  })

  describe('GET /api/employees', () => {
    it('should return all employees', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBeGreaterThanOrEqual(1)
    })

    it('should filter employees by search', async () => {
      const response = await request(app)
        .get('/api/employees?search=Test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/employees')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/employees/:id', () => {
    it('should return single employee', async () => {
      const response = await request(app)
        .get(`/api/employees/${global.testData.employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Test Employee')
    })

    it('should return 404 if employee not found', async () => {
      const response = await request(app)
        .get('/api/employees/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Karyawan tidak ditemukan')
    })
  })

  describe('POST /api/employees', () => {
    it('should create new employee (admin only)', async () => {
      const newEmployee = {
        employee_code: 'NEW001',
        name: 'New Employee',
        email: 'new.employee@test.com',
        hire_date: '2024-01-01'
      }

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newEmployee)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Karyawan berhasil ditambahkan')

      // Cleanup
      await pool.query('DELETE FROM users WHERE email = $1', ['new.employee@test.com'])
      await pool.query('DELETE FROM employees WHERE employee_code = $1', ['NEW001'])
    })

    it('should return 400 if required fields missing', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 403 if not admin', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employee_code: 'NEW002',
          name: 'New Employee',
          email: 'new2@test.com',
          hire_date: '2024-01-01'
        })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Akses ditolak. Hanya admin yang dapat mengakses')
    })
  })

  describe('PUT /api/employees/:id', () => {
    it('should update employee (admin only)', async () => {
      // Create employee to update
      const createResult = await pool.query(
        `INSERT INTO employees (employee_code, name, email, hire_date, department_id, position_id, status)
         VALUES ('UPD001', 'Update Employee', 'update@test.com', '2024-01-01', $1, $2, 'active') RETURNING id`,
        [global.testData.departmentId, global.testData.positionId]
      )
      const empId = createResult.rows[0].id

      const response = await request(app)
        .put(`/api/employees/${empId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employee_code: 'UPD001',
          name: 'Updated Name',
          email: 'update@test.com',
          hire_date: '2024-01-01',
          status: 'active'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Data karyawan berhasil diupdate')

      // Cleanup
      await pool.query('DELETE FROM employees WHERE id = $1', [empId])
    })

    it('should return 404 if employee not found', async () => {
      const response = await request(app)
        .put('/api/employees/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employee_code: 'TEST001',
          name: 'Test',
          email: 'test@test.com',
          hire_date: '2024-01-01',
          status: 'active'
        })
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/employees/:id', () => {
    it('should delete employee (admin only)', async () => {
      // Create employee to delete
      const createResult = await pool.query(
        `INSERT INTO employees (employee_code, name, email, hire_date, department_id, position_id, status)
         VALUES ('DEL001', 'Delete Employee', 'delete@test.com', '2024-01-01', $1, $2, 'active') RETURNING id`,
        [global.testData.departmentId, global.testData.positionId]
      )
      const empId = createResult.rows[0].id

      const response = await request(app)
        .delete(`/api/employees/${empId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Karyawan berhasil dihapus')
    })

    it('should return 404 if employee not found', async () => {
      const response = await request(app)
        .delete('/api/employees/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })

    it('should return 403 if not admin', async () => {
      const response = await request(app)
        .delete(`/api/employees/${global.testData.employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })
})
