import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict

from .config import SITES_TO_FETCH, OUTPUT_DIR, SITE_CHANGE_DELAY, PAGE_LOAD_DELAY
from .scraper import ShiftGenScraper
from .parser import ScheduleParser
from .database import ConsolidatedDatabase
from .name_mapper import NameMapper


def fetch_all_sites_schedules(scraper: ShiftGenScraper) -> List[Dict]:
    """
    Fetch schedules from all configured sites.
    
    Args:
        scraper: Logged-in ShiftGenScraper instance
        
    Returns:
        List of all shift data
    """
    all_data = []
    parser = ScheduleParser()
    
    for site in SITES_TO_FETCH:
        print(f"Processing: {site['name']}")
        
        if not scraper.change_site(site['id'], site['name']):
            continue
        
        time.sleep(SITE_CHANGE_DELAY)
        schedules = scraper.fetch_schedules()
        
        for schedule in schedules:
            html_content = scraper.get_printable_schedule(schedule["id"])
            if html_content:
                schedule_data = parser.parse_calendar(html_content, site['name'])
                all_data.extend(schedule_data)
        
        scraper.navigate_to_home()
        time.sleep(PAGE_LOAD_DELAY)
    
    return all_data


def main():
    
    # Create output directory
    output_dir = Path(OUTPUT_DIR)
    output_dir.mkdir(exist_ok=True)
    
    # Initialize name mapper
    name_mapper = NameMapper()
    
    # Initialize scraper
    scraper = ShiftGenScraper()
    
    print("="*70)
    print("SHIFTGEN SCHEDULE SCRAPER")
    print("="*70)
    
    if not scraper.login():
        print("❌ Login failed")
        return
    
    print("✅ Login successful")
    print("\n🔄 Fetching schedules...")
    
    # Fetch all schedules
    all_data = fetch_all_sites_schedules(scraper)
    
    # Build database
    print(f"\nBuilding fresh database...")
    db = ConsolidatedDatabase(name_mapper=name_mapper)
    total_records = db.update_data(all_data)
    db.save()
    
    # Save any newly discovered providers
    name_mapper.save_updates()
    
    print(f"Database rebuilt with {total_records} total records")
    
    # Show tomorrow's schedule
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    print("\n" + "="*70)
    print("TOMORROW'S SCHEDULE")
    print("="*70)
    print(db.format_daily_schedule(tomorrow))
    
    print(f"\n✅ Complete! Database saved to: {db.filepath}")


if __name__ == "__main__":
    main()