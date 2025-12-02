import csv
import discord
from datetime import datetime
from pathlib import Path
from typing import List, Dict
import pytz

from .name_mapper import NameMapper


class ConsolidatedDatabase:
    
    def __init__(self, filepath: str = "schedule_outputs/master_schedule.csv", name_mapper: NameMapper = None):
        """
        Initialize the database manager.
        
        Args:
            filepath: Path to the master CSV file
            name_mapper: NameMapper instance for standardizing names
        """
        self.filepath = Path(filepath)
        self.filepath.parent.mkdir(exist_ok=True)
        self.name_mapper = name_mapper or NameMapper()
        self.data = []
    
    def update_data(self, new_data: List[Dict]) -> int:
        
        """
        Replace all data with new data (full refresh strat)
        This ensures the database always reflects the current schedule state.
        
        Args:
            new_data: List of new shift dictionaries
            
        Returns:
            Number of records in the new dataset
        """

        # Standardize names and remove duplicates
        seen = set()
        self.data = []
        
        for record in new_data:
            # Standardize names
            role = record.get('role', '')
            raw_person = record.get('person', '')
            record['person'] = self.name_mapper.standardize_name(raw_person, role)
            
            # Deduplicate
            key = (record.get('date'), record.get('label'), record.get('time'), 
                   record.get('person'), record.get('role'))
            if key not in seen:
                self.data.append(record)
                seen.add(key)
        
        # Sort by date and time
        self.data.sort(key=lambda x: (x.get('date', ''), x.get('time', '')))
        
        return len(self.data)
    
    def save(self) -> None:
        """Save the database to CSV."""
        if not self.data:
            return
        
        fieldnames = ['date', 'label', 'time', 'person', 'role', 'site']
        with open(self.filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.data)
    
    def get_shifts_for_date(self, target_date: str) -> List[Dict]:
        """
        Get all shifts for a specific date.
        
        Args:
            target_date: Date in YYYY-MM-DD format
            
        Returns:
            List of shift dictionaries for that date
        """
        return [s for s in self.data if s.get('date') == target_date]
    
    def format_daily_schedule_combined(self, target_date: str) -> discord.Embed:
        """
        Format the schedule as a single combined embed for auto-updating messages.
        
        Args:
            target_date: Date in YYYY-MM-DD format
            
        Returns:
            Single discord.Embed object with all time periods
        """
        shifts = self.get_shifts_for_date(target_date)
        date_obj = datetime.strptime(target_date, "%Y-%m-%d")
        
        # Format title
        import platform
        if platform.system() == 'Windows':
            title = f"{date_obj.strftime('%A')} • {date_obj.strftime('%#m/%#d/%Y')}"
        else:
            title = f"{date_obj.strftime('%A')} • {date_obj.strftime('%-m/%-d/%Y')}"
        
        # Create embed with color based on day of week
        colors = {
            0: 0x3498db,  # Monday - Blue
            1: 0x9b59b6,  # Tuesday - Purple
            2: 0xe91e63,  # Wednesday - Pink
            3: 0xf39c12,  # Thursday - Orange
            4: 0x2ecc71,  # Friday - Green
            5: 0x1abc9c,  # Saturday - Teal
            6: 0xe74c3c,  # Sunday - Red
        }
        
        # Zone color indicators
        zone_indicators = {
            'A': '🟥 (Zone 2) →',
            'E': '🟥 (Zone 2) →',
            'I': '🟥 (Zone 2) →',
            'B': '🟦 (Zone 1) →',
            'F': '🟦 (Zone 1) →',
            'X': '🟦 (Zone 1) →',
            'C': '🟨 (Zone 3/4) →',
            'G': '🟨 (Zone 3/4) →',
            'D': '🟪 (Fast Track) →',
            'H': '🟪 (Fast Track) →',
            'PIT': '🟫 (Overflow) →',
            'PA': '🟩 (Fast Track) →',
        }
        
        embed = discord.Embed(
            title=title,
            color=colors[date_obj.weekday()],
        )
        
        if not shifts:
            embed.description = "No shifts scheduled for this date"
            return embed
        
        schedule_lines = []
        processed_indices = set()
        
        for i, shift in enumerate(shifts):
            if shift['role'] == 'Scribe' and i not in processed_indices:
                physician = None
                mlp = None
                is_pa_shift = shift['label'] == 'PA'
                
                # Match up shifts
                for j, other in enumerate(shifts):
                    match_date = other['date'] == shift['date']
                    
                    if is_pa_shift and other['role'] == 'MLP':
                        match_time = self._times_overlap_or_close(shift['time'], other['time'])
                        if match_date and match_time:
                            mlp = other['person']
                    else:
                        match_time = other['time'] == shift['time']
                        match_label = other['label'] == shift['label']
                        
                        if match_date and match_time and match_label:
                            if other['role'] == 'Physician':
                                physician = other['person']
                
                # Format time nicely
                time_parts = shift['time'].split('-')
                if len(time_parts) == 2:
                    start, end = time_parts[0], time_parts[1]
                    if len(start) == 4:
                        start = f"{start[:2]}:{start[2:]}"
                    elif len(start) == 3:
                        start = f"0{start[0]}:{start[1:]}"
                    if len(end) == 4:
                        end = f"{end[:2]}:{end[2:]}"
                    elif len(end) == 3:
                        end = f"0{end[0]}:{end[1:]}"
                    time_display = f"{start}-{end}"
                else:
                    time_display = shift['time']
                
                # Build field value
                if mlp:
                    value = f"**{shift['person']}** with {mlp}"
                elif physician:
                    value = f"**{shift['person']}** with {physician}"
                else:
                    value = f"**{shift['person']}**"
                
                # Get start hour for categorization
                start_hour = int(shift['time'].split('-')[0][:2]) if len(shift['time'].split('-')[0]) == 4 else int(shift['time'].split('-')[0][0])
                
                schedule_lines.append((shift['time'], shift['label'], time_display, value, start_hour))
                processed_indices.add(i)
        
        # Sort by time
        schedule_lines.sort(key=lambda x: x[0])
        
        # Categorize shifts by time of day
        morning = []
        afternoon = []
        night = []
        
        for time, label, time_display, value, start_hour in schedule_lines:
            if 5 <= start_hour < 11:
                morning.append((label, time_display, value))
            elif 11 <= start_hour < 18:
                afternoon.append((label, time_display, value))
            else:
                night.append((label, time_display, value))
        
        # Add all sections to single embed
        if morning:
            embed.add_field(name="☀️ Morning", value="", inline=False)
            for label, time_display, value in morning:
                indicator = zone_indicators.get(label, '⬜')
                embed.add_field(
                    name=f"{indicator} {label} {time_display}",
                    value=value,
                    inline=False
                )
        
        # Add blank space after morning section
        embed.add_field(name="\u200b", value="\u200b", inline=False)
        
        if afternoon:
            embed.add_field(name="🌤️ Afternoon/Evening", value="", inline=False)
            for label, time_display, value in afternoon:
                indicator = zone_indicators.get(label, '⬜')
                embed.add_field(
                    name=f"{indicator} {label} {time_display}",
                    value=value,
                    inline=False
                )

        # Add blank space after morning section
        embed.add_field(name="\u200b", value="\u200b", inline=False)
        
        if night:
            embed.add_field(name="🌙 Night", value="", inline=False)
            for label, time_display, value in night:
                indicator = zone_indicators.get(label, '⬜')
                embed.add_field(
                    name=f"{indicator} {label} {time_display}",
                    value=value,
                    inline=False
                )
        

        # Add footer with shift count
        # Add footer with shift count
        # Add footer with shift count and timestamp
        pst = pytz.timezone('America/Los_Angeles')
        now = datetime.now(pst)
        timestamp_str = now.strftime("%-m/%-d at %-I:%M %p")  # "10/8 at 5:44 PM"
        total_shifts = len(morning) + len(afternoon) + len(night)
        embed.set_footer(text=f"Total Shifts: {total_shifts} • Last Updated: {timestamp_str}")
        
        return embed
    
    def format_daily_schedule(self, target_date: str) -> list:
        """
        Format the schedule for a specific date as multiple Discord Embeds.
        
        Args:
            target_date: Date in YYYY-MM-DD format
            
        Returns:
            List of discord.Embed objects
        """
        shifts = self.get_shifts_for_date(target_date)
        date_obj = datetime.strptime(target_date, "%Y-%m-%d")
        
        # Format title
        import platform
        if platform.system() == 'Windows':
            title = f"{date_obj.strftime('%A')} • {date_obj.strftime('%#m/%#d/%Y')}"
        else:
            title = f"{date_obj.strftime('%A')} • {date_obj.strftime('%-m/%-d/%Y')}"
        
        # Create embed with color based on day of week
        colors = {
            0: 0x3498db,  # Monday - Blue
            1: 0x9b59b6,  # Tuesday - Purple
            2: 0xe91e63,  # Wednesday - Pink
            3: 0xf39c12,  # Thursday - Orange
            4: 0x2ecc71,  # Friday - Green
            5: 0x1abc9c,  # Saturday - Teal
            6: 0xe74c3c,  # Sunday - Red
        }
        
        # Zone color indicators
        zone_indicators = {
            'A': '🟥 (Zone 2) →',
            'E': '🟥 (Zone 2) →',
            'I': '🟥 (Zone 2) →',
            'B': '🟦 (Zone 1) →',
            'F': '🟦 (Zone 1) →',
            'X': '🟦 (Zone 1) →',
            'C': '🟨 (Zone 3/4) →',
            'G': '🟨 (Zone 3/4) →',
            'D': '🟪 (Fast Track) →',
            'H': '🟪 (Fast Track) →',
            'PIT': '🟫 (Overflow) →',
            'PA': '🟩 (Fast Track) →',
        }
        
        if not shifts:
            embed = discord.Embed(
                title=title,
                description="No shifts scheduled for this date",
                color=colors[date_obj.weekday()],
            )
            return [embed]
        
        schedule_lines = []
        processed_indices = set()
        
        for i, shift in enumerate(shifts):
            if shift['role'] == 'Scribe' and i not in processed_indices:
                physician = None
                mlp = None
                is_pa_shift = shift['label'] == 'PA'
                
                # Match up shifts
                for j, other in enumerate(shifts):
                    match_date = other['date'] == shift['date']
                    
                    if is_pa_shift and other['role'] == 'MLP':
                        match_time = self._times_overlap_or_close(shift['time'], other['time'])
                        if match_date and match_time:
                            mlp = other['person']
                    else:
                        match_time = other['time'] == shift['time']
                        match_label = other['label'] == shift['label']
                        
                        if match_date and match_time and match_label:
                            if other['role'] == 'Physician':
                                physician = other['person']
                
                # Format time nicely
                time_parts = shift['time'].split('-')
                if len(time_parts) == 2:
                    start, end = time_parts[0], time_parts[1]
                    if len(start) == 4:
                        start = f"{start[:2]}:{start[2:]}"
                    elif len(start) == 3:
                        start = f"0{start[0]}:{start[1:]}"
                    if len(end) == 4:
                        end = f"{end[:2]}:{end[2:]}"
                    elif len(end) == 3:
                        end = f"0{end[0]}:{end[1:]}"
                    time_display = f"{start}-{end}"
                else:
                    time_display = shift['time']
                
                # Build field value
                if mlp:
                    value = f"**{shift['person']}** with {mlp}"
                elif physician:
                    value = f"**{shift['person']}** with {physician}"
                else:
                    value = f"**{shift['person']}**"
                
                # Get start hour for categorization
                start_hour = int(shift['time'].split('-')[0][:2]) if len(shift['time'].split('-')[0]) == 4 else int(shift['time'].split('-')[0][0])
                
                schedule_lines.append((shift['time'], shift['label'], time_display, value, start_hour))
                processed_indices.add(i)
        
        # Sort by time
        schedule_lines.sort(key=lambda x: x[0])
        
        # Categorize shifts by time of day
        morning = []
        afternoon = []
        night = []
        
        for time, label, time_display, value, start_hour in schedule_lines:
            if 5 <= start_hour < 11:
                morning.append((label, time_display, value))
            elif 11 <= start_hour < 18:
                afternoon.append((label, time_display, value))
            else:
                night.append((label, time_display, value))
        
        # Create separate embeds for each time period
        embeds = []
        
        # Morning embed
        if morning:
            morning_embed = discord.Embed(
                title=f"{title} - ☀️ Morning",
                color=colors[date_obj.weekday()]
            )
            for label, time_display, value in morning:
                indicator = zone_indicators.get(label, '⬜')
                morning_embed.add_field(
                    name=f"{indicator} {label} {time_display}",
                    value=value,
                    inline=False
                )
            embeds.append(morning_embed)
        
        # Afternoon embed
        if afternoon:
            afternoon_embed = discord.Embed(
                title=f"{title} - 🌤️ Afternoon/Evening",
                color=colors[date_obj.weekday()]
            )
            for label, time_display, value in afternoon:
                indicator = zone_indicators.get(label, '⬜')
                afternoon_embed.add_field(
                    name=f"{indicator} {label} {time_display}",
                    value=value,
                    inline=False
                )
            embeds.append(afternoon_embed)
        
        # Night embed
        if night:
            night_embed = discord.Embed(
                title=f"{title} - 🌙 Night",
                color=colors[date_obj.weekday()]
            )
            for label, time_display, value in night:
                indicator = zone_indicators.get(label, '⬜')
                night_embed.add_field(
                    name=f"{indicator} {label} {time_display}",
                    value=value,
                    inline=False
                )
            embeds.append(night_embed)
        
        # Add footer to last embed
        if embeds:
            total_shifts = len(morning) + len(afternoon) + len(night)
            embeds[-1].set_footer(text=f"Total Shifts: {total_shifts} • Updated")
            embeds[-1].timestamp = datetime.utcnow()
        
        return embeds
    
    def format_current_schedule(self) -> discord.Embed:
        """
        Format the current shifts happening right now as a Discord Embed.
        
        Returns:
            discord.Embed object showing who's currently working
        """
        import pytz
        
        # Get current time in PST (since shifts are in PST)
        pst = pytz.timezone('America/Los_Angeles')
        now = datetime.now(pst)
        current_date = now.strftime("%Y-%m-%d")
        current_time_24hr = now.strftime("%H%M")  # e.g., "1430" for 2:30 PM
        current_minutes = int(current_time_24hr[:2]) * 60 + int(current_time_24hr[2:])
        
        shifts = self.get_shifts_for_date(current_date)
        
        # Zone color indicators
        zone_indicators = {
            'A': '🟥 (Zone 2) →',
            'E': '🟥 (Zone 2) →',
            'I': '🟥 (Zone 2) →',
            'B': '🟦 (Zone 1) →',
            'F': '🟦 (Zone 1) →',
            'X': '🟦 (Zone 1) →',
            'C': '🟨 (Zone 3/4) →',
            'G': '🟨 (Zone 3/4) →',
            'D': '🟪 (Fast Track) →',
            'H': '🟪 (Fast Track) →',
            'PIT': '🟫 (Overflow) →',
            'PA': '🟩 (Fast Track) →',
        }
        
        embed = discord.Embed(
            title="😷 Currently Scribbling 😷",
            description=f"🕐 {now.strftime('%I:%M %p PST')} • {now.strftime('%A, %B %d, %Y')}",
            color=0xff0000,  # Red for "war"
        )
        
        if not shifts:
            embed.add_field(name="Status", value="No scheduled shifts today", inline=False)
            return embed
        
        current_shifts = []
        processed_indices = set()
        
        for i, shift in enumerate(shifts):
            if shift['role'] == 'Scribe' and i not in processed_indices:
                # Parse shift time
                time_parts = shift['time'].split('-')
                if len(time_parts) != 2:
                    continue
                
                start_time = time_parts[0]
                end_time = time_parts[1]
                
                # Convert to minutes
                def to_minutes(time_str):
                    if len(time_str) == 4:
                        h = int(time_str[:2])
                        m = int(time_str[2:])
                    elif len(time_str) == 3:
                        h = int(time_str[0])
                        m = int(time_str[1:])
                    else:
                        return None
                    return h * 60 + m
                
                start_minutes = to_minutes(start_time)
                end_minutes = to_minutes(end_time)
                
                if start_minutes is None or end_minutes is None:
                    continue
                
                # Handle overnight shifts (end time < start time)
                if end_minutes < start_minutes:
                    end_minutes += 24 * 60
                    # If current time is before start, add 24 hours
                    check_minutes = current_minutes if current_minutes >= start_minutes else current_minutes + 24 * 60
                else:
                    check_minutes = current_minutes
                
                # Check if current time is within shift
                if start_minutes <= check_minutes < end_minutes:
                    # Find matching physician/MLP
                    physician = None
                    mlp = None
                    is_pa_shift = shift['label'] == 'PA'
                    
                    for j, other in enumerate(shifts):
                        if other['date'] == shift['date']:
                            if is_pa_shift and other['role'] == 'MLP':
                                match_time = self._times_overlap_or_close(shift['time'], other['time'])
                                if match_time:
                                    mlp = other['person']
                            else:
                                if other['time'] == shift['time'] and other['label'] == shift['label']:
                                    if other['role'] == 'Physician':
                                        physician = other['person']
                    
                    # Format time display
                    if len(start_time) == 4:
                        start_display = f"{start_time[:2]}:{start_time[2:]}"
                    else:
                        start_display = f"0{start_time[0]}:{start_time[1:]}"
                    if len(end_time) == 4:
                        end_display = f"{end_time[:2]}:{end_time[2:]}"
                    else:
                        end_display = f"0{end_time[0]}:{end_time[1:]}"
                    time_display = f"{start_display}-{end_display}"
                    
                    # Build field value
                    if mlp:
                        value = f"**{shift['person']}** with {mlp}"
                    elif physician:
                        value = f"**{shift['person']}** with {physician}"
                    else:
                        value = f"**{shift['person']}**"
                    
                    current_shifts.append((shift['label'], time_display, value))
                    processed_indices.add(i)
        
        if not current_shifts:
            embed.add_field(name="Status", value="No one is currently on shift", inline=False)
        else:
            # Sort by label
            current_shifts.sort(key=lambda x: x[0])
            
            for label, time_display, value in current_shifts:
                indicator = zone_indicators.get(label, '⬜')
                embed.add_field(
                    name=f"{indicator} {label} {time_display}",
                    value=value,
                    inline=False
                )
        
        pst = pytz.timezone('America/Los_Angeles')
        now = datetime.now(pst)
        timestamp_str = now.strftime("%-m/%-d at %-I:%M %p")
        embed.set_footer(text=f"Active Shifts: {len(current_shifts)} • Auto 10m • Last Updated: {timestamp_str}")
        
        return embed
    
    def _times_overlap_or_close(self, time1: str, time2: str, tolerance_minutes: int = 60) -> bool:
        """
        Check if two shift times overlap or start within tolerance of each other.
        For PA matching: scribe 1000-1830 should match MLP 1000-2000
        
        Args:
            time1: First time string (format: HHMM-HHMM)
            time2: Second time string (format: HHMM-HHMM)
            tolerance_minutes: Minutes of tolerance for start time matching
            
        Returns:
            True if times are close enough to match
        """
        try:
            # Parse times (format: HHMM-HHMM)
            start1, end1 = time1.split('-')
            start2, end2 = time2.split('-')
            
            # Convert to minutes for comparison
            def to_minutes(time_str):
                # Handle both 3 and 4 digit times
                if len(time_str) == 3:
                    h = int(time_str[0])
                    m = int(time_str[1:])
                else:
                    h = int(time_str[:2])
                    m = int(time_str[2:])
                return h * 60 + m
            
            s1 = to_minutes(start1)
            s2 = to_minutes(start2)
            
            # Check if start times are within tolerance
            return abs(s1 - s2) <= tolerance_minutes
        except:
            return False
        
    def compare_schedules(self, new_data: List[Dict]) -> List[Dict]:
        """
        Compare new schedule data with current data to find changes.
        
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
        
        # Create lookup dictionaries for comparison
        # Key: (date, label, time) -> record
        old_shifts = {}
        for record in self.data:
            if record.get('role') == 'Scribe':  # Only track scribe changes
                key = (record.get('date'), record.get('label'), record.get('time'))
                old_shifts[key] = record
        
        new_shifts = {}
        for record in new_data:
            if record.get('role') == 'Scribe':
                # Standardize the name first
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
                changes.append({
                    'type': 'removed',
                    'old': old_record,
                    'new': None
                })
        
        # Find added or modified shifts
        for key, new_record in new_shifts.items():
            if key not in old_shifts:
                changes.append({
                    'type': 'added',
                    'old': None,
                    'new': new_record
                })
            elif old_shifts[key].get('person') != new_record.get('person'):
                changes.append({
                    'type': 'modified',
                    'old': old_shifts[key],
                    'new': new_record
                })
        
        return changes

    