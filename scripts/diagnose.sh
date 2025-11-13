#!/bin/bash

echo "🔍 Diagnostic Script for SmartPhrase/Scenario/Procedure Issues"
echo "=============================================================="
echo ""

# Check 1: Prisma Client
echo "1️⃣ Checking Prisma Client..."
if [ -d "node_modules/.prisma/client" ]; then
    echo "   ✅ Prisma client directory exists"

    # Check if new models are in the generated client
    if grep -q "smartPhrase" node_modules/.prisma/client/index.d.ts 2>/dev/null; then
        echo "   ✅ SmartPhrase model found in generated client"
    else
        echo "   ❌ SmartPhrase model NOT found in generated client"
        echo "   🔧 FIX: Run 'npm run prisma:generate'"
    fi

    if grep -q "scenario" node_modules/.prisma/client/index.d.ts 2>/dev/null; then
        echo "   ✅ Scenario model found in generated client"
    else
        echo "   ❌ Scenario model NOT found in generated client"
        echo "   🔧 FIX: Run 'npm run prisma:generate'"
    fi

    if grep -q "procedure" node_modules/.prisma/client/index.d.ts 2>/dev/null; then
        echo "   ✅ Procedure model found in generated client"
    else
        echo "   ❌ Procedure model NOT found in generated client"
        echo "   🔧 FIX: Run 'npm run prisma:generate'"
    fi
else
    echo "   ❌ Prisma client not found"
    echo "   🔧 FIX: Run 'npm install'"
fi
echo ""

# Check 2: Database connection
echo "2️⃣ Checking Database Connection..."
if [ -z "$DATABASE_URL" ]; then
    echo "   ❌ DATABASE_URL environment variable not set"
    echo "   🔧 FIX: Set DATABASE_URL in .env.local"
else
    echo "   ✅ DATABASE_URL is set"
    # Try to connect
    if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        echo "   ✅ Database connection successful"
    else
        echo "   ❌ Cannot connect to database"
        echo "   🔧 FIX: Check your DATABASE_URL and database server"
    fi
fi
echo ""

# Check 3: Tables exist
echo "3️⃣ Checking Database Tables..."
if npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('SmartPhrase', 'Scenario', 'Procedure');" 2>/dev/null | grep -q "SmartPhrase"; then
    echo "   ✅ SmartPhrase table exists"
else
    echo "   ❌ SmartPhrase table does NOT exist"
    echo "   🔧 FIX: Run 'npm run prisma:migrate:deploy'"
fi

if npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('SmartPhrase', 'Scenario', 'Procedure');" 2>/dev/null | grep -q "Scenario"; then
    echo "   ✅ Scenario table exists"
else
    echo "   ❌ Scenario table does NOT exist"
    echo "   🔧 FIX: Run 'npm run prisma:migrate:deploy'"
fi

if npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('SmartPhrase', 'Scenario', 'Procedure');" 2>/dev/null | grep -q "Procedure"; then
    echo "   ✅ Procedure table exists"
else
    echo "   ❌ Procedure table does NOT exist"
    echo "   🔧 FIX: Run 'npm run prisma:migrate:deploy'"
fi
echo ""

# Check 4: Migration status
echo "4️⃣ Checking Migration Status..."
echo "   Migrations in directory:"
ls -1 prisma/migrations/ | grep -E "^[0-9]" | tail -3
echo ""

# Summary
echo "=============================================================="
echo "📋 RECOMMENDED ACTIONS:"
echo ""
echo "If any checks failed above, run these commands in order:"
echo ""
echo "  1. npm run prisma:generate"
echo "  2. npm run prisma:migrate:deploy"
echo "  3. Restart your dev server (npm run dev)"
echo ""
echo "If errors persist, check the browser console (F12) for details."
echo "=============================================================="
