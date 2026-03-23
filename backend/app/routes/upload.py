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

from app.ingest.multimodel_ingest import process_pdf



@router.post("/upload")
async def upload_paper(
    file: UploadFile,
    session_id: str = Form(...)
):
    paper_id = str(uuid.uuid4())

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        file_path = tmp.name

    # ---- RAG pipeline ----
    try:
        chunks = process_pdf(file_path)
        chunk_texts = [c["text"] for c in chunks]
        embeddings = embed_texts(chunk_texts)

        metadatas = [{"paper_id": paper_id, "chunk_type": c["type"]} for c in chunks]

        add_chunks(chunk_texts, embeddings, metadatas)
        add_paper_to_session(session_id, paper_id)
    finally:
        import os
        if os.path.exists(file_path):
            os.remove(file_path)

    # --- Debug: return first few chunks so we can verify what was ingested.
    preview_count = min(5, len(chunks))
    preview = []
    for i in range(preview_count):
        text = chunks[i]["text"]
        preview.append(text if len(text) <= 2000 else text[:2000] + "\n... (truncated)")

    return {
        "paper_id": paper_id,
        "chunks": len(chunks),
        "chunks_preview": preview
    }
