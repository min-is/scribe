# ShiftGen pesudo API
BASE_URL = "https://legacy.shiftgen.com"

# Site IDs to scrape
SITES_TO_FETCH = [
    {"id": "82", "name": "St Joseph Scribe"},
    {"id": "80", "name": "St Joseph/CHOC Physician"},
    {"id": "84", "name": "St Joseph/CHOC MLP"}
]

# File paths
OUTPUT_DIR = "schedule_outputs"
MASTER_SCHEDULE_FILE = "schedule_outputs/master_schedule.csv"
NAME_LEGEND_FILE = "name_legend.json"

# Timing settings (seconds)
SITE_CHANGE_DELAY = 2
PAGE_LOAD_DELAY = 1