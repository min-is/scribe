# Data Migration Scripts

## migrate-to-pages.ts

This script migrates existing Provider, Procedure, SmartPhrase, and Scenario records into the unified Page model.

### What it does:

1. **Converts WikiContent to TipTap JSON** - Rich wiki-style content is converted to TipTap's JSON format
2. **Converts plain text/markdown to TipTap JSON** - All text content is standardized
3. **Preserves relationships** - Links back to original records via `providerId`, `procedureId`, etc.
4. **Assigns fractional positions** - Enables efficient drag-and-drop reordering
5. **Extracts searchable text** - Creates plain text version for full-text search
6. **Sets appropriate icons and categories** - Visual organization in workspace

### Prerequisites:

1. Database schema must be migrated first:
   ```bash
   npm run prisma:migrate:deploy
   ```

2. Ensure you have existing data in Provider, Procedure, SmartPhrase, or Scenario tables

### Usage:

**Run the migration:**
```bash
npm run migrate:pages
```

**Or directly:**
```bash
npx tsx scripts/migrate-to-pages.ts
```

### What happens:

- Only migrates records that don't already have a Page (prevents duplicates)
- Maintains creation timestamps from original records
- Transfers view counts to new Page records
- Assigns sequential fractional index positions
- Creates appropriate icons for each page type:
  - Providers: 👨‍⚕️
  - Procedures: 📋
  - Smart Phrases: 💬
  - Scenarios: 🚨

### After migration:

The script prints a summary:
```
✅ Migration completed successfully!

📊 Migration Summary:
   Total Pages: 42
   Providers: 15
   Procedures: 12
   Smart Phrases: 10
   Scenarios: 5
```

### Safe to re-run:

Yes! The script only migrates records that don't already have a linked Page, so you can safely run it multiple times.

### Verification:

After running the migration, you can verify the data:

```bash
npm run prisma:studio
```

Then browse the `Page` table to see all migrated records.
