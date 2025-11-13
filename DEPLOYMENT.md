# Deployment Guide - SmartPhrase Library

## Prerequisites

Before deploying, ensure you have:

1. **Database Setup**: A PostgreSQL database (Vercel Postgres, Neon, Supabase, etc.)
2. **Environment Variables**: Required environment variables set in your deployment platform

## Environment Variables

Configure these in your Vercel/deployment platform:

```bash
# Database Connection
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# NextAuth v5
AUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
AUTH_URL="https://your-domain.vercel.app"

# Admin Access
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-password"
```

## Vercel Deployment Steps

### 1. Set Environment Variables

In your Vercel project settings:
1. Go to **Settings** → **Environment Variables**
2. Add all required variables (see above)
3. Ensure `DATABASE_URL` is set for **Production**, **Preview**, and **Development** environments

### 2. Database Migration

The `vercel-build` script will automatically:
- Run `prisma migrate deploy` to apply all migrations
- Generate Prisma Client
- Build the Next.js app

**Important**: Vercel will use the `vercel-build` script automatically if it exists, which includes database migration.

### 3. Seed the Database (First Deployment Only)

After your first successful deployment, seed the SmartPhrase data:

**Option A: Via Vercel CLI**
```bash
vercel env pull .env.local
npm run prisma:seed
```

**Option B: Via Direct Database Connection**
```bash
DATABASE_URL="your-production-db-url" npm run prisma:seed
```

**Option C: Manual SQL**
Run the seed script manually via your database client using the migration file.

### 4. Verify Deployment

1. Visit `https://your-domain.vercel.app/smartphrases`
2. You should see the SmartPhrase Library with all seeded phrases
3. Test search and copy functionality

## Manual Migration (If Needed)

If the `vercel-build` script fails due to database connectivity:

1. **Update build command** in `vercel.json`:
   ```json
   {
     "buildCommand": "pnpm build",
     ...
   }
   ```

2. **Run migration manually** after deployment:
   ```bash
   vercel env pull .env.local
   npm run prisma:migrate:deploy
   npm run prisma:seed
   ```

## Troubleshooting

### Error: Can't reach database server

**Cause**: `DATABASE_URL` environment variable not set or database not accessible during build.

**Solution**:
1. Verify `DATABASE_URL` is set in Vercel environment variables
2. Ensure database allows connections from Vercel's IP ranges
3. Check database credentials are correct

### Error: Migration failed

**Cause**: Migration conflicts or database schema issues.

**Solution**:
```bash
# Reset migration state (development only!)
npx prisma migrate reset

# Or resolve conflicts manually
npx prisma migrate resolve --applied <migration_name>
```

### Prisma Client not generated

**Cause**: `postinstall` hook not running or Prisma version mismatch.

**Solution**:
```bash
npm run prisma:generate
```

## Post-Deployment Tasks

### 1. Add More SmartPhrases (Optional)

Add custom SmartPhrases via:
- Direct database inserts
- Admin panel (if implemented)
- Update `prisma/seed.ts` and re-run seed script

### 2. Monitor Usage Analytics

Track SmartPhrase usage via the `usageCount` field:
```sql
SELECT slug, title, "usageCount"
FROM "SmartPhrase"
ORDER BY "usageCount" DESC
LIMIT 10;
```

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run build` | Build Next.js app (no DB required) |
| `npm run vercel-build` | Full deployment build (includes migrations) |
| `npm run prisma:migrate:deploy` | Apply migrations only |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:seed` | Seed SmartPhrase data |
| `npm run dev` | Start development server |

## Next Steps

After deploying the SmartPhrase Library:
1. ✅ Test all functionality
2. ⏭️ Implement Scenarios module (similar pattern)
3. ⏭️ Implement Procedures module (similar pattern)
4. ⏭️ Add admin panel for managing SmartPhrases
5. ⏭️ Analytics dashboard for usage tracking
