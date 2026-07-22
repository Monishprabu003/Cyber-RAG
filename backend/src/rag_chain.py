"""
RAG Chain and Query execution module for Cyber RAG.

Enforces strict stateless Retrieval-Augmented Generation where Google Gemini is NEVER
initialized without a document retriever and answers only from retrieved chunks.
"""

import os
import asyncio
import logging
from typing import Dict, Any
# pyrefly: ignore [missing-import]
from langchain.chains import RetrievalQA
# pyrefly: ignore [missing-import]
from langchain.prompts import PromptTemplate
# pyrefly: ignore [missing-import]
from langchain_google_genai import ChatGoogleGenerativeAI
# pyrefly: ignore [missing-import]
import langchain_google_genai.chat_models
import google.api_core.exceptions
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, before_sleep_log

from config import LLM_MODEL, LLM_TEMPERATURE
from prompts import STRICT_RAG_PROMPT_TEMPLATE
from utils import get_logger

logger = get_logger()


# Fail-fast retry decorator for Gemini 429/ResourceExhausted errors
def custom_create_retry_decorator():
    return retry(
        reraise=True,
        stop=stop_after_attempt(1),
        wait=wait_exponential(multiplier=1, min=1, max=2),
        retry=(
            retry_if_exception_type(google.api_core.exceptions.ResourceExhausted)
            | retry_if_exception_type(google.api_core.exceptions.ServiceUnavailable)
            | retry_if_exception_type(google.api_core.exceptions.GoogleAPIError)
        ),
        before_sleep=before_sleep_log(langchain_google_genai.chat_models.logger, logging.WARNING),
    )


langchain_google_genai.chat_models._create_retry_decorator = custom_create_retry_decorator


def ensure_event_loop():
    """Ensure that the current thread has an active asyncio event loop."""
    try:
        asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)


def build_rag_chain(retriever: Any = None, model_name: str = LLM_MODEL, temperature: float = LLM_TEMPERATURE) -> RetrievalQA:
    """
    Build strict RAG chain. Never initialize Gemini without a retriever.

    Args:
        retriever: Similarity search retriever. Must not be None.
        model_name (str): Google Gemini model name.
        temperature (float): LLM temperature.

    Returns:
        RetrievalQA: Grounded QA chain

    Raises:
        ValueError: If API key is missing or retriever is None.
    """
    ensure_event_loop()

    if retriever is None:
        logger.error("No retriever provided to build_rag_chain")
        raise ValueError("Please upload a PDF document before asking questions.")

    google_api_key = os.getenv("GEMINI_API_KEY")
    if not google_api_key:
        logger.error("GEMINI_API_KEY environment variable missing")
        raise ValueError("Google Gemini API Key is missing. Please configure GEMINI_API_KEY.")

    try:
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            google_api_key=google_api_key,
            max_retries=1
        )
        logger.info("Gemini Initialized with document retriever.")

        prompt = PromptTemplate(
            input_variables=["context", "question"],
            template=STRICT_RAG_PROMPT_TEMPLATE
        )

        chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={
                "prompt": prompt,
                "document_variable_name": "context"
            },
            return_source_documents=True
        )

        logger.info("Strict RAG chain built successfully.")
        return chain

    except Exception as e:
        logger.error(f"Error building RAG chain: {str(e)}")
        raise


def run_query(chain: RetrievalQA, query: str) -> Dict[str, Any]:
    """
    Execute grounded RAG query and return answer with sources and confidence.

    Args:
        chain (RetrievalQA): Grounded QA chain
        query (str): User question

    Returns:
        Dict[str, Any]: Dictionary containing 'answer', 'sources', and 'confidence'
    """
    ensure_event_loop()

    try:
        logger.info(f"Question Asked: {query}")

        result = chain.invoke({
            "query": query
        })

        answer = result.get("result", "No answer generated")
        source_documents = result.get("source_documents", [])

        logger.info(f"Retrieved Chunks: {len(source_documents)} chunks retrieved for query.")

        sources = []
        for idx, doc in enumerate(source_documents, 1):
            source_info = {
                "page": doc.metadata.get("page", 1),
                "chunk": doc.metadata.get("chunk", idx),
                "source": doc.metadata.get("source", "Unknown PDF"),
                "preview": doc.page_content[:180] + "...",
                "content": doc.page_content
            }
            sources.append(source_info)

        # Confidence estimation based on grounding
        lower_answer = answer.lower()
        if "couldn't find this information" in lower_answer or "could not find this information" in lower_answer:
            confidence_score = 0.00
            confidence = "INSUFFICIENT EVIDENCE"
        elif len(sources) >= 2:
            confidence_score = 0.95
            confidence = "CONFIDENCE 0.95"
        elif len(sources) == 1:
            confidence_score = 0.80
            confidence = "CONFIDENCE 0.80"
        else:
            confidence_score = 0.50
            confidence = "CONFIDENCE 0.50"

        logger.info(f"Response Generated (Confidence: {confidence})")

        return {
            "answer": answer,
            "sources": sources,
            "confidence": confidence,
            "confidence_score": confidence_score
        }

    except Exception as e:
        logger.error(f"Error executing RAG query: {str(e)}")
        raise
