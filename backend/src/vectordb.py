"""
Vector Database management module for Cyber RAG.

Handles persistent ChromaDB operations including adding documents,
querying statistics, listing PDFs, deleting specific PDFs, and clearing the database.
"""

import shutil
from pathlib import Path
from typing import Dict, List, Any
# pyrefly: ignore [missing-import]
from langchain_chroma import Chroma
from config import CHROMA_DB_DIR, EMBEDDING_MODEL
from embeddings import get_embedding_model
from utils import get_logger

logger = get_logger()


def get_vectordb(persist_directory: Path = CHROMA_DB_DIR) -> Chroma:
    """
    Load persistent ChromaDB vector store.

    Args:
        persist_directory (Path): Path to vector database directory

    Returns:
        Chroma: LangChain Chroma vector store instance
    """
    try:
        embeddings = get_embedding_model()
        logger.info(f"Vector DB Loaded from: {persist_directory}")
        return Chroma(
            persist_directory=str(persist_directory),
            embedding_function=embeddings
        )
    except Exception as e:
        logger.error(f"Error loading vector database: {str(e)}")
        raise


def add_chunks_to_vectordb(chunks: List[Any], persist_directory: Path = CHROMA_DB_DIR) -> int:
    """
    Add document chunks to persistent ChromaDB without re-embedding existing documents.

    Args:
        chunks (List): Document chunks with source and page metadata
        persist_directory (Path): Path to persistent ChromaDB

    Returns:
        int: Number of chunks added
    """
    if not chunks:
        return 0

    try:
        vectordb = get_vectordb(persist_directory)
        logger.info(f"Embedding Started: adding {len(chunks)} chunks to ChromaDB...")
        vectordb.add_documents(chunks)
        logger.info(f"Embedding Finished: {len(chunks)} chunks stored inside persistent ChromaDB")
        return len(chunks)
    except Exception as e:
        logger.error(f"Embedding Error: {str(e)}")
        raise


def get_kb_stats(persist_directory: Path = CHROMA_DB_DIR) -> Dict[str, Any]:
    """
    Retrieve comprehensive Knowledge Base statistics from persistent ChromaDB.

    Returns:
        Dict[str, Any]: Status card statistics including PDF count, pages, and chunks.
    """
    stats = {
        "status": "EMPTY",
        "total_chunks": 0,
        "pdf_count": 0,
        "pdf_list": [],
        "total_pages": 0,
        "embedding_model": EMBEDDING_MODEL,
        "db_path": str(persist_directory)
    }

    try:
        persist_path = Path(persist_directory)
        if not persist_path.exists():
            return stats

        vectordb = get_vectordb(persist_directory)
        collection = vectordb._collection
        count = collection.count()

        if count == 0:
            return stats

        data = collection.get(include=["metadatas"])
        metadatas = data.get("metadatas") or []

        sources = set()
        pages = set()
        for meta in metadatas:
            if not meta:
                continue
            source = meta.get("source", "Unknown PDF")
            sources.add(source)
            page = meta.get("page", 1)
            pages.add((source, page))

        pdf_list = sorted(list(sources))

        stats.update({
            "status": "READY",
            "total_chunks": count,
            "pdf_count": len(pdf_list),
            "pdf_list": pdf_list,
            "total_pages": len(pages),
        })
        return stats
    except Exception as e:
        logger.error(f"Error querying KB stats: {str(e)}")
        return stats


def list_uploaded_pdfs(persist_directory: Path = CHROMA_DB_DIR) -> List[str]:
    """
    List all unique PDF filenames currently indexed in ChromaDB.

    Returns:
        List[str]: List of PDF filenames
    """
    stats = get_kb_stats(persist_directory)
    return stats.get("pdf_list", [])


def delete_pdf_from_vectordb(source_filename: str, persist_directory: Path = CHROMA_DB_DIR) -> bool:
    """
    Delete all chunks belonging to a specific PDF filename from ChromaDB.

    Args:
        source_filename (str): Name of the PDF to delete
        persist_directory (Path): Path to persistent ChromaDB

    Returns:
        bool: True if deleted successfully
    """
    try:
        vectordb = get_vectordb(persist_directory)
        collection = vectordb._collection
        data = collection.get(where={"source": source_filename})
        ids_to_delete = data.get("ids", [])

        if ids_to_delete:
            collection.delete(ids=ids_to_delete)
            logger.info(f"Deleted {len(ids_to_delete)} chunks for PDF: {source_filename}")
            return True
        else:
            logger.warning(f"No chunks found for PDF: {source_filename}")
            return False
    except Exception as e:
        logger.error(f"Error deleting PDF {source_filename} from KB: {str(e)}")
        raise


def clear_vectordb(persist_directory: Path = CHROMA_DB_DIR) -> bool:
    """
    Clear the entire persistent ChromaDB vector store.

    Returns:
        bool: True if cleared successfully
    """
    try:
        persist_path = Path(persist_directory)
        if persist_path.exists():
            shutil.rmtree(persist_path)
            logger.info(f"Cleared vector database directory: {persist_directory}")
        persist_path.mkdir(parents=True, exist_ok=True)
        return True
    except Exception as e:
        logger.error(f"Error clearing vector database: {str(e)}")
        raise
