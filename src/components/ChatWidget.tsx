"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  sources?: { title: string; url?: string }[];
  timestamp: Date;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "👋 Hello! I'm your Smart Mart assistant. I can help you with:\n\n• Finding products and their locations\n• Store navigation and waypoints\n• Store policies and hours\n• Recipe suggestions\n• 📸 Upload food images for recipe ideas!\n• Any questions about shopping!\n\nHow can I help you today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() && !imagePreview) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      imageUrl: imagePreview || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    const currentImage = imagePreview;
    setInput("");
    setImagePreview(null);
    setLoading(true);

    try {
      // Use /api/assistant if image is present, otherwise /api/chat
      const endpoint = currentImage ? "/api/assistant" : "/api/chat";
      
      let requestBody;
      if (currentImage) {
        // Assistant API format
        requestBody = {
          query: currentInput,
          images: [{ url: currentImage }],
        };
      } else {
        // Chat API format
        requestBody = {
          query: currentInput,
          userType: "customer",
          history: messages.slice(-5),
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer || data.response || "Sorry, I couldn't process that.",
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "❌ Error connecting to assistant. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-br from-[#1A408D] to-[#0f2a6b] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center text-2xl"
        title="Chat Assistant"
        aria-label="Open chat assistant"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A408D] to-[#0f2a6b] text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <div className="font-semibold text-base">Smart Mart Assistant</div>
                <div className="text-xs opacity-90">Powered by RAG + Gemini</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-slate-200 text-xl transition"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50 to-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === "user"
                      ? "bg-[#1A408D] text-white rounded-br-sm"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                  }`}
                >
                  {msg.imageUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                      <Image
                        src={msg.imageUrl}
                        alt="Uploaded"
                        width={200}
                        height={150}
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                      <p className="font-semibold mb-2 text-slate-600">📚 Sources:</p>
                      <div className="space-y-1">
                        {msg.sources.map((src, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <span className="text-slate-400">•</span>
                            {src.url ? (
                              <a
                                href={src.url}
                                className="text-blue-600 hover:underline flex-1"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {src.title}
                              </a>
                            ) : (
                              <span className="text-slate-600 flex-1">{src.title}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs opacity-60 mt-2">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                    <span className="text-sm text-slate-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div className="px-4 py-2 bg-slate-100 border-t flex items-center gap-3">
              <div className="relative">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={50}
                  height={50}
                  className="rounded-lg border-2 border-[#1A408D]"
                />
              </div>
              <div className="flex-1 text-xs text-slate-600">Image attached</div>
              <button
                onClick={() => setImagePreview(null)}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition flex-shrink-0"
                title="Attach image"
                aria-label="Attach image"
              >
                📎
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask anything..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A408D] focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={loading || (!input.trim() && !imagePreview)}
                className="px-4 py-2 bg-[#1A408D] text-white rounded-lg hover:bg-[#0f2a6b] disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium flex-shrink-0"
                aria-label="Send message"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
