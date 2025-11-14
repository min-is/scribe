import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get actual data from all tables with more detail
    const [smartphrases, scenarios, procedures, providers] = await Promise.all([
      query('SELECT id, slug, title, category, "createdAt" FROM "SmartPhrase" ORDER BY "createdAt" DESC LIMIT 20').catch(() => []),
      query('SELECT id, slug, title, category, "createdAt" FROM "Scenario" ORDER BY "createdAt" DESC LIMIT 20').catch(() => []),
      query('SELECT id, slug, title, category, "createdAt" FROM "Procedure" ORDER BY "createdAt" DESC LIMIT 20').catch(() => []),
      query('SELECT id, slug, name, credentials, "createdAt" FROM "Provider" ORDER BY "createdAt" DESC LIMIT 20').catch(() => []),
    ]);

    // Get total counts
    const [smartphraseCount, scenarioCount, procedureCount, providerCount] = await Promise.all([
      query('SELECT COUNT(*) as count FROM "SmartPhrase"').then(r => r[0]?.count || 0).catch(() => 0),
      query('SELECT COUNT(*) as count FROM "Scenario"').then(r => r[0]?.count || 0).catch(() => 0),
      query('SELECT COUNT(*) as count FROM "Procedure"').then(r => r[0]?.count || 0).catch(() => 0),
      query('SELECT COUNT(*) as count FROM "Provider"').then(r => r[0]?.count || 0).catch(() => 0),
    ]);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      note: 'This shows the ACTUAL data in each database table. If a SmartPhrase appears in the Provider section, something is very wrong.',
      tables: {
        SmartPhrase: {
          tableName: 'SmartPhrase',
          totalCount: smartphraseCount,
          recentItems: smartphrases,
          structure: 'id, slug, title, category (for SmartPhrases)',
        },
        Scenario: {
          tableName: 'Scenario',
          totalCount: scenarioCount,
          recentItems: scenarios,
          structure: 'id, slug, title, category (for Scenarios)',
        },
        Procedure: {
          tableName: 'Procedure',
          totalCount: procedureCount,
          recentItems: procedures,
          structure: 'id, slug, title, category (for Procedures)',
        },
        Provider: {
          tableName: 'Provider',
          totalCount: providerCount,
          recentItems: providers,
          structure: 'id, slug, name, credentials (for Providers - notice "name" not "title")',
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
