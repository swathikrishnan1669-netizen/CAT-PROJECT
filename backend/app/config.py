import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR.parent / "data" / "generated"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Database
DB_PATH = DATA_DIR / "dairy_cold_chain.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Cold-chain temperature thresholds (°C)
DEFAULT_TEMP_NORMAL_MAX = 8.0     # 2°C - 8°C normal range
DEFAULT_TEMP_WARNING_MAX = 10.0   # 8°C - 10°C warning range
DEFAULT_TEMP_CRITICAL_MIN = 10.0  # > 10°C critical range

# Confidence thresholds (0 - 100)
DEFAULT_CONF_VERY_HIGH = 90.0
DEFAULT_CONF_HIGH = 75.0
DEFAULT_CONF_MEDIUM = 50.0

# Operational duration thresholds (minutes)
DEFAULT_MAX_GAP_DURATION_MINUTES = 15.0
DEFAULT_MAX_DOOR_OPEN_MINUTES = 10.0

# Sensor sampling interval (seconds)
SENSOR_INTERVAL_SECONDS = 60
