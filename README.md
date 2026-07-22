# 🛡️ Cyber Security Chatbot

A production-grade **conversational chatbot** for cybersecurity advice, threat analysis, and optional document-grounded question-answering (RAG). Built using the Google Gemini API, it supports conversational memory, interactive message bubbles, and dual-mode execution (general chat or context-grounded chat).

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Gemini API Setup](#-gemini-api-setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Future Improvements](#-future-improvements)

---

## ✨ Features

### Core Features
- ✅ **Classical Chat UI** - Sleek, bottom-anchored chat input box with conversational message bubbles
- ✅ **Conversational Memory** - Remembers context from previous conversation turns for fluid dialogues
- ✅ **Optional Document Grounding (RAG)** - Upload a PDF in the sidebar to ground chatbot responses in custom document context
- ✅ **Intelligent Retrieval** - Semantic search using ChromaDB and Sentence Transformers (when RAG is active)
- ✅ **LLM Integration** - Google Gemini API with gemini-2.5-flash for accurate, context-aware answers
- ✅ **Source Citations** - Displays matching PDF text chunks and page numbers when answering from a document
- ✅ **Dual-Mode Operation** - Seamlessly switches between a General Security Chatbot and a Document Grounding assistant

### Advanced Features
- 📊 **Vector Persistence** - Persists vector database collections for continuing sessions across restarts
- 📝 **Logging System** - Complete audit logs in `logs/rag_app.log` for troubleshooting and monitoring
- 🛡️ **Error Handling** - Comprehensive handling of missing API keys, invalid files, and connection failures
- 🚀 **Production-Ready** - Clean python code with type hints, docstrings, and modular structure

---

## 🛠️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | Streamlit | 1.32.0 |
| **LLM Framework** | LangChain | 0.1.14 |
| **Vector Database** | ChromaDB | 0.4.24 |
| **Embeddings** | Sentence Transformers | 2.2.2 |
| **LLM** | Google Gemini (gemini-2.5-flash) | - |
| **PDF Processing** | PyPDF | 4.0.1 |
| **Language** | Python | 3.12 |

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Streamlit Web UI                         │
│  ┌────────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │ PDF Upload     │  │ Query Input  │  │ Chat History  │   │
│  └────────────────┘  └──────────────┘  └───────────────┘   │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                   RAG Pipeline                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐    │
│  │ PDF Ingestion│  │ Chunking     │  │ Embeddings    │    │
│  │ (PyPDF)      │  │ (1000 tokens)│  │ (MiniLM)      │    │
│  └──────────────┘  └──────────────┘  └───────────────┘    │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│              Vector Database (ChromaDB)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Persisted Vector Store (chroma_db/)                    │ │
│  │ - Document embeddings                                  │ │
│  │ - Metadata (page, source)                              │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│            Retrieval & LLM Chain                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │ Retriever  │  │ Prompt     │  │ Gemini LLM         │   │
│  │ (k=4)      │  │ Template   │  │ (gemini-2.5-flash) │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│              Answer with Sources                            │
│  ┌───────────────────┐  ┌──────────────────────────────┐   │
│  │ Generated Answer  │  │ Retrieved Documents (Sources)│   │
│  │ (Context-aware)   │  │ - Page numbers               │   │
│  └───────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Installation

### Prerequisites
- Python 3.12+
- Google Gemini API Key (get it from [Google AI Studio](https://aistudio.google.com/))
- macOS, Linux, or Windows

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/Cyber-RAG.git
cd Cyber-RAG
```

### Step 2: Create Virtual Environment

```bash
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Verify Installation

```bash
python -c "import streamlit; import langchain; import chromadb; import google.generativeai; import langchain_google_genai; print('✅ All packages installed successfully')"
```

---

## 🔑 Gemini API Setup

To use the application, you need to configure your Google Gemini API Key.

### Step 1: Create a `.env` file

Copy the example environment file:
```bash
cp .env.example .env
```

### Step 2: Add your Gemini API Key

Open the `.env` file and replace `your_key_here` with your actual Google Gemini API Key:
```env
GEMINI_API_KEY=AIzaSy...
```

*Note: Alternatively, you can set the key directly in the Streamlit UI sidebar at runtime, or set it as a system environment variable `export GEMINI_API_KEY=your_key`.*

---

## 🚀 Running the Application

### Start the Streamlit App

```bash
streamlit run app.py
```

The application will open in your browser at `http://localhost:8501`

### Basic Usage

1. **Upload PDF**: Click the file uploader in the sidebar
2. **Process Document**: Click "Process Document" button
3. **Ask Questions**: Type your question in the text box
4. **View Answers**: See the AI response with sources

---

## 📁 Project Structure

```
Cyber-RAG/
│
├── app.py                 # Main Streamlit application
├── requirements.txt       # Python dependencies
├── README.md             # Project documentation
├── .gitignore            # Git ignore rules
│
├── src/                  # Source code module
│   ├── __init__.py       # Package initialization
│   ├── utils.py          # Logging and utilities
│   ├── ingest.py         # PDF loading and chunking
│   ├── retriever.py      # Vector store retrieval
│   └── rag_chain.py      # RAG chain implementation
│
├── chroma_db/            # Persisted vector database
├── data/                 # Storage for uploaded files
└── logs/                 # Application logs
```

---

## 📖 Usage Guide

### Uploading a PDF

1. Click "📤 Upload Document" in the sidebar
2. Select a cybersecurity PDF file
3. Click "🔄 Process Document"
4. Wait for the vectorization to complete

### Asking Questions

```
Good questions:
✅ "What are the best practices for password security?"
✅ "How can I prevent SQL injection attacks?"
✅ "What is XSS and how to prevent it?"

Avoid:
❌ Generic questions not related to the PDF content
❌ Questions requiring real-time external information
```

### Understanding the Response

- **Answer**: AI-generated response based on document context
- **Sources**: Original document chunks with:
  - Page number
  - File name
  - Text preview

---

## 🔧 API Reference

### `src/ingest.py`

#### `load_and_split_pdf(pdf_path: str) -> List`
Load and split PDF into chunks.

```python
from src.ingest import load_and_split_pdf
chunks = load_and_split_pdf("document.pdf")
```

#### `create_vectorstore(chunks: List, persist_directory: str) -> Chroma`
Create persisted vector store from chunks.

```python
from src.ingest import create_vectorstore
vectorstore = create_vectorstore(chunks, "chroma_db")
```

### `src/retriever.py`

#### `get_retriever(persist_directory: str, k: int) -> Retriever`
Load retriever from persisted vector store.

```python
from src.retriever import get_retriever
retriever = get_retriever(k=4)
```

### `src/rag_chain.py`

#### `build_rag_chain(retriever, model_name: str) -> RetrievalQA`
Build complete RAG chain.

```python
from src.rag_chain import build_rag_chain
chain = build_rag_chain(retriever, model_name="gemini-2.5-flash")
```

#### `run_query(chain, query: str) -> dict`
Run query through RAG chain.

```python
from src.rag_chain import run_query
result = run_query(chain, "What is cybersecurity?")
# Returns: {"answer": "...", "sources": [...]}
```

---

## 🐛 Troubleshooting

### Issue: "Google Gemini API Key is missing" or "Failed to connect to Google Gemini API"

**Solution:**
1. Ensure `GEMINI_API_KEY` is set in your `.env` file or environment.
2. Verify that your API key is valid and has active access to `gemini-2.5-flash` in Google AI Studio.
3. Ensure you have an active internet connection to make calls to Google's API servers.

### Issue: "Vector store not found"

**Solution:**
1. Upload and process a PDF first
2. Or ensure `chroma_db/` directory exists with data

### Issue: "ModuleNotFoundError"

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall requirements
pip install --upgrade -r requirements.txt
```

### Issue: "Streamlit not opening"

**Solution:**
```bash
# Try specifying the host
streamlit run app.py --server.address=localhost
```

### Issue: "Empty PDF error"

**Solution:**
- Ensure PDF has text content (not image-only)
- Try a different PDF
- Check file integrity

---

## 🚀 Future Improvements

### Planned Features
- [ ] Multi-PDF support (process multiple documents simultaneously)
- [ ] Advanced search filters (date, author, category)
- [ ] Export conversation history as PDF/JSON
- [ ] Custom model selection in UI
- [ ] Fine-tuned embeddings for cybersecurity
- [ ] Question suggestions based on content
- [ ] RAG evaluation metrics
- [ ] User authentication
- [ ] API endpoint for programmatic access
- [ ] Docker containerization
- [ ] GPU acceleration support
- [ ] Response quality scoring

### Optimization Ideas
- Implement caching for frequently asked questions
- Add batch processing for multiple documents
- Optimize chunk size based on document type
- Implement hybrid search (semantic + keyword)
- Add reranking for better relevance

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

## ✅ Verification Checklist

Before running:

- [x] Python 3.12 installed
- [x] Virtual environment created
- [x] Dependencies installed from requirements.txt
- [x] Google Gemini API Key configured in `.env`
- [x] Internet connection active to reach Gemini API
- [x] ChromaDB persistence configured
- [x] All source modules have type hints and docstrings
- [x] Error handling implemented
- [x] Logging configured
- [x] UI components responsive

---

**Built with ❤️ for Cybersecurity Professionals**