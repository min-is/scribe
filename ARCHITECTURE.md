# Scribe Data Architecture

This document describes the refactored data architecture implemented to resolve data population issues and establish a scalable, maintainable foundation.

## Problem Statement

The original architecture had several issues:
1. **Data corruption bug**: Migration used `JSON.stringify()` on WikiContent instead of proper TipTap extraction
2. **Dual data models**: Provider.wikiContent and Page.content without single source of truth
3. **Tight coupling**: Business logic mixed with database queries throughout the codebase
4. **Type safety issues**: Heavy use of `any` types, no runtime validation
5. **Inconsistent transformations**: Multiple implementations of WikiContent → TipTap conversion

## Architecture Overview

The new architecture follows a layered approach:

```
┌─────────────────────────────────────────────┐
│         UI Layer (React Components)          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│      Server Actions / API Routes            │
│      (src/provider/actions-v2.ts)           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          Service Layer (NEW)                │
│    - Business logic                         │
│    - Data transformations                   │
│    - Validation                             │
│    (src/lib/services/)                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        Repository Layer (NEW)               │
│    - Database operations                    │
│    - Encapsulates Prisma queries            │
│    (src/lib/repositories/)                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Database (PostgreSQL)               │
└─────────────────────────────────────────────┘
```

## Core Components

### 1. Content Transformers (`src/lib/content-transformers.ts`)

Centralized content transformation utilities:

- `wikiContentToTipTap()` - Convert WikiContent JSON to TipTap format
- `textToTipTap()` - Convert plain text/markdown to TipTap
- `tipTapToPlainText()` - Extract searchable text from TipTap
- `legacyToWikiContent()` - Migrate legacy provider fields

**Key Feature**: Single source of truth for all content transformations

### 2. Type Guards (`src/lib/type-guards.ts`)

Runtime type validation:

- `isTipTapContent()` - Validate TipTap JSONContent structure
- `isWikiContent()` - Validate WikiContent schema
- `validateTipTapContent()` - Deep validation with error messages
- `isCorruptedPageContent()` - Detect the JSON.stringify bug

**Key Feature**: Replaces unsafe `as any` casts with proper validation

### 3. DTOs (Data Transfer Objects)

Type-safe contracts between layers:

**`src/lib/dtos/page.dto.ts`**
- `PageDTO` - Complete page data
- `PageSummaryDTO` - Lightweight for lists
- `CreatePageInput` - Create page payload
- `UpdatePageInput` - Update page payload
- `PageSearchFilters` - Search parameters

**`src/lib/dtos/provider.dto.ts`**
- `ProviderDTO` - Complete provider data
- `ProviderProfileDTO` - Display data for profile pages
- `CreateProviderInput` / `UpdateProviderInput`

**Key Feature**: Clean separation between database models and application logic

### 4. Repository Layer

Encapsulates all database operations:

**`BaseRepository`** - Abstract base with common CRUD operations
**`PageRepository`** - Page-specific queries:
- `findBySlug()`, `findByType()`, `findWithFilters()`
- `updateContent()`, `incrementViewCount()`
- `findWithHierarchy()`, `getBreadcrumbs()`

**`ProviderRepository`** - Provider-specific queries:
- `findBySlugWithPage()` - Includes associated page
- `updateWithPageSync()` - Transactional update keeping Provider ↔ Page in sync
- `findTopProviders()`, `search()`

**Key Feature**: All Prisma queries in one place, easy to mock for testing

### 5. Service Layer

Business logic and orchestration:

**`PageService`**
- Validates content before saving
- Generates searchable text content automatically
- Handles hierarchy and breadcrumbs
- Maps Prisma models to DTOs

**`ProviderService`**
- Coordinates Provider and Page updates
- Handles WikiContent transformations
- Manages view count synchronization
- Provides profile data with fallback to legacy fields

**Key Feature**: Testable business logic, reusable across actions and API routes

## Migration Path

### Phase 1: Critical Fixes (Completed)

✅ Fixed `/app/api/migrate-pages/route.ts` bug
✅ Created unified content transformers
✅ Added type guards for runtime validation
✅ Created data repair script (`scripts/repair-page-content.ts`)

### Phase 2: Service & Repository Pattern (Completed)

✅ Implemented repository layer
✅ Implemented service layer
✅ Created DTOs
✅ Refactored provider actions to `actions-v2.ts`

