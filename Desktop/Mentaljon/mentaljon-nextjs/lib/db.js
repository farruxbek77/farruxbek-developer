import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin123@localhost:5432/mentaljon',
});

// Ma'lumotlar bazasini yaratish
export async function initDB() {
    const client = await pool.connect();
    try {
        // Contacts jadvali
        await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Groups jadvali
        await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Group members jadvali
        await client.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, contact_id)
      )
    `);

        // 200 ta test kontakt qo'shish
        const count = await client.query('SELECT COUNT(*) FROM contacts');
        if (count.rows[0].count === '0') {
            const values = [];
            for (let i = 1; i <= 200; i++) {
                values.push(`('Kontakt ${i}', '+998${90 + (i % 10)}${String(i).padStart(7, '0')}', 'kontakt${i}@example.com')`);
            }
            await client.query(`INSERT INTO contacts (name, phone, email) VALUES ${values.join(',')}`);
        }
    } finally {
        client.release();
    }
}

// Server ishga tushganda DB ni init qilish
initDB().catch(console.error);

export default pool;
