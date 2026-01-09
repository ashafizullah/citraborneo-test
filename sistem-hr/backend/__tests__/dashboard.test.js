const request = require('supertest')
const app = require('../app')
const { generateTestToken } = require('./helpers')

describe('Dashboard API', () => {
  let adminToken

  beforeAll(() => {
    adminToken = generateTestToken()
  })

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('totalEmployees')
      expect(response.body.data).toHaveProperty('activeEmployees')
      expect(response.body.data).toHaveProperty('totalDepartments')
      expect(response.body.data).toHaveProperty('totalPositions')
      expect(response.body.data).toHaveProperty('todayAttendance')
      expect(response.body.data).toHaveProperty('pendingLeaves')
    })

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })
})
