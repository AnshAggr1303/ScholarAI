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
  ChevronLeft,
  ChevronRight,
  Download,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { uploadPaper, sendMessage } from "@/services/api";
import type { Message } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Dynamic imports for PDF components (client-side only)
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

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
  const { theme, setTheme } = useTheme();
  const [sessionId, setSessionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPaused, setUploadPaused] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [paperUploaded, setPaperUploaded] = useState(false);
  
  // PDF viewer state
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(520);
  
  // Text selection state
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
  }, []);

  // Configure PDF.js worker (client-side only)
  useEffect(() => {
    import("react-pdf").then((reactPdf) => {
      reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    });
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus input when chat view opens
  useEffect(() => {
    if (paperUploaded && chatInputRef.current) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [paperUploaded]);

  // Responsive PDF width
  useEffect(() => {
    const updateWidth = () => {
      setPdfWidth(window.innerWidth * 0.46);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Global keyboard listener for auto-focus
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      if (!paperUploaded || uploading) return;
      
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (isInputFocused) return;
      
      const isTypeableKey = 
        e.key.length === 1 && 
        !e.ctrlKey && 
        !e.metaKey && 
        !e.altKey;
      
      if (isTypeableKey && chatInputRef.current) {
        chatInputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, [paperUploaded, uploading]);

  // Text selection listener
  useEffect(() => {
    const handleSelection = () => {
      const text = window.getSelection()?.toString().trim();

      if (text && text.length > 3) {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          setSelectedText(text);
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
          setShowSelectionMenu(true);
        }
      } else {
        setShowSelectionMenu(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (!target.closest(".selection-menu")) {
        setShowSelectionMenu(false);
      }
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  async function handleUpload(selectedFile: File) {
    setUploading(true);
    setUploadProgress(0);
    setUploadPaused(false);
    setUploadComplete(false);
    setFile(selectedFile);
    
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      if (!uploadPaused) {
        progress += Math.random() * 15;
        if (progress >= 90) {
          progress = 90;
        }
        setUploadProgress(progress);
      }
    }, 300);
    
    try {
      await uploadPaper(selectedFile, sessionId);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setUploadProgress(100);
      setUploadComplete(true);
      
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

  async function handleSummarizeSelection() {
    if (!selectedText) return;

    const userMessage: Message = {
      role: "user",
      content: `Summarize this selected text:\n"${selectedText}"`,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setShowSelectionMenu(false);

    try {
      const res = await sendMessage(
        sessionId,
        `Summarize this selected text:\n${selectedText}`
      );

      const assistantMessage: Message = {
        role: "assistant",
        content: res.answer,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      console.error("Failed to summarize selection");
    }

    setLoading(false);
  }

  function handleExportChat() {
    if (messages.length === 0) return;
    const lines: string[] = [`# Scholar AI Chat Export\n`, `**Paper:** ${file?.name ?? "Unknown"}\n`];
    for (const m of messages) {
      lines.push(`\n---\n\n**${m.role === "user" ? "You" : "Scholar AI"}:**\n\n${m.content}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scholar-ai-chat.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleAskSelection() {
    setInput(`Explain this:\n"${selectedText}"`);
    setShowSelectionMenu(false);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 50);
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_#f0f4f8_0%,_#e2e8f0_100%)] dark:bg-[radial-gradient(ellipse_at_center,_#1a1c2c_0%,_#0d0e14_100%)]">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#e6edf3]" />
          <span className="text-sm font-medium text-[#e6edf3] tracking-wide">
            Scholar AI
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-white/5 dark:hover:bg-white/5 hover:bg-black/5 transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-[#7d8590]" />
            ) : (
              <Moon className="h-5 w-5 text-[#7d8590]" />
            )}
          </button>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <LayoutGrid className="h-5 w-5 text-[#7d8590]" />
          </button>
        </div>
      </header>

      {/* Text Selection Floating Menu */}
      {showSelectionMenu && (
        <div
          className="selection-menu fixed z-50 flex gap-2 px-3 py-2 rounded-xl shadow-2xl"
          style={{
            left: selectionPosition.x,
            top: selectionPosition.y,
            transform: "translate(-50%, -100%)",
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            onClick={handleSummarizeSelection}
            className="text-xs text-white/90 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors font-medium"
          >
            ✨ Summarize
          </button>
          <button
            onClick={handleAskSelection}
            className="text-xs text-white/90 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors font-medium"
          >
            💡 Ask
          </button>
        </div>
      )}

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

          <p className="absolute bottom-8 text-center text-[#7d8590] text-xs">
            Scholar AI may contain errors. We recommend checking important information.
          </p>
        </div>
      )}

      {/* Uploading State - Liquid iOS Glass Modal */}
      {uploading && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl" />
          
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
              <div className="absolute inset-0 rounded-[2.5rem] opacity-50" style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.15) 0%, transparent 60%)'
              }} />
              
              <div className="relative w-28 h-28 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="4"
                  />
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
              
              <div className="relative text-center mb-5">
                <p className="text-sm text-white/80 truncate max-w-[200px] mx-auto mb-1">
                  {file?.name}
                </p>
                <p className="text-xs text-white/40">
                  {uploadComplete ? 'Complete' : uploadPaused ? 'Paused' : 'Processing...'}
                </p>
              </div>
              
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

      {/* Document + Chat Split View */}
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
            {/* File indicator */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#58a6ff]/60" />
                <span className="text-xs text-white/50 truncate">{file?.name}</span>
              </div>
              <span className="text-xs text-white/40">
                Page {currentPage} / {numPages}
              </span>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto px-3 pb-3">
              <div className="flex justify-center items-start w-full">
                {file && (
                  <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="rounded-2xl overflow-hidden"
                  >
                    <Page
                      pageNumber={currentPage}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      width={pdfWidth}
                      className="shadow-lg"
                      loading={<div className="text-white/30">Loading PDF...</div>}
                    />
                  </Document>
                )}
              </div>
            </div>

            {/* Page Controls */}
            <div className="flex items-center justify-center gap-4 py-3 px-5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-white/70" />
              </button>

              <span className="text-sm text-white/60 min-w-[80px] text-center">
                {currentPage} of {numPages}
              </span>

              <button
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-white/70" />
              </button>
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
            {/* Chat Header */}
            <div className="flex items-center justify-end px-5 py-3 shrink-0">
              <button
                type="button"
                onClick={handleExportChat}
                disabled={messages.length === 0}
                title="Export chat as Markdown"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </div>

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
                  <p className="text-white/20 text-xs mt-1">
                    ✨ Or select text in the PDF to summarize
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
                    {m.role === "assistant" ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-4 mb-2 text-white/95" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-3 mb-1 text-white/90" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1 text-white/85" {...props} />,
                          p: ({ node, ...props }) => <p className="text-sm leading-relaxed mb-2 text-white/80" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-sm text-white/80" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-sm text-white/80" {...props} />,
                          li: ({ node, ...props }) => <li className="text-sm text-white/80" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                          code: ({ node, ...props }) => <code className="bg-white/10 px-1 py-0.5 rounded font-mono text-xs text-[#79c0ff]" {...props} />,
                          pre: ({ node, ...props }) => <pre className="bg-white/5 p-3 rounded-lg overflow-x-auto my-2 border border-white/10" {...props} />,
                          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[#58a6ff]/50 pl-4 italic my-2 text-white/60" {...props} />,
                          table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table className="border-collapse border border-white/10 text-xs w-full" {...props} /></div>,
                          th: ({ node, ...props }) => <th className="border border-white/10 px-2 py-1 bg-white/5 font-semibold text-left" {...props} />,
                          td: ({ node, ...props }) => <td className="border border-white/10 px-2 py-1 text-white/70" {...props} />,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-sm leading-relaxed">{m.content}</p>
                    )}
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

            {/* Chat Input */}
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