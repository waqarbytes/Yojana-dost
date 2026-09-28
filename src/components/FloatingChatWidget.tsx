import React, { useState } from "react";
import { YojanaChat } from "./Chat/YojanaChat.js";

export interface FloatingChatWidgetProps {
  onOpenFullChat: () => void;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({ onOpenFullChat }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="yd-floating-chat-root">
      {/* Floating Drawer */}
      {isOpen && (
        <div className="yd-floating-chat-drawer">
          <div className="floating-drawer-header">
            <div className="drawer-title-group">
              <span className="drawer-icon">🤖</span>
              <div>
                <strong>Yojana Dost AI Assistant</strong>
                <span className="drawer-subtitle">Verified Citations &bull; RAG 2.0</span>
              </div>
            </div>
            <div className="drawer-actions">
              <button
                className="drawer-action-btn"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullChat();
                }}
                title="Expand to Full Page Chat"
              >
                ⤢ Fullscreen
              </button>
              <button
                className="drawer-action-btn"
                onClick={() => setIsOpen(false)}
                title="Close AI Assistant"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="floating-drawer-body">
            <YojanaChat />
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        className={`yd-fab-btn ${isOpen ? "fab-active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open Yojana Dost AI Assistant"
        title="Ask Yojana Dost AI Assistant"
      >
        <span className="fab-icon">{isOpen ? "✕" : "💬"}</span>
        {!isOpen && <span className="fab-text">Ask Yojana AI</span>}
        <span className="fab-ping"></span>
      </button>
    </div>
  );
};
