# Data Architecture Documentation

## Overview

This document describes the new data architecture for Scribe, implementing a service/repository pattern to improve maintainability, type safety, and scalability.

## Problem Statement

The original codebase had several architectural issues:

1. **Dual Data Model Confusion**: Provider ↔ Page relationships required dual writes, causing data sync issues
2. **Inconsistent Transformations**: Multiple implementations of WikiContent → TipTap conversion with different logic
3. **Type Safety Issues**: Heavy use of `any` types and lack of runtime validation
4. **Tight Coupling**: Direct Prisma queries scattered throughout components and actions
5. **Data Bug**: Migration route used `JSON.stringify()` instead of proper content extraction

## Solution: Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (React)                      │
│  - Components receive validated DTOs                     │
│  - Type-safe props, no 'any' types                      │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│              Server Actions / API Routes                 │
│  - Thin controllers                                      │
│  - Call services, return DTOs                           │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                  Service Layer                           │
│  - Business logic                                        │
│  - Data transformations                                  │
│  - Validation & error handling                          │
│  - Examples: ProviderService, PageService               │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│               Repository Layer                           │
│  - Database operations only                              │
│  - Encapsulates Prisma queries                          │
│  - Returns domain models                                │
│  - Examples: ProviderRepository, PageRepository         │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                Database (PostgreSQL)                     │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/lib/
├── repositories/           # Data access layer
│   ├── base.repository.ts       # Base CRUD operations
│   ├── page.repository.ts       # Page-specific queries
│   ├── provider.repository.ts   # Provider-specific queries
│   └── index.ts                 # Exports
├── services/              # Business logic layer
│   ├── page.service.ts          # Page operations
│   ├── provider.service.ts      # Provider operations
│   └── index.ts                 # Exports
├── dtos/                  # Data transfer objects
│   ├── page.dto.ts              # Page type contracts
│   ├── provider.dto.ts          # Provider type contracts
│   └── index.ts                 # Exports
├── content-transformers.ts # Content conversion utilities
└── type-guards.ts         # Runtime type validation
```

## Key Components

### 1. Repositories

**Purpose**: Encapsulate all database operations

```typescript
// Example usage
const pageRepo = new PageRepository(prisma);
const page = await pageRepo.findBySlug('my-page');
```

**Benefits**:
- Easy to mock for testing
- Centralized database logic
- Type-safe queries

### 2. Services

**Purpose**: Business logic and orchestration

```typescript
// Example usage
const pageService = new PageService(prisma);
const pageDTO = await pageService.getPageBySlug('my-page');
```

**Benefits**:
- Validates data before saving
- Transforms between models and DTOs
- Handles complex operations (e.g., Provider ↔ Page sync)

### 3. DTOs (Data Transfer Objects)

**Purpose**: Type-safe contracts between layers

```typescript
export interface PageDTO {
  id: string;
  slug: string;
  title: string;
  content: JSONContent;  // Always validated
  // ... other fields
}
```

**Benefits**:
- Clear API contracts
- Separates database models from business logic
- Easy to version and evolve

### 4. Content Transformers

**Purpose**: Single source of truth for content transformations

```typescript
// Convert WikiContent to TipTap
const content = ContentTransformers.wikiContentToTipTap(wikiContent);

// Extract plain text for search
const text = ContentTransformers.tipTapToPlainText(content);
```

**Benefits**:
- Consistent transformations
- Easy to test
- No duplicate code

### 5. Type Guards

**Purpose**: Runtime type validation

```typescript
// Validate TipTap content
if (isTipTapContent(value)) {
  // TypeScript now knows value is JSONContent
}

// Detect corrupted content
if (isCorruptedPageContent(page.content)) {
  // Repair it
}
```

**Benefits**:
- Replaces unsafe `as any` casts
- Provides detailed error messages
- Catches data issues early

## Usage Examples

### Creating a New Page

```typescript
import { PageService } from '@/lib/services';
import { prisma } from '@/lib/prisma';

const pageService = new PageService(prisma);

const page = await pageService.createPage({
  slug: 'my-page',
  title: 'My Page',
  type: PageType.WIKI,
  content: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello world' }],
      },
    ],
  },
});
```

### Updating Provider with Page Sync

```typescript
import { ProviderService } from '@/lib/services';

const providerService = new ProviderService(prisma);

