import mysql from 'mysql2/promise'
const conn = await mysql.createConnection({
  host: 'lms-dev-db.ct0ymcm4yn1s.ap-south-1.rds.amazonaws.com',
  user: 'admin', password: 'MqmNAb6KJPEaR4CV5wYd', database: 'lms_dev_db',
})
// Check tables for student code
const [tables] = await conn.execute("SHOW TABLES LIKE '%student%'")
console.log('Tables with student:', tables)

const [tables2] = await conn.execute("SHOW TABLES LIKE '%code%'")
console.log('Tables with code:', tables2)

// Check batch_info for batch 140 - student code prefix  
const [bi] = await conn.execute("SELECT item, value FROM batch_info WHERE batch_id = 140 AND item LIKE '%code%'")
console.log('batch_info code for batch 140:', bi)

// Check if profiles has roll_number or student_code field
const [pr] = await conn.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'lms_dev_db' AND column_name LIKE '%code%' OR column_name LIKE '%roll%'")
console.log('columns with code/roll:', pr.map(r => r.column_name + ' in ' + r.table_name ?? ''))

await conn.end()
