#!/bin/bash

echo "🔧 Quick Fix for SmartPhrase/Scenario/Procedure Issues"
echo "======================================================"
echo ""

# Fix 1: Regenerate Prisma Client
echo "Step 1: Regenerating Prisma client..."
if npm run prisma:generate > /dev/null 2>&1; then
    echo "✅ Prisma client regenerated"
else
    echo "⚠️  Using PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING workaround..."
    if PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate > /dev/null 2>&1; then
        echo "✅ Prisma client regenerated (with workaround)"
    else
        echo "❌ Failed to regenerate Prisma client"
        exit 1
    fi
fi
echo ""

# Fix 2: Apply migrations
echo "Step 2: Applying database migrations..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set - skipping migration"
    echo "   Please set DATABASE_URL in your .env.local file"
else
    if npm run prisma:migrate:deploy > /dev/null 2>&1; then
        echo "✅ Migrations applied successfully"
    else
        echo "⚠️  Migration may have already been applied or database not accessible"
    fi
fi
echo ""

# Done
echo "======================================================"
echo "✅ Quick fix complete!"
echo ""
echo "⚠️  IMPORTANT: Restart your dev server now:"
echo "   1. Stop current server (Ctrl+C)"
echo "   2. Run: npm run dev"
echo ""
echo "Then try creating a SmartPhrase/Scenario/Procedure again."
echo "======================================================"
