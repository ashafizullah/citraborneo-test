const request = require('supertest')
const app = require('../app')
const { pool } = require('../db')
const { generateTestToken, generateEmployeeToken } = require('./helpers')

describe('Leaves API', () => {
  let adminToken
  let employeeToken

  beforeAll(() => {
    adminToken = generateTestToken()
    employeeToken = generateEmployeeToken()
  })

  describe('GET /api/leaves', () => {
    it('should return all leaves for admin', async () => {
      // Create test leave
      await pool.query(
        `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
         VALUES ($1, 'Cuti Tahunan', '2024-03-01', '2024-03-03', 'Test leave', 'pending')`,
        [global.testData.employeeId]
      )

      const response = await request(app)
        .get('/api/leaves')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBeGreaterThanOrEqual(1)

      // Cleanup
      await pool.query('DELETE FROM leaves WHERE reason = $1', ['Test leave'])
    })

    it('should filter leaves by status', async () => {
      const response = await request(app)
        .get('/api/leaves?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/leaves/:id', () => {
    it('should return single leave', async () => {
      // Create test leave
      const createResult = await pool.query(
        `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
         VALUES ($1, 'Cuti Tahunan', '2024-04-01', '2024-04-02', 'Get by ID test', 'pending') RETURNING id`,
        [global.testData.employeeId]
      )
      const leaveId = createResult.rows[0].id

      const response = await request(app)
        .get(`/api/leaves/${leaveId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Cleanup
      await pool.query('DELETE FROM leaves WHERE id = $1', [leaveId])
    })

    it('should return 404 if leave not found', async () => {
      const response = await request(app)
        .get('/api/leaves/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/leaves', () => {
    it('should create leave request', async () => {
      const newLeave = {
        leave_type: 'Cuti Tahunan',
        start_date: '2024-05-15',
        end_date: '2024-05-17',
        reason: 'Family vacation'
      }

      const response = await request(app)
        .post('/api/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(newLeave)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Pengajuan cuti berhasil dibuat')

      // Cleanup
      await pool.query('DELETE FROM leaves WHERE reason = $1', ['Family vacation'])
    })

    it('should return 400 if required fields missing', async () => {
      const response = await request(app)
        .post('/api/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ leave_type: 'Cuti Tahunan' })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 if start_date > end_date', async () => {
      const response = await request(app)
        .post('/api/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leave_type: 'Cuti Tahunan',
          start_date: '2024-01-20',
          end_date: '2024-01-15'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Tanggal mulai tidak boleh lebih dari tanggal selesai')
    })
  })

  describe('PUT /api/leaves/:id/approve', () => {
    it('should approve leave (admin only)', async () => {
      // Create pending leave
      const createResult = await pool.query(
        `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
         VALUES ($1, 'Cuti Tahunan', '2024-06-01', '2024-06-02', 'Approve test', 'pending') RETURNING id`,
        [global.testData.employeeId]
      )
      const leaveId = createResult.rows[0].id

      const response = await request(app)
        .put(`/api/leaves/${leaveId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Cuti berhasil disetujui')

      // Cleanup
      await pool.query('DELETE FROM leaves WHERE id = $1', [leaveId])
    })

    it('should reject leave (admin only)', async () => {
      // Create pending leave
      const createResult = await pool.query(
        `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
         VALUES ($1, 'Cuti Tahunan', '2024-06-05', '2024-06-06', 'Reject test', 'pending') RETURNING id`,
        [global.testData.employeeId]
      )
      const leaveId = createResult.rows[0].id

      const response = await request(app)
        .put(`/api/leaves/${leaveId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'rejected' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Cuti berhasil ditolak')

      // Cleanup
      await pool.query('DELETE FROM leaves WHERE id = $1', [leaveId])
    })

    it('should return 400 if leave already processed', async () => {
      // Create approved leave
      const createResult = await pool.query(
        `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
         VALUES ($1, 'Cuti Tahunan', '2024-06-10', '2024-06-11', 'Already processed', 'approved') RETURNING id`,
        [global.testData.employeeId]
      )
      const leaveId = createResult.rows[0].id

      const response = await request(app)
        .put(`/api/leaves/${leaveId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Cuti ini sudah diproses sebelumnya')

      // Cleanup
      await pool.query('DELETE FROM leaves WHERE id = $1', [leaveId])
    })

    it('should return 400 if invalid status', async () => {
      const response = await request(app)
        .put('/api/leaves/1/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid' })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 403 if not admin', async () => {
      const response = await request(app)
        .put('/api/leaves/1/approve')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ status: 'approved' })
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/leaves/:id', () => {
    it('should update leave if pending', async () => {
      // Create pending leave
      const createResult = await pool.query(
        `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
         VALUES ($1, 'Cuti Tahunan', '2024-07-01', '2024-07-02', 'Update test', 'pending') RETURNING id`,
        [global.testData.employeeId]
      )
      const leaveId = createResult.rows[0].id

      const response = await request(app)
        .put(`/api/leaves/${leaveId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leave_type: 'Cuti Sakit',
          start_date: '2024-07-01',
          end_date: '2024-07-03'
        })
        .expect(200)

      expect(response.body.success).toBe(true)

      // Cleanup
      await pool.query('DELETE FROM leaves WHERE id = $1', [leaveId])
    })

    it('should return 400 if leave already processed', async () => {
      // Create approved leave
      const createResult = await pool.query(
        `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
         VALUES ($1, 'Cuti Tahunan', '2024-07-10', '2024-07-11', 'Cant update', 'approved') RETURNING id`,
        [global.testData.employeeId]
      )
      const leaveId = createResult.rows[0].id

      const response = await request(app)
        .put(`/api/leaves/${leaveId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ leave_type: 'Cuti Sakit', start_date: '2024-07-10', end_date: '2024-07-11' })
        .expect(400)

      expect(response.body.success).toBe(false)

      // Cleanup
      await pool.query('DELETE FROM leaves WHERE id = $1', [leaveId])
    })
  })

  describe('DELETE /api/leaves/:id', () => {
    it('should delete leave if pending', async () => {
      // Create pending leave
      const createResult = await pool.query(
        `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
         VALUES ($1, 'Cuti Tahunan', '2024-08-01', '2024-08-02', 'Delete test', 'pending') RETURNING id`,
        [global.testData.employeeId]
      )
      const leaveId = createResult.rows[0].id

      const response = await request(app)
        .delete(`/api/leaves/${leaveId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should return 404 if leave not found', async () => {
      const response = await request(app)
        .delete('/api/leaves/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })
})
