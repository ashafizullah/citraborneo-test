require('dotenv').config({ path: '.env.test' })
const { pool } = require('../db')
const bcrypt = require('bcrypt')

// Test data IDs for reference
global.testData = {
  adminId: null,
  employeeUserId: null,
  departmentId: null,
  positionId: null,
  employeeId: null
}

// Setup test data before all tests
beforeAll(async () => {
  // Add refresh_token column if not exists
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'refresh_token') THEN
        ALTER TABLE users ADD COLUMN refresh_token TEXT;
      END IF;
    END
    $$;
  `)

  // Clean all tables
  await pool.query('TRUNCATE TABLE leaves RESTART IDENTITY CASCADE')
  await pool.query('TRUNCATE TABLE attendances RESTART IDENTITY CASCADE')
  await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
  await pool.query('TRUNCATE TABLE employees RESTART IDENTITY CASCADE')
  await pool.query('TRUNCATE TABLE positions RESTART IDENTITY CASCADE')
  await pool.query('TRUNCATE TABLE departments RESTART IDENTITY CASCADE')

  // Create test department
  const deptResult = await pool.query(
    "INSERT INTO departments (name, description) VALUES ('Test Department', 'For testing') RETURNING id"
  )
  global.testData.departmentId = deptResult.rows[0].id

  // Create test position
  const posResult = await pool.query(
    'INSERT INTO positions (name, department_id, description) VALUES ($1, $2, $3) RETURNING id',
    ['Test Position', global.testData.departmentId, 'For testing']
  )
  global.testData.positionId = posResult.rows[0].id

  // Create test employee
  const empResult = await pool.query(
    `INSERT INTO employees (employee_code, name, email, phone, hire_date, department_id, position_id, status)
     VALUES ('TEST001', 'Test Employee', 'test.employee@company.com', '08123456789', '2024-01-01', $1, $2, 'active') RETURNING id`,
    [global.testData.departmentId, global.testData.positionId]
  )
  global.testData.employeeId = empResult.rows[0].id

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const adminResult = await pool.query(
    "INSERT INTO users (email, password, name, role) VALUES ('admin@hr.com', $1, 'Admin HR', 'admin') RETURNING id",
    [adminPassword]
  )
  global.testData.adminId = adminResult.rows[0].id

  // Create employee user
  const empPassword = await bcrypt.hash('password123', 10)
  const empUserResult = await pool.query(
    'INSERT INTO users (email, password, name, role, employee_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    ['test.employee@company.com', empPassword, 'Test Employee', 'employee', global.testData.employeeId]
  )
  global.testData.employeeUserId = empUserResult.rows[0].id
})

// Cleanup after all tests
afterAll(async () => {
  await pool.end()
})
