# Railway PostgreSQL Connection Setup

This guide explains how to connect your Railway PostgreSQL database to both your Vercel-hosted website and Railway-hosted Discord bot.

## Overview

- **Database**: PostgreSQL hosted on Railway
- **Website**: Next.js hosted on Vercel
- **Discord Bot**: Python hosted on Railway
- **Goal**: Share one database between both services

---

## Step 1: Get Railway Connection String

### From Railway Dashboard

1. Go to your Railway project: https://railway.app
2. Click on your **PostgreSQL** service
3. Navigate to the **Variables** tab
4. Copy the `DATABASE_URL` value

The connection string format:
```
postgresql://username:password@host.railway.app:port/database
```

**Example:**
```
postgresql://postgres:abc123xyz@containers-us-west-123.railway.app:5432/railway
```

---

## Step 2: Connect Vercel Website to Railway Database

### Add Environment Variable to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: (paste the Railway connection string from Step 1)
   - **Environments**: Check **Production**, **Preview**, and **Development**
4. Click **Save**

### Redeploy Your Application

After adding the environment variable:

1. Go to the **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Select **Redeploy**

Vercel will now use your Railway PostgreSQL database!

---

## Step 3: Connect Discord Bot to Railway Database

Your Discord bot is already hosted on Railway, so connecting to the Railway PostgreSQL is easier:

### Option A: Use Railway's Internal Networking (Recommended)

Railway services within the same project can communicate via internal networking:

1. In your Railway project, select your **Python Discord Bot** service
2. Go to the **Variables** tab
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Reference the PostgreSQL service
   - **Use Railway's variable reference**: `${{Postgres.DATABASE_URL}}`

This creates an internal connection that's faster and more secure.

### Option B: Use Public Connection String

Alternatively, use the same public connection string from Step 1:

1. Select your **Python Discord Bot** service in Railway
2. Go to **Variables** tab
3. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: (same connection string from Step 1)

---

## Step 4: Update Python Bot Code to Use PostgreSQL

Your Discord bot currently uses CSV files (`database.py`). To use PostgreSQL:

### Install Python Dependencies

Add to your `requirements.txt`:
```txt
psycopg2-binary==2.9.9
sqlalchemy==2.0.23
alembic==1.13.1
```

### Update Database Class

Replace CSV storage with PostgreSQL using SQLAlchemy (ORM for Python):

```python
# database.py (updated)
from sqlalchemy import create_engine, Column, String, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Shift(Base):
    __tablename__ = 'Shift'

    id = Column(String, primary_key=True)
    date = Column(DateTime)
    zone = Column(String)
    startTime = Column(String)
    endTime = Column(String)
    site = Column(String)
    scribeId = Column(String, nullable=True)
    providerId = Column(String, nullable=True)
    # ... rest of fields

def save_shifts_to_db(shifts):
    session = SessionLocal()
    try:
        # Insert shifts into database
        for shift in shifts:
            session.add(Shift(**shift))
        session.commit()
    finally:
        session.close()
```

**Note**: The website uses Prisma (TypeScript ORM), and the bot would use SQLAlchemy (Python ORM). Both work with the same PostgreSQL database.

---

## Step 5: Test Database Connection Locally

### Test from Next.js (Website)

1. Create a `.env` file in your project root:
   ```bash
   DATABASE_URL="postgresql://username:password@host.railway.app:port/database"
   ```

2. Run Prisma commands to test:
   ```bash
   npx prisma db pull       # Pull schema from database
   npx prisma generate      # Generate Prisma Client
   npx prisma studio        # Open database GUI
   ```

3. If successful, you'll see your database tables in Prisma Studio

### Test from Python (Discord Bot)

1. Create a `.env` file in your bot directory:
   ```bash
   DATABASE_URL="postgresql://username:password@host.railway.app:port/database"
   ```

2. Test connection with a simple script:
   ```python
   import os
   import psycopg2
   from dotenv import load_dotenv

   load_dotenv()

   conn = psycopg2.connect(os.getenv('DATABASE_URL'))
   cur = conn.cursor()
   cur.execute('SELECT version();')
   print(cur.fetchone())
   conn.close()
   ```

---

## Step 6: Run Database Migrations

After connecting, you need to create the new shift tables:

### From Website (Prisma)

```bash
# Generate migration files
npx prisma migrate dev --name add_shift_tables

# Apply migrations to production
npx prisma migrate deploy
```

This creates the `Shift` and `Scribe` tables in your Railway PostgreSQL database.

### From Discord Bot

If your bot needs to create tables, use SQLAlchemy:

```python
from database import Base, engine

# Create all tables
Base.metadata.create_all(engine)
```

---

## Security Best Practices

### ✅ DO:
- Store `DATABASE_URL` in environment variables only
- Use Railway's internal networking when possible
- Enable SSL/TLS for database connections (Railway does this by default)
- Use strong passwords for database credentials
- Rotate credentials periodically

### ❌ DON'T:
- Commit `.env` files to git (add to `.gitignore`)
- Share connection strings in public channels
- Use default/weak passwords
- Hardcode credentials in source code

---

## Common Issues & Troubleshooting

### Issue: "Connection refused" or "Connection timeout"

**Solution**: Ensure Railway database is set to accept external connections:
1. Check Railway database settings
2. Verify the connection string is correct
3. Confirm your IP isn't blocked (Railway should allow all IPs by default)

### Issue: "SSL required" error

**Solution**: Add `?sslmode=require` to your connection string:
```
postgresql://user:pass@host:port/db?sslmode=require
```

### Issue: Prisma migration fails

**Solution**:
1. Ensure `DATABASE_URL` is set correctly
2. Check database credentials are valid
3. Try `npx prisma db push` instead of `migrate dev` for quick testing

### Issue: Python bot can't connect

**Solution**:
1. Install `psycopg2-binary` (not just `psycopg2`)
2. Check `DATABASE_URL` format is correct
3. Test connection with raw `psycopg2` first before using SQLAlchemy

---

## Monitoring Database Usage

### Railway Dashboard

1. Go to your PostgreSQL service in Railway
2. Click on the **Metrics** tab
3. Monitor:
   - Connection count
   - Storage usage
   - Query performance

### Prisma Studio (Website)

```bash
npx prisma studio
```

This opens a web UI to browse/edit database records.

---

## Next Steps

After successful database connection:

1. ✅ Run Prisma migrations to create shift tables
2. ✅ Update Discord bot to write to PostgreSQL instead of CSV
3. ✅ Test data flow: Scraper → Database → Website
4. ✅ Set up scheduled refresh (every 12 hours)
5. ✅ Add monitoring/logging for database errors

---

## Resources

- [Railway PostgreSQL Docs](https://docs.railway.app/databases/postgresql)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [SQLAlchemy PostgreSQL](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html)

---

**Questions?** Open an issue on GitHub or check the [Railway Discord](https://discord.gg/railway).
