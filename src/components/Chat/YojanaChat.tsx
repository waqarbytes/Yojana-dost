/**
 * React Component: YojanaChat
 * Production-ready streaming chat UI with SSE Reader, citation chips, telemetry badges, and error boundaries.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface CitationItem {
  scheme_id: string;
  scheme_name: string;
  section: string;
  official_url: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  citations?: CitationItem[];
  timestamp: string;
  isStreaming?: boolean;
  latencyMs?: number;
  costUsd?: number;
  tokensUsed?: number;
  isCached?: boolean;
}

export interface YojanaChatProps {
  apiEndpoint?: string;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export const YojanaChat: React.FC<YojanaChatProps> = ({
  apiEndpoint = "/api/chat",
  initialQuery,
  onClearInitialQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "🙏 **Namaste! Welcome to Yojana Dost AI.**\n\nI am your verified assistant for 120+ Indian Government Welfare Schemes. Ask me about eligibility rules, financial subsidies, pensions, healthcare, or application steps. Every claim is strictly grounded with official citations.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendQuery = useCallback(async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const botMsgId = `bot-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append user query and empty bot placeholder
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", text: trimmed, timestamp: timeStr },
      { id: botMsgId, sender: "bot", text: "", timestamp: timeStr, isStreaming: true },
    ]);

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, stream: true }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment before sending more requests.");
        }
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) throw new Error("No response stream body available");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedText = "";
      let accumulatedCitations: CitationItem[] = [];
      let latencyMs: number | undefined;
      let costUsd: number | undefined;
      let tokensUsed: number | undefined;
      let isCached = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawJson = line.slice(6).trim();
            if (!rawJson) continue;

            try {
              const event = JSON.parse(rawJson);
              if (event.type === "token" && event.token) {
                accumulatedText += event.token;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId ? { ...msg, text: accumulatedText } : msg
                  )
                );
              } else if (event.type === "citations" && Array.isArray(event.citations)) {
                accumulatedCitations = event.citations;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId ? { ...msg, citations: accumulatedCitations } : msg
                  )
                );
              } else if (event.type === "metrics" && event.metrics) {
                latencyMs = event.metrics.latency?.total_ms;
                costUsd = event.metrics.estimated_cost_usd;
                tokensUsed = event.metrics.usage?.total_tokens;
                isCached = latencyMs !== undefined && latencyMs <= 5;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId
                      ? {
                          ...msg,
                          latencyMs,
                          costUsd,
                          tokensUsed,
                          isCached,
                        }
                      : msg
                  )
                );
              } else if (event.type === "error") {
                accumulatedText += `\n\n⚠️ Error: ${event.error}`;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMsgId ? { ...msg, text: accumulatedText } : msg
                  )
                );
              }
            } catch {
              // ignore parse fragments
            }
          }
        }
      }

      // Mark streaming complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? {
                ...msg,
                text: `⚠️ **Request Failed**: ${errorMsg}`,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, isLoading]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      void sendQuery(initialQuery);
      onClearInitialQuery?.();
    }
  }, [initialQuery, sendQuery, onClearInitialQuery]);

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: "🙏 **Chat Cleared.** Ask me any question about Indian Government Schemes.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const quickPrompts = [
    "What financial benefit does PM-KISAN provide to farmers?",
    "What are the loan categories under PM Mudra Yojana?",
    "What is the annual health cover amount under PM-JAY?",
    "Who is eligible for Sukanya Samriddhi Yojana?",
  ];

  return (
    <div className="yd-chat-component">
      <div className="yd-chat-header">
        <div className="yd-chat-header-info">
          <div className="yd-chat-avatar">🤖</div>
          <div>
            <h3>Yojana Dost AI Assistant</h3>
            <div className="yd-chat-subtext">
              <span className="online-indicator"></span> Grounded RAG &bull; 120+ Schemes
            </div>
          </div>
        </div>

        <div className="yd-chat-actions">
          <button className="yd-chat-action-btn" onClick={handleClear} title="Clear Conversation">
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Messages Viewport */}
      <div className="yd-chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`yd-message-row ${msg.sender === "user" ? "user-row" : "bot-row"}`}>
            {msg.sender === "bot" && <div className="yd-bot-icon">🇮🇳</div>}

            <div className={`yd-message-bubble ${msg.sender === "user" ? "user-bubble" : "bot-bubble"}`}>
              <div className="yd-message-content">
                {msg.text.split("\n\n").map((para, pIdx) => (
                  <p key={pIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(para) }} />
                ))}
              </div>

              {/* Citations Container */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="yd-citations-block">
                  <div className="citations-header">📚 Verified Scheme Sources:</div>
                  <div className="citations-chips-wrap">
                    {msg.citations.map((c, cIdx) => (
                      <a
                        key={cIdx}
                        href={c.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="yd-citation-chip"
                        title={`Open official portal for ${c.scheme_name}`}
                      >
                        <span className="chip-code">[{c.scheme_id}]</span>
                        <span className="chip-name">{c.scheme_name}</span>
                        <span className="chip-external">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Telemetry Footer */}
              <div className="yd-message-footer">
                <span className="message-time">{msg.timestamp}</span>

                {msg.latencyMs !== undefined && (
                  <span className={`telemetry-badge ${msg.isCached ? "cached" : ""}`}>
                    ⚡ {msg.latencyMs}ms {msg.isCached ? "(Cache Hit)" : ""}
                  </span>
                )}

                {msg.costUsd !== undefined && (
                  <span className="cost-badge">
                    💰 {msg.costUsd === 0 ? "Free ($0.00)" : `$${msg.costUsd.toFixed(5)}`}
                  </span>
                )}

                {msg.sender === "bot" && (
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy(msg.id, msg.text)}
                    title="Copy response"
                  >
                    {copiedId === msg.id ? "✓ Copied" : "📋 Copy"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="yd-suggested-prompts">
        <span className="suggested-label">Try Asking:</span>
        {quickPrompts.map((q, idx) => (
          <button key={idx} className="yd-prompt-pill" onClick={() => void sendQuery(q)}>
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        className="yd-chat-input-area"
        onSubmit={(e) => {
          e.preventDefault();
          void sendQuery(input);
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="yd-chat-input"
          placeholder="Ask any scheme question (e.g. 'PM-KISAN eligibility')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="yd-chat-send-btn" disabled={isLoading || !input.trim()}>
          {isLoading ? "⏳ Generating..." : "Send ➔"}
        </button>
      </form>
    </div>
  );
};

function formatInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([a-zA-Z0-9_\-]+)\]/g, '<span class="inline-citation-marker">[$1]</span>');
}
