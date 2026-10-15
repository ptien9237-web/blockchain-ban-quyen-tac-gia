import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './sqlServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigration(migrationFileName: string): Promise<void> {
  const filePath = path.join(__dirname, 'migrations', migrationFileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }

  const sqlContent = fs.readFileSync(filePath, 'utf-8');
  const pool = await getPool();

  // Split batches by GO statements
  const batches = sqlContent
    .split(/^\s*GO\s*$/gim)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  for (const batch of batches) {
    // Skip USE statements as pool is already bound to target database
    if (/^\s*USE\s+/i.test(batch)) {
      continue;
    }
    await pool.request().query(batch);
  }

  console.log(`[Migration] Successfully executed: ${migrationFileName}`);
}

async function main() {
  const migration = process.argv[2] || '001_create_invitations.sql';
  await runMigration(migration);
  process.exit(0);
}

// If run directly via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error('[Migration Error]', err);
    process.exit(1);
  });
}