// Updates both Provider.wikiContent and Page.content atomically
await providerService.updateProviderWiki(providerId, wikiContent);
```

### Searching Pages

```typescript
const pages = await pageService.searchPages({
  query: 'cardiology',
  type: PageType.PROVIDER,
  limit: 20,
});
```

## Migration Guide

### For New Code

Use services instead of direct Prisma calls:

```typescript
// ❌ Old way (direct Prisma)
const provider = await prisma.provider.findUnique({
  where: { slug },
  include: { page: true },
});

// ✅ New way (service)
const provider = await providerService.getProviderProfile(slug);
```

### For Existing Code

Gradually migrate actions to use services:

1. Import the service
2. Replace Prisma calls with service methods
3. Update type annotations to use DTOs
4. Test thoroughly

## Data Repair

If you encounter corrupted page content (from the JSON.stringify bug), run:

```bash
npx tsx scripts/repair-page-content.ts
```

This will:
- Scan all pages for corruption
- Attempt to repair from Provider.wikiContent
- Replace with placeholders if repair fails
- Provide a detailed summary

## Testing

### Unit Testing Repositories

```typescript
import { PageRepository } from '@/lib/repositories';

const mockPrisma = {
  page: {
    findUnique: jest.fn(),
    // ... other mocks
  },
};

const repo = new PageRepository(mockPrisma as any);

// Test
await repo.findBySlug('test');
expect(mockPrisma.page.findUnique).toHaveBeenCalledWith({
  where: { slug: 'test' },
});
```

### Unit Testing Services

```typescript
import { PageService } from '@/lib/services';

const mockPrisma = {
  // ... mock all Prisma operations
};

const service = new PageService(mockPrisma as any);

// Test
const page = await service.createPage({
  slug: 'test',
  title: 'Test',
  type: PageType.WIKI,
});

expect(page.textContent).toBeDefined();
```

## Best Practices

### 1. Always Use Services in Actions

```typescript
'use server';

import { ProviderService } from '@/lib/services';
import { prisma } from '@/lib/prisma';

export async function getProvider(slug: string) {
  const service = new ProviderService(prisma);
  return await service.getProviderProfile(slug);
}
```

### 2. Validate Content Before Saving

Services handle this automatically:

```typescript
// This will throw if content is invalid
await pageService.updatePageContent(id, content);
```

### 3. Use Type Guards for Unknown Data

```typescript
import { parseWikiContent } from '@/lib/type-guards';

const wikiContent = parseWikiContent(provider.wikiContent);
if (wikiContent) {
  // Safe to use
}
```

### 4. Generate textContent for Search

Services handle this automatically:

```typescript
// textContent is generated from content
const page = await pageService.createPage({
  content: myTipTapContent,
  // textContent will be auto-generated
});
```

## Future Enhancements

### Phase 3: Schema Simplification
- Make Page the primary source of truth
- Deprecate Provider.wikiContent (make it a view)
- Simplify queries

### Phase 4: Caching
- Add SWR client-side caching
- Consider Redis for server-side caching
- Implement cache invalidation strategies

### Phase 5: Monitoring
- Add logging to services
- Track data integrity issues
- Monitor performance

## Troubleshooting

### TypeScript Error: Implicit 'any' Type

**Fixed**: All type errors have been resolved by adding explicit type annotations.

Example fix in page.repository.ts:
```typescript
// Before (error)
const page = await this.prisma.page.findUnique({ ... });

// After (fixed)
const page: Page | null = await this.prisma.page.findUnique({ ... });
```

### Corrupted Page Content

If you see raw JSON like `{"media":[],"version":1,...}`:

1. Run the repair script: `npx tsx scripts/repair-page-content.ts`
2. Or use the migration endpoint: `/api/migrate-pages`

### Data Out of Sync

If Provider.wikiContent and Page.content diverge:

1. Use `ProviderService.updateProviderWiki()` which updates both atomically
2. The service uses transactions to ensure consistency

## Contributing

When adding new models:

1. Create a repository in `src/lib/repositories/`
2. Create a service in `src/lib/services/`
3. Define DTOs in `src/lib/dtos/`
4. Use the service in server actions
5. Write tests for both repository and service

## Questions?

Refer to the implementation files for detailed examples:
- `src/lib/repositories/page.repository.ts`
- `src/lib/services/page.service.ts`
- `src/lib/dtos/page.dto.ts`
