"""
Pydantic models for data validation
"""
import re
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, field_validator


class Shift(BaseModel):
    """
    Validated shift model ensuring all data meets expected formats.
    """
    date: str  # YYYY-MM-DD format
    label: str  # Zone label (A, B, C, etc.)
    time: str  # HHMM-HHMM format
    person: str  # Standardized person name
    role: Literal['Scribe', 'Physician', 'MLP']  # Must be one of these
    site: str  # Site name

    @field_validator('date')
    @classmethod
    def validate_date(cls, v: str) -> str:
        """Ensure date is in YYYY-MM-DD format and is valid"""
        try:
            datetime.strptime(v, "%Y-%m-%d")
            return v
        except ValueError:
            raise ValueError(f"Invalid date format: {v}. Expected YYYY-MM-DD")

    @field_validator('time')
    @classmethod
    def validate_time(cls, v: str) -> str:
        """Ensure time is in HHMM-HHMM format"""
        if not re.match(r'^\d{3,4}-\d{3,4}$', v):
            raise ValueError(f"Invalid time format: {v}. Expected HHMM-HHMM or HMM-HHMM")

        # Validate time ranges
        start, end = v.split('-')

        def parse_time(t: str) -> int:
            """Convert time string to minutes"""
            if len(t) == 4:
                h, m = int(t[:2]), int(t[2:])
            elif len(t) == 3:
                h, m = int(t[0]), int(t[1:])
            else:
                raise ValueError(f"Invalid time component: {t}")

            if h > 23 or m > 59:
                raise ValueError(f"Invalid time: {t}")
            return h * 60 + m

        # Validate both times are valid
        parse_time(start)
        parse_time(end)

        return v

    @field_validator('person')
    @classmethod
    def validate_person(cls, v: str) -> str:
        """Ensure person name is not empty"""
        if not v or not v.strip():
            raise ValueError("Person name cannot be empty")
        return v.strip()

    @field_validator('label')
    @classmethod
    def validate_label(cls, v: str) -> str:
        """Ensure label is not empty"""
        if not v or not v.strip():
            raise ValueError("Label cannot be empty")
        return v.strip()

    @field_validator('site')
    @classmethod
    def validate_site(cls, v: str) -> str:
        """Ensure site name is not empty"""
        if not v or not v.strip():
            raise ValueError("Site name cannot be empty")
        return v.strip()

    def to_dict(self) -> dict:
        """Convert to dictionary for database storage"""
        return {
            'date': self.date,
            'label': self.label,
            'time': self.time,
            'person': self.person,
            'role': self.role,
            'site': self.site
        }


class ParsedScheduleData(BaseModel):
    """Container for validating a list of shifts"""
    shifts: list[Shift]

    @classmethod
    def validate_shifts(cls, raw_data: list[dict]) -> tuple[list[Shift], list[dict]]:
        """
        Validate a list of raw shift dictionaries.

        Returns:
            Tuple of (valid_shifts, invalid_records)
        """
        valid_shifts = []
        invalid_records = []

        for record in raw_data:
            try:
                shift = Shift(**record)
                valid_shifts.append(shift)
            except Exception as e:
                invalid_records.append({
                    'record': record,
                    'error': str(e)
                })

        return valid_shifts, invalid_records
