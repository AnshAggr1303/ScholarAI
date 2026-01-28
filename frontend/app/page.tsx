/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { uploadPaper, sendMessage } from "../services/api";
import { Message } from "../types/chat";

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Generate session ID once
  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      await uploadPaper(file, sessionId);
      alert("Paper uploaded successfully");
    } catch (err) {
      alert("Upload failed");
    }
    setLoading(false);
  }

  async function handleSend() {
    if (!input) return;

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
      alert("Chat failed");
    }

    setLoading(false);
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h1>📘 ScholarAI</h1>

      <section>
        <h3>Upload Research Paper</h3>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={handleUpload} disabled={loading}>
          Upload
        </button>
      </section>

      <hr />

      <section>
        <h3>Chat</h3>
        <div
          style={{
            border: "1px solid #ccc",
            padding: "1rem",
            minHeight: "300px",
          }}
        >
          {messages.map((m, i) => (
            <p key={i}>
              <b>{m.role === "user" ? "You" : "ScholarAI"}:</b>{" "}
              {m.content}
            </p>
          ))}
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something about the paper..."
          style={{ width: "100%", marginTop: "1rem" }}
        />
        <button onClick={handleSend} disabled={loading}>
          Send
        </button>
      </section>
    </main>
  );
}