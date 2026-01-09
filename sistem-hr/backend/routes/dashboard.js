const express = require('express')
const router = express.Router()
const { pool } = require('../db')
const { authenticateToken } = require('../middleware/auth')

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
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

    // Today's attendance
    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = await pool.query(
      `SELECT
        COUNT(CASE WHEN check_in IS NOT NULL THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late
       FROM attendances WHERE date = $1`,
      [today]
    )

    // Pending leaves
    const pendingLeaves = await pool.query(
      "SELECT COUNT(*) as count FROM leaves WHERE status = 'pending'"
    )

    // Monthly attendance summary
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
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

    // Recent leaves
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

    res.json({
      success: true,
      data: {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data dashboard',
      error: error.message
    })
  }
})

module.exports = router
