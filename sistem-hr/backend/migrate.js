require('dotenv').config()
const { initDatabase, pool } = require('./db')

const migrate = async () => {
  console.log('Running migration for Sistem HR...')
  console.log(`Database: ${process.env.DB_NAME}`)

  try {
    await initDatabase()
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
