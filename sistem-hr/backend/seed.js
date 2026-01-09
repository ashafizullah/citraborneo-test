require('dotenv').config()
const { pool } = require('./db')
const bcrypt = require('bcrypt')

const seedData = async () => {
  console.log('Seeding data for Sistem HR...')
  console.log(`Database: ${process.env.DB_NAME}`)

  const client = await pool.connect()

  try {
    // Clear existing data (in correct order due to foreign keys)
    await client.query('TRUNCATE TABLE leaves RESTART IDENTITY CASCADE')
    await client.query('TRUNCATE TABLE attendances RESTART IDENTITY CASCADE')
    await client.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
    await client.query('TRUNCATE TABLE employees RESTART IDENTITY CASCADE')
    await client.query('TRUNCATE TABLE positions RESTART IDENTITY CASCADE')
    await client.query('TRUNCATE TABLE departments RESTART IDENTITY CASCADE')

    // Seed departments
    const departments = [
      { name: 'Human Resources', description: 'Mengelola SDM perusahaan' },
      { name: 'Information Technology', description: 'Mengelola sistem IT perusahaan' },
      { name: 'Finance', description: 'Mengelola keuangan perusahaan' },
      { name: 'Marketing', description: 'Mengelola pemasaran dan promosi' },
      { name: 'Operations', description: 'Mengelola operasional perusahaan' }
    ]

    const deptIds = {}
    for (const dept of departments) {
      const result = await client.query(
        'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING id',
        [dept.name, dept.description]
      )
      deptIds[dept.name] = result.rows[0].id
    }
    console.log(`Inserted ${departments.length} departments`)

    // Seed positions
    const positions = [
      { name: 'HR Manager', department: 'Human Resources', description: 'Kepala departemen HR' },
      { name: 'HR Staff', department: 'Human Resources', description: 'Staff HR' },
      { name: 'IT Manager', department: 'Information Technology', description: 'Kepala departemen IT' },
      { name: 'Software Developer', department: 'Information Technology', description: 'Pengembang software' },
      { name: 'System Administrator', department: 'Information Technology', description: 'Admin sistem' },
      { name: 'Finance Manager', department: 'Finance', description: 'Kepala departemen keuangan' },
      { name: 'Accountant', department: 'Finance', description: 'Akuntan' },
      { name: 'Marketing Manager', department: 'Marketing', description: 'Kepala departemen marketing' },
      { name: 'Marketing Staff', department: 'Marketing', description: 'Staff marketing' },
      { name: 'Operations Manager', department: 'Operations', description: 'Kepala departemen operasional' },
      { name: 'Operations Staff', department: 'Operations', description: 'Staff operasional' }
    ]

    const posIds = {}
    for (const pos of positions) {
      const result = await client.query(
        'INSERT INTO positions (name, department_id, description) VALUES ($1, $2, $3) RETURNING id',
        [pos.name, deptIds[pos.department], pos.description]
      )
      posIds[pos.name] = result.rows[0].id
    }
    console.log(`Inserted ${positions.length} positions`)

    // Seed employees
    const employees = [
      { code: 'EMP001', name: 'Ahmad Wijaya', email: 'ahmad.wijaya@company.com', phone: '081234567001', hire_date: '2020-01-15', department: 'Human Resources', position: 'HR Manager' },
      { code: 'EMP002', name: 'Siti Rahayu', email: 'siti.rahayu@company.com', phone: '081234567002', hire_date: '2020-03-01', department: 'Human Resources', position: 'HR Staff' },
      { code: 'EMP003', name: 'Budi Santoso', email: 'budi.santoso@company.com', phone: '081234567003', hire_date: '2019-06-01', department: 'Information Technology', position: 'IT Manager' },
      { code: 'EMP004', name: 'Dewi Lestari', email: 'dewi.lestari@company.com', phone: '081234567004', hire_date: '2021-02-15', department: 'Information Technology', position: 'Software Developer' },
      { code: 'EMP005', name: 'Eko Prasetyo', email: 'eko.prasetyo@company.com', phone: '081234567005', hire_date: '2021-05-01', department: 'Information Technology', position: 'Software Developer' },
      { code: 'EMP006', name: 'Fitri Handayani', email: 'fitri.handayani@company.com', phone: '081234567006', hire_date: '2020-08-01', department: 'Information Technology', position: 'System Administrator' },
      { code: 'EMP007', name: 'Gunawan Hidayat', email: 'gunawan.hidayat@company.com', phone: '081234567007', hire_date: '2019-01-10', department: 'Finance', position: 'Finance Manager' },
      { code: 'EMP008', name: 'Hesti Permata', email: 'hesti.permata@company.com', phone: '081234567008', hire_date: '2020-04-01', department: 'Finance', position: 'Accountant' },
      { code: 'EMP009', name: 'Irwan Setiawan', email: 'irwan.setiawan@company.com', phone: '081234567009', hire_date: '2021-01-01', department: 'Finance', position: 'Accountant' },
      { code: 'EMP010', name: 'Joko Widodo', email: 'joko.widodo@company.com', phone: '081234567010', hire_date: '2019-09-01', department: 'Marketing', position: 'Marketing Manager' },
      { code: 'EMP011', name: 'Kartika Sari', email: 'kartika.sari@company.com', phone: '081234567011', hire_date: '2021-03-15', department: 'Marketing', position: 'Marketing Staff' },
      { code: 'EMP012', name: 'Lukman Hakim', email: 'lukman.hakim@company.com', phone: '081234567012', hire_date: '2020-07-01', department: 'Marketing', position: 'Marketing Staff' },
      { code: 'EMP013', name: 'Maya Anggraini', email: 'maya.anggraini@company.com', phone: '081234567013', hire_date: '2019-04-01', department: 'Operations', position: 'Operations Manager' },
      { code: 'EMP014', name: 'Nur Hidayah', email: 'nur.hidayah@company.com', phone: '081234567014', hire_date: '2021-06-01', department: 'Operations', position: 'Operations Staff' },
      { code: 'EMP015', name: 'Oscar Pratama', email: 'oscar.pratama@company.com', phone: '081234567015', hire_date: '2022-01-10', department: 'Operations', position: 'Operations Staff' }
    ]

    const empIds = {}
    for (const emp of employees) {
      const result = await client.query(
        `INSERT INTO employees (employee_code, name, email, phone, hire_date, department_id, position_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') RETURNING id`,
        [emp.code, emp.name, emp.email, emp.phone, emp.hire_date, deptIds[emp.department], posIds[emp.position]]
      )
      empIds[emp.code] = result.rows[0].id
    }
    console.log(`Inserted ${employees.length} employees`)

    // Seed users (admin + employees)
    const hashedPassword = await bcrypt.hash('password123', 10)
    const adminPassword = await bcrypt.hash('admin123', 10)

    // Admin user
    await client.query(
      'INSERT INTO users (email, password, name, role, employee_id) VALUES ($1, $2, $3, $4, $5)',
      ['admin@hr.com', adminPassword, 'Admin HR', 'admin', null]
    )

    // Employee users
    for (const emp of employees) {
      await client.query(
        'INSERT INTO users (email, password, name, role, employee_id) VALUES ($1, $2, $3, $4, $5)',
        [emp.email, hashedPassword, emp.name, 'employee', empIds[emp.code]]
      )
    }
    console.log(`Inserted ${employees.length + 1} users`)

    // Seed attendances (last 7 days)
    const today = new Date()
    let attendanceCount = 0

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue

      for (const emp of employees) {
        // Random attendance status
        const rand = Math.random()
        let status, checkIn, checkOut

        if (rand < 0.85) {
          // Present
          status = 'present'
          const checkInHour = 7 + Math.floor(Math.random() * 2) // 07:00 - 08:59
          const checkInMin = Math.floor(Math.random() * 60)
          checkIn = `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}:00`

          const checkOutHour = 16 + Math.floor(Math.random() * 3) // 16:00 - 18:59
          const checkOutMin = Math.floor(Math.random() * 60)
          checkOut = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}:00`
        } else if (rand < 0.95) {
          // Late
          status = 'late'
          const checkInHour = 9 + Math.floor(Math.random() * 2) // 09:00 - 10:59
          const checkInMin = Math.floor(Math.random() * 60)
          checkIn = `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}:00`

          const checkOutHour = 17 + Math.floor(Math.random() * 2)
          const checkOutMin = Math.floor(Math.random() * 60)
          checkOut = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}:00`
        } else {
          // Absent
          status = 'absent'
          checkIn = null
          checkOut = null
        }

        await client.query(
          'INSERT INTO attendances (employee_id, date, check_in, check_out, status) VALUES ($1, $2, $3, $4, $5)',
          [empIds[emp.code], dateStr, checkIn, checkOut, status]
        )
        attendanceCount++
      }
    }
    console.log(`Inserted ${attendanceCount} attendance records`)

    // Seed leaves
    const leaveTypes = ['Cuti Tahunan', 'Cuti Sakit', 'Cuti Melahirkan', 'Izin Pribadi']
    const leaveStatuses = ['pending', 'approved', 'rejected']
    let leaveCount = 0

    const leaveRecords = [
      { emp: 'EMP002', type: 'Cuti Tahunan', start: '2024-02-01', end: '2024-02-03', reason: 'Liburan keluarga', status: 'approved' },
      { emp: 'EMP004', type: 'Cuti Sakit', start: '2024-01-20', end: '2024-01-22', reason: 'Sakit demam', status: 'approved' },
      { emp: 'EMP006', type: 'Izin Pribadi', start: '2024-01-25', end: '2024-01-25', reason: 'Urusan keluarga', status: 'approved' },
      { emp: 'EMP008', type: 'Cuti Tahunan', start: '2024-02-15', end: '2024-02-20', reason: 'Mudik lebaran', status: 'pending' },
      { emp: 'EMP010', type: 'Cuti Sakit', start: '2024-01-28', end: '2024-01-29', reason: 'Operasi ringan', status: 'approved' },
      { emp: 'EMP011', type: 'Cuti Tahunan', start: '2024-03-01', end: '2024-03-05', reason: 'Liburan', status: 'pending' },
      { emp: 'EMP012', type: 'Izin Pribadi', start: '2024-02-10', end: '2024-02-10', reason: 'Mengurus dokumen', status: 'rejected' },
      { emp: 'EMP014', type: 'Cuti Tahunan', start: '2024-02-25', end: '2024-02-28', reason: 'Pernikahan saudara', status: 'pending' },
      { emp: 'EMP015', type: 'Cuti Sakit', start: '2024-01-15', end: '2024-01-16', reason: 'Flu berat', status: 'approved' },
      { emp: 'EMP003', type: 'Cuti Tahunan', start: '2024-03-10', end: '2024-03-15', reason: 'Refreshing', status: 'pending' }
    ]

    for (const leave of leaveRecords) {
      await client.query(
        `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [empIds[leave.emp], leave.type, leave.start, leave.end, leave.reason, leave.status]
      )
      leaveCount++
    }
    console.log(`Inserted ${leaveCount} leave records`)

    console.log('\n=== Seeding completed successfully! ===')
    console.log('\nDefault login credentials:')
    console.log('Admin: admin@hr.com / admin123')
    console.log('Employee: [any_employee_email] / password123')
    console.log('Example: ahmad.wijaya@company.com / password123')

  } catch (error) {
    console.error('Seeding failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seedData()
