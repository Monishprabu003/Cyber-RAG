import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle2, Bot } from 'lucide-react';

export default function MainChat({
  stats,
  messages = [],
  isQuerying,
  onExecuteQuery,
  selectedTurnId,
  onSelectTurn
}) {
  const [inputQuestion, setInputQuestion] = useState('');
  const chatBottomRef = useRef(null);

  // Auto-scroll to bottom whenever messages change or when querying
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

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

  // Group messages into turns for clean paired rendering
  const turns = [];
  let currentTurn = null;

  messages.forEach((msg) => {
    if (msg.role === 'user') {
      if (currentTurn) {
        turns.push(currentTurn);
      }
      currentTurn = {
        turnId: msg.turnId || msg.id,
        userMessage: msg,
        assistantMessage: null,
      };
    } else if (msg.role === 'assistant') {
      if (currentTurn) {
        currentTurn.assistantMessage = msg;
        turns.push(currentTurn);
        currentTurn = null;
      } else {
        turns.push({
          turnId: msg.turnId || msg.id,
          userMessage: null,
          assistantMessage: msg,
        });
      }
    }
  });

  if (currentTurn) {
    turns.push(currentTurn);
  }

  // Helper for formatting paragraphs and bullets
  const renderFormattedAnswer = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} style={{ marginLeft: '20px', marginBottom: '6px' }}>
            {line.trim().substring(2)}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '10px' }} />;
      }
      return <p key={idx} style={{ marginBottom: '12px' }}>{line}</p>;
    });
  };

  // Find latest active response for status pills
  const latestAsst = [...messages].reverse().find((m) => m.role === 'assistant' && m.responseData);
  const confScoreDisplay = latestAsst?.responseData?.confidence_score !== undefined
    ? latestAsst.responseData.confidence_score.toFixed(2)
    : '--';

  return (
    <main className="main-chat">
      {/* Top Header Bar */}
      <div className="header-bar">
        <div className="status-group">
          <span className="status-pill">Docs {stats?.pdf_count || 0}</span>
          <span className="status-pill">Confidence {confScoreDisplay}</span>
          <span className="status-pill">Messages {messages.length}</span>
        </div>
        <div className="status-online">
          <span className="status-dot" /> Backend online
        </div>
      </div>

      <div className="chat-body-scrollable">
        {!isKbReady ? (
          <div className="findings-card" style={{ textAlign: 'center', margin: 'auto', maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: '800' }}>ℹ️ No Knowledge Base Found</h3>
            <p style={{ color: '#334155' }}>
              Please drop and index a PDF document in the left sidebar before asking questions.
            </p>
          </div>
        ) : turns.length === 0 ? (
          /* Watermark & Prompt Suggestions Grid when conversation is empty */
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
          /* Multi-turn Chat Conversation Stream */
          <div className="active-query-section">
            {turns.map((turn, tIdx) => {
              const uMsg = turn.userMessage;
              const aMsg = turn.assistantMessage;
              const isSelected = selectedTurnId === turn.turnId;
              const confBadge = aMsg?.responseData?.confidence || 'CONFIDENCE 0.80';
              const isHigh = confBadge.includes('0.9') || confBadge.includes('0.8');

              return (
                <div 
                  key={turn.turnId || tIdx} 
                  className={`conversation-turn ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectTurn && onSelectTurn(turn.turnId)}
                >
                  {/* User Bubble */}
                  {uMsg && (
                    <div className="user-bubble-container">
                      <div className="user-bubble-meta">
                        <span className="bubble-time">{uMsg.timestamp}</span>
                      </div>
                      <div className="user-bubble">{uMsg.content}</div>
                    </div>
                  )}

                  {/* Pipeline Steps Bar */}
                  <div className="pipeline-bar">
                    <div className="pipeline-step">
                      <span className="pipeline-circle"><CheckCircle2 size={15} /></span>
                      RETRIEVE
                    </div>
                    <div className="pipeline-line" />
                    <div className="pipeline-step">
                      <span className="pipeline-circle"><CheckCircle2 size={15} /></span>
                      EVIDENCE
                    </div>
                    <div className="pipeline-line" />
                    <div className="pipeline-step">
                      <span className="pipeline-circle"><CheckCircle2 size={15} /></span>
                      REPORT
                    </div>
                  </div>

                  {/* Findings Card */}
                  {aMsg ? (
                    <div className="findings-card">
                      <div className="findings-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Bot size={20} color="#1e3a8a" />
                          <span className="findings-title">Findings</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`confidence-badge ${isHigh ? 'high' : 'low'}`}>
                            {confBadge}
                          </span>
                          <span className="turn-timestamp">{aMsg.timestamp}</span>
                        </div>
                      </div>

                      <div className="findings-body">
                        {renderFormattedAnswer(aMsg.content)}
                      </div>
                    </div>
                  ) : isQuerying && tIdx === turns.length - 1 ? (
                    /* Loading State for in-flight turn */
                    <div className="findings-card">
                      <div className="findings-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Bot size={20} color="#1e3a8a" />
                          <span className="findings-title">Findings</span>
                        </div>
                        <span className="confidence-badge" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                          ⏳ Grounding Evidence...
                        </span>
                      </div>

                      <div className="findings-body">
                        <p style={{ fontStyle: 'italic', color: '#64748b' }}>
                          Searching Chroma vector store and analyzing document chunks with Gemini 2.5...
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div ref={chatBottomRef} style={{ height: '1px' }} />
          </div>
        )}
      </div>

      {/* Fixed Bottom Chat Input Bar */}
      <div className="chat-input-wrapper">
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input"
            placeholder={isKbReady ? "Send a message..." : "Upload a PDF first to ask questions"}
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
