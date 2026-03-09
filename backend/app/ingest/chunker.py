from typing import List
from app.config import CHUNK_SIZE, CHUNK_OVERLAP

def chunk_text(text: str) -> List[str]:
    words = text.split()
    chunks = []

    start = 0
    while start < len(words):
        end = start + CHUNK_SIZE
        chunk = words[start:end]
        chunks.append(" ".join(chunk))
        start += CHUNK_SIZE - CHUNK_OVERLAP

    return chunks