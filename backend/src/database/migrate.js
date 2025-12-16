import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    const sqlPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    console.log(`📄 Reading migration file: ${sqlPath}`);

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📝 SQL content length: ${sql.length} characters`);

    console.log('⚙️  Executing SQL...');
    const result = await pool.query(sql);
    console.log('✅ SQL executed successfully');
    console.log('📊 Result:', result);

    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    console.log('📋 Tables created:', tablesResult.rows.map(r => r.table_name));
    console.log('✅ Database migrations completed successfully');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
