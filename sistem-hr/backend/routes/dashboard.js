const express = require('express')
const router = express.Router()
const { pool } = require('../db')
const { authenticateToken } = require('../middleware/auth')

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin'
    const employeeId = req.user.employee_id
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date()
    startOfMonth.setDate(1)

    // Admin Dashboard
    if (isAdmin) {
      // Total employees
      const totalEmployees = await pool.query(
        'SELECT COUNT(*) as count FROM employees'
      )

      // Active employees
      const activeEmployees = await pool.query(
        "SELECT COUNT(*) as count FROM employees WHERE status = 'active'"
      )

      // Departments count
      const totalDepartments = await pool.query(
        'SELECT COUNT(*) as count FROM departments'
      )

      // Positions count
      const totalPositions = await pool.query(
        'SELECT COUNT(*) as count FROM positions'
      )

      // Today's attendance (all employees)
      const todayAttendance = await pool.query(
        `SELECT
          COUNT(CASE WHEN check_in IS NOT NULL THEN 1 END) as present,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as late
         FROM attendances WHERE date = $1`,
        [today]
      )

      // Pending leaves (all employees)
      const pendingLeaves = await pool.query(
        "SELECT COUNT(*) as count FROM leaves WHERE status = 'pending'"
      )

      // Monthly attendance summary (all employees)
      const monthlyAttendance = await pool.query(
        `SELECT
          COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
          COUNT(*) as total
         FROM attendances
         WHERE date >= $1`,
        [startOfMonth.toISOString().split('T')[0]]
      )

      // Recent leaves (all employees)
      const recentLeaves = await pool.query(
        `SELECT l.*, e.name as employee_name
         FROM leaves l
         JOIN employees e ON l.employee_id = e.id
         ORDER BY l.created_at DESC LIMIT 5`
      )

      // Employees by department
      const employeesByDepartment = await pool.query(
        `SELECT d.name as department, COUNT(e.id) as count
         FROM departments d
         LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
         GROUP BY d.id, d.name
         ORDER BY count DESC`
      )

      return res.json({
        success: true,
        data: {
          isAdmin: true,
          totalEmployees: parseInt(totalEmployees.rows[0].count),
          activeEmployees: parseInt(activeEmployees.rows[0].count),
          totalDepartments: parseInt(totalDepartments.rows[0].count),
          totalPositions: parseInt(totalPositions.rows[0].count),
          todayAttendance: {
            present: parseInt(todayAttendance.rows[0].present) || 0,
            absent: parseInt(todayAttendance.rows[0].absent) || 0,
            late: parseInt(todayAttendance.rows[0].late) || 0
          },
          pendingLeaves: parseInt(pendingLeaves.rows[0].count),
          monthlyAttendance: {
            present: parseInt(monthlyAttendance.rows[0].present) || 0,
            absent: parseInt(monthlyAttendance.rows[0].absent) || 0,
            late: parseInt(monthlyAttendance.rows[0].late) || 0,
            total: parseInt(monthlyAttendance.rows[0].total) || 0
          },
          recentLeaves: recentLeaves.rows,
          employeesByDepartment: employeesByDepartment.rows
        }
      })
    }

    // Employee Dashboard - only show own data
    if (!employeeId) {
      return res.json({
        success: true,
        data: {
          isAdmin: false,
          message: 'User tidak terhubung dengan data karyawan'
        }
      })
    }

    // Get employee info
    const employeeInfo = await pool.query(
      `SELECT e.*, d.name as department_name, p.name as position_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE e.id = $1`,
      [employeeId]
    )

    // Today's attendance (own)
    const todayAttendance = await pool.query(
      'SELECT * FROM attendances WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    )

    // Monthly attendance summary (own)
    const monthlyAttendance = await pool.query(
      `SELECT
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
        COUNT(*) as total
       FROM attendances
       WHERE employee_id = $1 AND date >= $2`,
      [employeeId, startOfMonth.toISOString().split('T')[0]]
    )

    // Recent leaves (own)
    const recentLeaves = await pool.query(
      `SELECT l.*, e.name as employee_name
       FROM leaves l
       JOIN employees e ON l.employee_id = e.id
       WHERE l.employee_id = $1
       ORDER BY l.created_at DESC LIMIT 5`,
      [employeeId]
    )

    // Pending leaves count (own)
    const pendingLeaves = await pool.query(
      "SELECT COUNT(*) as count FROM leaves WHERE employee_id = $1 AND status = 'pending'",
      [employeeId]
    )

    res.json({
      success: true,
      data: {
        isAdmin: false,
        employee: employeeInfo.rows[0] || null,
        todayAttendance: todayAttendance.rows[0] || null,
        monthlyAttendance: {
          present: parseInt(monthlyAttendance.rows[0].present) || 0,
          absent: parseInt(monthlyAttendance.rows[0].absent) || 0,
          late: parseInt(monthlyAttendance.rows[0].late) || 0,
          total: parseInt(monthlyAttendance.rows[0].total) || 0
        },
        pendingLeaves: parseInt(pendingLeaves.rows[0].count),
        recentLeaves: recentLeaves.rows
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data dashboard',
      error: error.message
    })
  }
})

module.exports = router
