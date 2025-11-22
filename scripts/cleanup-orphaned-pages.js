#!/usr/bin/env node

/**
 * One-time cleanup script to soft-delete orphaned PROVIDER pages
 * These are pages with type='PROVIDER' but providerId=NULL
 */

const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PRISMA_DATABASE_URL;

if (!connectionString) {
  console.error('❌ No database URL found in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString, connectionTimeoutMillis: 10000 });

async function main() {
  console.log('\n========================================');
  console.log('🧹 CLEANUP: Orphaned Provider Pages');
  console.log('========================================\n');

  try {
    // First, find orphaned pages
    console.log('🔍 Finding orphaned PROVIDER pages...\n');

    const findOrphaned = await pool.query(`
      SELECT id, slug, title, type, "providerId", "createdAt", "viewCount"
      FROM "Page"
      WHERE type = 'PROVIDER'
        AND "providerId" IS NULL
        AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
    `);

    if (findOrphaned.rows.length === 0) {
      console.log('✅ No orphaned pages found! Database is clean.\n');
      return;
    }

    console.log(`Found ${findOrphaned.rows.length} orphaned PROVIDER pages:\n`);

    findOrphaned.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. "${row.title}"`);
      console.log(`   Slug: ${row.slug}`);
      console.log(`   Created: ${new Date(row.createdAt).toLocaleDateString()}`);
      console.log(`   View Count: ${row.viewCount}`);
      console.log('');
    });

    // Soft delete orphaned pages
    console.log('🗑️  Soft-deleting orphaned pages...\n');

    const result = await pool.query(`
      UPDATE "Page"
      SET "deletedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE type = 'PROVIDER'
        AND "providerId" IS NULL
        AND "deletedAt" IS NULL
      RETURNING id, slug, title
    `);

    console.log('========================================');
    console.log(`✅ Successfully soft-deleted ${result.rows.length} orphaned pages`);
    console.log('========================================\n');

    if (result.rows.length > 0) {
      console.log('Deleted pages:');
      result.rows.forEach((row, idx) => {
        console.log(`  ${idx + 1}. ${row.title} (${row.slug})`);
      });
      console.log('');
    }

    console.log('✅ Cleanup complete!\n');
    console.log('Note: These pages are soft-deleted (deletedAt is set).');
    console.log('They will no longer appear in search results or page listings.');
    console.log('They can be restored if needed by setting deletedAt back to NULL.\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ CLEANUP ERROR:');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    console.error('========================================\n');
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Cleanup script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { main };
