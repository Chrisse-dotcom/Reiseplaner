const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        destination VARCHAR(255) NOT NULL,
        country VARCHAR(255),
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        due_date DATE,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS packing_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        checked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS travel_info_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        destination VARCHAR(255) NOT NULL,
        country VARCHAR(255) NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS travel_info_cache_dest_country
        ON travel_info_cache(destination, country);

      CREATE TABLE IF NOT EXISTS medicine_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        checked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS geo_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cache_key VARCHAR(500) NOT NULL UNIQUE,
        svg_path TEXT,
        view_box VARCHAR(100),
        dest_x FLOAT,
        dest_y FLOAT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS flights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        label VARCHAR(50) NOT NULL DEFAULT 'Flug',
        flight_number VARCHAR(20),
        departure_airport VARCHAR(10),
        arrival_airport VARCHAR(10),
        flight_date VARCHAR(10),
        departure_time VARCHAR(5),
        arrival_time VARCHAR(5),
        gate VARCHAR(20),
        terminal VARCHAR(30),
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
