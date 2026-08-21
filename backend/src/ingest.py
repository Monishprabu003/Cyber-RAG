"""
PDF Ingestion pipeline for Cyber RAG.

Handles validating, loading, and splitting uploaded cybersecurity PDF documents
with exact source filename and 1-indexed page number metadata.
"""

from pathlib import Path
from typing import List, Any
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import CHUNK_SIZE, CHUNK_OVERLAP
from utils import get_logger, validate_pdf_file

logger = get_logger()


def load_and_split_pdf(pdf_path: str, source_filename: str = None) -> List[Any]:
    """
    Load PDF file, validate, assign metadata, and split into chunks.

    Args:
        pdf_path (str): File system path to the temporary PDF file
        source_filename (str): Clean display name of the uploaded PDF

    Returns:
        List[Any]: Document chunks enriched with source filename and page numbers

    Raises:
        ValueError: If PDF is empty, invalid, or corrupted
    """
    if not validate_pdf_file(pdf_path):
        logger.error(f"Invalid PDF file: {pdf_path}")
        raise ValueError("Invalid or corrupted PDF file.")

    clean_filename = source_filename or Path(pdf_path).name
    logger.info(f"PDF Uploaded: loading {clean_filename}")

    try:
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()

        if not documents:
            logger.error(f"Empty PDF file: {clean_filename}")
            raise ValueError(f"PDF appears to be empty: {clean_filename}")

        # Ensure consistent metadata formatting across all chunks
        for doc in documents:
            doc.metadata["source"] = clean_filename
            # PyPDFLoader usually 0-indexes page numbers; ensure readable 1-indexed page
            raw_page = doc.metadata.get("page", 0)
            doc.metadata["page"] = int(raw_page) + 1 if isinstance(raw_page, int) else 1

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP
        )

        chunks = splitter.split_documents(documents)
        for idx, chunk in enumerate(chunks, 1):
            chunk.metadata["chunk"] = idx
        logger.info(f"Split {clean_filename} into {len(chunks)} chunks.")
        return chunks

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Error reading PDF {clean_filename}: {str(e)}")
        raise ValueError(f"Error processing PDF file: {str(e)}")