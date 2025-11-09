import os
import time
from typing import List, Dict, Optional

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

from .config import BASE_URL


class ShiftGenScraper:
    
    def __init__(self, username: str = None, password: str = None):
        """
        Initialize the scraper with credentials.
        
        Args:
            username: Email (defaults to env variable)
            password: (defaults to env variable)
        """
        load_dotenv()
        self.username = username or os.getenv('SHIFTGEN_USERNAME')
        self.password = password or os.getenv('SHIFTGEN_PASSWORD')
        
        if not self.username or not self.password:
            raise ValueError(
                "Credentials not provided. Set SHIFTGEN_USERNAME and "
                "SHIFTGEN_PASSWORD environment variables or pass them as arguments."
            )
        
        self.session = requests.Session()
        self.logged_in = False
        self.current_site = None
        
    def login(self) -> bool:
        try:
            payload = {
                "user_session[email]": self.username,
                "user_session[password]": self.password
            }
            resp = self.session.post(f"{BASE_URL}/login", data=payload)
            
            if resp.url.endswith("/login") or "Invalid" in resp.text:
                return False
            
            self.logged_in = True
            return True
        except requests.RequestException:
            return False
    
    def navigate_to_home(self) -> bool:
        """navigate back to home pg"""
        if not self.logged_in:
            raise RuntimeError("Not logged in. Call login() first.")
        
        try:
            resp = self.session.get(f"{BASE_URL}/member/multi_site_schedule")
            return resp.status_code == 200
        except requests.RequestException:
            return False
    
    def change_site(self, site_id: str, site_name: str = "") -> bool:
        """
        Change to a different site using the dropdown.
        
        Args:
            site_id: The site ID to switch to
            site_name: Optional site name for logging
            
        Returns:
            bool: True if successful
        """
        if not self.logged_in:
            raise RuntimeError("Not logged in. Call login() first.")
        
        try:
            self.navigate_to_home()
            time.sleep(1)
            
            resp = self.session.post(
                f"{BASE_URL}/member/change_selected_site",
                data={"site_id": site_id}
            )
            
            if resp.status_code == 200:
                self.current_site = site_name or site_id
                return True
            return False
        except requests.RequestException:
            return False
    
    def navigate_to_all_schedules(self) -> bool:
        """go to all schedules"""
        if not self.logged_in:
            raise RuntimeError("Not logged in. Call login() first.")
        
        try:
            resp = self.session.get(f"{BASE_URL}/member/schedule")
            return resp.status_code == 200
        except requests.RequestException:
            return False
    
    def fetch_schedules(self) -> List[Dict[str, any]]:
        """
        Fetch all available schedules from the current site.
        
        Returns:
            List of schedule dictionaries with 'id' and 'title'
        """
        if not self.logged_in:
            raise RuntimeError("Not logged in. Call login() first.")
        
        if not self.navigate_to_all_schedules():
            return []
        
        time.sleep(1)
        
        try:
            resp = self.session.get(f"{BASE_URL}/member/schedule")
            soup = BeautifulSoup(resp.text, "html.parser")
            
            schedules = []
            for form in soup.find_all("form", {"action": "/member/schedule"}):
                sched_id_input = form.find("input", {"name": "[id]"})
                if not sched_id_input:
                    continue
                    
                sched_id = sched_id_input.get("value")
                header_elem = form.find("h2")
                if not header_elem:
                    continue
                    
                header = header_elem.get_text(strip=True)
                schedules.append({
                    "id": sched_id, 
                    "title": header,
                    "site": self.current_site
                })
            
            return schedules
        except requests.RequestException:
            return []
    
    def get_printable_schedule(self, schedule_id: str) -> Optional[str]:
        """
        Get printable version of a schedule.
        
        Args:
            schedule_id: ID of the schedule to fetch
            
        Returns:
            HTML content of the printable schedule
        """
        if not self.logged_in:
            raise RuntimeError("Not logged in. Call login() first.")
        
        try:
            resp = self.session.post(
                f"{BASE_URL}/member/schedule",
                data={"[id]": schedule_id, "commit": "Create Print Version"}
            )
            
            return resp.text if resp.status_code == 200 else None
        except requests.RequestException:
            return None