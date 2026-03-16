import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env (works regardless of CWD).
ROOT_DIR = Path(__file__).resolve().parent.parent
DOTENV_PATH = ROOT_DIR / ".env"
load_dotenv(DOTENV_PATH)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
CHROMA_PATH = "chroma_db"

CHUNK_SIZE = 800
CHUNK_OVERLAP = 200