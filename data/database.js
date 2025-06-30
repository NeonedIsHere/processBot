const path = require('path')
const fs = require('fs')
const { Database } = require('sqlite3')

const dbPath = path.join(__dirname, 'database.sqlite')

if (!fs.existsSync(dbPath)) {
    const dir = path.dirname(dbPath)

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`Created directory: ${dir}`)
    }
}

const db = new Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err)
    } else {
        console.log('Connected to the database successfully.')

        db.run(`CREATE TABLE IF NOT EXISTS action_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            process_id INTEGER,
                process_name TEXT,
                timestamp TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Failed to create action_logs table:', err)
            } else {
                console.log('action_logs table created successfully.')
            }
        })
    }
})

module.exports = db