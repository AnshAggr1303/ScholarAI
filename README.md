# 📘 ScholarAI

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-black)
![License](https://img.shields.io/badge/License-MIT-blue)

ScholarAI is an AI-powered research paper assistant that allows users to upload academic PDFs and interactively ask questions about their content. It uses vector search (ChromaDB) and a Retrieval-Augmented Generation (RAG) pipeline powered by LLaMA (Groq API) to generate grounded, citation-aware responses.

---

## 🚀 Features

- **📄 PDF Intelligence:** Seamlessly upload and parse complex academic research papers.
- **🧠 Contextual Q&A:** Get answers grounded strictly in the provided text to minimize hallucinations.
- **📚 Multi-Paper Sessions:** Manage and query multiple documents within a single session.
- **📍 Citation-Aware:** Responses include references to specific sections of the source material.
- **⚡ High Performance:** Lightning-fast inference using **LLaMA 3** hosted on **Groq Cloud**.

---

## 🧠 How It Works (High Level)



1.  **Ingest:** PDF text is extracted (via pdfplumber/PyMuPDF), split into semantic chunks, and embedded using `BGE-small`.
2.  **Store:** Chunks are saved in **ChromaDB** for efficient similarity searching.
3.  **Retrieve:** When a user asks a question, the system finds the most relevant text snippets.
4.  **Generate:** The snippets + user question are sent to **LLaMA (Groq)** to return a final, grounded answer.

---

## 📦 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | FastAPI |
| **Vector Database** | ChromaDB |
| **Embeddings** | BGE-small |
| **LLM** | LLaMA via Groq API |
| **Parsing** | pdfplumber & PyMuPDF |
| **Deployment** | Hugging Face Spaces |
| **Frontend** | Next.js (Planned) |

---

## 📁 Repository Structure

```text
ScholarAI/
├── backend/                # FastAPI backend code
│   ├── app/
│   │   ├── routes/         # API endpoints (Upload, Chat, Health)
│   │   ├── ingest/         # PDF parsing & chunking logic
│   │   ├── rag/            # RAG logic (Retrieval & LLM)
│   │   └── session/        # Session manager
│   ├── chroma_db/          # Vector storage
│   └── requirements.txt    # Python dependencies
│
└── frontend/               # Next.js frontend (To be built)