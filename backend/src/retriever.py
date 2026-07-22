"""
Retriever module for RAG PDF Agent.

Provides Maximum Marginal Relevance (MMR) search over persistent ChromaDB
with Smart Header / Cover Slide Anchoring to guarantee that presentation titles,
authors, domains, and abstracts are never missed during structural or summary queries.
"""

from typing import Any, List, Optional
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from pydantic import Field
from config import RETRIEVER_K
from vectordb import get_vectordb
from utils import get_logger

logger = get_logger()


class SmartRetriever(BaseRetriever):
    """
    Intelligent RAG Retriever combining MMR diversity search with Cover Page Anchoring.
    Guarantees exact title/metadata recovery on presentation slides and reports.
    """
    vectordb: Any = Field(description="Chroma vector database instance")
    k: int = Field(default=RETRIEVER_K, description="Number of documents to retrieve")
    fetch_k: int = Field(default=25, description="Number of candidate chunks for MMR search")

    def _get_relevant_documents(self, query: str, *, run_manager: Any = None) -> List[Document]:
        # 1. Perform Maximum Marginal Relevance (MMR) search for optimal diversity across all slides/pages
        try:
            docs = self.vectordb.max_marginal_relevance_search(
                query, k=self.k, fetch_k=self.fetch_k
            )
            logger.debug(f"MMR search returned {len(docs)} documents.")
        except Exception as e:
            logger.warning(f"MMR search failed ({str(e)}), falling back to similarity search.")
            docs = self.vectordb.similarity_search(query, k=self.k)

        # 2. Smart Cover Slide / Header Anchoring:
        # Presentation slides (PPTs) and reports store title, domain, author, and guide on Page 1 / Chunk 1.
        # When queries ask about title, project name, authors, or summary, guarantee that Chunk 1 is in context!
        query_lower = query.lower()
        metadata_keywords = [
            "title", "project", "author", "made by", "guided by", "team", "abstract",
            "domain", "summary", "about", "overview", "what is this", "who", "subject", "ppt"
        ]
        needs_cover = any(kw in query_lower for kw in metadata_keywords)

        if needs_cover:
            has_chunk_1 = any(
                doc.metadata.get("chunk") == 1 or doc.metadata.get("page") == 1
                for doc in docs
            )
            if not has_chunk_1:
                logger.info("Title/Metadata query detected: Anchoring Chunk 1 (Cover Slide) into retrieved context.")
                try:
                    cover_data = self.vectordb._collection.get(where={"chunk": 1})
                    if not cover_data or not cover_data.get("documents"):
                        cover_data = self.vectordb._collection.get(where={"page": 1})
                    
                    if cover_data and cover_data.get("documents") and len(cover_data["documents"]) > 0:
                        content = cover_data["documents"][0]
                        meta = cover_data["metadatas"][0] if cover_data.get("metadatas") else {"chunk": 1, "page": 1}
                        cover_doc = Document(page_content=content, metadata=meta)
                        # Prepend cover doc so Gemini sees the exact title/header first
                        docs.insert(0, cover_doc)
                except Exception as e:
                    logger.warning(f"Failed to fetch cover chunk directly: {str(e)}")

        return docs


def get_retriever(vectordb: Any = None, k: int = RETRIEVER_K) -> BaseRetriever:
    """
    Create SmartRetriever over persistent ChromaDB.

    Args:
        vectordb: ChromaDB instance. If None, loads persistent DB.
        k (int): Number of documents to retrieve (defaults to RETRIEVER_K).

    Returns:
        SmartRetriever: LangChain retriever instance with MMR and cover anchoring.

    Raises:
        ValueError: If knowledge base is empty (no PDFs uploaded).
    """
    if vectordb is None:
        vectordb = get_vectordb()

    collection_count = vectordb._collection.count()
    if collection_count == 0:
        logger.error("No knowledge base found (0 chunks in ChromaDB).")
        raise ValueError("Please upload a PDF document before asking questions.")

    retriever = SmartRetriever(vectordb=vectordb, k=k, fetch_k=25)
    logger.info(f"SmartRetriever Loaded (k={k}, MMR diversity fetch_k=25, Cover Anchoring enabled)")
    return retriever
