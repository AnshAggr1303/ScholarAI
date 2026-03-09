import tiktoken

MAX_CONTEXT_TOKENS = 6000  # safe for Groq free tier

def build_prompt(context_chunks, question):
    encoder = tiktoken.get_encoding("cl100k_base")

    context = ""
    total_tokens = 0

    for chunk in context_chunks:
        tokens = len(encoder.encode(chunk))
        if total_tokens + tokens > MAX_CONTEXT_TOKENS:
            break
        context += chunk + "\n\n"
        total_tokens += tokens

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