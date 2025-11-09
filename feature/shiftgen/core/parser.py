import re
from datetime import datetime
from typing import List, Dict, Tuple

from bs4 import BeautifulSoup


class ScheduleParser:
    """Parser for ShiftGen schedule HTML"""
    
    @staticmethod
    def determine_role_from_site(site_name: str) -> str:
        """
        Determine the role based on the site name.
        
        Args:
            site_name: Name of the site
            
        Returns:
            Role string (Scribe, Physician, or MLP)
        """
        site_lower = site_name.lower()
        if "scribe" in site_lower:
            return "Scribe"
        elif "physician" in site_lower:
            return "Physician"
        elif "mlp" in site_lower:
            return "MLP"
        else:
            return "Unknown"
    
    @staticmethod
    def parse_shift_text(shift_text: str, role: str = "") -> Tuple[str, str, str]:
        """
        Parse shift text into components.
        
        Args:
            shift_text: Raw shift text from HTML
            role: Role type for context
            
        Returns:
            Tuple of (label, time, person)
        """
        if not shift_text:
            return "", "", ""

        # Normalize whitespace
        s = shift_text.strip()
        s = s.replace("\u00A0", " ").replace("\u200b", "")
        s = s.replace("\r", " ").replace("\n", " ").replace("\t", " ")
        s = re.sub(r"\s+", " ", s).strip()
        s = re.sub(r"\s*:\s*", ": ", s)

        # SJH physician prefix (e.g., "SJH A 0530-1400: MERJANIAN")
        m = re.match(r"^(?:SJH)\s+([A-Za-z0-9\- ]+?)\s+(\d{3,4}-\d{3,4}):\s*(.+)$", s, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip(), m.group(2), m.group(3).strip()

        # CHOC physician directions (e.g., "North 0530-1400: SHIEH")
        m = re.match(r"^(North|South|East|West|RED)\s+(\d{3,4}-\d{3,4}):\s*(.+)$", s, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip(), m.group(2), m.group(3).strip()

        # CHOC MLP entries -> normalize to "PA"
        m = re.match(r"^CHOC\s+(?:MLP|PA|[A-Za-z0-9\- ]+?)\s+(\d{3,4}-\d{3,4}):\s*(.+)$", s, flags=re.IGNORECASE)
        if m:
            return "PA", m.group(1), m.group(2).strip()

        # General "Label TIME: Person"
        m = re.match(r"^([A-Za-z0-9\- ]{1,30}?)\s+(\d{3,4}-\d{3,4}):\s*(.+)$", s)
        if m:
            return m.group(1).strip(), m.group(2), m.group(3).strip()

        # Time + Role pattern (e.g., "1000-1830 PA: Molly")
        m = re.match(r"^(\d{3,4}-\d{3,4})\s*(PA|MD|NP|RN):\s*(.+)$", s, flags=re.IGNORECASE)
        if m:
            return m.group(2).upper(), m.group(1), m.group(3).strip()

        # Time (Location) : Person (e.g., "1000-1800 (RED): Ahilin")
        m = re.match(r"^(\d{3,4}-\d{3,4})\s*\(([^)]+)\):\s*(.+)$", s)
        if m:
            return m.group(2).strip(), m.group(1), m.group(3).strip()

        # Simple "TIME: Person"
        m = re.match(r"^(\d{3,4}-\d{3,4}):\s*(.+)$", s)
        if m:
            return "", m.group(1), m.group(2).strip()

        # Fallback
        if ":" in s:
            left, right = s.split(":", 1)
            left = left.strip()
            person = right.strip()
            time_match = re.search(r"(\d{3,4}-\d{3,4})", left)
            if time_match:
                time = time_match.group(1)
                label_part = left[:left.index(time)].strip()
                label = re.sub(r"\b(SJH|CHOC)\b", "", label_part, flags=re.IGNORECASE).strip()
                return label, time, person

        return "", "", s
    
    @staticmethod
    def normalize_person(person: str) -> str:
        """
        Normalize person name.
        
        Args:
            person: Raw person string
            
        Returns:
            Normalized person name
        """
        person = person.strip()
        if "**EMPTY**" in person.upper() or "EMPTY" in person.upper():
            return "EMPTY"
        return person
    
    def parse_calendar(self, html_content: str, site_name: str = "") -> List[Dict[str, str]]:
        """
        Parse calendar HTML into structured data.
        
        Args:
            html_content: HTML content of the schedule
            site_name: Name of the site for role determination
            
        Returns:
            List of shift dictionaries
        """
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Extract month/year from header
        header = soup.find("div", style=lambda x: x and "font-weight:bold" in x and "font-size:16px" in x)
        if not header:
            return []
        
        header_text = header.get_text(strip=True)
        month_year = None
        
        # Try to extract month and year using regex
        match = re.search(r"([A-Za-z]+\s+\d{4})", header_text)
        if match:
            month_year = match.group(1)
        
        if not month_year:
            # Fallback: try to extract from the date range in parentheses
            match = re.search(r"\((\d{2}/\d{2}/\d{4})", header_text)
            if match:
                date_str = match.group(1)
                try:
                    date_obj = datetime.strptime(date_str, "%m/%d/%Y")
                    month_year = date_obj.strftime("%B %Y")
                except ValueError:
                    return []
            else:
                return []
        
        role = self.determine_role_from_site(site_name)
        schedule_data = []
        
        # Find all day cells
        for day_cell in soup.find_all("td", style=lambda x: x and "vertical-align:text-top" in x):
            day_div = day_cell.find("div", style=lambda x: x and "font-size:12px" in x)
            if not day_div:
                continue
            
            day_num = day_div.get_text(strip=True)
            if not day_num.isdigit():
                continue
            
            # Construct date
            try:
                date_obj = datetime.strptime(f"{day_num} {month_year}", "%d %B %Y")
                date_str = date_obj.strftime("%Y-%m-%d")
            except ValueError:
                continue
            
            # Extract shifts (ignore notes in <pre>)
            for span in day_cell.find_all("span"):
                shift_text = span.get_text(strip=True)
                if not shift_text:
                    continue
                
                label, time, person = self.parse_shift_text(shift_text, role)
                person = self.normalize_person(person)
                
                # Skip empty shifts
                if person != "EMPTY":
                    schedule_data.append({
                        "date": date_str,
                        "label": label.strip(),
                        "time": time.strip(),
                        "person": person,
                        "role": role,
                        "site": site_name
                    })
        
        return schedule_data