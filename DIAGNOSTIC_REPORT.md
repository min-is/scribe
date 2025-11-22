# Database Issue: Deleted Providers Appearing in Search

## Executive Summary

**Problem:** Searching for 't' returns deleted providers like 'Test, Test' and 'Katie Doering'. These pages load successfully but should not exist.

**Root Cause:** Orphaned `Page` records exist in the database with `type='PROVIDER'` but `providerId=NULL`. These orphaned pages pass all current filters and appear in search results.

**Severity:** Medium - Data integrity issue causing user confusion and exposing deleted content.

---

## Technical Analysis

### 1. The Database Relationship Issue

**Location:** `/home/user/scribe/scripts/run-migrations.js:220`

The foreign key constraint for `Page.providerId` is configured as:

```sql
FOREIGN KEY ("providerId") REFERENCES "Provider"("id")
ON DELETE SET NULL ON UPDATE CASCADE
```

**Problem:** When a Provider is deleted, this constraint sets `providerId` to NULL instead of cascading the deletion to the Page.

**Current Deletion Logic:** `/home/user/scribe/src/provider/actions.ts:326-336`

```typescript
await prisma.$transaction(async (tx) => {
  // Delete associated Page records first
  await tx.page.deleteMany({
    where: { providerId: id },
  });

  // Then delete the provider
  await tx.provider.delete({
    where: { id },
  });
});
```

The current code **does** explicitly delete Pages before deleting Providers. However, orphaned pages likely exist from one of these scenarios:

1. **Legacy Data:** Pages created before this deletion logic was implemented
2. **Failed Transactions:** Previous deletion attempts that partially failed
3. **Direct Database Manipulation:** Manual database changes that bypassed the application logic
4. **Migration Issues:** The foreign key constraint SET NULL behavior affecting older deletions

---

### 2. Search Not Filtering Orphaned Pages

**Location:** `/home/user/scribe/app/api/search/route.ts:22-27`

```typescript
const whereClause: any = {
  deletedAt: null,  // Only checks for soft-deleted pages
  OR: [
    { title: { contains: query, mode: 'insensitive' } },
    { textContent: { contains: query, mode: 'insensitive' } },
    { tags: { hasSome: [query] } },
  ],
};
```

**Missing Filter:** No check to ensure `providerId` is not NULL for PROVIDER-type pages.

**Result:** Orphaned pages (where `type='PROVIDER'` AND `providerId=NULL`) pass this filter and appear in search results.

---

### 3. Page Routing Allows Orphaned Pages

**Location:** `/home/user/scribe/app/home/pages/[slug]/page.tsx:18-53`

```typescript
const getPage = cache(async (slug: string) => {
  return await prisma.page.findUnique({
    where: { slug, deletedAt: null },
    select: {
      // ... fields
      provider: {  // LEFT JOIN - returns null if no provider
        select: { name: true, credentials: true, icon: true },
      },
    },
  });
});
```

**Issue:** The query uses an implicit LEFT JOIN with Provider. Pages with `providerId=NULL` are still returned.

**Rendering Logic:** Lines 140-149 gracefully handle missing providers:

```typescript
{page.provider ? (
  <>{page.provider.name}{page.provider.credentials && <span>, {page.provider.credentials}</span>}</>
) : (
  page.title
)}
```

**Result:** Orphaned pages render successfully, just displaying `page.title` instead of provider information.

---

### 4. How Users Encounter Deleted Providers

**Flow:**
1. User searches for 't' in SearchModal (`/home/user/scribe/src/components/search/SearchModal.tsx:60`)
2. API returns all Pages where `deletedAt=NULL` and title/content contains 't'
3. This includes orphaned Provider pages
4. User clicks "Katie Doering"
5. SearchModal navigates to `/home/pages/doering` (line 94)
6. Page component renders the orphaned page successfully

---

## Why This Happened

### Historical Context

Based on the codebase analysis:

1. **Migration Evolution:**
   - Initial schema: `Physician` model (migration: `20251111183728_init`)
   - Renamed to `Provider` (migration: `20251111193434`)
   - Page model added later (migration: `20251115000000`)

2. **Foreign Key Design Choice:**
   - The `ON DELETE SET NULL` constraint suggests Pages were intended to be independent of their source models
   - This supports the Notion-like document architecture where Pages can exist independently

3. **Deletion Logic Evolution:**
   - Current deletion code explicitly deletes Pages (good!)
   - But legacy data from earlier versions or failed deletions may remain

---

## Current Database State Assessment

**Orphaned Pages Likely Exist If:**
- Searching for common letters returns deleted provider names
- Clicking those results loads valid pages
- The page displays the `title` instead of provider name + credentials

**SQL to Verify:**

```sql
-- Find orphaned PROVIDER pages
SELECT id, slug, title, type, "providerId", "createdAt"
FROM "Page"
WHERE type = 'PROVIDER'
  AND "providerId" IS NULL
  AND "deletedAt" IS NULL;

-- Find specific mentioned pages
SELECT id, slug, title, type, "providerId"
FROM "Page"
WHERE (title ILIKE '%Test, Test%' OR title ILIKE '%Katie Doering%')
  AND "deletedAt" IS NULL;
```

---

## Recommendations

### Immediate Fixes

#### 1. **Clean Up Existing Orphaned Pages** (Quick Win)

Create a cleanup script to soft-delete orphaned Provider pages:

