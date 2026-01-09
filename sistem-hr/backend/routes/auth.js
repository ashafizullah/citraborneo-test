const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { pool } = require('../db')
const { authenticateToken } = require('../middleware/auth')

// Generate tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      employee_id: user.employee_id
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Access token expires in 15 minutes
  )
}

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' } // Refresh token expires in 7 days
  )
}

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi'
      })
    }

    const result = await pool.query(
      `SELECT u.*, e.employee_code, e.department_id, e.position_id
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE u.email = $1`,
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      })
    }

    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      })
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    // Store refresh token in database
    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [refreshToken, user.id]
    )

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          employee_id: user.employee_id,
          employee_code: user.employee_code
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal login',
      error: error.message
    })
  }
})

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token diperlukan'
      })
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    )

    // Check if refresh token matches in database
    const result = await pool.query(
      `SELECT u.*, e.employee_code, e.department_id, e.position_id
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE u.id = $1 AND u.refresh_token = $2`,
      [decoded.id, refreshToken]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token tidak valid'
      })
    }

    const user = result.rows[0]
    const newAccessToken = generateAccessToken(user)
    const newRefreshToken = generateRefreshToken(user)

    // Update refresh token in database
    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [newRefreshToken, user.id]
    )

    res.json({
      success: true,
      message: 'Token berhasil diperbarui',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900
      }
    })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token sudah kadaluarsa, silakan login kembali'
      })
    }
    res.status(401).json({
      success: false,
      message: 'Refresh token tidak valid'
    })
  }
})

// Logout - invalidate refresh token
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [req.user.id]
    )

    res.json({
      success: true,
      message: 'Logout berhasil'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal logout',
      error: error.message
    })
  }
})

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.employee_id,
              e.employee_code, e.department_id, e.position_id,
              d.name as department_name, p.name as position_name
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE u.id = $1`,
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data user',
      error: error.message
    })
  }
})

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan baru wajib diisi'
      })
    }

    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    )

    const validPassword = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password
    )

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Password lama salah'
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    )

    res.json({
      success: true,
      message: 'Password berhasil diubah'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengubah password',
      error: error.message
    })
  }
})

module.exports = router
