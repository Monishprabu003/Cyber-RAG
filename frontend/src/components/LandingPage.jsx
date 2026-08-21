import React from 'react';
import './LandingPage.css';
import { 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Target, 
  CheckCircle2, 
  BookOpen, 
  Cpu, 
  Database, 
  RefreshCw 
} from 'lucide-react';

export default function LandingPage({ onLaunchApp }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-container">
      {/* Top Sticky Header */}
      <header className="landing-header">
        <div className="landing-brand" onClick={onLaunchApp} title="Launch Workspace">
          <FileText size={28} color="#0f172a" />
          <span className="brand-title">RAG AGENT</span>
          <span className="brand-badge">EVIDENCE CHAT</span>
        </div>

        <div className="landing-nav">
          <button className="nav-link" onClick={() => scrollToSection('solution')}>MMR Engine</button>
          <button className="nav-link" onClick={() => scrollToSection('features')}>Capabilities</button>
          <button className="nav-link" onClick={() => scrollToSection('architecture')}>Workspace</button>
        </div>

        <div className="landing-actions">
          <button className="btn-launch-header" onClick={onLaunchApp}>
            <span>Open Workspace</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-card">
          <h1 className="hero-headline">
            Evidence-Verified PDF Intelligence with <span className="highlight-text">Zero Hallucinations</span>.
          </h1>

          <p className="hero-subtitle">
            Upload any document—from dense research papers to sparse PowerPoint slides (`PPTs`). Our state-of-the-art <strong>Maximum Marginal Relevance (MMR)</strong> engine and <strong>Cover Slide Anchoring</strong> guarantee exact citations every single time.
          </p>

          <div className="hero-cta-group">
            <button className="btn-launch-hero" onClick={onLaunchApp}>
              <span>⚡ Launch RAG Workspace</span>
              <ArrowRight size={18} />
            </button>
            <button className="btn-secondary-hero" onClick={() => scrollToSection('solution')}>
              <BookOpen size={18} />
              <span>How We Solved PPT Retrieval</span>
            </button>
          </div>

          <div className="hero-stats-row">
            <div className="stat-pill-box">
              <Zap size={16} color="#3b82f6" />
              <span><strong>&lt; 1.0s</strong> Avg Query Speed</span>
            </div>
            <div className="stat-pill-box">
              <Target size={16} color="#3b82f6" />
              <span><strong>MMR Diversity</strong> (k=6, fetch_k=25)</span>
            </div>
            <div className="stat-pill-box">
              <Layers size={16} color="#3b82f6" />
              <span><strong>100% Cover Slide</strong> Anchoring</span>
            </div>
            <div className="stat-pill-box">
              <ShieldCheck size={16} color="#3b82f6" />
              <span><strong>Strict Grounding</strong> Guardrails</span>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Section: Why PPTs & Titles Were Solved */}
      <section id="solution" className="landing-section">
        <div className="section-header-box">
          <h2 className="section-title">How We Solved Presentation Title & Structural Retrieval</h2>
          <p className="section-desc">
            Standard RAG (`k=4` similarity search) often misses titles on Page 1 of PowerPoint presentations (`PPTs`) because sparse bullet points across later slides cluster together in embedding space. Here is how our upgraded `SmartRetriever` solves this permanently:
          </p>
        </div>

        <div className="pipeline-grid">
          <div className="pipeline-card">
            <div className="pipeline-step-badge">STAGE 01</div>
            <div className="pipeline-icon">
              <Database size={32} color="#2563eb" />
            </div>
            <h3 className="pipeline-title">Universal Chunking & Indexing</h3>
            <p className="pipeline-text">
              Drag and drop any PDF up to 200MB. Our LangChain text splitter preserves layout metadata (`page` and `chunk` numbers) and indexes vectors into persistent ChromaDB using `all-MiniLM-L6-v2`.
            </p>
          </div>

          <div className="pipeline-card highlighted-pipeline">
            <div className="pipeline-step-badge badge-accent">STAGE 02 (UPGRADED)</div>
            <div className="pipeline-icon">
              <Target size={32} color="#ffffff" style={{ backgroundColor: '#2563eb', padding: '6px', borderRadius: '8px' }} />
            </div>
            <h3 className="pipeline-title">MMR + Cover Slide Anchoring</h3>
            <p className="pipeline-text">
              Instead of selecting 4 redundant slides, our `SmartRetriever` fetches 25 candidates using <strong>Maximum Marginal Relevance (MMR)</strong> and automatically locks Page 1 (the cover slide) right into top context for title, author, and project queries.
            </p>
          </div>

          <div className="pipeline-card">
            <div className="pipeline-step-badge">STAGE 03</div>
            <div className="pipeline-icon">
              <Cpu size={32} color="#2563eb" />
            </div>
            <h3 className="pipeline-title">Grounded Gemini 2.5 Synthesis</h3>
            <p className="pipeline-text">
              The LLM receives diverse, complete context and strictly synthesizes verifiable answers with exact page and chunk citations (`p. X · chunk Y`). If evidence is missing, it refuses to guess.
            </p>
          </div>
        </div>
      </section>

      {/* Core Capabilities Grid */}
      <section id="features" className="landing-section">
        <div className="section-header-box">
          <h2 className="section-title">Enterprise-Grade Retrieval Capabilities</h2>
          <p className="section-desc">
            Designed for high-contrast visibility, lightning speed, and absolute evidentiary reliability.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-header">
              <FileText size={22} color="#2563eb" />
              <h3>Universal PDF Intelligence</h3>
            </div>
            <p>Seamlessly handles presentation slides (`PPTs`), legal contracts, research papers, technical specs, and financial manuals.</p>
          </div>

          <div className="feature-card">
            <div className="feature-header">
              <Target size={22} color="#2563eb" />
              <h3>MMR Diversity Search</h3>
            </div>
            <p>Balances semantic similarity with document-wide diversity so that every distinct chapter and theme is represented in the prompt.</p>
          </div>

          <div className="feature-card">
            <div className="feature-header">
              <Layers size={22} color="#2563eb" />
              <h3>Cover Page Guarantee</h3>
            </div>
            <p>Smart query inspection guarantees that Page 1 metadata (Project Title, Authors, Domain, Team members) is never missed.</p>
          </div>

          <div className="feature-card">
            <div className="feature-header">
              <ShieldCheck size={22} color="#2563eb" />
              <h3>Zero Hallucinations</h3>
            </div>
            <p>Strict prompt guardrails force the model to answer solely based on retrieved chunks or explicitly state `INSUFFICIENT EVIDENCE`.</p>
          </div>

          <div className="feature-card">
            <div className="feature-header">
              <RefreshCw size={22} color="#2563eb" />
              <h3>Real-Time Chroma Cache</h3>
            </div>
            <p>Persistent local vector index with instant selective document deletion, live KB cache rebuilding, and zero restart latency.</p>
          </div>

          <div className="feature-card">
            <div className="feature-header">
              <CheckCircle2 size={22} color="#2563eb" />
              <h3>Side-by-Side Evidence</h3>
            </div>
            <p>Inspect exact page numbers, chunk identifiers, and raw source text snippets alongside your AI answers in real time.</p>
          </div>
        </div>
      </section>

      {/* Interactive CTA Banner */}
      <section id="architecture" className="landing-section">
        <div className="cta-banner-card">
          <div className="cta-banner-content">
            <h2>Ready to Ground Your Queries in Verifiable Evidence?</h2>
            <p>Enter the interactive 3-column workspace now to upload your PDFs and start inspecting exact chunk citations.</p>
          </div>
          <button className="btn-launch-banner" onClick={onLaunchApp}>
            <span>Launch RAG Agent Workspace</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-left">
            <FileText size={20} color="#0f172a" />
            <span className="footer-brand">RAG AGENT — Evidence Chat</span>
          </div>
          <div className="footer-right">
            <span>Universal PDF Retrieval System · Built with React, FastAPI, ChromaDB & Gemini 2.5</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
