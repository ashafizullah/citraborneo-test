require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const authRoutes = require('./routes/auth')
const employeesRoutes = require('./routes/employees')
const departmentsRoutes = require('./routes/departments')
const positionsRoutes = require('./routes/positions')
const attendancesRoutes = require('./routes/attendances')
const leavesRoutes = require('./routes/leaves')
const dashboardRoutes = require('./routes/dashboard')

const app = express()

// Rate limiting - General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Terlalu banyak request, coba lagi dalam 15 menit'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Rate limiting - Auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Apply rate limiting
app.use('/api/', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/refresh', authLimiter)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/employees', employeesRoutes)
app.use('/api/departments', departmentsRoutes)
app.use('/api/positions', positionsRoutes)
app.use('/api/attendances', attendancesRoutes)
app.use('/api/leaves', leavesRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'HR System API is running' })
})

module.exports = app
