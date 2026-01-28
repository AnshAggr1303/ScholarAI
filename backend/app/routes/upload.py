import uuid
import shutil
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
    file_path = f"/tmp/{paper_id}.pdf"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = parse_pdf(file_path)
    chunks = chunk_text(text)
    embeddings = embed_texts(chunks)

    metadatas = [{"paper_id": paper_id} for _ in chunks]

    add_chunks(chunks, embeddings, metadatas)
    add_paper_to_session(session_id, paper_id)

    return {"paper_id": paper_id, "chunks": len(chunks)}