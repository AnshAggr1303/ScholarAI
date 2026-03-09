import chromadb
from app.config import CHROMA_PATH

client = chromadb.Client(
    chromadb.config.Settings(
        persist_directory=CHROMA_PATH,
        anonymized_telemetry=False
    )
)

collection = client.get_or_create_collection(name="papers")

def add_chunks(chunks, embeddings, metadatas):
    collection.add(
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=[f"{meta['paper_id']}_{i}" for i, meta in enumerate(metadatas)]
    )

def retrieve(query_embedding, paper_ids, k=4):
    where_filter = {"paper_id": {"$in": paper_ids}}

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        where=where_filter
    )

    return results["documents"][0]