import pool from './connection.js';

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running database migrations...');
    console.log('📊 Database:', process.env.DB_NAME || 'crypto');
    console.log('🔗 Host:', process.env.DB_HOST || 'localhost');

    // Create users table
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Users table created');

    // Create addresses table
    console.log('Creating addresses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        label VARCHAR(100) NOT NULL,
        address VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('evm', 'bitcoin')),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Addresses table created');

    // Create user_preferences table
    console.log('Creating user_preferences table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        default_currency VARCHAR(10) DEFAULT 'BRL',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ User_preferences table created');

    // Create indexes
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_addresses_address ON addresses(address);
    `);
    console.log('✅ Indexes created');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('📋 Tables in database:', tablesResult.rows.map(r => r.table_name));
    console.log('✅ Database migrations completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position
    });
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
