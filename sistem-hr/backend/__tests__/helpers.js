const jwt = require('jsonwebtoken')

const generateTestToken = (payload = {}) => {
  const defaultPayload = {
    id: global.testData?.adminId || 1,
    email: 'admin@hr.com',
    name: 'Admin HR',
    role: 'admin',
    employee_id: null
  }

  return jwt.sign(
    { ...defaultPayload, ...payload },
    process.env.JWT_SECRET || 'hr_system_secret_key_2024',
    { expiresIn: '1h' }
  )
}

const generateEmployeeToken = (payload = {}) => {
  const defaultPayload = {
    id: global.testData?.employeeUserId || 2,
    email: 'test.employee@company.com',
    name: 'Test Employee',
    role: 'employee',
    employee_id: global.testData?.employeeId || 1
  }

  return jwt.sign(
    { ...defaultPayload, ...payload },
    process.env.JWT_SECRET || 'hr_system_secret_key_2024',
    { expiresIn: '1h' }
  )
}

module.exports = {
  generateTestToken,
  generateEmployeeToken
}
