import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '../src/db/migrations');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get list of executed migrations
    const { rows: executed } = await pool.query(
      'SELECT filename FROM schema_migrations ORDER BY filename'
    );
    const executedFiles = new Set(executed.map((r) => r.filename));

    // Get list of migration files
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    console.log(`Found ${sqlFiles.length} migration files`);

    for (const file of sqlFiles) {
      if (executedFiles.has(file)) {
        console.log(`  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`  Executing ${file}...`);
      const sql = await readFile(join(migrationsDir, file), 'utf-8');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ✓ ${file} executed successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`  ✗ Error executing ${file}:`, error);
        throw error;
      } finally {
        client.release();
      }
    }

    console.log('\nMigrations complete!');
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
