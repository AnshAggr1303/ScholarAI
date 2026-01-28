import uuid
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, Form

from app.ingest.parser import parse_pdf
from app.ingest.chunker import chunk_text
from app.ingest.embedder import embed_texts
from app.rag.retriever import add_chunks
from app.session.manager import add_paper_to_session

router = APIRouter()

@router.post("/upload")
async def upload_paper(
    file: UploadFile,
    session_id: str = Form(...)
):
    paper_id = str(uuid.uuid4())

    # ✅ Cross-platform temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        file_path = tmp.name

    # ---- RAG pipeline ----
    text = parse_pdf(file_path)
    chunks = chunk_text(text)
    embeddings = embed_texts(chunks)

    metadatas = [{"paper_id": paper_id} for _ in chunks]

    add_chunks(chunks, embeddings, metadatas)
    add_paper_to_session(session_id, paper_id)

    return {
        "paper_id": paper_id,
        "chunks": len(chunks)
    }
