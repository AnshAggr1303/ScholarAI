def build_prompt(context_chunks, question):
    context = "\n\n".join(context_chunks)

    return f"""
You are a research assistant.

Answer ONLY using the context below.
If the answer is not present, say:
"This information is not present in the uploaded papers."

Context:
{context}

Question:
{question}

Answer:
"""