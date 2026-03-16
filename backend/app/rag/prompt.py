import tiktoken

MAX_CONTEXT_TOKENS = 6000

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

Formatting rules:
- Write naturally like an academic assistant
- Use short paragraphs
- Add line breaks between ideas
- Use bullet points only when useful
- Avoid rigid labels like Summary / Key Points / Example unless needed
- Keep tone concise and professional

If answer is not present, say:
"This information is not present in the uploaded papers."

Context:
{context}

Question:
{question}
"""