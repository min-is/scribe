#!/usr/bin/env node

/**
 * Diagnostic script to check for orphaned Pages using raw SQL
 */

const { Pool } = require('pg');

// Get database URL from environment
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PRISMA_DATABASE_URL;

if (!connectionString) {
  console.error('❌ No database URL found in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function main() {
  try {
    console.log('🔍 Checking for orphaned Pages...\n');

    // Check for Pages with type=PROVIDER but no providerId
    const orphanedResult = await pool.query(`
      SELECT
        id,
        slug,
        title,
        type,
        "providerId",
        "createdAt",
        "updatedAt",
        "viewCount"
      FROM "Page"
      WHERE type = 'PROVIDER'
        AND "providerId" IS NULL
        AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
    `);

    console.log(`Found ${orphanedResult.rows.length} orphaned PROVIDER pages:\n`);

    if (orphanedResult.rows.length > 0) {
      orphanedResult.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. ${row.title}`);
        console.log(`   Slug: ${row.slug}`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Provider ID: NULL ⚠️`);
        console.log(`   Created: ${row.createdAt}`);
        console.log(`   View Count: ${row.viewCount}`);
        console.log('');
      });

      console.log('⚠️  These pages appear in search results but have no associated Provider record!');
      console.log('This is why deleted providers still appear in search.\n');
    } else {
      console.log('✅ No orphaned PROVIDER pages found.\n');
    }

    // Check for specific providers mentioned by user
    console.log('🔍 Searching for "Test, Test" and "Katie Doering"...\n');

    const specificResult = await pool.query(`
      SELECT
        p.id,
        p.slug,
        p.title,
        p.type,
        p."providerId",
        p."deletedAt",
        pr.name as provider_name,
        pr.slug as provider_slug
      FROM "Page" p
      LEFT JOIN "Provider" pr ON p."providerId" = pr.id
      WHERE (
        p.title ILIKE '%Test, Test%'
        OR p.title ILIKE '%Katie Doering%'
        OR p.slug ILIKE '%doering%'
      )
      AND p."deletedAt" IS NULL
    `);

    if (specificResult.rows.length > 0) {
      console.log('Found pages matching search criteria:\n');
      specificResult.rows.forEach((row) => {
        console.log(`📄 Page: "${row.title}"`);
        console.log(`   Slug: ${row.slug}`);
        console.log(`   Type: ${row.type}`);
        console.log(`   Provider ID: ${row.providerId || 'NULL ⚠️'}`);
        console.log(`   Provider exists: ${row.provider_name ? 'YES' : 'NO ⚠️'}`);
        if (row.provider_name) {
          console.log(`   Provider name: ${row.provider_name}`);
          console.log(`   Provider slug: ${row.provider_slug}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No pages found matching "Test, Test" or "Katie Doering".\n');
    }

    // Get summary statistics
    console.log('📊 Summary of all Pages by type:\n');

    const statsResult = await pool.query(`
      SELECT
        type,
        COUNT(*) as total,
        COUNT(CASE WHEN "providerId" IS NULL AND type = 'PROVIDER' THEN 1 END) as orphaned,
        COUNT(CASE WHEN "deletedAt" IS NULL THEN 1 END) as active,
        COUNT(CASE WHEN "deletedAt" IS NOT NULL THEN 1 END) as soft_deleted
      FROM "Page"
      GROUP BY type
      ORDER BY total DESC
    `);

    statsResult.rows.forEach((row) => {
      console.log(`${row.type}:`);
      console.log(`  Total: ${row.total}`);
      console.log(`  Active: ${row.active}`);
      console.log(`  Soft Deleted: ${row.soft_deleted}`);
      if (row.type === 'PROVIDER') {
        console.log(`  Orphaned (no Provider): ${row.orphaned} ⚠️`);
      }
      console.log('');
    });

    // Check for Providers without Pages
    console.log('🔍 Checking for Providers without Pages...\n');

    const providersResult = await pool.query(`
      SELECT
        pr.id,
        pr.slug,
        pr.name,
        pr."createdAt",
        p.id as page_id
      FROM "Provider" pr
      LEFT JOIN "Page" p ON p."providerId" = pr.id
      WHERE p.id IS NULL
    `);

    if (providersResult.rows.length > 0) {
      console.log(`Found ${providersResult.rows.length} Providers without associated Pages:\n`);
      providersResult.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. ${row.name} (${row.slug})`);
        console.log(`   Created: ${row.createdAt}`);
      });
      console.log('');
    } else {
      console.log('✅ All Providers have associated Pages.\n');
    }

    // Check database constraints
    console.log('🔍 Checking foreign key constraints...\n');

    const constraintsResult = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'Page'
        AND kcu.column_name = 'providerId'
    `);

    if (constraintsResult.rows.length > 0) {
      console.log('Foreign key constraint for Page.providerId:\n');
      constraintsResult.rows.forEach((row) => {
        console.log(`Constraint: ${row.constraint_name}`);
        console.log(`  References: ${row.foreign_table_name}.${row.foreign_column_name}`);
        console.log(`  On Update: ${row.update_rule}`);
        console.log(`  On Delete: ${row.delete_rule} ${row.delete_rule === 'SET NULL' ? '⚠️ (THIS IS THE PROBLEM!)' : ''}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
