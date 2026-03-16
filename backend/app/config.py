import os
from pathlib import Path
import itertools
import time
from collections import defaultdict
from threading import Lock
from dotenv import load_dotenv

# Load environment variables from backend/.env (works regardless of CWD).
ROOT_DIR = Path(__file__).resolve().parent.parent
DOTENV_PATH = ROOT_DIR / ".env"
load_dotenv(DOTENV_PATH)

# =====================
# GROQ API KEY ROTATION
# =====================

_keys = os.getenv("GROQ_API_KEYS", "")
if not _keys:
    raise RuntimeError("GROQ_API_KEYS not set in .env")

GROQ_API_KEYS = _keys.split(",")
_key_cycle = itertools.cycle(GROQ_API_KEYS)
_key_lock = Lock()

def get_groq_api_key() -> str:
    with _key_lock:
        return next(_key_cycle)

# =====================
# RATE LIMITING
# =====================

GROQ_RATE_LIMIT = int(os.getenv("GROQ_RATE_LIMIT", 60))
_request_log = defaultdict(list)

def allow_groq_request(api_key: str) -> bool:
    now = time.time()
    window_start = now - 60

    # keep only last 60 seconds
    _request_log[api_key] = [
        t for t in _request_log[api_key] if t > window_start
    ]

    if len(_request_log[api_key]) >= GROQ_RATE_LIMIT:
        return False

    _request_log[api_key].append(now)
    return True


# =====================
# EXISTING CONFIG
# =====================

EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
CHROMA_PATH = "chroma_db"

CHUNK_SIZE = 800
CHUNK_OVERLAP = 200
