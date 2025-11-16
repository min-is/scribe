import { NextResponse } from 'next/server';
import { Pool } from 'pg';

/**
 * Emergency endpoint to manually create the Page table
 * Visit: https://your-site.vercel.app/api/create-page-table
 *
 * This should be run ONCE before visiting /api/migrate-pages
 * Use this if the automated migration didn't create the table during deployment
 */
export async function GET() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PRISMA_DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      {
        success: false,
        error: 'No database URL found in environment variables',
      },
      { status: 500 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    // Check if table already exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Page'
      );
    `);

    if (tableCheck.rows[0].exists) {
      return NextResponse.json({
        success: false,
        message: 'Page table already exists. You can now visit /api/migrate-pages to populate it.',
      });
    }

    // Create PageType enum
    await pool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PageType') THEN
              CREATE TYPE "PageType" AS ENUM ('PROVIDER', 'PROCEDURE', 'SMARTPHRASE', 'SCENARIO', 'WIKI', 'FOLDER');
          END IF;
      END $$;
    `);

    // Create Page table
    await pool.query(`
      CREATE TABLE "Page" (
          "id" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "content" JSONB NOT NULL,
          "textContent" TEXT,
          "type" "PageType" NOT NULL,
          "parentId" TEXT,
          "position" TEXT NOT NULL DEFAULT 'a0',
          "icon" TEXT,
          "coverPhoto" TEXT,
          "category" TEXT,
          "tags" TEXT[],
          "providerId" TEXT,
          "procedureId" TEXT,
          "scenarioId" TEXT,
          "smartPhraseId" TEXT,
          "deletedAt" TIMESTAMP(3),
          "viewCount" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "createdBy" TEXT,
          "updatedBy" TEXT,

          CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create indexes
    await pool.query(`
      CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
      CREATE UNIQUE INDEX "Page_providerId_key" ON "Page"("providerId");
      CREATE UNIQUE INDEX "Page_procedureId_key" ON "Page"("procedureId");
      CREATE UNIQUE INDEX "Page_scenarioId_key" ON "Page"("scenarioId");
      CREATE UNIQUE INDEX "Page_smartPhraseId_key" ON "Page"("smartPhraseId");
      CREATE INDEX "Page_parentId_position_idx" ON "Page"("parentId", "position");
      CREATE INDEX "Page_type_deletedAt_idx" ON "Page"("type", "deletedAt");
      CREATE INDEX "Page_slug_idx" ON "Page"("slug");
      CREATE INDEX "Page_category_idx" ON "Page"("category");
    `);

    // Add foreign keys
    await pool.query(`
      ALTER TABLE "Page" ADD CONSTRAINT "Page_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await pool.query(`
      ALTER TABLE "Page" ADD CONSTRAINT "Page_providerId_fkey"
      FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    await pool.query(`
      ALTER TABLE "Page" ADD CONSTRAINT "Page_procedureId_fkey"
      FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    await pool.query(`
      ALTER TABLE "Page" ADD CONSTRAINT "Page_scenarioId_fkey"
      FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    await pool.query(`
      ALTER TABLE "Page" ADD CONSTRAINT "Page_smartPhraseId_fkey"
      FOREIGN KEY ("smartPhraseId") REFERENCES "SmartPhrase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    return NextResponse.json({
      success: true,
      message: 'Page table created successfully! Now visit /api/migrate-pages to populate it with data.',
    });
  } catch (error: any) {
    console.error('Error creating Page table:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        hint: 'Check the error message above. The table may already exist or there may be a database connection issue.',
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
