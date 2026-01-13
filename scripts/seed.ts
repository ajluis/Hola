import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedsDir = join(__dirname, '../src/db/seeds');

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Seeding database...\n');

    // Get list of seed files
    const files = await readdir(seedsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    console.log(`Found ${sqlFiles.length} seed files`);

    for (const file of sqlFiles) {
      console.log(`\n  Executing ${file}...`);
      const sql = await readFile(join(seedsDir, file), 'utf-8');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`  ✓ ${file} executed successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        // Check if it's a duplicate key error (data already seeded)
        if ((error as { code?: string }).code === '23505') {
          console.log(`  ⚠ ${file} - Data already exists (skipping)`);
        } else {
          console.error(`  ✗ Error executing ${file}:`, error);
          throw error;
        }
      } finally {
        client.release();
      }
    }

    // Log summary
    const { rows: vocabCount } = await pool.query('SELECT COUNT(*) FROM vocab_items');
    console.log(`\n✓ Seeding complete! Total vocabulary items: ${vocabCount[0].count}`);
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
