from fastapi import APIRouter
from app.session.manager import get_active_papers

router = APIRouter()

@router.get("/session/{session_id}")
def session_info(session_id: str):
    return {"active_papers": get_active_papers(session_id)}