"""
Embeddings module for Cyber RAG.

Handles loading and caching of local HuggingFace embedding models
so they are never re-downloaded or reloaded unnecessarily.
"""

import streamlit as st
from langchain_huggingface import HuggingFaceEmbeddings
from config import EMBEDDING_MODEL, DATA_DIR
from utils import get_logger

logger = get_logger()


@st.cache_resource(show_spinner=False)
def get_embedding_model() -> HuggingFaceEmbeddings:
    """
    Load and cache the local sentence-transformers embedding model.

    Returns:
        HuggingFaceEmbeddings: Cached embedding model instance
    """
    try:
        cache_folder = DATA_DIR / "models"
        cache_folder.mkdir(parents=True, exist_ok=True)

        logger.info(f"Loading cached embedding model: {EMBEDDING_MODEL}")
        embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            cache_folder=str(cache_folder),
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True}
        )
        logger.info("Embedding model loaded successfully.")
        return embeddings
    except Exception as e:
        logger.error(f"Error loading embedding model {EMBEDDING_MODEL}: {str(e)}")
        raise
