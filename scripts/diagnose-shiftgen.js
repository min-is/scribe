#!/usr/bin/env node

/**
 * ShiftGen Diagnostic Script
 *
 * Checks all ShiftGen components and identifies issues preventing data from appearing in calendar
 */

const { PrismaClient } = require('@prisma/client');

async function runDiagnostics() {
  console.log('\n========================================');
  console.log('🔍 SHIFTGEN DIAGNOSTIC SCRIPT');
  console.log('========================================\n');

  const issues = [];
  const warnings = [];
  const success = [];

  // Check 1: Environment Variables
  console.log('1️⃣  Checking Environment Variables...');
  const requiredEnvVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'SHIFTGEN_USERNAME': process.env.SHIFTGEN_USERNAME,
    'SHIFTGEN_PASSWORD': process.env.SHIFTGEN_PASSWORD,
    'SHIFTGEN_API_KEY': process.env.SHIFTGEN_API_KEY,
    'CRON_SECRET': process.env.CRON_SECRET,
  };

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      if (key === 'DATABASE_URL') {
        issues.push(`❌ CRITICAL: ${key} is not set - database operations will fail`);
      } else if (key === 'CRON_SECRET') {
        warnings.push(`⚠️  ${key} is not set - cron job will fail (manual scraping still works)`);
      } else {
        issues.push(`❌ ${key} is not set - scraping will fail`);
      }
    } else {
      const maskedValue = key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY')
        ? '****' + value.slice(-4)
        : value.substring(0, 30) + (value.length > 30 ? '...' : '');
      success.push(`✅ ${key}: ${maskedValue}`);
    }
  }

  // Check 2: Database Connection & Tables
  console.log('\n2️⃣  Checking Database Connection & Tables...');

  if (!process.env.DATABASE_URL) {
    issues.push('❌ Skipping database checks - DATABASE_URL not set');
  } else {
    try {
      const prisma = new PrismaClient();

      // Test connection
      await prisma.$connect();
      success.push('✅ Database connection successful');

      // Check if Scribe table exists
      try {
        const scribeCount = await prisma.scribe.count();
        success.push(`✅ Scribe table exists (${scribeCount} records)`);

        if (scribeCount === 0) {
          warnings.push('⚠️  Scribe table is empty - no scribes in database');
        }
      } catch (e) {
        issues.push(`❌ Scribe table missing or inaccessible: ${e.message}`);
      }

      // Check if Shift table exists
      try {
        const shiftCount = await prisma.shift.count();
        success.push(`✅ Shift table exists (${shiftCount} records)`);

        if (shiftCount === 0) {
          issues.push('❌ MAIN ISSUE: Shift table is EMPTY - no shifts in database!');
          console.log('\n   📌 This is why the calendar shows no data.');
          console.log('   📌 Solution: Run a scrape to populate the database.\n');
        } else {
          // Check date range
          const oldestShift = await prisma.shift.findFirst({
            orderBy: { date: 'asc' },
            select: { date: true },
          });
          const newestShift = await prisma.shift.findFirst({
            orderBy: { date: 'desc' },
            select: { date: true },
          });

          success.push(`✅ Shifts date range: ${oldestShift.date.toISOString().split('T')[0]} to ${newestShift.date.toISOString().split('T')[0]}`);
        }
      } catch (e) {
        issues.push(`❌ Shift table missing or inaccessible: ${e.message}`);
      }

      await prisma.$disconnect();
    } catch (e) {
      issues.push(`❌ Database connection failed: ${e.message}`);
    }
  }

  // Check 3: File System - Name Legend
  console.log('\n3️⃣  Checking Name Legend File...');
  const fs = require('fs');
  const path = require('path');
  const legendPath = path.join(process.cwd(), 'feature/shiftgen/name_legend.json');

  try {
    if (fs.existsSync(legendPath)) {
      const legend = JSON.parse(fs.readFileSync(legendPath, 'utf-8'));
      const physicianCount = Object.keys(legend.physicians || {}).length;
      const mlpCount = Object.keys(legend.mlps || {}).length;
      success.push(`✅ Name legend found: ${physicianCount} physicians, ${mlpCount} MLPs`);
    } else {
      warnings.push(`⚠️  Name legend not found at ${legendPath} - will be created on first scrape`);
    }
  } catch (e) {
    warnings.push(`⚠️  Error reading name legend: ${e.message}`);
  }

  // Check 4: API Endpoints
  console.log('\n4️⃣  Checking API Endpoint Files...');
  const apiEndpoints = [
    'app/api/shifts/route.ts',
    'app/api/shifts/range/route.ts',
    'app/api/shifts/daily/route.ts',
    'app/api/shifts/current/route.ts',
    'app/api/shifts/scrape/route.ts',
    'app/api/cron/scrape-shifts/route.ts',
  ];

  for (const endpoint of apiEndpoints) {
    const fullPath = path.join(process.cwd(), endpoint);
    if (fs.existsSync(fullPath)) {
      success.push(`✅ ${endpoint}`);
    } else {
      issues.push(`❌ Missing: ${endpoint}`);
    }
  }

  // Check 5: Scraper Components
  console.log('\n5️⃣  Checking Scraper Components...');
  const scraperFiles = [
    'src/lib/shiftgen/scraper.ts',
    'src/lib/shiftgen/parser.ts',
    'src/lib/shiftgen/sync.ts',
    'src/lib/shiftgen/name-mapper.ts',
    'src/lib/shiftgen/db.ts',
    'src/lib/shiftgen/config.ts',
  ];

  for (const file of scraperFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      success.push(`✅ ${file}`);
    } else {
      issues.push(`❌ Missing: ${file}`);
    }
  }

  // Print Summary
  console.log('\n========================================');
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('========================================\n');

  if (success.length > 0) {
    console.log('✅ WORKING COMPONENTS:');
    success.forEach(s => console.log(`   ${s}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(w => console.log(`   ${w}`));
    console.log('');
  }

  if (issues.length > 0) {
    console.log('❌ ISSUES FOUND:');
    issues.forEach(i => console.log(`   ${i}`));
    console.log('');
  }

  // Recommendations
  console.log('========================================');
  console.log('💡 RECOMMENDATIONS');
  console.log('========================================\n');

  const hasDbIssues = issues.some(i => i.includes('Shift table is EMPTY'));
  const hasEnvIssues = issues.some(i => i.includes('SHIFTGEN_'));

  if (hasDbIssues && hasEnvIssues) {
    console.log('1. Set environment variables in Vercel:');
    console.log('   - Go to Vercel Dashboard → Settings → Environment Variables');
    console.log('   - Add SHIFTGEN_USERNAME (your ShiftGen email)');
    console.log('   - Add SHIFTGEN_PASSWORD (your ShiftGen password)');
    console.log('   - Add SHIFTGEN_API_KEY (generate: openssl rand -base64 32)');
    console.log('   - Add CRON_SECRET (generate: openssl rand -base64 32)');
    console.log('');
    console.log('2. Trigger initial scrape:');
    console.log('   - Visit https://yoursite.com/admin/shifts');
    console.log('   - Enter passcode: 5150');
    console.log('   - Click "Trigger Manual Scrape"');
    console.log('   - Enter your SHIFTGEN_API_KEY when prompted');
    console.log('');
    console.log('3. Verify calendar:');
    console.log('   - Visit calendar page');
    console.log('   - Enter passcode: 5150');
    console.log('   - Click on dates to see shifts');
  } else if (hasDbIssues) {
    console.log('✅ Environment variables are set!');
    console.log('');
    console.log('To populate the database:');
    console.log('');
    console.log('Option 1 - Manual Trigger (Recommended):');
    console.log('   1. Visit https://yoursite.com/admin/shifts');
    console.log('   2. Enter passcode: 5150');
    console.log('   3. Click "Trigger Manual Scrape"');
    console.log('   4. Enter your SHIFTGEN_API_KEY when prompted');
    console.log('');
    console.log('Option 2 - Wait for Cron:');
    console.log('   - Cron job runs daily at midnight UTC');
    console.log('   - Next run: Check Vercel Dashboard → Cron Jobs');
    console.log('');
    console.log('Option 3 - API Call:');
    console.log('   curl -X POST https://yoursite.com/api/shifts/scrape \\');
    console.log('     -H "Authorization: Bearer $SHIFTGEN_API_KEY"');
  } else if (hasEnvIssues) {
    console.log('Set missing environment variables in Vercel:');
    console.log('   - Go to Vercel Dashboard → Settings → Environment Variables');

    if (!process.env.SHIFTGEN_USERNAME) {
      console.log('   - Add SHIFTGEN_USERNAME (your ShiftGen email)');
    }
    if (!process.env.SHIFTGEN_PASSWORD) {
      console.log('   - Add SHIFTGEN_PASSWORD (your ShiftGen password)');
    }
    if (!process.env.SHIFTGEN_API_KEY) {
      console.log('   - Add SHIFTGEN_API_KEY (generate: openssl rand -base64 32)');
    }
    if (!process.env.CRON_SECRET) {
      console.log('   - Add CRON_SECRET (generate: openssl rand -base64 32)');
    }
  } else {
    console.log('✅ All systems operational!');
    console.log('');
    console.log('The calendar should be working. If you still see no data:');
    console.log('1. Check Vercel deployment logs for errors');
    console.log('2. Try triggering a manual scrape from /admin/shifts');
    console.log('3. Check browser console for API errors');
  }

  console.log('\n========================================\n');

  // Exit code
  if (issues.some(i => i.includes('CRITICAL'))) {
    process.exit(1);
  } else if (issues.length > 0) {
    process.exit(2);
  } else {
    process.exit(0);
  }
}

// Run diagnostics
runDiagnostics().catch((error) => {
  console.error('\n❌ Diagnostic script failed:', error);
  process.exit(1);
});
