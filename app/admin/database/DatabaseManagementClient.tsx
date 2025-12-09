'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FiDatabase, FiCopy, FiCheck, FiAlertCircle, FiCode } from 'react-icons/fi';

const MIGRATIONS = [
  {
    name: '20251113000000_add_smartphrase_model',
    description: 'Create SmartPhrase table',
    sql: `-- CreateTable
CREATE TABLE "SmartPhrase" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmartPhrase_slug_key" ON "SmartPhrase"("slug");
CREATE INDEX "SmartPhrase_category_idx" ON "SmartPhrase"("category");
CREATE INDEX "SmartPhrase_slug_idx" ON "SmartPhrase"("slug");
CREATE INDEX "SmartPhrase_usageCount_idx" ON "SmartPhrase"("usageCount");`,
  },
  {
    name: '20251113000001_add_scenarios_and_procedures',
    description: 'Create Scenario and Procedure tables',
    sql: `-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "tags" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedure" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "complications" TEXT,
    "tags" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scenario_slug_key" ON "Scenario"("slug");
CREATE INDEX "Scenario_category_idx" ON "Scenario"("category");
CREATE INDEX "Scenario_slug_idx" ON "Scenario"("slug");
CREATE INDEX "Scenario_viewCount_idx" ON "Scenario"("viewCount");

-- CreateIndex
CREATE UNIQUE INDEX "Procedure_slug_key" ON "Procedure"("slug");
CREATE INDEX "Procedure_category_idx" ON "Procedure"("category");
CREATE INDEX "Procedure_slug_idx" ON "Procedure"("slug");
CREATE INDEX "Procedure_viewCount_idx" ON "Procedure"("viewCount");`,
  },
  {
    name: '20251122070000_add_home_page_content',
    description: 'Create HomePageContent table',
    sql: `-- CreateTable
CREATE TABLE "HomePageContent" (
    "id" TEXT NOT NULL,
    "announcementText" TEXT NOT NULL,
    "gettingStartedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePageContent_pkey" PRIMARY KEY ("id")
);

-- Insert default content
INSERT INTO "HomePageContent" ("id", "announcementText", "gettingStartedText", "createdAt", "updatedAt")
VALUES (
    'default',
    'Welcome! Check back here for important updates and announcements.',
    'Welcome to your home!

• Browse provider preferences and documentation
• Access procedure guides and protocols
• Find smart phrases for EPIC documentation
• Review critical scenarios and emergency protocols',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);`,
  },
];

export default function DatabaseManagementClient() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (sql: string, index: number) => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopiedIndex(index);
      toast.success('SQL copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyAllSQL = async () => {
    const allSQL = MIGRATIONS.map(m => `-- ${m.name}\n-- ${m.description}\n\n${m.sql}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(allSQL);
      toast.success('All SQL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="min-h-screen p-8 font-mono">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-main mb-2">
            Database Setup
          </h1>
          <p className="text-dim text-lg">
            Automatic migrations on deployment + manual fallback
          </p>
        </div>

        {/* Automatic Migrations Info */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <FiCheck className="text-2xl text-green-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-main mb-2">
                ✨ Migrations Run Automatically
              </h2>
              <p className="text-medium text-sm mb-3">
                Database migrations run automatically when you:
              </p>
              <ul className="list-disc list-inside text-medium space-y-1 text-sm ml-4">
                <li>Deploy to production (Vercel, etc.) - migrations run during build</li>
                <li>Start the development server (<code className="bg-content px-1 py-0.5 rounded">npm run dev</code>)</li>
                <li>Start the production server (<code className="bg-content px-1 py-0.5 rounded">npm start</code>)</li>
              </ul>
              <p className="text-medium text-sm mt-3">
                <strong className="text-main">No manual setup required!</strong> The tables are created automatically via the <code className="bg-content px-1 py-0.5 rounded">scripts/run-migrations.js</code> script during deployment.
              </p>
              <p className="text-dim text-sm mt-2">
                💡 If you need to add a table immediately, redeploy your app or restart your dev server.
              </p>
            </div>
          </div>
        </div>

        {/* Manual Fallback Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-2xl text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-main mb-2">
                Manual Setup (Fallback Only)
              </h2>
              <p className="text-medium text-sm mb-3">
                Only use this if automatic migrations failed or you need to run them manually:
              </p>
              <ol className="list-decimal list-inside text-medium space-y-2 text-sm">
                <li>Copy the SQL for each migration below</li>
                <li>Open your database console:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li><strong>Vercel Postgres:</strong> Vercel Dashboard → Storage → Your Database → Query</li>
                    <li><strong>Supabase:</strong> Dashboard → SQL Editor</li>
                    <li><strong>Neon:</strong> Console → SQL Editor</li>
                    <li><strong>PlanetScale:</strong> Dashboard → Console</li>
                  </ul>
                </li>
                <li>Paste and execute each SQL statement</li>
                <li>Refresh this page and try creating SmartPhrases/Scenarios/Procedures</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Quick Copy All */}
        <div className="mb-6">
          <button
            onClick={copyAllSQL}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <FiCopy />
            Copy All SQL (Quick Setup)
          </button>
          <p className="text-dim text-sm mt-2">
            Copy all migrations at once and run them in sequence
          </p>
        </div>

        {/* Individual Migrations */}
        <div className="space-y-6">
          {MIGRATIONS.map((migration, index) => (
            <div
              key={migration.name}
              className="bg-medium border border-main rounded-lg overflow-hidden"
            >
              {/* Migration Header */}
              <div className="p-4 border-b border-main bg-dim">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiDatabase className="text-xl text-blue-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-main">
                        Migration {index + 1}: {migration.description}
                      </h3>
                      <p className="text-dim text-sm font-mono">
                        {migration.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(migration.sql, index)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      copiedIndex === index
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                    }`}
                  >
                    {copiedIndex === index ? (
                      <>
                        <FiCheck />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy />
                        Copy SQL
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SQL Code */}
              <div className="p-4">
                <pre className="bg-content border border-main rounded-lg p-4 text-sm text-medium overflow-x-auto font-mono">
                  {migration.sql}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Verification Section */}
        <div className="mt-8 bg-medium border border-main rounded-lg p-6">
          <h3 className="text-lg font-semibold text-main mb-3 flex items-center gap-2">
            <FiCheck className="text-green-400" />
            Verify Installation
          </h3>
          <p className="text-medium text-sm mb-4">
            After running the SQL, verify the tables were created by running this query:
          </p>
          <pre className="bg-content border border-main rounded-lg p-4 text-sm text-medium overflow-x-auto font-mono mb-4">
{`SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('SmartPhrase', 'Scenario', 'Procedure', 'HomePageContent');`}
          </pre>
          <p className="text-medium text-sm">
            You should see all four tables listed. If so, you&apos;re ready to go! 🎉
          </p>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-dim border border-main rounded-lg p-6">
          <h3 className="text-lg font-semibold text-main mb-3">
            ℹ️ Troubleshooting
          </h3>
          <div className="space-y-3 text-medium text-sm">
            <div>
              <strong className="text-main">Table already exists error?</strong>
              <p>The migrations have already been applied. You can skip this step.</p>
            </div>
            <div>
              <strong className="text-main">Permission denied error?</strong>
              <p>Make sure your database user has CREATE TABLE permissions.</p>
            </div>
            <div>
              <strong className="text-main">Still seeing &quot;table does not exist&quot;?</strong>
              <p>Make sure you&apos;re connected to the same database as your DATABASE_URL environment variable.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
