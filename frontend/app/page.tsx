/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useRef } from "react";
import { uploadPaper, sendMessage } from "../services/api";
import { Message } from "../types/chat";
import "./styles.css";

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [paperUploaded, setPaperUploaded] = useState(false);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate session ID once
  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  function showNotification(type: string, message: string) {
    setNotification({ type, message });
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      await uploadPaper(file, sessionId);
      setPaperUploaded(true);
      setFile(null);
      showNotification("success", "Paper uploaded successfully!");
    } catch (err) {
      showNotification("error", "Upload failed. Please try again.");
    }
    setLoading(false);
  }

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendMessage(sessionId, input);
      const assistantMessage: Message = {
        role: "assistant",
        content: res.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      showNotification("error", "Failed to get response. Please try again.");
    }

    setLoading(false);
  }

  return (
    <main className="page-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">📘</div>
            <div>
              <h1 className="logo-text">ScholarAI</h1>
              <p className="logo-subtitle">Intelligent Research Paper Analysis</p>
            </div>
          </div>
          {paperUploaded && <div className="status-badge">✓ Paper Loaded</div>}
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="content-wrapper">
        {/* Upload Section */}
        {!paperUploaded && (
          <section className="upload-section">
            <div className="upload-card">
              <div className="upload-icon">📄</div>
              <h2>Upload Your Research Paper</h2>
              <p className="upload-description">
                Upload a PDF document to start analyzing with ScholarAI
              </p>

              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="file-input"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={loading}
                />
                <label htmlFor="file-input" className="file-label">
                  {file ? file.name : "Choose PDF File"}
                </label>
              </div>

              <button
                className="btn btn-primary btn-large"
                onClick={handleUpload}
                disabled={!file || loading}
              >
                {loading ? "Uploading..." : "Upload Paper"}
              </button>
            </div>
          </section>
        )}

        {/* Chat Section */}
        {paperUploaded && (
          <section className="chat-section">
            <div className="chat-container">
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <h3>Ask Questions About Your Paper</h3>
                    <p>
                      Start a conversation with ScholarAI to extract insights,
                      summarize content, or dive deeper into specific topics.
                    </p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      className={`message-wrapper message-${m.role}`}
                    >
                      <div className="message-avatar">
                        {m.role === "user" ? "👤" : "🤖"}
                      </div>
                      <div className={`message-bubble message-${m.role}`}>
                        <p>{m.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="message-wrapper message-assistant">
                    <div className="message-avatar">🤖</div>
                    <div className="message-bubble message-assistant">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="input-area">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask something about the paper..."
                  disabled={loading}
                  className="message-input"
                />
                <button
                  className="btn btn-send"
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                >
                  ➤
                </button>
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  setPaperUploaded(false);
                  setMessages([]);
                  setFile(null);
                }}
              >
                Upload Different Paper
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}