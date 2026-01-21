from fastapi import FastAPI
from app.routes import upload, chat, session

app = FastAPI(title="ScholarAI API")

app.include_router(upload.router, prefix="/papers")
app.include_router(chat.router)
app.include_router(session.router)

@app.get("/health")
def health():
    return {"status": "ok"}
