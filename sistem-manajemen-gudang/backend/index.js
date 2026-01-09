const app = require('./app')
const { initDatabase } = require('./db')

const PORT = process.env.PORT || 3000

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}).catch(error => {
  console.error('Failed to initialize database:', error)
  process.exit(1)
})
