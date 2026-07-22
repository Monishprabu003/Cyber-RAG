import React from 'react';

export default function EvidencePanel({ currentResponse, isQuerying }) {
  const sources = currentResponse?.sources || [];

  return (
    <aside className="evidence-panel">
      <div className="evidence-header">EVIDENCE</div>

      {isQuerying ? (
        <div className="evidence-empty-card" style={{ textAlign: 'center' }}>
          ⏳ Retrieving top semantic chunks from Chroma DB...
        </div>
      ) : !currentResponse || sources.length === 0 ? (
        <div className="evidence-empty-card">
          Supporting <strong>evidence</strong> from your <strong>uploaded documents</strong> will appear here when you ask a question or click a suggestion prompt.
        </div>
      ) : (
        <div className="evidence-list">
          {sources.map((src, idx) => {
            const pdfName = src.source || 'Unknown PDF';
            const pageNum = src.page || 1;
            const chunkNum = src.chunk || idx + 1;
            const snippetText = src.preview || (src.content ? src.content.substring(0, 200) + '...' : '');

            return (
              <div className="evidence-card" key={idx}>
                <div className="evidence-card-title">{pdfName}</div>
                <div className="evidence-card-subtitle">p. {pageNum} · chunk {chunkNum}</div>
                <div className="evidence-progress-bar" />
                <div className="evidence-snippet">{snippetText}</div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
