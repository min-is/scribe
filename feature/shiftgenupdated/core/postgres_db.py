"""
PostgreSQL database manager for shift schedules
"""
import os
import hashlib
from datetime import datetime
from typing import List, Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

from .models import Shift, ParsedScheduleData
from .name_mapper import NameMapper
from .discord_formatter import DiscordFormatter


class PostgresDatabase(DiscordFormatter):
    """PostgreSQL database manager with connection pooling and error handling"""

    def __init__(self, name_mapper: NameMapper = None):
        """
        Initialize PostgreSQL database connection.

        Environment variables required:
            DATABASE_URL or individual components:
            - POSTGRES_HOST
            - POSTGRES_PORT
            - POSTGRES_DB
            - POSTGRES_USER
            - POSTGRES_PASSWORD
        """
        load_dotenv()
        self.name_mapper = name_mapper or NameMapper()
        self.connection = None
        self._connect()
        self._initialize_schema()

    def _connect(self):
        """Establish database connection"""
        # Try DATABASE_URL first (Railway provides this)
        database_url = os.getenv('DATABASE_URL')

        if database_url:
            # Railway sometimes provides postgres:// instead of postgresql://
            if database_url.startswith('postgres://'):
                database_url = database_url.replace('postgres://', 'postgresql://', 1)
            self.connection = psycopg2.connect(database_url)
        else:
            # Fall back to individual components
            self.connection = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                port=os.getenv('POSTGRES_PORT', '5432'),
                database=os.getenv('POSTGRES_DB', 'shiftgen'),
                user=os.getenv('POSTGRES_USER', 'postgres'),
                password=os.getenv('POSTGRES_PASSWORD', '')
            )

        self.connection.autocommit = False

    def _ensure_connection(self):
        """
        Ensure database connection is alive. Reconnect if connection is closed.
        This handles SSL errors and connection timeouts that can occur with Railway PostgreSQL.
        """
        try:
            # Check if connection is closed
            if self.connection is None or self.connection.closed:
                self._connect()
                return

            # Test the connection with a simple query
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except (psycopg2.OperationalError, psycopg2.InterfaceError):
            # Connection is broken, reconnect
            self._connect()

    def _initialize_schema(self):
        """Create database tables if they don't exist"""
        schema = """
        -- Shifts table
        CREATE TABLE IF NOT EXISTS shifts (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            label VARCHAR(50) NOT NULL,
            time VARCHAR(20) NOT NULL,
            person VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            site VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(date, label, time, person, role)
        );

        -- Index for faster queries
        CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
        CREATE INDEX IF NOT EXISTS idx_shifts_role ON shifts(role);
        CREATE INDEX IF NOT EXISTS idx_shifts_person ON shifts(person);

        -- Metadata table for tracking refreshes
        CREATE TABLE IF NOT EXISTS metadata (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Table to track alerted changes to prevent duplicate alerts
        CREATE TABLE IF NOT EXISTS alerted_changes (
            id SERIAL PRIMARY KEY,
            change_hash VARCHAR(255) UNIQUE NOT NULL,
            change_type VARCHAR(20) NOT NULL,
            date DATE NOT NULL,
            label VARCHAR(50) NOT NULL,
            time VARCHAR(20) NOT NULL,
            old_person VARCHAR(255),
            new_person VARCHAR(255),
            site VARCHAR(255) NOT NULL,
            alerted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Index for cleanup queries
        CREATE INDEX IF NOT EXISTS idx_alerted_changes_date ON alerted_changes(date);
        """

        try:
            with self.connection.cursor() as cursor:
                cursor.execute(schema)
                self.connection.commit()
        except Exception as e:
            self.connection.rollback()
            raise Exception(f"Failed to initialize database schema: {e}")

    def update_data(self, new_data: List[Dict]) -> tuple[int, int, List[dict]]:
        """
        Replace all data with new data (full refresh strategy).
        Validates data using Pydantic models before insertion.

        Args:
            new_data: List of raw shift dictionaries

        Returns:
            Tuple of (valid_count, invalid_count, invalid_records)
        """
        self._ensure_connection()
        # Standardize names first
        for record in new_data:
            role = record.get('role', '')
            raw_person = record.get('person', '')
            record['person'] = self.name_mapper.standardize_name(raw_person, role)

        # Validate using Pydantic
        valid_shifts, invalid_records = ParsedScheduleData.validate_shifts(new_data)

        if not valid_shifts:
            return 0, len(invalid_records), invalid_records

        try:
            with self.connection.cursor() as cursor:
                # Clear existing data
                cursor.execute("DELETE FROM shifts")

                # Insert new data
                insert_query = """
                    INSERT INTO shifts (date, label, time, person, role, site)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (date, label, time, person, role)
                    DO UPDATE SET
                        site = EXCLUDED.site,
                        updated_at = CURRENT_TIMESTAMP
                """

                for shift in valid_shifts:
                    cursor.execute(insert_query, (
                        shift.date,
                        shift.label,
                        shift.time,
                        shift.person,
                        shift.role,
                        shift.site
                    ))

                # Update metadata
                cursor.execute("""
                    INSERT INTO metadata (key, value, updated_at)
                    VALUES ('last_refresh', %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (key) DO UPDATE SET
                        value = EXCLUDED.value,
                        updated_at = CURRENT_TIMESTAMP
                """, (datetime.now().isoformat(),))

                self.connection.commit()
                return len(valid_shifts), len(invalid_records), invalid_records

        except Exception as e:
            self.connection.rollback()
            raise Exception(f"Failed to update database: {e}")

    def get_shifts_for_date(self, target_date: str) -> List[Dict]:
        """
        Get all shifts for a specific date.

        Deduplicates results to ensure only one shift per (date, label, time, role) combination.
        In case of duplicates, keeps the most recently updated record.

        Args:
            target_date: Date in YYYY-MM-DD format

        Returns:
            List of shift dictionaries
        """
        self._ensure_connection()
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Use DISTINCT ON to deduplicate by (date, label, time, role)
                # This ensures only ONE scribe per shift, even if multiple people are assigned
                # Keep the most recently updated record in case of duplicates
                cursor.execute("""
                    SELECT DISTINCT ON (date, label, time, role)
                           date, label, time, person, role, site
                    FROM shifts
                    WHERE date = %s
                    ORDER BY date, label, time, role, updated_at DESC
                """, (target_date,))
                results = cursor.fetchall()
                # Convert date objects to strings
                return [
                    {
                        'date': row['date'].strftime('%Y-%m-%d'),
                        'label': row['label'],
                        'time': row['time'],
                        'person': row['person'],
                        'role': row['role'],
                        'site': row['site']
                    }
                    for row in results
                ]
        except Exception as e:
            raise Exception(f"Failed to fetch shifts for date {target_date}: {e}")

    def get_all_shifts(self) -> List[Dict]:
        """
        Get all shifts from database.

        Deduplicates results to ensure only one shift per (date, label, time, role) combination.
        This prevents false shift change alerts when duplicates exist in the database.
        """
        self._ensure_connection()
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Use DISTINCT ON to deduplicate by (date, label, time, role)
                # This ensures only ONE person per shift, even if duplicates exist
                # Keep the most recently updated record in case of duplicates
                cursor.execute("""
                    SELECT DISTINCT ON (date, label, time, role)
                           date, label, time, person, role, site
                    FROM shifts
                    ORDER BY date, label, time, role, updated_at DESC
                """)
                results = cursor.fetchall()
                return [
                    {
                        'date': row['date'].strftime('%Y-%m-%d'),
                        'label': row['label'],
                        'time': row['time'],
                        'person': row['person'],
                        'role': row['role'],
                        'site': row['site']
                    }
                    for row in results
                ]
        except Exception as e:
            raise Exception(f"Failed to fetch all shifts: {e}")

    def get_date_range(self) -> tuple[Optional[str], Optional[str]]:
        """
        Get the minimum and maximum dates in the database.

        Returns:
            Tuple of (min_date, max_date) in YYYY-MM-DD format, or (None, None) if empty
        """
        self._ensure_connection()
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT MIN(date), MAX(date) FROM shifts")
                result = cursor.fetchone()
                if result[0] and result[1]:
                    return result[0].strftime('%Y-%m-%d'), result[1].strftime('%Y-%m-%d')
                return None, None
        except Exception as e:
            raise Exception(f"Failed to get date range: {e}")

    def get_record_count(self) -> int:
        """Get total number of shifts in database"""
        self._ensure_connection()
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM shifts")
                return cursor.fetchone()[0]
        except Exception as e:
            raise Exception(f"Failed to get record count: {e}")

    def get_last_refresh_time(self) -> Optional[str]:
        """Get timestamp of last database refresh"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT value FROM metadata WHERE key = 'last_refresh'")
                result = cursor.fetchone()
                return result[0] if result else None
        except Exception:
            return None

    def _generate_change_hash(self, change_type: str, date: str, label: str, time: str,
                              old_person: Optional[str], new_person: Optional[str]) -> str:
        """
        Generate a unique hash for a change to prevent duplicate alerts.

        Args:
            change_type: 'added', 'removed', or 'modified'
            date: Date in YYYY-MM-DD format
            label: Shift label
            time: Time string
            old_person: Previous person (None for added)
            new_person: New person (None for removed)

        Returns:
            SHA256 hash string
        """
        hash_input = f"{change_type}|{date}|{label}|{time}|{old_person}|{new_person}"
        return hashlib.sha256(hash_input.encode()).hexdigest()

    def _is_change_already_alerted(self, change_hash: str) -> bool:
        """Check if a change has already been alerted"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(
                    "SELECT 1 FROM alerted_changes WHERE change_hash = %s",
                    (change_hash,)
                )
                return cursor.fetchone() is not None
        except Exception:
            return False

    def _mark_change_as_alerted(self, change: Dict) -> None:
        """Mark a change as alerted to prevent future duplicate alerts"""
        try:
            change_hash = self._generate_change_hash(
                change['type'],
                change.get('new', change.get('old'))['date'],
                change.get('new', change.get('old'))['label'],
                change.get('new', change.get('old'))['time'],
                change.get('old', {}).get('person') if change.get('old') else None,
                change.get('new', {}).get('person') if change.get('new') else None
            )

            old_record = change.get('old')
            new_record = change.get('new')
            record = new_record or old_record

            with self.connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO alerted_changes
                    (change_hash, change_type, date, label, time, old_person, new_person, site)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (change_hash) DO NOTHING
                """, (
                    change_hash,
                    change['type'],
                    record['date'],
                    record['label'],
                    record['time'],
                    old_record['person'] if old_record else None,
                    new_record['person'] if new_record else None,
                    record['site']
                ))
                self.connection.commit()
        except Exception as e:
            self.connection.rollback()
            # Don't fail the whole process if we can't mark a change
            print(f"Warning: Failed to mark change as alerted: {e}")

    def mark_changes_as_alerted(self, changes: List[Dict]) -> None:
        """
        Mark multiple changes as alerted.
        Should be called after successfully posting alerts to Discord.

        Args:
            changes: List of change dictionaries
        """
        for change in changes:
            self._mark_change_as_alerted(change)

    def cleanup_old_alerted_changes(self, days_to_keep: int = 30) -> None:
        """
        Remove alerted changes older than specified days to prevent table bloat.

        Args:
            days_to_keep: Number of days to keep alerted change records
        """
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM alerted_changes
                    WHERE date < CURRENT_DATE - INTERVAL '%s days'
                """, (days_to_keep,))
                self.connection.commit()
        except Exception as e:
            self.connection.rollback()
            print(f"Warning: Failed to cleanup old alerted changes: {e}")

    def compare_schedules(self, new_data: List[Dict]) -> List[Dict]:
        """
        Compare new schedule data with current data to find changes.
        Only returns changes that haven't been alerted yet.

        Args:
            new_data: List of new shift dictionaries

        Returns:
            List of changes in format: {
                'type': 'added'|'removed'|'modified',
                'old': {...}|None,
                'new': {...}|None
            }
        """
        changes = []

        # Get current shifts from database
        current_shifts = self.get_all_shifts()

        # Create lookup dictionaries (only track scribe changes)
        old_shifts = {}
        for record in current_shifts:
            if record.get('role') == 'Scribe':
                key = (record.get('date'), record.get('label'), record.get('time'))
                old_shifts[key] = record

        new_shifts = {}
        for record in new_data:
            if record.get('role') == 'Scribe':
                # Standardize name
                role = record.get('role', '')
                raw_person = record.get('person', '')
                standardized_person = self.name_mapper.standardize_name(raw_person, role)
                record_copy = record.copy()
                record_copy['person'] = standardized_person

                key = (record.get('date'), record.get('label'), record.get('time'))
                new_shifts[key] = record_copy

        # Find removed shifts
        for key, old_record in old_shifts.items():
            if key not in new_shifts:
                change = {
                    'type': 'removed',
                    'old': old_record,
                    'new': None
                }
                # Only include if not already alerted
                change_hash = self._generate_change_hash(
                    'removed',
                    old_record['date'],
                    old_record['label'],
                    old_record['time'],
                    old_record['person'],
                    None
                )
                if not self._is_change_already_alerted(change_hash):
                    changes.append(change)

        # Find added or modified shifts
        for key, new_record in new_shifts.items():
            if key not in old_shifts:
                change = {
                    'type': 'added',
                    'old': None,
                    'new': new_record
                }
                # Only include if not already alerted
                change_hash = self._generate_change_hash(
                    'added',
                    new_record['date'],
                    new_record['label'],
                    new_record['time'],
                    None,
                    new_record['person']
                )
                if not self._is_change_already_alerted(change_hash):
                    changes.append(change)
            elif old_shifts[key].get('person') != new_record.get('person'):
                change = {
                    'type': 'modified',
                    'old': old_shifts[key],
                    'new': new_record
                }
                # Only include if not already alerted
                change_hash = self._generate_change_hash(
                    'modified',
                    new_record['date'],
                    new_record['label'],
                    new_record['time'],
                    old_shifts[key]['person'],
                    new_record['person']
                )
                if not self._is_change_already_alerted(change_hash):
                    changes.append(change)

        return changes

    def is_empty(self) -> bool:
        """Check if database has any shifts"""
        return self.get_record_count() == 0

    def remove_duplicate_shifts(self) -> int:
        """
        Remove duplicate shift entries from the database.
        Keeps the most recently updated record for each (date, label, time, role) combination.
        This ensures only ONE person is assigned to each shift.

        Returns:
            Number of duplicate records removed
        """
        self._ensure_connection()
        try:
            with self.connection.cursor() as cursor:
                # Find and delete duplicates, keeping the one with the latest updated_at
                # Partition by (date, label, time, role) to ensure only one person per shift
                cursor.execute("""
                    DELETE FROM shifts
                    WHERE id IN (
                        SELECT id
                        FROM (
                            SELECT id,
                                   ROW_NUMBER() OVER (
                                       PARTITION BY date, label, time, role
                                       ORDER BY updated_at DESC
                                   ) AS row_num
                            FROM shifts
                        ) duplicates
                        WHERE row_num > 1
                    )
                """)
                deleted_count = cursor.rowcount
                self.connection.commit()
                return deleted_count
        except Exception as e:
            self.connection.rollback()
            raise Exception(f"Failed to remove duplicate shifts: {e}")

    def get_duplicate_count(self) -> int:
        """
        Count the number of duplicate shift entries in the database.
        Counts shifts where multiple people are assigned to the same (date, label, time, role).

        Returns:
            Number of duplicate records that would be removed
        """
        self._ensure_connection()
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*)
                    FROM (
                        SELECT id,
                               ROW_NUMBER() OVER (
                                   PARTITION BY date, label, time, role
                                   ORDER BY updated_at DESC
                               ) AS row_num
                        FROM shifts
                    ) duplicates
                    WHERE row_num > 1
                """)
                return cursor.fetchone()[0]
        except Exception as e:
            raise Exception(f"Failed to count duplicates: {e}")

    def clear_all_shifts(self) -> int:
        """
        Clear all shift entries from the database.
        Use this for a complete database reset before repopulating with fresh data.

        Returns:
            Number of records deleted
        """
        self._ensure_connection()
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM shifts")
                count = cursor.fetchone()[0]

                cursor.execute("DELETE FROM shifts")
                self.connection.commit()
                return count
        except Exception as e:
            self.connection.rollback()
            raise Exception(f"Failed to clear shifts: {e}")

    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()

    def __del__(self):
        """Cleanup on deletion"""
        self.close()
