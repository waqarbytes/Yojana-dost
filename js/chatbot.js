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
  
  function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;
  
    addUserMessage(message);
    input.value = '';
    showTypingIndicator();
  
    getBotResponse(message)
      .then(response => addBotMessage(response))
      .catch(() => addBotMessage("Server error. Please try again."))
      .finally(() => hideTypingIndicator());
  }
  
  async function getBotResponse(message) {
    const response = await fetch('https://yojana-dost.onrender.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
  
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return data.response;
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
  
    
    
