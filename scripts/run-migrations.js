const { Pool } = require('pg');

// SQL for all migrations - these are idempotent and safe to run multiple times
const MIGRATIONS = [
  {
    name: '20251113000000_add_smartphrase_model',
    sql: `
-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "SmartPhrase" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SmartPhrase_slug_key') THEN
        CREATE UNIQUE INDEX "SmartPhrase_slug_key" ON "SmartPhrase"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SmartPhrase_category_idx') THEN
        CREATE INDEX "SmartPhrase_category_idx" ON "SmartPhrase"("category");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SmartPhrase_slug_idx') THEN
        CREATE INDEX "SmartPhrase_slug_idx" ON "SmartPhrase"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SmartPhrase_usageCount_idx') THEN
        CREATE INDEX "SmartPhrase_usageCount_idx" ON "SmartPhrase"("usageCount");
    END IF;
END $$;
    `,
  },
  {
    name: '20251113000001_add_scenarios_and_procedures',
    sql: `
-- CreateTable Scenario (only if not exists)
CREATE TABLE IF NOT EXISTS "Scenario" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable Procedure (only if not exists)
CREATE TABLE IF NOT EXISTS "Procedure" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "indications" TEXT,
    "contraindications" TEXT,
    "equipment" TEXT,
    "steps" TEXT NOT NULL,
    "complications" TEXT,
    "tags" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for Scenario
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Scenario_slug_key') THEN
        CREATE UNIQUE INDEX "Scenario_slug_key" ON "Scenario"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Scenario_category_idx') THEN
        CREATE INDEX "Scenario_category_idx" ON "Scenario"("category");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Scenario_slug_idx') THEN
        CREATE INDEX "Scenario_slug_idx" ON "Scenario"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Scenario_viewCount_idx') THEN
        CREATE INDEX "Scenario_viewCount_idx" ON "Scenario"("viewCount");
    END IF;
END $$;

-- CreateIndexes for Procedure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Procedure_slug_key') THEN
        CREATE UNIQUE INDEX "Procedure_slug_key" ON "Procedure"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Procedure_category_idx') THEN
        CREATE INDEX "Procedure_category_idx" ON "Procedure"("category");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Procedure_slug_idx') THEN
        CREATE INDEX "Procedure_slug_idx" ON "Procedure"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Procedure_viewCount_idx') THEN
        CREATE INDEX "Procedure_viewCount_idx" ON "Procedure"("viewCount");
    END IF;
END $$;
    `,
  },
];

async function runMigrations() {
  console.log('\n========================================');
  console.log('🔄 MIGRATION SCRIPT STARTED');
  console.log('========================================\n');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ CRITICAL: DATABASE_URL environment variable is not set!');
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')));
    console.log('\n⚠️  Skipping migrations - database tables will NOT be created');
    console.log('========================================\n');
    return;
  }

  console.log('✓ DATABASE_URL found');
  console.log('  Connection string:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });

  try {
    // Test connection first
    console.log('\n📡 Testing database connection...');
    const client = await pool.connect();
    console.log('✓ Database connection successful');

    // Get database info
    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    console.log('  Database:', dbInfo.rows[0].current_database);
    console.log('  User:', dbInfo.rows[0].current_user);
    console.log('  PostgreSQL:', dbInfo.rows[0].version.split(',')[0]);

    client.release();

    console.log('\n🔧 Applying migrations...\n');

    let successCount = 0;
    let failCount = 0;

    for (const migration of MIGRATIONS) {
      console.log(`➜ Migration: ${migration.name}`);
      try {
        const startTime = Date.now();
        await pool.query(migration.sql);
        const duration = Date.now() - startTime;
        console.log(`  ✅ Completed in ${duration}ms\n`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ FAILED:`);
        console.error(`     Error: ${error.message}`);
        console.error(`     Code: ${error.code}`);
        console.error(`     Detail: ${error.detail || 'N/A'}`);
        console.error(`     Hint: ${error.hint || 'N/A'}\n`);
        failCount++;
      }
    }

    console.log('========================================');
    console.log(`✅ Migration Summary:`);
    console.log(`   ${successCount} succeeded`);
    console.log(`   ${failCount} failed`);
    console.log('========================================\n');

    if (failCount > 0) {
      console.warn('⚠️  Some migrations failed - check errors above');
      console.warn('⚠️  App will continue, but features may not work correctly\n');
    }

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ MIGRATION FATAL ERROR:');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    console.error('========================================');
    console.error('⚠️  App will continue, but database features will NOT work');
    console.error('========================================\n');
  } finally {
    try {
      await pool.end();
      console.log('🔌 Database connection closed\n');
    } catch (error) {
      console.error('Error closing pool:', error.message);
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration runner finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
