import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
CHROMA_PATH = "chroma_db"

CHUNK_SIZE = 800
CHUNK_OVERLAP = 200