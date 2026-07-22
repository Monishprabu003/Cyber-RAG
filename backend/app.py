"""
Cyber Security Knowledge Assistant - Production Streamlit Dashboard

A 3-column Evidence-Verified RAG interface:
1. Left Sidebar: Case File upload, chunking & embeddings execution, KB index status.
2. Middle Section: Prompt suggestions, pipeline indicators, query input, and unified white Findings card.
3. Right Section: Live Retrieved Supporting Evidence (PDF chunks & page citations).

Color Palette:
- App Background: Mild Blue (#e6f1fe)
- Section & Card Backgrounds: Pure White (#ffffff)
- Texts: Black (#000000 / #111827) and White (#ffffff) for high contrast and crystal clear readability.
"""

import os
import sys
import tempfile
from pathlib import Path
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

from src.config import STREAMLIT_PAGE_TITLE, STREAMLIT_PAGE_ICON, CHROMA_DB_DIR
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

st.set_page_config(
    page_title="CYBER RAG — Evidence Chat",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

logger = setup_logging()

# Custom High-Contrast Professional CSS (Mild Blue background, White section backgrounds, Black & White text)
st.markdown("""
<style>
    /* Main App Background & Fonts */
    .stApp {
        background-color: #e6f1fe !important;
        color: #000000 !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Streamlit Container Border Styling (Unified White Cards) */
    [data-testid="stVerticalBlockBorderWrapper"] {
        background-color: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 14px !important;
        padding: 20px !important;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
    }
    [data-testid="stVerticalBlockBorderWrapper"] * {
        color: #000000 !important;
    }

    /* Left Sidebar Styling (Pure White background, Black text for 100% visibility) */
    [data-testid="stSidebar"] {
        background-color: #ffffff !important;
        border-right: 1px solid #cbd5e1 !important;
    }
    [data-testid="stSidebar"] * {
        color: #000000 !important;
    }
    /* Buttons in Sidebar */
    [data-testid="stSidebar"] .stButton > button {
        background-color: #0f172a !important;
        color: #ffffff !important;
        border: 1px solid #0f172a !important;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.2s ease;
    }
    [data-testid="stSidebar"] .stButton > button:hover {
        background-color: #1e293b !important;
        border-color: #334155 !important;
    }
    /* Secondary/Action buttons inside sidebar */
    [data-testid="stSidebar"] button[kind="secondary"] {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #94a3b8 !important;
    }
    [data-testid="stSidebar"] button[kind="secondary"]:hover {
        background-color: #f1f5f9 !important;
    }

    /* File Uploader styling inside Sidebar */
    [data-testid="stFileUploadDropzone"] {
        background-color: #f8fafc !important;
        border: 2px dashed #94a3b8 !important;
        border-radius: 10px !important;
    }
    [data-testid="stFileUploadDropzone"] * {
        color: #000000 !important;
        font-weight: 500 !important;
    }

    /* Top Status Header Bar */
    .header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 9999px;
        padding: 10px 24px;
        margin-bottom: 24px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }
    .status-pill {
        background-color: #f1f5f9;
        color: #000000;
        font-weight: 700;
        font-size: 0.85rem;
        padding: 6px 14px;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid #e2e8f0;
    }
    .status-pill-backend {
        color: #15803d;
        font-weight: 700;
        font-size: 0.85rem;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    .status-dot {
        height: 10px;
        width: 10px;
        background-color: #22c55e;
        border-radius: 50%;
        display: inline-block;
    }

    /* Case File Cards in Sidebar */
    .case-file-card {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 12px 14px;
        margin-top: 8px;
        margin-bottom: 8px;
    }
    .case-file-name {
        font-weight: 700;
        font-size: 0.88rem;
        color: #000000 !important;
        margin-bottom: 3px;
        word-break: break-all;
    }
    .case-file-meta {
        font-size: 0.78rem;
        color: #475569 !important;
        font-weight: 500;
    }

    /* Watermark & Prompt Suggestions (Center Grid) */
    .watermark-container {
        text-align: center;
        margin-top: 30px;
        margin-bottom: 24px;
    }
    .watermark-title {
        font-size: 3.5rem;
        font-weight: 850;
        color: #000000;
        letter-spacing: -0.04em;
        line-height: 1;
        opacity: 0.75;
    }
    .watermark-subtitle {
        font-size: 1.25rem;
        font-weight: 650;
        color: #334155;
        margin-top: 8px;
    }

    /* Main Area Suggestion Buttons */
    .stMain .stButton > button {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 12px !important;
        font-weight: 600 !important;
        padding: 1.1rem 1rem !important;
        text-align: left !important;
        line-height: 1.4 !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
        transition: all 0.2s ease !important;
    }
    .stMain .stButton > button:hover {
        background-color: #f1f7ff !important;
        border-color: #3b82f6 !important;
    }

    /* User Question Pill Bubble */
    .user-bubble-container {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 20px;
    }
    .user-bubble {
        background-color: #1e3a8a;
        color: #ffffff !important;
        padding: 12px 22px;
        border-radius: 20px 20px 4px 20px;
        font-weight: 600;
        font-size: 0.98rem;
        box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        max-width: 80%;
    }

    /* Pipeline Steps Bar */
    .pipeline-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        margin-bottom: 18px;
    }
    .pipeline-step {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        font-weight: 750;
        color: #1e293b;
        letter-spacing: 0.05em;
    }
    .pipeline-circle {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background-color: #10b981;
        color: #ffffff !important;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 800;
    }
    .pipeline-line {
        height: 2px;
        width: 45px;
        background-color: #94a3b8;
    }

    /* Findings Card Header inside Container */
    .findings-header-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e2e8f0;
    }
    .findings-title {
        font-size: 1.3rem;
        font-weight: 800;
        color: #000000 !important;
    }
    .confidence-badge {
        background-color: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #000000;
        font-weight: 800;
        font-size: 0.8rem;
        padding: 6px 14px;
        border-radius: 9999px;
    }
    .confidence-badge-high {
        background-color: #dcfce7;
        border-color: #86efac;
        color: #15803d !important;
    }
    .confidence-badge-low {
        background-color: #fef08a;
        border-color: #fde047;
        color: #854d0e !important;
    }

    /* Evidence Right Sidebar Column */
    .evidence-section-header {
        font-size: 0.9rem;
        font-weight: 800;
        color: #000000;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 14px;
    }
    .evidence-empty-card {
        background-color: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 24px 18px;
        color: #334155;
        font-size: 0.95rem;
        line-height: 1.5;
        box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }
    .evidence-card {
        background-color: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.04);
    }
    .evidence-card-title {
        font-weight: 800;
        font-size: 0.92rem;
        color: #000000 !important;
        margin-bottom: 3px;
    }
    .evidence-card-subtitle {
        font-size: 0.8rem;
        color: #334155 !important;
        font-weight: 700;
        margin-bottom: 8px;
    }
    .evidence-progress-bar {
        height: 3px;
        background-color: #f59e0b;
        border-radius: 2px;
        width: 60%;
        margin-bottom: 10px;
    }
    .evidence-snippet {
        font-size: 0.86rem;
        color: #000000 !important;
        line-height: 1.5;
        background-color: #f8fafc;
        padding: 10px 12px;
        border-radius: 6px;
        border-left: 3px solid #3b82f6;
        font-weight: 450;
    }
</style>
""", unsafe_allow_html=True)


@st.cache_resource(show_spinner=False)
def get_cached_retriever(_version: int = 0):
    """Cached retriever instance invalidated when _version increments."""
    return get_retriever()


def initialize_session():
    if "current_query" not in st.session_state:
        st.session_state.current_query = None
    if "current_response" not in st.session_state:
        st.session_state.current_response = None
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []
    if "kb_version" not in st.session_state:
        st.session_state.kb_version = 0


def render_left_sidebar(stats: dict):
    """Column 1: Left Sidebar for CASE FILE upload, chunking execution, and management."""
    with st.sidebar:
        st.markdown("<h2 style='font-weight: 850; color: #000000 !important; margin-bottom: 1.2rem;'>📄 RAG AGENT</h2>", unsafe_allow_html=True)
        
        # New Chat Button
        if st.button("➕ New Chat", use_container_width=True, type="primary"):
            st.session_state.current_query = None
            st.session_state.current_response = None
            st.session_state.chat_history = []
            st.rerun()

        st.markdown("<p style='font-size: 0.8rem; font-weight: 800; color: #334155 !important; letter-spacing: 0.08em; margin-top: 1.6rem; margin-bottom: 0.5rem;'>CASE FILE</p>", unsafe_allow_html=True)

        # PDF File Upload Box
        uploaded_file = st.file_uploader(
            "Drop a document, or choose a file to index",
            type=["pdf"],
            key="pdf_uploader",
            label_visibility="collapsed"
        )

        if uploaded_file is not None:
            if st.button("⚡ Index Document & Run Chunking", use_container_width=True):
                with st.spinner(f"Chunking & embedding {uploaded_file.name}..."):
                    temp_dir = Path(tempfile.gettempdir()) / "cyber_rag_upload"
                    temp_dir.mkdir(exist_ok=True)
                    temp_path = temp_dir / uploaded_file.name
                    with open(temp_path, "wb") as f:
                        f.write(uploaded_file.getbuffer())

                    try:
                        chunks = load_and_split_pdf(str(temp_path), source_filename=uploaded_file.name)
                        add_chunks_to_vectordb(chunks)
                        st.session_state.kb_version += 1
                        st.cache_resource.clear()
                        st.success(f"Indexed {len(chunks)} chunks!")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Error processing PDF: {str(e)}")

        # Indexed Status Summary
        st.markdown(f"<p style='font-size: 0.85rem; color: #000000 !important; margin-top: 0.8rem; font-weight: 750;'>Indexed — {stats['total_chunks']} chunks.</p>", unsafe_allow_html=True)

        # List of Indexed Case Files
        pdf_list = list_uploaded_pdfs()
        if pdf_list:
            for pdf_name in pdf_list:
                col1, col2 = st.columns([0.82, 0.18])
                with col1:
                    st.markdown(f"""
                    <div class="case-file-card">
                        <div class="case-file-name">{pdf_name}</div>
                        <div class="case-file-meta">Indexed in ChromaDB</div>
                    </div>
                    """, unsafe_allow_html=True)
                with col2:
                    st.write("") # spacing
                    if st.button("🗑️", key=f"del_{pdf_name}", help=f"Delete {pdf_name}"):
                        delete_pdf_from_vectordb(pdf_name)
                        st.session_state.kb_version += 1
                        st.cache_resource.clear()
                        if st.session_state.current_response:
                            st.session_state.current_query = None
                            st.session_state.current_response = None
                        st.rerun()
        else:
            st.markdown("""
            <div class="case-file-card" style="border-style: dashed;">
                <div class="case-file-meta" style="text-align: center; color: #334155 !important;">No documents indexed yet. Upload a cybersecurity PDF above.</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<hr style='border-color: #cbd5e1; margin: 1.5rem 0;'>", unsafe_allow_html=True)

        # Management buttons
        col_a, col_b = st.columns(2)
        with col_a:
            if st.button("🔄 Rebuild", use_container_width=True, help="Rebuild Knowledge Base cache"):
                st.cache_resource.clear()
                st.session_state.kb_version += 1
                st.success("Reloaded")
                st.rerun()
        with col_b:
            if st.button("💥 Clear", use_container_width=True, help="Delete all chunks from DB"):
                clear_vectordb()
                st.session_state.current_query = None
                st.session_state.current_response = None
                st.session_state.chat_history = []
                st.session_state.kb_version += 1
                st.cache_resource.clear()
                st.warning("Cleared")
                st.rerun()

        # Tech stack footer pills
        st.markdown("<div style='margin-top: 3rem; display: flex; gap: 6px; flex-wrap: wrap;'>", unsafe_allow_html=True)
        st.markdown("<span style='background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: #334155;'>LangChain</span>", unsafe_allow_html=True)
        st.markdown("<span style='background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: #334155;'>ChromaDB</span>", unsafe_allow_html=True)
        st.markdown("<span style='background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: #334155;'>Gemini 2.5</span>", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)


def execute_rag_query(question: str):
    """Executes query through retriever & Gemini, updating session state."""
    if not validate_query(question):
        st.warning("Please enter a valid question.")
        return

    st.session_state.current_query = question
    with st.spinner("Searching Case File & Grounding Evidence..."):
        try:
            retriever = get_cached_retriever(st.session_state.kb_version)
            rag_chain = build_rag_chain(retriever=retriever)
            response = run_query(rag_chain, question)
            st.session_state.current_response = response
            st.session_state.chat_history.append({
                "question": question,
                "answer": response["answer"],
                "sources": response.get("sources", []),
                "confidence": response.get("confidence", "CONFIDENCE 0.80"),
                "confidence_score": response.get("confidence_score", 0.80)
            })
        except Exception as e:
            st.error(f"❌ Error processing question: {str(e)}")


def main():
    initialize_session()

    # Check API key
    if not os.getenv("GEMINI_API_KEY"):
        st.error("❌ **Google Gemini API Key missing.** Please configure GEMINI_API_KEY in `.env`.")
        st.stop()

    stats = get_kb_stats()
    is_kb_ready = stats["status"] == "READY"

    # Render Column 1: Left Sidebar
    render_left_sidebar(stats)

    # Main 2-Column layout for Middle (Chat/Findings) and Right (Evidence)
    col_main, col_evidence = st.columns([0.67, 0.33], gap="large")

    with col_main:
        # Top Header Bar
        conf_display = "--"
        if st.session_state.current_response:
            conf_display = f"{st.session_state.current_response.get('confidence_score', 0.80):.2f}"

        st.markdown(f"""
        <div class="header-bar">
            <div style="display: flex; gap: 12px; align-items: center;">
                <span class="status-pill">Docs {stats['pdf_count']}</span>
                <span class="status-pill">Confidence {conf_display}</span>
                <span class="status-pill">Retries 0</span>
            </div>
            <div class="status-pill-backend">
                <span class="status-dot"></span> Backend online
            </div>
        </div>
        """, unsafe_allow_html=True)

        if not is_kb_ready:
            with st.container(border=True):
                st.info("ℹ️ **No knowledge base found.** Please upload and index a PDF document in the left sidebar before asking questions.")
            st.chat_input("Please index a document first...", disabled=True)
            return

        # Check if we have an active query or if we should show the initial grid
        if st.session_state.current_query is None:
            # Show Watermark & Prompt Suggestion Grid
            st.markdown("""
            <div class="watermark-container">
                <div class="watermark-title">RAG AGENT</div>
                <div class="watermark-subtitle">Evidence-verified document answers</div>
            </div>
            """, unsafe_allow_html=True)

            # Suggestion Grid (2x3)
            col_s1, col_s2, col_s3 = st.columns(3)
            with col_s1:
                if st.button("Summarize the document\n\nacross everything I've uploaded so far", use_container_width=True):
                    execute_rag_query("Summarize the uploaded document and its main topics.")
                    st.rerun()
                if st.button("List open action items\n\nmentioned anywhere in the security record", use_container_width=True):
                    execute_rag_query("List open action items, recommendations, and security controls mentioned in the record.")
                    st.rerun()
            with col_s2:
                if st.button("Find key facts\n\nabout the retrieval pipeline and core concepts", use_container_width=True):
                    execute_rag_query("Find key facts and core definitions discussed in the uploaded document.")
                    st.rerun()
                if st.button("Explain a term\n\nas it's defined in the case file", use_container_width=True):
                    execute_rag_query("Explain the most important technical terms defined in the case file.")
                    st.rerun()
            with col_s3:
                if st.button("Compare two sections\n\nfrom different uploaded documents or chapters", use_container_width=True):
                    execute_rag_query("Compare two different sections or security principles mentioned in the document.")
                    st.rerun()
                if st.button("Check a claim\n\nagainst the evidence I've uploaded", use_container_width=True):
                    execute_rag_query("Verify what security claims and best practices are explicitly stated in the evidence.")
                    st.rerun()

        else:
            # Active Query State: Show User Bubble, Pipeline Steps, and Unified Bordered Findings Card
            st.markdown(f"""
            <div class="user-bubble-container">
                <div class="user-bubble">{st.session_state.current_query}</div>
            </div>
            """, unsafe_allow_html=True)

            # Pipeline Steps Bar
            st.markdown("""
            <div class="pipeline-bar">
                <div class="pipeline-step"><span class="pipeline-circle">✓</span> RETRIEVE</div>
                <div class="pipeline-line"></div>
                <div class="pipeline-step"><span class="pipeline-circle">✓</span> EVIDENCE</div>
                <div class="pipeline-line"></div>
                <div class="pipeline-step"><span class="pipeline-circle">✓</span> REPORT</div>
            </div>
            """, unsafe_allow_html=True)

            resp = st.session_state.current_response
            if resp:
                conf_text = resp.get("confidence", "CONFIDENCE 0.80")
                conf_badge_class = "confidence-badge-high" if "0.9" in conf_text or "0.8" in conf_text else "confidence-badge-low"

                # Unified bordered container box (border=True) with white background and black text
                with st.container(border=True):
                    st.markdown(f"""
                    <div class="findings-header-box">
                        <span class="findings-title">Findings</span>
                        <span class="confidence-badge {conf_badge_class}">{conf_text}</span>
                    </div>
                    """, unsafe_allow_html=True)

                    # Render answer inside the exact same bordered white container card with 100% visible black text!
                    st.markdown(resp["answer"])

        # Bottom Chat Input
        if question := st.chat_input("Send a message..."):
            execute_rag_query(question)
            st.rerun()

    # Column 3: Right Section (EVIDENCE Panel)
    with col_evidence:
        st.markdown('<div class="evidence-section-header">EVIDENCE</div>', unsafe_allow_html=True)

        resp = st.session_state.current_response
        if not resp or not resp.get("sources"):
            st.markdown("""
            <div class="evidence-empty-card">
                Supporting <strong>evidence</strong> from your <strong>case file</strong> will appear here when you ask a question or click a suggestion prompt.
            </div>
            """, unsafe_allow_html=True)
        else:
            sources = resp.get("sources", [])
            for idx, src in enumerate(sources, 1):
                pdf_name = src.get("source", "Unknown PDF")
                page_num = src.get("page", 1)
                chunk_num = src.get("chunk", idx)
                snippet = src.get("preview", src.get("content", "")[:200])

                st.markdown(f"""
                <div class="evidence-card">
                    <div class="evidence-card-title">{pdf_name}</div>
                    <div class="evidence-card-subtitle">p. {page_num} · chunk {chunk_num}</div>
                    <div class="evidence-progress-bar"></div>
                    <div class="evidence-snippet">{snippet}</div>
                </div>
                """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()