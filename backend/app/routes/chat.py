from fastapi import APIRouter
from pydantic import BaseModel
from app.ingest.embedder import embed_texts
from app.rag.retriever import retrieve
from app.rag.prompt import build_prompt
from app.rag.generator import generate_answer
from app.session.manager import get_active_papers

router = APIRouter()

class ChatRequest(BaseModel):
    session_id: str
    question: str

@router.post("/chat")
def chat(req: ChatRequest):
    paper_ids = get_active_papers(req.session_id)

    if not paper_ids:
        return {"answer": "No papers uploaded in this session."}

    query_embedding = embed_texts([req.question])[0]
    context_chunks = retrieve(query_embedding, paper_ids)

    prompt = build_prompt(context_chunks, req.question)
    answer = generate_answer(prompt)

    return {"answer": answer}