```sql
UPDATE "Page"
SET "deletedAt" = NOW()
WHERE type = 'PROVIDER'
  AND "providerId" IS NULL
  AND "deletedAt" IS NULL;
```

#### 2. **Fix Search Filter** (Prevents Future Issues)

Update `/home/user/scribe/app/api/search/route.ts` to exclude orphaned Provider pages:

```typescript
const whereClause: any = {
  deletedAt: null,
  // Exclude orphaned PROVIDER pages
  NOT: {
    AND: [
      { type: 'PROVIDER' },
      { providerId: null }
    ]
  },
  OR: [
    { title: { contains: query, mode: 'insensitive' } },
    { textContent: { contains: query, mode: 'insensitive' } },
    { tags: { hasSome: [query] } },
  ],
};
```

#### 3. **Fix Page Routing** (Belt and Suspenders)

Update `/home/user/scribe/app/home/pages/[slug]/page.tsx` to handle orphaned pages:

```typescript
const page = await getPage(slug);

if (!page) {
  notFound();
}

// PROVIDER pages MUST have an associated provider
if (page.type === 'PROVIDER' && !page.provider) {
  notFound();
}
```

---

### Long-Term Improvements

#### 1. **Change Foreign Key Constraint to CASCADE** (Recommended)

Update the migration to use `ON DELETE CASCADE`:

```sql
ALTER TABLE "Page" DROP CONSTRAINT "Page_providerId_fkey";

ALTER TABLE "Page" ADD CONSTRAINT "Page_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "Provider"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
```

**Benefits:**
- Database enforces referential integrity automatically
- No need to manually delete Pages in application code
- Impossible to create orphaned pages

**Risks:**
- Requires a migration
- If you want Pages to survive Provider deletion (unlikely based on current design), this won't work

#### 2. **Add Database Constraint** (Extra Safety)

Add a CHECK constraint to prevent NULL providerId for PROVIDER-type pages:

```sql
ALTER TABLE "Page" ADD CONSTRAINT "provider_page_must_have_provider"
CHECK (
  type != 'PROVIDER' OR "providerId" IS NOT NULL
);
```

#### 3. **Implement Soft Delete for Providers** (Optional)

Currently, Providers use hard delete while Pages support soft delete. Consider adding `deletedAt` to Provider model for consistency:

**Benefits:**
- Can restore accidentally deleted providers
- Maintains audit trail
- More consistent with Page model

**Implementation:**
```prisma
model Provider {
  // ... existing fields
  deletedAt DateTime?

  @@index([deletedAt])
}
```

---

## Database Technology Evaluation

### Current Setup: ✅ **PostgreSQL with Prisma - GOOD CHOICE**

**Why it's appropriate:**

1. **Vercel Native Support:**
   - Vercel Postgres is built on PostgreSQL
   - First-class integration with Vercel platform
   - Automatic scaling and connection pooling

2. **Prisma ORM:**
   - Type-safe queries
   - Excellent migrations system
   - Good performance with edge runtime

3. **PostgreSQL Features:**
   - Full-text search (you could enhance search with `tsvector`)
   - JSONB support for flexible content (TipTap editor content)
   - Mature, battle-tested database
   - Excellent indexing capabilities

**Your Current Approach is Sound:** The issue isn't with your database choice, but with:
- Legacy data cleanup needed
- Missing query filters
- Foreign key constraint behavior

### Alternative Considerations (Not Recommended)

| Database | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Supabase** | Real-time subscriptions, built-in auth | Another service to manage, migration effort | Unnecessary - you're not using real-time features |
| **PlanetScale** | Serverless MySQL, great scaling | No foreign keys (vitess limitation), migration effort | **NO** - Foreign keys are important for your use case |
| **MongoDB** | Flexible schema | No relational integrity, complex migrations | **NO** - You need relations |
| **Neon** | Serverless Postgres, generous free tier | Similar to Vercel Postgres, redundant | No compelling reason to switch |

**Recommendation:** **Stay with Vercel Postgres + Prisma**

Your database setup is appropriate for your application. The issue is a data integrity problem, not a technology choice problem.

---

## Proposed Solution Plan

### Phase 1: Immediate Cleanup (15 minutes)

1. Create cleanup migration to soft-delete orphaned pages
2. Deploy and run migration

### Phase 2: Prevention (30 minutes)

1. Update search API to filter orphaned pages
2. Update page routing to reject orphaned pages
3. Add validation to prevent future orphaned pages

### Phase 3: Long-term (Optional, 1 hour)

1. Change foreign key constraint to CASCADE
2. Add database CHECK constraint
3. Consider soft delete for Providers

---

## Files to Modify

1. **Create new migration:** `prisma/migrations/YYYYMMDD_cleanup_orphaned_pages/migration.sql`
2. **Update search:** `app/api/search/route.ts`
3. **Update routing:** `app/home/pages/[slug]/page.tsx`
4. **Update migration script:** `scripts/run-migrations.js` (add cleanup + constraint change)
5. **Update schema:** `prisma/schema.prisma` (change foreign key behavior)

---

## Conclusion

**Root Cause:** Orphaned Page records exist with `type='PROVIDER'` but `providerId=NULL`, passing current filters.

**Quick Fix:** Clean up orphaned pages + add filters to prevent them from appearing.

**Long-term Fix:** Change foreign key to CASCADE and add database constraints.

**Database Choice:** Current PostgreSQL + Prisma setup is excellent - no need to change.

The issue is **data integrity and filtering logic**, not your database technology choice.
