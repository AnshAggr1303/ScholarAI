# 📘 ScholarAI

ScholarAI is an AI-powered research paper assistant that lets users upload academic PDFs and interactively ask questions about their content. It uses vector search (ChromaDB) and a Retrieval-Augmented Generation (RAG) pipeline powered by LLaMA (Groq API) to generate grounded, citation-aware responses.

---

## 🚀 Features

- 📄 Upload research papers (PDF)
- 🧠 Contextual Q&A based on uploaded content
- 📚 Handles multiple papers per session
- 📍 Citation-aware answers
- 🚀 Fast inference using LLaMA via Groq

---

## 📦 Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI |
| Vector Database | ChromaDB |
| Embeddings | BGE-small |
| LLM | LLaMA via Groq API |
| Parsing | pdfplumber & PyMuPDF |
| Deployment | Hugging Face Spaces |
| Frontend (planned) | Next.js |

---

## 📁 Repository Structure

```
ScholarAI/
├── backend/                # FastAPI backend code
│   ├── app/
│   │   ├── routes/        # API endpoints
│   │   ├── ingest/        # PDF parsing & chunking
│   │   ├── rag/           # RAG logic
│   │   └── session/       # Session manager
│   ├── chroma_db/         # Vector storage
│   ├── venv/              # Python environment (ignored)
│   └── requirements.txt
│
└── frontend/              # Next.js frontend (to be built)
```

---

## 🔧 Installation (Backend)

Clone the repo and create a Python virtual environment:

```bash
git clone https://github.com/AnshAggr1303/ScholarAI
cd ScholarAI/backend
python3 -m venv venv
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

---

## 📑 Environment Variables

Create a `.env` file inside `backend/`:

```bash
GROQ_API_KEY=your_groq_api_key
```

---

## 🚀 Running Backend Locally

```bash
uvicorn app.main:app --reload --port 8000
```

---

## 📡 API Endpoints

### 🧪 Health Check
```
GET /health
```

### 📤 Upload Paper
```
POST /papers/upload
```
**Form Data:**
- `file`: PDF file
- `session_id`: unique session ID

### 📄 List Active Papers
```
GET /papers?session_id={id}
```

### 💬 Chat / Ask Question
```
POST /chat
```
**Body:**
```json
{
  "session_id": "abc123",
  "question": "Explain the methodology",
  "scope": "all"
}
```

---

## 📌 Frontend (Next.js)

Frontend will be a separate Next.js project inside `frontend/`. It will communicate with the backend via REST API endpoints.

**Example service functions:**

```typescript
// services/api.ts
export async function uploadPaper(file, sessionId) { ... }
export async function sendMessage(sessionId, question) { ... }
```

---

## 🧠 How It Works (High Level)

1. **Upload PDF** → extract text, chunk, embed, store in ChromaDB
2. **User Questions** → retrieve most relevant chunks → send to LLaMA via Groq → return grounded answer
3. **Multi-Paper Sessions** → maintain active papers in session → filter retrieval accordingly

---

## 🗂️ Recommended Workflow

1. Backend endpoints first
2. Frontend integration next
3. Deployment on Hugging Face Spaces

---

## 📄 Contribution

Feel free to open issues, add features, or improve prompts & UI. All contributions are welcome!

---

## 🔐 License

MIT License © 2026

---

## 📬 Contact

For questions or suggestions, open an issue or reach out via GitHub!