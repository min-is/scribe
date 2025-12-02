"""
Discord embed formatting utilities for schedule displays
"""
import discord
import pytz
from datetime import datetime
from typing import List, Dict


class DiscordFormatter:
    """Mixin class providing Discord embed formatting for schedule data"""

    def format_daily_schedule_combined(self, target_date: str) -> discord.Embed:
        """
        Format the schedule as a single combined embed grouped by zones.

        Args:
            target_date: Date in YYYY-MM-DD format

        Returns:
            Single discord.Embed object with shifts grouped by zone
        """
        shifts = self.get_shifts_for_date(target_date)
        date_obj = datetime.strptime(target_date, "%Y-%m-%d")

        # Format title
        import platform
        if platform.system() == 'Windows':
            title = f"Showing: {date_obj.strftime('%A')} • {date_obj.strftime('%#m/%#d/%Y')}"
        else:
            title = f"Showing: {date_obj.strftime('%A')} • {date_obj.strftime('%-m/%-d/%Y')}"

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

        # Zone groupings - maps labels to zone info
        # Using colored square emojis to represent zone colors
        zone_groups = {
            'Zone 1': {
                'emoji': '🎄',
                'color_emoji': '🟦',  # Blue square
                'header': '(っ ᐛ )っ **Zone 1**',
                'labels': ['B', 'F', 'X'],
                'shifts': []
            },
            'Zone 2': {
                'emoji': '☃️',
                'color_emoji': '🟥',  # Red square
                'header': '(っ ᐛ )っ **Zone 2**',
                'labels': ['A', 'E', 'I'],
                'shifts': []
            },
            'Zones 3/4': {
                'emoji': '🍷',
                'color_emoji': '🟨',  # Yellow square
                'header': '(っ ᐛ )っ **Zones 3/4**',
                'labels': ['C', 'G'],
                'shifts': []
            },
            'Zones 5/6 (Fast Track)': {
                'emoji': '🎅',
                'color_emoji': '🟪',  # Purple square
                'header': '(っ ᐛ )っ **Zones 5/6 (Fast Track)**',
                'labels': ['D', 'H'],
                'shifts': []
            },
            'PA (Fast Track)': {
                'emoji': '🍫',
                'color_emoji': '🟩',  # Green square
                'header': '(っ ᐛ )っ **PA (Fast Track)**',
                'labels': ['PA'],
                'shifts': []
            },
            'Overflow': {
                'emoji': '🟫',
                'color_emoji': '🟫',  # Brown square
                'header': '(っ ᐛ )っ **Overflow**',
                'labels': ['PIT'],
                'shifts': []
            }
        }

        embed = discord.Embed(
            title=title,
            color=colors[date_obj.weekday()],
        )

        if not shifts:
            embed.description = "No shifts scheduled for this date"
            return embed

        # Process shifts
        processed_indices = set()
        total_shifts = 0

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

                # Build person string
                if mlp:
                    person_str = f"**{shift['person']}** with {mlp}"
                elif physician:
                    person_str = f"**{shift['person']}** with {physician}"
                else:
                    person_str = f"**{shift['person']}**"

                # Add to appropriate zone group
                label = shift['label']
                for zone_name, zone_info in zone_groups.items():
                    if label in zone_info['labels']:
                        zone_info['shifts'].append({
                            'label': label,
                            'time': shift['time'],
                            'time_display': time_display,
                            'person': person_str,
                            'scribe_name': shift['person']  # Store scribe name separately for grouping
                        })
                        total_shifts += 1
                        break

                processed_indices.add(i)

        # Add zones to embed (only zones with shifts)
        zones_added = 0
        for zone_name, zone_info in zone_groups.items():
            if zone_info['shifts']:
                # Sort shifts by time within each zone
                zone_info['shifts'].sort(key=lambda x: x['time'])

                # Build all shifts for this zone into a single field value
                # Group consecutive shifts by the same scribe in the same label
                shift_lines = []
                i = 0
                while i < len(zone_info['shifts']):
                    shift_data = zone_info['shifts'][i]
                    current_label = shift_data['label']
                    current_scribe = shift_data['scribe_name']
                    current_person = shift_data['person']

                    # Collect all consecutive shifts with same label and scribe
                    consecutive_times = [shift_data['time_display']]
                    providers = [current_person]  # Track different providers for split shifts
                    j = i + 1
                    while j < len(zone_info['shifts']):
                        next_shift = zone_info['shifts'][j]
                        if next_shift['label'] == current_label and next_shift['scribe_name'] == current_scribe:
                            consecutive_times.append(next_shift['time_display'])
                            providers.append(next_shift['person'])
                            j += 1
                        else:
                            break

                    # Format the shift line
                    if len(consecutive_times) == 1:
                        # Single shift
                        shift_line = f"{current_label}  {consecutive_times[0]} • {current_person}"
                    else:
                        # Multiple shifts - check if same provider or different
                        # Get unique providers (person strings)
                        unique_providers = list(dict.fromkeys(providers))
                        if len(unique_providers) == 1:
                            # Same provider for all shifts - just show times
                            times_str = ", ".join(consecutive_times)
                            shift_line = f"{current_label}  {times_str} • {current_person}"
                        else:
                            # Different providers - show each time with provider
                            for k, (time_display, provider) in enumerate(zip(consecutive_times, providers)):
                                if k == 0:
                                    shift_line = f"{current_label}  {time_display} • {provider}"
                                    shift_lines.append(shift_line)
                                else:
                                    # Indent continuation shifts slightly
                                    shift_line = f"     {time_display} • {provider}"
                                    shift_lines.append(shift_line)
                            i = j
                            continue

                    shift_lines.append(shift_line)
                    i = j

                # Combine all shifts with newlines and add blank line at the end for spacing
                zone_value = "\n".join(shift_lines) + "\n\u200b"  # \u200b is a zero-width space for spacing

                # Create field name with color indicator emoji and decorative emoji
                field_name = f"{zone_info['color_emoji']} {zone_info['header']} {zone_info['emoji']}"

                # Add zone as a single field
                embed.add_field(
                    name=field_name,
                    value=zone_value,
                    inline=False
                )

                zones_added += 1

        # Add footer with shift count and timestamp
        pst = pytz.timezone('America/Los_Angeles')
        now = datetime.now(pst)
        timestamp_str = now.strftime("%-m/%-d at %-I:%M %p")
        embed.set_footer(text=f"Total Shifts: {total_shifts} • Last Updated: {timestamp_str}")

        return embed

    def format_daily_schedule_multi(self, target_date: str) -> list:
        """
        Format the schedule as multiple embeds (one per zone) for improved visual separation.

        Args:
            target_date: Date in YYYY-MM-DD format

        Returns:
            List of discord.Embed objects (one header + one per zone with shifts)
        """
        shifts = self.get_shifts_for_date(target_date)
        date_obj = datetime.strptime(target_date, "%Y-%m-%d")

        # Format date string
        import platform
        if platform.system() == 'Windows':
            date_display = f"{date_obj.strftime('%A')} • {date_obj.strftime('%#m/%#d/%Y')}"
        else:
            date_display = f"{date_obj.strftime('%A')} • {date_obj.strftime('%-m/%-d/%Y')}"

        # Zone groupings with new names and emojis
        # Using colored square emojis to represent zone colors
        zone_groups = {
            'Zone 1': {
                'emoji': '🎄',
                'color_emoji': '🟦',  # Blue square
                'header': '(っ ᐛ )っ **Zone 1**',
                'labels': ['B', 'F', 'X'],
                'shifts': []
            },
            'Zone 2': {
                'emoji': '☃️',
                'color_emoji': '🟥',  # Red square
                'header': '(っ ᐛ )っ **Zone 2**',
                'labels': ['A', 'E', 'I'],
                'shifts': []
            },
            'Zones 3/4': {
                'emoji': '🍷',
                'color_emoji': '🟨',  # Yellow square
                'header': '(っ ᐛ )っ **Zones 3/4**',
                'labels': ['C', 'G'],
                'shifts': []
            },
            'Zones 5/6 (Fast Track)': {
                'emoji': '🎅',
                'color_emoji': '🟪',  # Purple square
                'header': '(っ ᐛ )っ **Zones 5/6 (Fast Track)**',
                'labels': ['D', 'H'],
                'shifts': []
            },
            'PA (Fast Track)': {
                'emoji': '🍫',
                'color_emoji': '🟩',  # Green square
                'header': '(っ ᐛ )っ **PA (Fast Track)**',
                'labels': ['PA'],
                'shifts': []
            },
            'Overflow': {
                'emoji': '🟫',
                'color_emoji': '🟫',  # Brown square
                'header': '(っ ᐛ )っ **Overflow**',
                'labels': ['PIT'],
                'shifts': []
            }
        }

        embeds = []

        if not shifts:
            # Return a single embed if no shifts
            embed = discord.Embed(
                title=f"Showing: {date_display}",
                description="No shifts scheduled for this date",
                color=0x95a5a6
            )
            return [embed]

        # Process shifts
        processed_indices = set()
        total_shifts = 0

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

                # Build person string
                if mlp:
                    person_str = f"**{shift['person']}** with {mlp}"
                elif physician:
                    person_str = f"**{shift['person']}** with {physician}"
                else:
                    person_str = f"**{shift['person']}**"

                # Add to appropriate zone group
                label = shift['label']
                for zone_name, zone_info in zone_groups.items():
                    if label in zone_info['labels']:
                        zone_info['shifts'].append({
                            'label': label,
                            'time': shift['time'],
                            'time_display': time_display,
                            'person': person_str,
                            'scribe_name': shift['person']
                        })
                        total_shifts += 1
                        break

                processed_indices.add(i)

        # Create embeds for each zone with shifts
        for zone_name, zone_info in zone_groups.items():
            if zone_info['shifts']:
                # Sort shifts by time within each zone
                zone_info['shifts'].sort(key=lambda x: x['time'])

                # Build shift lines
                shift_lines = []
                i = 0
                while i < len(zone_info['shifts']):
                    shift_data = zone_info['shifts'][i]
                    current_label = shift_data['label']
                    current_scribe = shift_data['scribe_name']
                    current_person = shift_data['person']

                    # Collect consecutive shifts with same label and scribe
                    consecutive_times = [shift_data['time_display']]
                    providers = [current_person]
                    j = i + 1
                    while j < len(zone_info['shifts']):
                        next_shift = zone_info['shifts'][j]
                        if next_shift['label'] == current_label and next_shift['scribe_name'] == current_scribe:
                            consecutive_times.append(next_shift['time_display'])
                            providers.append(next_shift['person'])
                            j += 1
                        else:
                            break

                    # Format the shift line
                    if len(consecutive_times) == 1:
                        shift_line = f"{current_label} {consecutive_times[0]} • {current_person}"
                    else:
                        unique_providers = list(dict.fromkeys(providers))
                        if len(unique_providers) == 1:
                            times_str = ", ".join(consecutive_times)
                            shift_line = f"{current_label} {times_str} • {current_person}"
                        else:
                            for k, (time_display, provider) in enumerate(zip(consecutive_times, providers)):
                                if k == 0:
                                    shift_line = f"{current_label} {time_display} • {provider}"
                                    shift_lines.append(shift_line)
                                else:
                                    shift_line = f"    {time_display} • {provider}"
                                    shift_lines.append(shift_line)
                            i = j
                            continue

                    shift_lines.append(shift_line)
                    i = j

                # Create embed for this zone
                zone_description = "\n".join(shift_lines)

                # Use a subtle color for each zone
                zone_embed = discord.Embed(
                    title=f"{zone_info['color_emoji']} {zone_info['header']} {zone_info['emoji']}",
                    description=zone_description,
                    color=0x2f3136  # Discord dark theme color for subtle separation
                )

                embeds.append(zone_embed)

        # Add header embed at the beginning if we have zones
        if embeds:
            header_embed = discord.Embed(
                title=f"Showing: {date_display}",
                color=0x5865F2  # Discord blurple
            )
            embeds.insert(0, header_embed)

            # Add footer to last embed
            pst = pytz.timezone('America/Los_Angeles')
            now = datetime.now(pst)
            timestamp_str = now.strftime("%-m/%-d at %-I:%M %p")
            embeds[-1].set_footer(text=f"Total Shifts: {total_shifts} • Last Updated: {timestamp_str}")

        return embeds

    def format_daily_schedule(self, target_date: str) -> list:
        """
        Format the schedule for a specific date using zone grouping.
        Returns a single embed wrapped in a list for compatibility.

        Args:
            target_date: Date in YYYY-MM-DD format

        Returns:
            List containing a single discord.Embed object with zone-grouped shifts
        """
        # Use the combined format (zone-grouped) for consistency
        embed = self.format_daily_schedule_combined(target_date)
        return [embed]

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
        current_time_24hr = now.strftime("%H%M")
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
            color=0xff0000,  # Red
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
