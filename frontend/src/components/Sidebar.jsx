import React, { useRef, useState } from 'react';
import { 
  Plus, 
  Upload, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  FileText, 
  Home, 
  MessageSquare
} from 'lucide-react';

export default function Sidebar({
  stats,
  documents,
  chatSessions = [],
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAllChats,
  onNewChat,
  onUpload,
  onDelete,
  onRebuild,
  onClear,
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
      <div className="sidebar-scrollable-content">
        {/* Header with Home Button */}
        <div 
          className="sidebar-header" 
          onClick={onGoHome} 
          title="Return to Landing Page"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={26} color="#0f172a" />
            <span style={{ fontWeight: '850' }}>RAG AGENT</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onGoHome(); }}
            title="Back to Landing Page"
            className="btn-home-nav"
          >
            <Home size={14} />
            <span>Home</span>
          </button>
        </div>

        {/* New Chat Primary Action Button */}
        <button 
          className="btn-new-chat" 
          onClick={onNewChat} 
          disabled={isUploading}
          title="Start a new chat conversation"
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        {/* Chat History Section */}
        <div className="sidebar-section-header">
          <div className="sidebar-section-title" style={{ marginTop: 0 }}>
            CHAT HISTORY
          </div>
          {chatSessions.length > 1 && (
            <button 
              className="btn-clear-history-text" 
              onClick={onClearAllChats}
              title="Clear all chat history"
            >
              Clear
            </button>
          )}
        </div>

        <div className="chat-history-list">
          {chatSessions && chatSessions.length > 0 ? (
            chatSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const msgCount = session.messages ? session.messages.length : 0;
              const turnCount = Math.ceil(msgCount / 2);

              return (
                <div
                  key={session.id}
                  className={`chat-session-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectSession(session.id)}
                  title={session.title || 'New Conversation'}
                >
                  <div className="chat-session-icon">
                    <MessageSquare size={15} />
                  </div>
                  <div className="chat-session-info">
                    <div className="chat-session-title">
                      {session.title || 'New Conversation'}
                    </div>
                    <div className="chat-session-meta">
                      {turnCount === 0 ? 'Empty chat' : `${turnCount} turn${turnCount > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  {chatSessions.length > 1 && (
                    <button
                      className="btn-delete-session"
                      onClick={(e) => onDeleteSession(session.id, e)}
                      title="Delete this chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="chat-history-empty">
              No saved conversations
            </div>
          )}
        </div>

        <hr className="sidebar-divider" />

        {/* Case File Section */}
        <div className="sidebar-section-title">CASE FILE</div>

        {/* Drag and Drop Zone */}
        <div
          className={`dropzone ${isDragActive ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={22} color="#3b82f6" style={{ margin: '0 auto 6px auto', display: 'block' }} />
          <div className="dropzone-text">
            {isUploading ? 'Chunking & Indexing...' : 'Drop PDF or click to browse'}
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
          Indexed — {stats?.total_chunks || 0} chunks ({stats?.pdf_count || 0} docs).
        </div>

        {/* Indexed Document Cards */}
        <div className="case-file-list">
          {documents && documents.length > 0 ? (
            documents.map((docName, idx) => (
              <div className="case-file-card" key={idx}>
                <div className="case-file-info">
                  <div className="case-file-name" title={docName}>
                    <FileText size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
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
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="case-file-card" style={{ borderStyle: 'dashed', justifyContent: 'center' }}>
              <div className="case-file-meta" style={{ textAlign: 'center', padding: '6px 0' }}>
                No documents indexed yet. Upload a PDF above.
              </div>
            </div>
          )}
        </div>

        <hr className="sidebar-divider" />

        {/* Management Buttons */}
        <div className="mgmt-actions">
          <button className="btn-secondary" onClick={onRebuild} disabled={isUploading} title="Rebuild KB Cache">
            <RefreshCw size={13} style={{ display: 'inline', marginRight: '5px' }} />
            Rebuild
          </button>
          <button className="btn-secondary" onClick={onClear} disabled={isUploading} title="Clear all DB chunks">
            <AlertTriangle size={13} style={{ display: 'inline', marginRight: '5px', color: '#d97706' }} />
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
