from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import upload, chat, session
import os
import time
from collections import defaultdict

app = FastAPI(title="ScholarAI API")

from dotenv import load_dotenv
load_dotenv()

print("Loaded key:", os.getenv("GROQ_API_KEY"))

# Rate limiter for /chat: 20 requests per minute per client IP
_chat_timestamps: dict = defaultdict(list)
_CHAT_LIMIT = 20
_CHAT_WINDOW = 60  # seconds

@app.middleware("http")
async def chat_rate_limit_middleware(request: Request, call_next):
    if request.url.path == "/chat":
        ip = request.client.host
        now = time.time()
        window_start = now - _CHAT_WINDOW
        recent = [t for t in _chat_timestamps[ip] if t > window_start]
        if len(recent) >= _CHAT_LIMIT:
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded: 20 requests per minute."},
            )
        recent.append(now)
        _chat_timestamps[ip] = recent
    return await call_next(request)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],          # Allow OPTIONS, POST, etc.
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/papers")
app.include_router(chat.router)
app.include_router(session.router)

@app.get("/health")
def health():
    return {"status": "ok"}