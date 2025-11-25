const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * Seed medications from CSV file into the database
 * This script loads data/medications-comprehensive.csv into the Medication table
 */
async function seedMedications() {
  console.log('\n========================================');
  console.log('💊 MEDICATION SEED SCRIPT STARTED');
  console.log('========================================\n');

  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PRISMA_DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ No database URL found!');
    console.log('⚠️  Skipping medication seed\n');
    return;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('📡 Connecting to database...');
    const client = await pool.connect();
    console.log('✓ Connected\n');

    // Check if Medication table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Medication'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  Medication table does not exist yet');
      console.log('   Run migrations first before seeding medications\n');
      client.release();
      return;
    }

    // Check if we already have medications
    const countResult = await client.query('SELECT COUNT(*) FROM "Medication"');
    const count = parseInt(countResult.rows[0].count);

    if (count > 0) {
      console.log(`ℹ️  Medication table already has ${count} records`);
      console.log('   Skipping seed (delete existing records to re-seed)\n');
      client.release();
      return;
    }

    // Read CSV file
    const csvPath = path.join(__dirname, '..', 'data', 'medications-comprehensive.csv');

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`);
      client.release();
      return;
    }

    console.log('📄 Reading CSV file...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');

    console.log(`   Found ${lines.length - 1} medications in CSV\n`);
    console.log('💉 Inserting medications into database...\n');

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Skip header row (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV properly (handles quoted fields with commas)
      const parts = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim()); // Add last field

      if (parts.length < 3) {
        failCount++;
        errors.push(`Line ${i + 1}: Invalid format (needs at least Name, Brand Names, and Type)`);
        continue;
      }

      const [name, brandNames, type, commonlyUsedFor] = parts;

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Generate unique ID
      const id = `med_${slug}`;

      try {
        // Check if medication with this slug already exists
        const existing = await client.query(
          'SELECT id FROM "Medication" WHERE slug = $1',
          [slug]
        );

        if (existing.rows.length > 0) {
          // Skip duplicates silently
          continue;
        }

        // Insert medication
        await client.query(
          `INSERT INTO "Medication" (
            id, slug, name, "brandNames", type, "commonlyUsedFor", tags, "viewCount", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [
            id,
            slug,
            name,
            brandNames && brandNames.trim() ? brandNames.trim() : null,
            type || 'Unknown',
            commonlyUsedFor || null,
            [], // tags
            0   // viewCount
          ]
        );

        successCount++;

        // Progress indicator every 100 records
        if (successCount % 100 === 0) {
          console.log(`   ✓ Inserted ${successCount} medications...`);
        }
      } catch (error) {
        failCount++;
        errors.push(`${name}: ${error.message}`);
      }
    }

    client.release();

    console.log('\n========================================');
    console.log('✅ Medication Seed Summary:');
    console.log(`   ${successCount} medications inserted`);
    if (failCount > 0) {
      console.log(`   ${failCount} failed`);
      if (errors.length > 0) {
        console.log('\n   First 5 errors:');
        errors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
      }
    }
    console.log('========================================\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ MEDICATION SEED ERROR:');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================\n');
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seedMedications()
    .then(() => {
      console.log('✅ Medication seed script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Medication seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedMedications };
