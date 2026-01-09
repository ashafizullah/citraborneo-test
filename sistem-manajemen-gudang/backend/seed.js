require('dotenv').config()
const { pool } = require('./db')

const seedData = async () => {
  console.log('Seeding data for Sistem Manajemen Gudang...')
  console.log(`Database: ${process.env.DB_NAME}`)

  const client = await pool.connect()

  try {
    // Clear existing data
    await client.query('TRUNCATE TABLE items RESTART IDENTITY CASCADE')

    // Insert sample items
    const items = [
      { item_name: 'Laptop Dell Inspiron', stock: 25, unit: 'unit' },
      { item_name: 'Monitor LG 24"', stock: 40, unit: 'unit' },
      { item_name: 'Keyboard Logitech', stock: 100, unit: 'unit' },
      { item_name: 'Mouse Wireless', stock: 150, unit: 'unit' },
      { item_name: 'Kabel HDMI 2m', stock: 200, unit: 'pcs' },
      { item_name: 'USB Flash Drive 32GB', stock: 75, unit: 'pcs' },
      { item_name: 'Printer HP LaserJet', stock: 10, unit: 'unit' },
      { item_name: 'Toner Printer HP', stock: 30, unit: 'pcs' },
      { item_name: 'Kertas HVS A4', stock: 500, unit: 'rim' },
      { item_name: 'Pulpen Standard', stock: 1000, unit: 'pcs' },
      { item_name: 'Buku Tulis', stock: 200, unit: 'pcs' },
      { item_name: 'Stapler', stock: 50, unit: 'unit' },
      { item_name: 'Isi Staples', stock: 100, unit: 'box' },
      { item_name: 'Penghapus', stock: 150, unit: 'pcs' },
      { item_name: 'Pensil 2B', stock: 300, unit: 'pcs' },
      { item_name: 'Spidol Whiteboard', stock: 80, unit: 'pcs' },
      { item_name: 'Papan Whiteboard', stock: 15, unit: 'unit' },
      { item_name: 'Kursi Kantor', stock: 50, unit: 'unit' },
      { item_name: 'Meja Kerja', stock: 30, unit: 'unit' },
      { item_name: 'Lemari Arsip', stock: 20, unit: 'unit' }
    ]

    for (const item of items) {
      await client.query(
        'INSERT INTO items (item_name, stock, unit) VALUES ($1, $2, $3)',
        [item.item_name, item.stock, item.unit]
      )
    }

    console.log(`Inserted ${items.length} items`)
    console.log('Seeding completed successfully!')
  } catch (error) {
    console.error('Seeding failed:', error.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seedData()
