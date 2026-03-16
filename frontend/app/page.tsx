"use client";

import React from "react"
import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Globe,
  Paperclip,
  Eye,
  AudioWaveform,
  LayoutGrid,
  Send,
  Upload,
  FileText,
  Pause,
  Play,
  Check,
  X,
} from "lucide-react";
import { uploadPaper, sendMessage } from "@/services/api";
import type { Message } from "@/types/chat";

function TypingText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      // Hide cursor 2 seconds after typing finishes
      const cursorTimeout = setTimeout(() => {
        setShowCursor(false);
      }, 2000);
      return () => clearTimeout(cursorTimeout);
    }
  }, [displayedText, text]);

  return (
    <div className="h-12 flex items-center justify-center">
      <span className="font-mono text-3xl md:text-4xl text-slate-300 tracking-tight">
        {displayedText}
        {showCursor && (
          <span className="typing-cursor text-slate-300">|</span>
        )}
      </span>
    </div>
  );
}

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPaused, setUploadPaused] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [paperUploaded, setPaperUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus input when chat view opens
  useEffect(() => {
    if (paperUploaded && chatInputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [paperUploaded]);

  // Global keyboard listener for auto-focus
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      // Only auto-focus if:
      // 1. Chat is open (paperUploaded)
      // 2. Not currently uploading
      // 3. Not already focused on an input
      // 4. Key is alphanumeric or space
      // 5. No modifier keys (except Shift for capitals)
      
      if (!paperUploaded || uploading) return;
      
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Don't interfere if already typing in an input
      if (isInputFocused) return;
      
      // Check if it's a typeable character (alphanumeric, space, punctuation)
      const isTypeableKey = 
        e.key.length === 1 && // Single character
        !e.ctrlKey && 
        !e.metaKey && 
        !e.altKey;
      
      if (isTypeableKey && chatInputRef.current) {
        chatInputRef.current.focus();
        // Let the key naturally appear in the input (don't preventDefault)
      }
    };

    window.addEventListener('keydown', handleGlobalKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, [paperUploaded, uploading]);

  async function handleUpload(selectedFile: File) {
    setUploading(true);
    setUploadProgress(0);
    setUploadPaused(false);
    setUploadComplete(false);
    setFile(selectedFile);
    
    // Create local URL for PDF preview
    const url = URL.createObjectURL(selectedFile);
    setFileUrl(url);
    
    // Simulate progress animation
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      if (!uploadPaused) {
        progress += Math.random() * 15;
        if (progress >= 90) {
          progress = 90; // Cap at 90% until actual upload completes
        }
        setUploadProgress(progress);
      }
    }, 300);
    
    try {
      await uploadPaper(selectedFile, sessionId);
      
      // Clear interval and complete
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setUploadProgress(100);
      setUploadComplete(true);
      
      // Transition to split view after short delay
      setTimeout(() => {
        setPaperUploaded(true);
        setUploading(false);
      }, 1500);
    } catch {
      console.error("Upload failed");
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setFile(null);
      setFileUrl(null);
      setUploading(false);
    }
  }
  
  function togglePause() {
    setUploadPaused((prev) => !prev);
  }
  
  function cancelUpload() {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setUploading(false);
    setUploadProgress(0);
    setFile(null);
    setFileUrl(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleUpload(selectedFile);
    }
  }

  async function handleSend() {
  if (!input.trim() || loading) return;

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
    console.error("Failed to get response");
  }

  setLoading(false);

  setTimeout(() => {
    chatInputRef.current?.focus();
  }, 100);
}

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_#1a1c2c_0%,_#0d0e14_100%)]">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#e6edf3]" />
          <span className="text-sm font-medium text-[#e6edf3] tracking-wide">
            Scholar AI
          </span>
        </div>
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <LayoutGrid className="h-5 w-5 text-[#7d8590]" />
        </button>
      </header>

      {/* Landing View - Before Upload */}
      {!paperUploaded && !uploading && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div className="text-center mb-10">
            <Sparkles className="h-8 w-8 text-[#58a6ff] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-light text-[#e6edf3] mb-4 font-mono">
              Hi, Researcher
            </h1>
            <TypingText text="Can I help you with anything?" />
            <p className="text-[#7d8590] text-base max-w-md mx-auto mt-4">
              Upload a research paper to get started with intelligent analysis.
            </p>
          </div>

          {/* Central Upload Button - Pill shaped, transparent, no border */}
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-500 ease-out group"
          >
            <Upload className="h-5 w-5 text-[#58a6ff]/80 group-hover:text-[#58a6ff] group-hover:scale-110 transition-all duration-300" />
            <span className="text-[#e6edf3]/70 group-hover:text-[#e6edf3] font-medium transition-colors duration-300">Upload Document</span>
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Footer */}
          <p className="absolute bottom-8 text-center text-[#7d8590] text-xs">
            Scholar AI may contain errors. We recommend checking important information.
          </p>
        </div>
      )}

      {/* Uploading State - Liquid iOS Glass Modal */}
      {uploading && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl" />
          
          {/* Liquid Glass Upload Modal */}
          <div 
            className="relative liquid-modal-enter"
            style={{
              transform: uploadComplete ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
            }}
          >
            <div 
              className="relative w-72 p-8 rounded-[2.5rem] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Subtle inner glow */}
              <div className="absolute inset-0 rounded-[2.5rem] opacity-50" style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.15) 0%, transparent 60%)'
              }} />
              
              {/* Progress Ring */}
              <div className="relative w-28 h-28 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="4"
                  />
                  {/* Progress ring with glow */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={251}
                    strokeDashoffset={251 - (251 * uploadProgress) / 100}
                    style={{ 
                      transition: 'stroke-dashoffset 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                      filter: 'drop-shadow(0 0 6px rgba(88,166,255,0.5))'
                    }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#79c0ff" />
                      <stop offset="100%" stopColor="#58a6ff" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {uploadComplete ? (
                    <div className="w-14 h-14 rounded-full flex items-center justify-center fade-in" style={{
                      background: 'linear-gradient(135deg, rgba(63,185,80,0.3) 0%, rgba(63,185,80,0.1) 100%)'
                    }}>
                      <Check className="h-7 w-7 text-[#3fb950]" />
                    </div>
                  ) : (
                    <span className="text-2xl font-light text-white/90 tabular-nums">
                      {Math.round(uploadProgress)}%
                    </span>
                  )}
                </div>
              </div>
              
              {/* File info */}
              <div className="relative text-center mb-5">
                <p className="text-sm text-white/80 truncate max-w-[200px] mx-auto mb-1">
                  {file?.name}
                </p>
                <p className="text-xs text-white/40">
                  {uploadComplete ? 'Complete' : uploadPaused ? 'Paused' : 'Processing...'}
                </p>
              </div>
              
              {/* Controls */}
              {!uploadComplete && (
                <div className="relative flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {uploadPaused ? (
                      <Play className="h-4 w-4 text-white/80 ml-0.5" />
                    ) : (
                      <Pause className="h-4 w-4 text-white/80" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelUpload}
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-[#f85149]/20"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <X className="h-4 w-4 text-white/60" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document + Chat Split View - Floating Liquid Glass Aesthetic */}
      {paperUploaded && (
        <div className="flex h-screen p-6 pt-20 gap-6">
          {/* Left: Floating Document Viewer */}
          <div 
            className="w-1/2 h-full flex flex-col overflow-hidden rounded-3xl fade-in"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Minimal file indicator */}
            <div className="flex items-center gap-2 px-5 py-3">
              <FileText className="h-4 w-4 text-[#58a6ff]/60" />
              <span className="text-xs text-white/50 truncate">{file?.name}</span>
            </div>
            <div className="flex-1 overflow-hidden mx-3 mb-3 rounded-2xl">
              {fileUrl ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-full rounded-2xl"
                  title="Document Preview"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white/30">
                  No document loaded
                </div>
              )}
            </div>
          </div>

          {/* Right: Floating Chat Interface */}
          <div 
            className="w-1/2 h-full flex flex-col overflow-hidden rounded-3xl fade-in"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
              animationDelay: '0.1s'
            }}
          >
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="h-5 w-5 text-[#58a6ff]/50 mb-3" />
                  <p className="text-white/40 text-sm">
                    Ask me anything about the paper
                  </p>
                  <p className="text-white/20 text-xs mt-2">
                    💡 Just start typing - no need to click!
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      m.role === "user"
                        ? "text-[#0d1117]"
                        : "text-white/90"
                    }`}
                    style={{
                      background: m.role === "user" 
                        ? 'linear-gradient(135deg, #79c0ff 0%, #58a6ff 100%)'
                        : 'rgba(255,255,255,0.06)',
                      backdropFilter: m.role === "assistant" ? 'blur(10px)' : 'none',
                    }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {m.content}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div 
                    className="px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input - Floating pill */}
            <div className="p-5">
              <div 
                className="h-12 rounded-full flex items-center px-4 transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    title="Upload File"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4 text-white/40" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    title="Web Search"
                  >
                    <Globe className="h-4 w-4 text-white/40" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <input
                  ref={chatInputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask something..."
                  disabled={loading}
                  className="flex-1 bg-transparent border-none outline-none text-white/90 placeholder-white/30 text-sm px-3"
                />

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4 text-white/40" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    title="Voice"
                  >
                    <AudioWaveform className="h-4 w-4 text-white/40" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="p-1.5 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 ml-2"
                    style={{
                      background: 'linear-gradient(135deg, #79c0ff 0%, #58a6ff 100%)',
                    }}
                  >
                    <Send className="h-4 w-4 text-[#0d1117]" />
                  </button>
                </div>
              </div>
              <p className="text-center text-white/25 text-xs mt-3">
                Scholar AI may contain errors
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}