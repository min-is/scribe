# Troubleshooting: "Failed to create smartphrase/scenario/procedure"

## Problem
When trying to create SmartPhrases, Scenarios, or Procedures in the admin panel, you receive an error like:
- "Failed to create smartphrase"
- "Failed to create scenario"
- "Failed to create procedure"

## Root Cause
The Prisma client was generated before the SmartPhrase, Scenario, and Procedure models were added to the schema. The client doesn't know about these new models yet.

## Solution

### Option 1: Regenerate Prisma Client (Quickest)
Run this command in your terminal:

```bash
npm run prisma:generate
```

Or if that fails due to network issues:

```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```

### Option 2: Restart Dev Server
If you're running `npm run dev`, simply restart it:

1. Stop the server (Ctrl+C)
2. Run `npm run dev` again
3. The `postinstall` hook will automatically run `prisma generate`

### Option 3: Full Reset (If above don't work)

```bash
# 1. Install dependencies (triggers postinstall -> prisma generate)
npm install

# 2. Run migrations (if not already run)
npm run prisma:migrate:deploy

# 3. Seed data (optional, for SmartPhrases)
npm run prisma:seed

# 4. Start dev server
npm run dev
```

## Verify the Fix

After regenerating the Prisma client:

1. Go to `/admin/smartphrases`
2. Click "Add SmartPhrase"
3. Fill in the form:
   - Slug: `.TEST`
   - Title: `Test Phrase`
   - Category: `Testing`
   - Content: `This is a test`
4. Click "Create SmartPhrase"
5. You should see a success toast notification

## For Production/Vercel Deployment

The `vercel-build` script handles this automatically:
```json
"vercel-build": "prisma migrate deploy && prisma generate && next build"
```

This ensures:
1. Migrations run first (creating tables)
2. Prisma client is generated with new models
3. Next.js builds successfully

## Still Having Issues?

Check the browser console (F12 → Console tab) for detailed error messages. The server action logs the actual error:

```typescript
catch (error) {
  console.error('Error creating smartphrase:', error);
  return { success: false, error: 'Failed to create smartphrase' };
}
```

Common issues:
- **Database not connected**: Check `DATABASE_URL` environment variable
- **Table doesn't exist**: Run migrations with `npm run prisma:migrate:deploy`
- **Permission errors**: Check database user has CREATE/INSERT permissions
- **Unique constraint violation**: Slug already exists (try a different slug)

## Quick Test Commands

```bash
# Check if Prisma can connect to database
npx prisma db pull

# Check current schema state
npx prisma db push --preview-feature

# View database in browser
npx prisma studio
```
