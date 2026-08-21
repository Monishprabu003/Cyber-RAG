"""
Utility functions for Cyber RAG application.

Provides logging setup, file validation, and helper functions.
"""

import logging
import os
from pathlib import Path
from typing import Optional
from config import LOG_FILE, LOG_FORMAT, LOG_DATE_FORMAT


def setup_logging(log_file: Path = LOG_FILE) -> logging.Logger:
    """
    Set up logging configuration for the application.

    Args:
        log_file (Path): Path to log file.

    Returns:
        logging.Logger: Configured logger instance
    """
    log_dir = Path(log_file).parent
    log_dir.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger("cyber_rag")
    logger.setLevel(logging.DEBUG)

    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    formatter = logging.Formatter(LOG_FORMAT, datefmt=LOG_DATE_FORMAT)
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

    return logger


def validate_pdf_file(file_path: str) -> bool:
    """
    Validate if a file exists and has a valid PDF header (%PDF).

    Args:
        file_path (str): Path to the PDF file

    Returns:
        bool: True if valid PDF, False otherwise
    """
    if not os.path.exists(file_path):
        return False

    if not str(file_path).lower().endswith('.pdf'):
        return False

    try:
        with open(file_path, 'rb') as f:
            header = f.read(4)
            return header == b'%PDF'
    except Exception:
        return False


def validate_query(query: str) -> bool:
    """Validate if query string is non-empty."""
    return bool(query and query.strip())


def get_logger() -> logging.Logger:
    """Get the configured cyber_rag logger instance."""
    return logging.getLogger("cyber_rag")
