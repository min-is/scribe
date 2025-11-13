#!/bin/bash

# Setup script for SmartPhrases, Scenarios, and Procedures
# Run this after pulling the latest code changes

echo "🔧 Setting up medical dashboard features..."
echo ""

# Step 1: Generate Prisma Client
echo "📦 Step 1: Generating Prisma client with new models..."
if PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm run prisma:generate; then
    echo "✅ Prisma client generated successfully"
else
    echo "⚠️  Warning: Prisma generation had issues, but continuing..."
fi
echo ""

# Step 2: Check if database is accessible
echo "🔍 Step 2: Checking database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "   Please check your DATABASE_URL environment variable"
    exit 1
fi
echo ""

# Step 3: Apply migrations
echo "🗄️  Step 3: Applying database migrations..."
echo "   This will create SmartPhrase, Scenario, and Procedure tables..."
if npm run prisma:migrate:deploy; then
    echo "✅ Migrations applied successfully"
else
    echo "⚠️  Migration failed - you may need to run this manually"
fi
echo ""

# Step 4: Seed SmartPhrases (optional)
echo "🌱 Step 4: Seeding SmartPhrase data (optional)..."
read -p "   Do you want to seed sample SmartPhrases? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if npm run prisma:seed; then
        echo "✅ SmartPhrase data seeded successfully"
    else
        echo "⚠️  Seeding failed - you can run 'npm run prisma:seed' later"
    fi
else
    echo "⏭️  Skipping seed data"
fi
echo ""

# Done
echo "✅ Setup complete!"
echo ""
echo "🎉 You can now:"
echo "   - Visit /admin/smartphrases to create SmartPhrases"
echo "   - Visit /admin/scenarios to create Scenarios"
echo "   - Visit /admin/procedures to create Procedures"
echo ""
echo "📚 Public pages available at:"
echo "   - /smartphrases - Browse SmartPhrases"
echo "   - /scenarios - Browse Scenarios"
echo "   - /procedures - Browse Procedures"
echo ""
echo "🔍 Use Cmd/Ctrl+K to search and navigate"
echo ""
