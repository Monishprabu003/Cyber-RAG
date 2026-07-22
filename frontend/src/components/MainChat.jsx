import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export default function MainChat({
  stats,
  currentQuery,
  currentResponse,
  isQuerying,
  onExecuteQuery
}) {
  const [inputQuestion, setInputQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputQuestion.trim() && !isQuerying) {
      onExecuteQuery(inputQuestion.trim());
      setInputQuestion('');
    }
  };

  const handleSuggestionClick = (promptText) => {
    if (!isQuerying) {
      onExecuteQuery(promptText);
    }
  };

  const isKbReady = stats?.status === 'READY';
  const confScoreDisplay = currentResponse?.confidence_score !== undefined
    ? currentResponse.confidence_score.toFixed(2)
    : '--';

  const confBadgeText = currentResponse?.confidence || 'CONFIDENCE 0.80';
  const isHighConf = confBadgeText.includes('0.9') || confBadgeText.includes('0.8');

  // Simple paragraph & bullet rendering helper for exact grounded markdown text
  const renderFormattedAnswer = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={idx} style={{ marginLeft: '20px', marginBottom: '6px' }}>{line.trim().substring(2)}</li>;
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '10px' }} />;
      }
      return <p key={idx} style={{ marginBottom: '12px' }}>{line}</p>;
    });
  };

  return (
    <main className="main-chat">
      {/* Top Header Bar */}
      <div className="header-bar">
        <div className="status-group">
          <span className="status-pill">Docs {stats?.pdf_count || 0}</span>
          <span className="status-pill">Confidence {confScoreDisplay}</span>
          <span className="status-pill">Retries 0</span>
        </div>
        <div className="status-online">
          <span className="status-dot" /> Backend online
        </div>
      </div>

      {!isKbReady ? (
        <div className="findings-card" style={{ textAlign: 'center', margin: 'auto' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: '800' }}>ℹ️ No Knowledge Base Found</h3>
          <p style={{ color: '#334155' }}>
            Please drop and index a PDF document in the left sidebar before asking questions.
          </p>
        </div>
      ) : !currentQuery ? (
        /* Watermark & Prompt Suggestions Grid */
        <div className="watermark-section">
          <div className="watermark-title">RAG AGENT</div>
          <div className="watermark-subtitle">Evidence-verified document answers</div>

          <div className="suggestions-grid">
            <button
              className="suggestion-card"
              onClick={() => handleSuggestionClick('Summarize the uploaded document and its main topics.')}
            >
              <div className="suggestion-title">Summarize the document</div>
              <div className="suggestion-desc">across everything I've uploaded so far</div>
            </button>

            <button
              className="suggestion-card"
              onClick={() => handleSuggestionClick('Find key facts and core definitions discussed in the uploaded document.')}
            >
              <div className="suggestion-title">Find key facts</div>
              <div className="suggestion-desc">across the uploaded document and concepts</div>
            </button>

            <button
              className="suggestion-card"
              onClick={() => handleSuggestionClick('Compare two different sections or themes mentioned in the document.')}
            >
              <div className="suggestion-title">Compare two sections</div>
              <div className="suggestion-desc">from different uploaded documents</div>
            </button>

            <button
              className="suggestion-card"
              onClick={() => handleSuggestionClick('List open action items, recommendations, or requirements mentioned in the record.')}
            >
              <div className="suggestion-title">List open action items</div>
              <div className="suggestion-desc">mentioned anywhere in the document record</div>
            </button>

            <button
              className="suggestion-card"
              onClick={() => handleSuggestionClick('Explain the most important technical terms defined in the document.')}
            >
              <div className="suggestion-title">Explain a term</div>
              <div className="suggestion-desc">as it's defined in the uploaded document</div>
            </button>

            <button
              className="suggestion-card"
              onClick={() => handleSuggestionClick('Verify what claims and factual findings are explicitly stated in the evidence.')}
            >
              <div className="suggestion-title">Check a claim</div>
              <div className="suggestion-desc">against the evidence I've uploaded</div>
            </button>
          </div>
        </div>
      ) : (
        /* Active Query State */
        <div className="active-query-section">
          {/* User Bubble */}
          <div className="user-bubble-container">
            <div className="user-bubble">{currentQuery}</div>
          </div>

          {/* Pipeline Steps Bar */}
          <div className="pipeline-bar">
            <div className="pipeline-step">
              <span className="pipeline-circle"><CheckCircle2 size={16} /></span>
              RETRIEVE
            </div>
            <div className="pipeline-line" />
            <div className="pipeline-step">
              <span className="pipeline-circle"><CheckCircle2 size={16} /></span>
              EVIDENCE
            </div>
            <div className="pipeline-line" />
            <div className="pipeline-step">
              <span className="pipeline-circle"><CheckCircle2 size={16} /></span>
              REPORT
            </div>
          </div>

          {/* Unified Bordered White Findings Card */}
          <div className="findings-card">
            <div className="findings-header">
              <span className="findings-title">Findings</span>
              {isQuerying ? (
                <span className="confidence-badge" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  ⏳ Grounding Evidence...
                </span>
              ) : (
                <span className={`confidence-badge ${isHighConf ? 'high' : 'low'}`}>
                  {confBadgeText}
                </span>
              )}
            </div>

            <div className="findings-body">
              {isQuerying ? (
                <p style={{ fontStyle: 'italic', color: '#64748b' }}>
                  Searching Chroma vector store and analyzing document chunks with Gemini 2.5...
                </p>
              ) : currentResponse ? (
                renderFormattedAnswer(currentResponse.answer)
              ) : (
                <p>No response generated.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Chat Input Bar */}
      <div className="chat-input-wrapper">
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input"
            placeholder="Send a message..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={!isKbReady || isQuerying}
          />
          <button
            type="submit"
            className="btn-send"
            disabled={!isKbReady || isQuerying || !inputQuestion.trim()}
            title="Send Query"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </main>
  );
}
