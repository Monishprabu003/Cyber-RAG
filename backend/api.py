"""
FastAPI REST API Backend for CYBER RAG — Evidence Chat.

Exposes endpoints for PDF document indexing, knowledge base management,
and exact grounded Retrieval-Augmented Generation (RAG) queries.
"""

import os
import sys
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(override=True)

# Ensure src directory is in sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

from src.utils import setup_logging, validate_query, get_logger
from src.ingest import load_and_split_pdf
from src.vectordb import (
    add_chunks_to_vectordb,
    get_kb_stats,
    list_uploaded_pdfs,
    delete_pdf_from_vectordb,
    clear_vectordb
)
from src.retriever import get_retriever
from src.rag_chain import build_rag_chain, run_query

logger = setup_logging()

app = FastAPI(
    title="RAG PDF AGENT API",
    description="Backend REST API for RAG PDF Agent — Evidence Chat",
    version="1.0.0"
)

# Enable CORS for Vite dev server & production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global version cache counter for retriever invalidation
_kb_version: int = 0
_cached_retriever: Any = None
_cached_version: int = -1


def get_active_retriever():
    """Returns a cached retriever unless _kb_version has changed."""
    global _cached_retriever, _cached_version
    if _cached_retriever is None or _cached_version != _kb_version:
        logger.info(f"Rebuilding retriever for KB version {_kb_version}...")
        _cached_retriever = get_retriever()
        _cached_version = _kb_version
    return _cached_retriever


def invalidate_cache():
    """Increment KB version to invalidate cached retriever."""
    global _kb_version
    _kb_version += 1
    logger.info(f"KB cache invalidated. New version: {_kb_version}")


class QueryRequest(BaseModel):
    question: str


@app.get("/api/stats")
async def get_stats():
    """Get current Knowledge Base statistics."""
    try:
        stats = get_kb_stats()
        return stats
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents")
async def get_documents():
    """Get list of all indexed PDF file names."""
    try:
        docs = list_uploaded_pdfs()
        return {"documents": docs}
    except Exception as e:
        logger.error(f"Error fetching documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a cybersecurity PDF document."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    logger.info(f"Uploading and processing file: {file.filename}")
    temp_dir = Path(tempfile.gettempdir()) / "cyber_rag_upload"
    temp_dir.mkdir(exist_ok=True)
    temp_path = temp_dir / file.filename

    try:
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        chunks = load_and_split_pdf(str(temp_path), source_filename=file.filename)
        add_chunks_to_vectordb(chunks)
        invalidate_cache()

        # Cleanup temp file
        if temp_path.exists():
            temp_path.unlink()

        return {
            "message": f"Successfully indexed {file.filename}",
            "filename": file.filename,
            "chunks_count": len(chunks)
        }
    except Exception as e:
        logger.error(f"Error uploading {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to index PDF: {str(e)}")


@app.delete("/api/documents/{pdf_name}")
async def delete_document(pdf_name: str):
    """Delete all chunks for a specific PDF from ChromaDB."""
    try:
        delete_pdf_from_vectordb(pdf_name)
        invalidate_cache()
        return {"message": f"Successfully deleted {pdf_name}"}
    except Exception as e:
        logger.error(f"Error deleting {pdf_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete PDF: {str(e)}")


@app.post("/api/rebuild")
async def rebuild_kb():
    """Rebuild retriever cache."""
    try:
        invalidate_cache()
        get_active_retriever()
        return {"message": "Knowledge Base cache reloaded"}
    except Exception as e:
        logger.error(f"Error rebuilding KB: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/clear")
async def clear_kb():
    """Clear all documents from ChromaDB."""
    try:
        clear_vectordb()
        invalidate_cache()
        return {"message": "Knowledge Base cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing KB: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query")
async def execute_query(payload: QueryRequest):
    """Execute a grounded RAG query over indexed documents using Google Gemini."""
    question = payload.question.strip()
    if not validate_query(question):
        raise HTTPException(status_code=400, detail="Please provide a valid question.")

    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="Google Gemini API Key is missing on backend (.env).")

    stats = get_kb_stats()
    if stats["status"] != "READY":
        raise HTTPException(status_code=400, detail="Knowledge base is empty. Please upload and index a PDF document first.")

    try:
        retriever = get_active_retriever()
        rag_chain = build_rag_chain(retriever=retriever)
        response = run_query(rag_chain, question)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error executing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")
