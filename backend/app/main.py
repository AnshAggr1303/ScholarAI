from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import upload, chat, session

app = FastAPI(title="ScholarAI API")

# ✅ CORS configuration
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