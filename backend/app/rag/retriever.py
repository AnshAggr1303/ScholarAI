import logging
import chromadb
from app.config import CHROMA_PATH

logger = logging.getLogger(__name__)

client = chromadb.Client(
    chromadb.config.Settings(
        persist_directory=CHROMA_PATH,
        anonymized_telemetry=False
    )
)

collection = client.get_or_create_collection(name="papers")


def add_chunks(chunks, embeddings, metadatas):

    BATCH_SIZE = 150   # safe for chroma

    for i in range(0, len(chunks), BATCH_SIZE):

        batch_chunks = chunks[i:i+BATCH_SIZE]
        batch_embeddings = embeddings[i:i+BATCH_SIZE]
        batch_metadatas = metadatas[i:i+BATCH_SIZE]

        batch_ids = [
            f"{meta['paper_id']}_{i+j}"
            for j, meta in enumerate(batch_metadatas)
        ]

        collection.add(
            documents=batch_chunks,
            embeddings=batch_embeddings,
            metadatas=batch_metadatas,
            ids=batch_ids
        )


def retrieve(query_embedding, paper_ids, k=10, debug=False):

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        where={"paper_id": {"$in": paper_ids}}
    )

    if not results["documents"]:
        return []

    docs = results["documents"][0]

    logger.info("Retrieved chunks: %s", docs)

    return docs