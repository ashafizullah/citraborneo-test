require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const itemsRoutes = require('./routes/items')

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

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Apply rate limiting
app.use('/api/', apiLimiter)

// Routes
app.use('/api/items', itemsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

module.exports = app