### Phase 3: Gradual Migration (Next Steps)

1. **Update imports**: Change `from './actions'` to `from './actions-v2'` in components
2. **Test thoroughly**: Verify provider pages display correctly
3. **Run repair script**: `npx tsx scripts/repair-page-content.ts`
4. **Deprecate old actions**: Once v2 is stable, remove original actions
5. **Extend to other models**: Apply pattern to Procedures, SmartPhrases, Scenarios

### Phase 4: Schema Simplification (Future)

- Make `Page` the primary source of truth
- Deprecate `Provider.wikiContent` (make it a computed field)
- Update all reads to query `Page` directly via `PageService`

## Usage Examples

### Server Actions (New Pattern)

```typescript
import { ProviderService } from '@/lib/services';

const providerService = new ProviderService();

// Get provider profile
const profile = await providerService.getProviderProfile(slug);

// Update with WikiContent
await providerService.updateProvider(id, {
  wikiContent: updatedContent,
});
// ✅ Automatically syncs to Page.content
```

### Direct Service Usage

```typescript
import { PageService } from '@/lib/services';

const pageService = new PageService();

// Create page with validation
const page = await pageService.createPage({
  slug: 'new-page',
  title: 'New Page',
  content: tipTapJSON,
  type: PageType.WIKI,
});
// ✅ Content validated, textContent generated automatically
```

### Type-Safe Queries

```typescript
import { PageRepository } from '@/lib/repositories';

const repo = new PageRepository();

// Type-safe filters
const pages = await repo.findWithFilters({
  type: [PageType.PROVIDER, PageType.PROCEDURE],
  category: 'Emergency',
  query: 'chest pain',
});
// ✅ Returns Page[] with full type safety
```

## Benefits

### Immediate
- ✅ Fixes provider data display bug
- ✅ Single source of truth for transformations
- ✅ Type safety throughout the stack

### Medium-term
- ✅ Easier to add features (service layer handles complexity)
- ✅ Testable (repositories and services are unit-testable)
- ✅ Better performance (optimized queries in repositories)

### Long-term
- ✅ Maintainable (clear separation of concerns)
- ✅ Scalable (can add caching, search, etc. without touching core logic)
- ✅ Future-proof (abstraction layers mean you can swap implementations)

## Scripts

### Repair Corrupted Pages

```bash
npx tsx scripts/repair-page-content.ts
```

Scans all pages and repairs content that was incorrectly created with `JSON.stringify()`.

### Migrate to Pages

```bash
npx tsx scripts/migrate-to-pages.ts
```

Migrates legacy Provider, Procedure, SmartPhrase, and Scenario records to the unified Page model.

## Testing Recommendations

1. **Unit Tests**: Test services and repositories in isolation
2. **Integration Tests**: Test full flow from actions to database
3. **Data Validation**: Run repair script on staging before production
4. **Performance**: Monitor query counts with Prisma middleware

## File Structure

```
src/
├── lib/
│   ├── content-transformers.ts    # Content transformation utilities
│   ├── type-guards.ts             # Runtime type validation
│   ├── dtos/
│   │   ├── page.dto.ts           # Page data contracts
│   │   ├── provider.dto.ts       # Provider data contracts
│   │   └── index.ts
│   ├── repositories/
│   │   ├── base.repository.ts    # Abstract base repository
│   │   ├── page.repository.ts    # Page data access
│   │   ├── provider.repository.ts # Provider data access
│   │   └── index.ts
│   └── services/
│       ├── page.service.ts       # Page business logic
│       ├── provider.service.ts   # Provider business logic
│       └── index.ts
├── provider/
│   ├── actions.ts                # Original actions (legacy)
│   └── actions-v2.ts             # Refactored actions using services
└── ...

scripts/
├── repair-page-content.ts        # Fix corrupted page content
└── migrate-to-pages.ts           # Migrate to unified Page model

app/api/
└── migrate-pages/
    └── route.ts                  # Fixed migration endpoint
```

## Contributing

When adding new features:

1. **Add DTOs** for new data structures in `src/lib/dtos/`
2. **Extend repositories** with new queries in `src/lib/repositories/`
3. **Add service methods** for business logic in `src/lib/services/`
4. **Update actions** to call services, not Prisma directly
5. **Add type guards** if introducing new JSON structures

## References

- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [TipTap JSONContent](https://tiptap.dev/guide/output-json)
