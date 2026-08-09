"use client";

import React, { useState } from "react";
import { X, Sparkles, Send, Receipt, ShieldAlert, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

interface VaultlyAiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VaultlyAiChatDrawer({ isOpen, onClose }: VaultlyAiChatDrawerProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<
    Array<{
      sender: "user" | "ai";
      text: string;
      purchases?: any[];
    }>
  >([
    {
      sender: "ai",
      text: "Hello! I'm your Vaultly AI assistant. Ask me anything about your purchases, warranty expirations, return eligibility, or spending totals.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || query;
    if (!q.trim() || loading) return;

    const userMsg = { sender: "user" as const, text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.answer,
            purchases: data.matchedPurchases,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.error || "Sorry, I couldn't search your vault right now.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Network issue. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Which warranties expire this month?",
    "How much did I spend on electronics?",
    "Find my Samsung TV receipt",
    "What can I still return?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-[#faf9f6] h-full shadow-2xl border-l border-[#e5e5e1] flex flex-col justify-between">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#e5e5e1] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#4f46e5]/10 text-[#3525cd] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[#1a1c1a] text-base">Vaultly AI</h3>
              <p className="text-xs text-[#777587]">Contextual Vault Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#efeeeb] text-[#464555] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#3525cd] text-white rounded-br-none shadow-sm"
                    : "bg-white border border-[#e5e5e1] text-[#1a1c1a] rounded-bl-none shadow-card"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
              </div>

              {/* Render matched purchases cards if any */}
              {m.purchases && m.purchases.length > 0 && (
                <div className="mt-3 w-full space-y-2">
                  <span className="text-[11px] font-semibold text-[#777587] uppercase tracking-wider block">
                    Vault Matches:
                  </span>
                  {m.purchases.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white rounded-xl border border-[#e5e5e1] shadow-xs flex items-center justify-between text-xs hover:border-[#3525cd] transition-colors"
                    >
                      <div>
                        <p className="font-bold text-[#1a1c1a]">{p.items?.[0] || p.storeName}</p>
                        <p className="text-[11px] text-[#5f5e5e]">
                          {p.storeName} • {p.currency} {p.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <Link
                        href={`/vault?id=${p.id}`}
                        onClick={onClose}
                        className="flex items-center gap-1 text-[#3525cd] font-semibold hover:underline"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-[#e5e5e1] max-w-[60%]">
              <Sparkles className="w-4 h-4 text-[#3525cd] animate-spin" />
              <span className="text-xs text-[#5f5e5e]">Analyzing your vault records...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts & Input Bar */}
        <div className="p-4 border-t border-[#e5e5e1] bg-white space-y-3">
          {messages.length < 3 && (
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full bg-[#f4f3f1] hover:bg-[#e2dfff] text-[#3525cd] border border-[#e5e5e1] transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#faf9f6] border border-[#c7c4d8] rounded-xl p-2 focus-within:border-[#3525cd] transition-colors">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Vaultly AI..."
              className="flex-1 bg-transparent px-2 text-sm text-[#1a1c1a] focus:outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!query.trim() || loading}
              className="w-8 h-8 rounded-lg bg-[#3525cd] text-white flex items-center justify-center hover:bg-[#4f46e5] disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
