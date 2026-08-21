import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import MainChat from './components/MainChat';
import EvidencePanel from './components/EvidencePanel';
import LandingPage from './components/LandingPage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const CHAT_SESSIONS_STORAGE_KEY = 'cyber_rag_chat_sessions_v1';
const ACTIVE_SESSION_STORAGE_KEY = 'cyber_rag_active_session_id_v1';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'app'
  const [stats, setStats] = useState({ pdf_count: 0, total_chunks: 0, status: 'EMPTY', total_pages: 0 });
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [selectedTurnId, setSelectedTurnId] = useState(null);

  // Chat sessions state with localStorage persistence
  const [chatSessions, setChatSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load chat sessions from localStorage:', e);
    }
    const initialId = 'session_' + Date.now();
    return [{
      id: initialId,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: []
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (savedId) return savedId;
    } catch (e) {
      console.error('Failed to load active session ID from localStorage:', e);
    }
    return chatSessions[0]?.id || 'session_' + Date.now();
  });

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(chatSessions));
    } catch (e) {
      console.error('Failed to save chat sessions to localStorage:', e);
    }
  }, [chatSessions]);

  // Save active session ID to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId);
    } catch (e) {
      console.error('Failed to save active session ID to localStorage:', e);
    }
  }, [activeSessionId]);

  // Active session object
  const activeSession = chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];

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
      await fetchStatsAndDocs();
    } catch (error) {
      alert(`Clear DB error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // New Chat handler - Creates and switches to a new conversation
  const handleNewChat = () => {
    // If active session is already empty, just keep it
    if (activeSession && (!activeSession.messages || activeSession.messages.length === 0)) {
      setSelectedTurnId(null);
      return;
    }

    const newSessionId = 'session_' + Date.now();
    const newSession = {
      id: newSessionId,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: []
    };

    setChatSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setSelectedTurnId(null);
  };

  // Select a past chat session
  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setSelectedTurnId(null);
  };

  // Delete a chat session
  const handleDeleteSession = (sessionId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat?')) return;

    setChatSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      if (remaining.length === 0) {
        const freshId = 'session_' + Date.now();
        const freshSession = {
          id: freshId,
          title: 'New Conversation',
          createdAt: new Date().toISOString(),
          messages: []
        };
        setActiveSessionId(freshId);
        return [freshSession];
      }
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
    setSelectedTurnId(null);
  };

  // Clear all chat history
  const handleClearAllChats = () => {
    if (!window.confirm('Are you sure you want to clear all chat history?')) return;
    const freshId = 'session_' + Date.now();
    const freshSession = {
      id: freshId,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: []
    };
    setChatSessions([freshSession]);
    setActiveSessionId(freshId);
    setSelectedTurnId(null);
  };

  // Execute Grounded Query
  const handleExecuteQuery = async (question) => {
    if (!question.trim() || isQuerying) return;

    const queryText = question.trim();
    const userMessageId = 'msg_user_' + Date.now();
    const turnId = 'turn_' + Date.now();

    const userMessage = {
      id: userMessageId,
      turnId: turnId,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update active session with the new user message
    let currentTitle = activeSession?.title;
    if (!currentTitle || currentTitle === 'New Conversation') {
      currentTitle = queryText.length > 32 ? queryText.slice(0, 32) + '...' : queryText;
    }

    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            title: currentTitle,
            messages: [...(s.messages || []), userMessage],
          };
        }
        return s;
      })
    );

    setIsQuerying(true);
    setSelectedTurnId(turnId);

    try {
      const res = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText }),
      });

      if (res.ok) {
        const data = await res.json();
        const asstMessage = {
          id: 'msg_asst_' + Date.now(),
          turnId: turnId,
          role: 'assistant',
          content: data.answer,
          responseData: data,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setChatSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSessionId) {
              return {
                ...s,
                messages: [...(s.messages || []), asstMessage],
              };
            }
            return s;
          })
        );
      } else {
        const err = await res.json();
        alert(`Query execution error: ${err.detail || res.statusText}`);
      }
    } catch (error) {
      alert(`Backend connection error during query: ${error.message}`);
    } finally {
      setIsQuerying(false);
    }
  };

  // Determine which response to show in Evidence Panel
  const activeMessages = activeSession?.messages || [];
  
  // Find evidence from selected turn or from the latest assistant message
  let activeResponseData = null;
  if (selectedTurnId) {
    const selectedAsst = activeMessages.find((m) => m.turnId === selectedTurnId && m.role === 'assistant');
    if (selectedAsst?.responseData) {
      activeResponseData = selectedAsst.responseData;
    }
  }
  
  if (!activeResponseData) {
    // Default to the last assistant message
    const lastAsst = [...activeMessages].reverse().find((m) => m.role === 'assistant' && m.responseData);
    if (lastAsst) {
      activeResponseData = lastAsst.responseData;
    }
  }

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
      {/* Column 1: Left Sidebar with History & Case File */}
      <Sidebar
        stats={stats}
        documents={documents}
        chatSessions={chatSessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearAllChats={handleClearAllChats}
        onNewChat={handleNewChat}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onRebuild={handleRebuild}
        onClear={handleClear}
        isUploading={isUploading}
        onGoHome={() => setCurrentView('landing')}
      />

      {/* Column 2: Main Chat & Findings Area */}
      <MainChat
        stats={stats}
        messages={activeMessages}
        isQuerying={isQuerying}
        onExecuteQuery={handleExecuteQuery}
        selectedTurnId={selectedTurnId}
        onSelectTurn={(turnId) => setSelectedTurnId(turnId)}
      />

      {/* Column 3: Right Evidence Panel */}
      <EvidencePanel
        currentResponse={activeResponseData}
        isQuerying={isQuerying}
      />
    </div>
  );
}
