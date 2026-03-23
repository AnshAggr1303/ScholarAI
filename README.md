# 📘 ScholarAI

AI-powered research paper assistant that lets users upload academic PDFs and interactively ask questions. Uses ChromaDB vector search and RAG pipeline powered by LLaMA (Groq API).

---

## 🚀 Features

**Backend:**
- 📄 Upload PDFs & contextual Q&A
- 📚 Multi-paper sessions
- 📍 Citation-aware answers

**Frontend:**
- 📱 Interactive PDF viewer with selectable text
- ✨ Text selection → Summarize/Ask menu
- ⌨️ Auto-focus typing (press any key)
- 📜 Auto-scroll & smooth animations

---

## 📦 Tech Stack

| Component | Backend | Frontend |
|-----------|---------|----------|
| Framework | FastAPI | Next.js 14 + React 18 |
| Database | ChromaDB | - |
| LLM | LLaMA (Groq) | - |
| Styling | - | Tailwind CSS |
| PDF | pdfplumber, PyMuPDF | react-pdf |
| Language | Python | TypeScript |

---

## 📁 Structure
```
ScholarAI/
├── backend/
│   ├── app/
│   │   ├── routes/        # API endpoints
│   │   ├── ingest/        # PDF parsing
│   │   ├── rag/           # RAG logic
│   │   └── session/       # Session manager
│   └── requirements.txt
│
└── frontend/
    ├── public/
    │   └── pdf.worker.min.js
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx
    │   │   └── globals.css
    │   ├── services/
    │   │   └── api.ts
    │   └── types/
    │       └── chat.ts
    └── package.json
```

---

## 🔧 Installation

### Backend
```bash
git clone https://github.com/AnshAggr1303/ScholarAI
cd ScholarAI/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend
```bash
cd ../frontend
npm install
npm install react-pdf

# Download PDF worker
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/
```

---

## 📑 Environment Variables

**Backend** (`.env`):
```bash
GROQ_API_KEY=your_groq_api_key
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🚀 Running

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/papers/upload` | POST | Upload PDF |
| `/papers?session_id={id}` | GET | List papers |
| `/chat` | POST | Ask question |

**Chat Request:**
```json
{
  "session_id": "abc123",
  "question": "Explain the methodology"
}
```

---

## 🎨 Key Frontend Features

### 1. Text Selection
```typescript
// Select text in PDF → floating menu appears
useEffect(() => {
  const handleSelection = () => {
    const text = window.getSelection()?.toString().trim();
    if (text && text.length > 3) {
      setShowSelectionMenu(true);
    }
  };
  document.addEventListener("mouseup", handleSelection);
}, []);
```

### 2. Auto-Focus Typing
```typescript
// Press any key → input focuses automatically
useEffect(() => {
  const handleGlobalKeyPress = (e: KeyboardEvent) => {
    if (isTypeableKey && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };
  window.addEventListener('keydown', handleGlobalKeyPress);
}, []);
```

### 3. Auto-Scroll
```typescript
// New message → scroll to bottom
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
```

---

## 📦 Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    "react-pdf": "^7.7.0",
    "lucide-react": "^0.263.1",
    "typescript": "^5.0.0"
  }
}
```

---

## 🧠 How It Works

1. **Upload PDF** → Extract text → Chunk → Embed → Store in ChromaDB
2. **User Question** → Retrieve relevant chunks → Send to LLaMA → Return answer
3. **Frontend** → Display PDF → Select text → Chat with AI → Auto-scroll

---

## 🧪 Testing Checklist

- [ ] PDF uploads successfully
- [ ] Text selection menu works
- [ ] Auto-focus on keypress
- [ ] Chat messages send/receive
- [ ] Auto-scroll triggers
- [ ] Page navigation works

---

## 🚀 Deployment

**Backend:** Hugging Face Spaces  
**Frontend:** Vercel/Netlify
```bash
# Frontend build
npm run build
vercel --prod
```

---

## 📄 Contribution

Contributions welcome! Open issues or PRs for:
- UI/UX improvements
- Additional features
- Bug fixes
- Documentation

---

## 🔐 License

MIT License © 2026

---

## 📬 Contact

**GitHub:** [@AnshAggr1303](https://github.com/AnshAggr1303)

Built with ❤️ for researchers 🎓
