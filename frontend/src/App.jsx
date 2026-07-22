import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import MainChat from './components/MainChat';
import EvidencePanel from './components/EvidencePanel';
import LandingPage from './components/LandingPage';

const API_BASE_URL = 'http://localhost:8000/api';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'app'
  const [stats, setStats] = useState({ pdf_count: 0, total_chunks: 0, status: 'EMPTY', total_pages: 0 });
  const [documents, setDocuments] = useState([]);
  const [currentQuery, setCurrentQuery] = useState(null);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);

  // Fetch stats and documents list from FastAPI
  const fetchStatsAndDocs = useCallback(async () => {
    try {
      const statsRes = await fetch(`${API_BASE_URL}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const docsRes = await fetch(`${API_BASE_URL}/documents`);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch from backend API:', error);
    }
  }, []);

  useEffect(() => {
    fetchStatsAndDocs();
  }, [fetchStatsAndDocs]);

  // Upload PDF handler
  const handleUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchStatsAndDocs();
      } else {
        const err = await res.json();
        alert(`Failed to index PDF: ${err.detail || res.statusText}`);
      }
    } catch (error) {
      alert(`Error connecting to backend API: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete PDF handler
  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;
    setIsUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (currentResponse) {
          setCurrentQuery(null);
          setCurrentResponse(null);
        }
        await fetchStatsAndDocs();
      } else {
        const err = await res.json();
        alert(`Failed to delete document: ${err.detail || res.statusText}`);
      }
    } catch (error) {
      alert(`Error deleting document: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Rebuild KB handler
  const handleRebuild = async () => {
    setIsUploading(true);
    try {
      await fetch(`${API_BASE_URL}/rebuild`, { method: 'POST' });
      await fetchStatsAndDocs();
    } catch (error) {
      alert(`Rebuild error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Clear KB handler
  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear all documents from Chroma DB?')) return;
    setIsUploading(true);
    try {
      await fetch(`${API_BASE_URL}/clear`, { method: 'POST' });
      setCurrentQuery(null);
      setCurrentResponse(null);
      await fetchStatsAndDocs();
    } catch (error) {
      alert(`Clear DB error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // New Chat handler
  const handleNewChat = () => {
    setCurrentQuery(null);
    setCurrentResponse(null);
  };

  // Execute Grounded Query
  const handleExecuteQuery = async (question) => {
    setCurrentQuery(question);
    setIsQuerying(true);
    setCurrentResponse(null);

    try {
      const res = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentResponse(data);
      } else {
        const err = await res.json();
        alert(`Query execution error: ${err.detail || res.statusText}`);
        setCurrentQuery(null);
      }
    } catch (error) {
      alert(`Backend connection error during query: ${error.message}`);
      setCurrentQuery(null);
    } finally {
      setIsQuerying(false);
    }
  };

  if (currentView === 'landing') {
    return (
      <LandingPage
        stats={stats}
        documents={documents}
        onLaunchApp={() => setCurrentView('app')}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Column 1: Left Sidebar */}
      <Sidebar
        stats={stats}
        documents={documents}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onRebuild={handleRebuild}
        onClear={handleClear}
        onNewChat={handleNewChat}
        isUploading={isUploading}
        onGoHome={() => setCurrentView('landing')}
      />

      {/* Column 2: Main Chat & Findings */}
      <MainChat
        stats={stats}
        currentQuery={currentQuery}
        currentResponse={currentResponse}
        isQuerying={isQuerying}
        onExecuteQuery={handleExecuteQuery}
      />

      {/* Column 3: Right Evidence Panel */}
      <EvidencePanel
        currentResponse={currentResponse}
        isQuerying={isQuerying}
      />
    </div>
  );
}
