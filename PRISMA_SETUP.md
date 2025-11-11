# Prisma Database Setup Guide

This project uses Prisma with PostgreSQL for managing physician profiles and preferences.

## Initial Setup

### 1. Set up your Database

#### Option A: Vercel Postgres (Recommended for production)

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Create a new Postgres database
4. Copy the connection string

#### Option B: Local PostgreSQL (For development)

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb scribe
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/scribe?schema=public"

# For Vercel Postgres, use the connection string from your dashboard:
# DATABASE_URL="postgres://username:password@region.postgres.vercel-storage.com/dbname"

# NextAuth (if not already configured)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

### 3. Generate Prisma Client

```bash
pnpm prisma:generate
```

### 4. Run Database Migrations

```bash
pnpm prisma:migrate
```

When prompted, give your migration a name like `init` or `add_physicians`.

## Available Prisma Commands

```bash
# Generate Prisma Client
pnpm prisma:generate

# Create and apply migrations
pnpm prisma:migrate

# Open Prisma Studio (database GUI)
pnpm prisma:studio

# Reset database (WARNING: Deletes all data)
pnpm dlx prisma migrate reset
```

## Database Schema

The current schema includes:

### Physician Model
- `id`: Unique identifier
- `slug`: URL-friendly identifier (e.g., "physician-smith")
- `name`: Full name
- `specialty`: Medical specialty
- `credentials`: Credentials (e.g., "MD, FACP")
- `noteTemplate`: Default note template
- `preferences`: JSON field for additional preferences
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## Usage

### Admin Interface

Access the physician management interface at:
- **Admin Dashboard**: `/admin`
- **Physicians Management**: `/admin/physicians`

### Public Interface

View physician profiles on the homepage:
- Click on a physician name in the "Physician Preferences" section
- Or navigate directly to: `/#physician-slug`

## Troubleshooting

### Migration Issues

If you encounter migration issues:

```bash
# Check migration status
pnpm dlx prisma migrate status

# If stuck, reset database (WARNING: loses data)
pnpm dlx prisma migrate reset

# Re-run migrations
pnpm prisma:migrate
```

### Connection Issues

1. Verify your `DATABASE_URL` is correct in `.env.local`
2. Check that PostgreSQL is running (local development)
3. For Vercel Postgres, ensure your IP is whitelisted

### Prisma Client Not Found

```bash
# Regenerate Prisma Client
pnpm prisma:generate

# Restart your development server
pnpm dev
```

## Production Deployment

When deploying to Vercel:

1. Add `DATABASE_URL` to your Vercel project environment variables
2. Vercel will automatically run `pnpm postinstall` which generates the Prisma Client
3. Migrations are not automatically run - you'll need to run them manually:
   ```bash
   # From your local machine, connected to production database
   DATABASE_URL="your-production-url" pnpm dlx prisma migrate deploy
   ```

## Security Notes

- **Never commit `.env.local`** - it's in .gitignore
- Use strong, unique passwords for database connections
- For production, use connection pooling (Prisma Data Proxy or pgBouncer)
- Regularly backup your database
