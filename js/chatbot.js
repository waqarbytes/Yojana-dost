// chatbot_final.js — With API integration + category pagination + timestamps

const CATEGORY_ALIASES = {
    "Women": "Women & Child",
    "Business": "Business & Employment",
    "Employment": "Business & Employment",
    "Pension": "Social Welfare",
    "Rural": "Rural Development",
    "Technology": "Technology & Digital",
    "Scholarships": "Education",
    "education scholarships": "Education",
    "student scholarship": "Education",
    "scholarship": "Education",
    "farmer": "Agriculture",
    "farmers": "Agriculture",
    "kisan": "Agriculture",
    "krishi": "Agriculture",
    "crop insurance": "Agriculture"
  };
  
  document.addEventListener('DOMContentLoaded', function () {
    console.log("Chatbot ready");
    document.querySelector('.send-btn').addEventListener('click', sendMessage);
    document.querySelector('#messageInput').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') sendMessage();
    });
    document.querySelectorAll('.quick-action-item').forEach(button => {
      button.addEventListener('click', () => {
        const query = button.getAttribute('data-query');
        document.getElementById('messageInput').value = query;
        sendMessage();
      });
    });
    showWelcomeMessage();
  });
  
  async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;
  
    addUserMessage(message);
    input.value = '';
    showTypingIndicator();
  
    // Create streaming bot message element
    const botMsgContainer = createStreamingBotMessage();
    const textElement = botMsgContainer.querySelector('.message-text');
    const chipsContainer = botMsgContainer.querySelector('.citation-chips-container');
    
    hideTypingIndicator();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, stream: true })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);
              if (event.type === 'token' && event.token) {
                fullText += event.token;
                textElement.innerHTML = formatMarkdownText(fullText);
                scrollToBottom();
              } else if (event.type === 'citations' && Array.isArray(event.citations)) {
                renderCitationChips(chipsContainer, event.citations);
                scrollToBottom();
              } else if (event.type === 'error') {
                textElement.innerHTML += `<br><span style="color: #ef4444;">Error: ${event.error}</span>`;
              }
            } catch (parseErr) {
              console.error("Failed to parse SSE JSON", parseErr);
            }
          }
        }
      }
    } catch (err) {
      console.warn("SSE stream failed, attempting fallback query", err);
      try {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ message, stream: false })
        });
        const data = await fallbackRes.json();
        textElement.innerHTML = formatMarkdownText(data.answer || "Server error. Please try again.");
        if (data.citations) {
          renderCitationChips(chipsContainer, data.citations);
        }
      } catch (fallbackErr) {
        textElement.innerHTML = "Unable to connect to scheme intelligence server. Please try again.";
      }
    } finally {
      hideTypingIndicator();
    }
  }

  function createStreamingBotMessage() {
    const messages = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = 'message bot-message';
    msg.innerHTML = `
      <div class="message-text"></div>
      <div class="citation-chips-container" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;"></div>
      <div class="message-time">${getCurrentTime()}</div>
    `;
    messages.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function renderCitationChips(container, citations) {
    if (!citations || citations.length === 0) return;
    container.innerHTML = '';
    
    citations.forEach(c => {
      const chip = document.createElement('a');
      chip.href = c.official_url;
      chip.target = '_blank';
      chip.rel = 'noopener noreferrer';
      chip.className = 'citation-chip';
      chip.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #0284c7;
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 12px;
        text-decoration: none;
        transition: all 0.2s ease;
      `;
      chip.title = `Verified Source: ${c.scheme_name} (${c.section})`;
      chip.innerHTML = `<span>🏛️ ${c.scheme_name}</span> <span style="font-size: 10px;">↗</span>`;
      container.appendChild(chip);
    });
  }

  function formatMarkdownText(text) {
    // Simple markdown formatting for bold, bullets, linebreaks, and citations
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([a-zA-Z0-9_\-]+)\]/g, '<span style="color: #0284c7; font-weight: 600; font-size: 0.9em; background: #e0f2fe; padding: 1px 5px; border-radius: 4px;">[$1]</span>')
      .replace(/\n/g, '<br>');
    return formatted;
  }

  function scrollToBottom() {
    const messages = document.getElementById('chatMessages');
    if (messages) messages.scrollTop = messages.scrollHeight;
  }

  
  function addUserMessage(text) {
    const messages = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = 'message user-message';
    msg.innerHTML = `
      <div class="message-text">${text}</div>
      <div class="message-time">${getCurrentTime()}</div>
    `;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }
  
  function addBotMessage(text) {
    const messages = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = 'message bot-message';
    msg.innerHTML = `
      <div class="message-text">${text}</div>
      <div class="message-time">${getCurrentTime()}</div>
    `;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }
  
  function showTypingIndicator() {
    const messages = document.getElementById('chatMessages');
    const typing = document.createElement('div');
    typing.id = 'typing-indicator';
    typing.className = 'message bot-message typing';
    typing.innerHTML = `<div class="typing-dots"><span>.</span><span>.</span><span>.</span></div>`;
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
  }
  
  function hideTypingIndicator() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
  }
  
  function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function showWelcomeMessage() {
    addBotMessage(`
      <strong>Welcome to Yojana Dost!</strong><br><br>
      I can help you explore 400+ government schemes.<br>
      Try asking about:<br>
      • Education scholarships<br>
      • Women welfare<br>
      • Business loans<br>
      • Farmer Schemes<br>
      • Health Schemes<br><br>
      Or click a quick action below.
    `);
  }
  
  function clearChat() {
    const chatBox = document.getElementById('chatMessages');
    chatBox.style.transition = 'opacity 0.2s ease';
    chatBox.style.opacity = 0;
  
    setTimeout(() => {
      chatBox.innerHTML = '';
      showWelcomeMessage();
      chatBox.style.opacity = 1;
    }, 200);
  }

  // downloadbutton
  function exportChat() {
    const messages = document.querySelectorAll('#chatMessages .message');
    let chatContent = '💬 Chat Transcript - Yojana Dost\n\n';
  
    messages.forEach(msg => {
      const isUser = msg.classList.contains('user-message');
      const role = isUser ? '👤 You' : '🤖 Assistant';
      const text = msg.querySelector('.message-text')?.innerText || '';
      const time = msg.querySelector('.message-time')?.innerText || '';
      chatContent += `[${time}] ${role}: ${text}\n\n`;
    });
  
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.href = url;
    a.download = 'YojanaDost_Chat.txt';
    a.click();
  
    URL.revokeObjectURL(url);
  }

// Minimize
  
    
    