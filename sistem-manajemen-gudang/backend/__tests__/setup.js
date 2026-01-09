require('dotenv').config({ path: '.env.test' })
const { pool } = require('../db')

// Cleanup test data before all tests
beforeAll(async () => {
  // Clean items table and reset sequence
  await pool.query('TRUNCATE TABLE items RESTART IDENTITY CASCADE')
})

// Cleanup after all tests
afterAll(async () => {
  await pool.end()
})
