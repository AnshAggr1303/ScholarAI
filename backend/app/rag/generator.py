from groq import Groq
from app.config import get_groq_api_key, allow_groq_request

def generate_answer(prompt: str) -> str:
    api_key = get_groq_api_key()

    if not allow_groq_request(api_key):
        raise RuntimeError("LLM capacity temporarily exhausted")

    client = Groq(api_key=api_key)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=1024
    )

    return response.choices[0].message.content
