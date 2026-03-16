from groq import Groq

from app.config import GROQ_API_KEY

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found. Check your backend/.env file.")

client = Groq(api_key=GROQ_API_KEY)

def generate_answer(prompt: str) -> str:

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1024
    )

    return response.choices[0].message.content