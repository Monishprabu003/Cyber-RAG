"""
Configuration and constants for Cyber RAG application.

This module contains all configuration settings and constants used
throughout the application.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
CHROMA_DB_DIR = PROJECT_ROOT / "chroma_db"
LOGS_DIR = PROJECT_ROOT / "logs"

# Gemini API Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Model configuration
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
LLM_MODEL = "gemini-2.5-flash"

# RAG configuration
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
RETRIEVER_K = 6  # Number of documents to retrieve
LLM_TEMPERATURE = 0.3  # Lower = more deterministic

# Validation
MAX_PDF_SIZE_MB = 100  # Maximum PDF file size
ALLOWED_EXTENSIONS = {".pdf"}

# UI Configuration
STREAMLIT_PAGE_TITLE = "RAG PDF Agent — Evidence Chat"
STREAMLIT_PAGE_ICON = "📄"

# Logging
LOG_FILE = LOGS_DIR / "rag_app.log"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Error messages
ERROR_MESSAGES = {
    "empty_query": "Please enter a valid question.",
    "invalid_pdf": "Invalid or corrupted PDF file.",
    "empty_pdf": "PDF appears to be empty.",
    "no_vectorstore": "Vector store not found. Please upload a PDF first.",
    "missing_api_key": "Google Gemini API Key is missing. Please set the GEMINI_API_KEY environment variable in a .env file.",
    "gemini_error": "Error communicating with Google Gemini API.",
    "query_error": "Error processing your question.",
    "upload_error": "Error processing the PDF file.",
}

# Success messages
SUCCESS_MESSAGES = {
    "pdf_processed": "✅ Successfully processed PDF",
    "ready": "Ready to answer questions!",
    "vectorstore_created": "Vector store created successfully",
}

