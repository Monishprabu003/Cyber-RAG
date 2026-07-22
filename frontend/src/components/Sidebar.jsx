import React, { useRef, useState } from 'react';
import { Shield, Plus, Upload, Trash2, RefreshCw, AlertTriangle, FileText, Home } from 'lucide-react';

export default function Sidebar({
  stats,
  documents,
  onUpload,
  onDelete,
  onRebuild,
  onClear,
  onNewChat,
  isUploading,
  onGoHome
}) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        onUpload(file);
      } else {
        alert('Only PDF documents are supported.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onUpload(file);
    }
  };

  return (
    <aside className="sidebar">
      <div>
        <div 
          className="sidebar-header" 
          onClick={onGoHome} 
          title="Return to Landing Page"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={26} color="#0f172a" />
            <span>RAG AGENT</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onGoHome(); }}
            title="Back to Landing Page"
            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '750', color: '#0f172a' }}
          >
            <Home size={14} />
            <span>Home</span>
          </button>
        </div>

        <button className="btn-new-chat" onClick={onNewChat} disabled={isUploading}>
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        <div className="sidebar-section-title">CASE FILE</div>

        {/* Drag and Drop Zone */}
        <div
          className={`dropzone ${isDragActive ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={24} color="#3b82f6" style={{ margin: '0 auto 8px auto', display: 'block' }} />
          <div className="dropzone-text">
            {isUploading ? 'Chunking & Indexing...' : 'Drop a document, or choose a file to index'}
          </div>
          <div className="dropzone-subtext">Supports PDF up to 200MB</div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden-file-input"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        {isUploading && (
          <div className="upload-progress">
            ⚡ Running TextSplitter & Chroma embeddings...
          </div>
        )}

        <div className="indexed-status">
          Indexed — {stats?.total_chunks || 0} chunks.
        </div>

        {/* Indexed Document Cards */}
        <div className="case-file-list">
          {documents && documents.length > 0 ? (
            documents.map((docName, idx) => (
              <div className="case-file-card" key={idx}>
                <div className="case-file-info">
                  <div className="case-file-name" title={docName}>
                    <FileText size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    {docName}
                  </div>
                  <div className="case-file-meta">Indexed in ChromaDB</div>
                </div>
                <button
                  className="btn-delete-file"
                  onClick={() => onDelete(docName)}
                  title={`Delete ${docName}`}
                  disabled={isUploading}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="case-file-card" style={{ borderStyle: 'dashed', justifyContent: 'center' }}>
              <div className="case-file-meta" style={{ textAlign: 'center', padding: '8px 0' }}>
                No documents indexed yet. Upload a PDF document above.
              </div>
            </div>
          )}
        </div>

        <hr className="sidebar-divider" />

        {/* Management Buttons */}
        <div className="mgmt-actions">
          <button className="btn-secondary" onClick={onRebuild} disabled={isUploading} title="Rebuild KB Cache">
            <RefreshCw size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Rebuild
          </button>
          <button className="btn-secondary" onClick={onClear} disabled={isUploading} title="Clear all DB chunks">
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px', color: '#d97706' }} />
            Clear
          </button>
        </div>
      </div>

      {/* Tech Stack Footer Pills */}
      <div className="tech-pills">
        <span className="tech-pill">LangChain</span>
        <span className="tech-pill">ChromaDB</span>
        <span className="tech-pill">Gemini 2.5</span>
      </div>
    </aside>
  );
}
