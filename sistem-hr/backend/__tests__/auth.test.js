const request = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const { pool } = require('../db')
const { generateTestToken } = require('./helpers')

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@hr.com', password: 'admin123' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
      expect(response.body.data.expiresIn).toBeDefined()
      expect(response.body.data.user.email).toBe('admin@hr.com')
      expect(response.body.data.user.role).toBe('admin')
    })

    it('should login as employee successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test.employee@company.com', password: 'password123' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
      expect(response.body.data.user.role).toBe('employee')
    })

    it('should return 400 if email or password missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@hr.com' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Email dan password wajib diisi')
    })

    it('should return 401 if user not found', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@hr.com', password: 'password123' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Email atau password salah')
    })

    it('should return 401 if password is wrong', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@hr.com', password: 'wrongpassword' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Email atau password salah')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user info', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('admin@hr.com')
    })

    it('should return 401 if no token provided', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Token tidak ditemukan')
    })

    it('should return 403 if token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Token tidak valid atau sudah expired')
    })
  })

  describe('PUT /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      // Create a temporary user for this test
      const tempPassword = await bcrypt.hash('temppass123', 10)
      const result = await pool.query(
        "INSERT INTO users (email, password, name, role) VALUES ('tempuser@test.com', $1, 'Temp User', 'admin') RETURNING id",
        [tempPassword]
      )
      const tempUserId = result.rows[0].id

      const token = generateTestToken({ id: tempUserId, email: 'tempuser@test.com' })

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'temppass123', newPassword: 'newpass123' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password berhasil diubah')

      // Verify new password works
      const verifyResult = await pool.query('SELECT password FROM users WHERE id = $1', [tempUserId])
      const isValid = await bcrypt.compare('newpass123', verifyResult.rows[0].password)
      expect(isValid).toBe(true)

      // Cleanup
      await pool.query('DELETE FROM users WHERE id = $1', [tempUserId])
    })

    it('should return 400 if passwords not provided', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'oldpassword' })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 401 if current password is wrong', async () => {
      const token = generateTestToken()

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Password lama salah')
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // First login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@hr.com', password: 'admin123' })
        .expect(200)

      const refreshToken = loginResponse.body.data.refreshToken

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    it('should return 400 if refresh token not provided', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Refresh token diperlukan')
    })

    it('should return 401 if refresh token is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@hr.com', password: 'admin123' })
        .expect(200)

      const accessToken = loginResponse.body.data.accessToken

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Logout berhasil')
    })

    it('should return 401 if no token provided', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })
})

describe('Health Check', () => {
  it('should return OK status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)

    expect(response.body.status).toBe('OK')
    expect(response.body.message).toBe('HR System API is running')
  })
})
