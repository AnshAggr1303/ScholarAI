from pathlib import Path

path = Path('backend/app/rag/retriever.py')
text = path.read_text()
idx = text.find('def retrieve')
if idx == -1:
    raise SystemExit('def retrieve not found')

head = text[:idx]
new_fn = '''def retrieve(query_embedding, paper_ids, k=10, debug=False):

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        where={"paper_id": {"": paper_ids}}
    )

    # Chroma returns a list of lists per query input.
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    if not documents:
        return {
            "documents": [],
            "metadatas": [],
        }

    if debug:
        # Debug logs for backend tracing.
        print("Retrieved chunks:", documents)
        print("Retrieved metadatas:", metadatas)

    return {
        "documents": documents,
        "metadatas": metadatas,
    }
'''

path.write_text(head + new_fn)
print('Updated retrieve() successfully')
