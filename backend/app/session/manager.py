from typing import Dict, List

# In-memory session store (HF free-tier safe)
SESSIONS: Dict[str, List[str]] = {}

def add_paper_to_session(session_id: str, paper_id: str):
    if session_id not in SESSIONS:
        SESSIONS[session_id] = []
    SESSIONS[session_id].append(paper_id)

def get_active_papers(session_id: str) -> List[str]:
    return SESSIONS.get(session_id, [])