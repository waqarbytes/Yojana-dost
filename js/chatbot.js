// Chatbot Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeChatbotPage();
});

function initializeChatbotPage() {
    setupChatInterface();
    loadChatbotData();
    addSampleQuestions();
    setupEventListeners();
}

function setupChatInterface() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;

    // Add welcome message
    addChatMessage('Hello! I\'m your Yojana Dost AI assistant. I can help you find government schemes that match your needs. What would you like to know?', 'bot');
}

function loadChatbotData() {
    // Load schemes data for chatbot responses
    fetch('/data/schemes.json')
        .then(response => response.json())
        .then(data => {
            window.chatbotSchemes = data;
            console.log('Chatbot schemes loaded:', data.length, 'schemes');
        })
        .catch(error => {
            console.error('Error loading chatbot data:', error);
            window.chatbotSchemes = [];
        });
}

function addSampleQuestions() {
    const sampleQuestions = [
        "What schemes are available for farmers?",
        "Show me education schemes",
        "What benefits can women get?",
        "Are there any health schemes?",
        "What schemes are available in my state?",
        "Show me business loan schemes"
    ];

    const suggestionsContainer = document.getElementById('suggestions');
    if (suggestionsContainer) {
        sampleQuestions.forEach(question => {
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion-item';
            suggestion.textContent = question;
            suggestion.onclick = () => {
                document.getElementById('user-input').value = question;
                sendChatMessage();
            };
            suggestionsContainer.appendChild(suggestion);
        });
    }
}

function setupEventListeners() {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }

    if (sendButton) {
        sendButton.addEventListener('click', sendChatMessage);
    }
}

function sendChatMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    
    if (!message) return;

    // Add user message
    addChatMessage(message, 'user');
    
    // Clear input
    userInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Process message and respond
    setTimeout(() => {
        const response = processUserMessage(message);
        hideTypingIndicator();
        addChatMessage(response, 'bot');
    }, 1000);
}

function addChatMessage(message, sender) {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = message;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(timestamp);
    chatContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingIndicator() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="typing-animation">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <span>AI is typing...</span>
    `;
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function processUserMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for scheme categories
    if (lowerMessage.includes('farmer') || lowerMessage.includes('agriculture')) {
        return findSchemesByCategory('Agriculture');
    } else if (lowerMessage.includes('education') || lowerMessage.includes('student')) {
        return findSchemesByCategory('Education');
    } else if (lowerMessage.includes('women') || lowerMessage.includes('female')) {
        return findSchemesByCategory('Women');
    } else if (lowerMessage.includes('health') || lowerMessage.includes('medical')) {
        return findSchemesByCategory('Health');
    } else if (lowerMessage.includes('business') || lowerMessage.includes('loan')) {
        return findSchemesByCategory('Business');
    } else if (lowerMessage.includes('pension') || lowerMessage.includes('elderly')) {
        return findSchemesByCategory('Pension');
    } else if (lowerMessage.includes('housing') || lowerMessage.includes('home')) {
        return findSchemesByCategory('Housing');
    } else if (lowerMessage.includes('employment') || lowerMessage.includes('job')) {
        return findSchemesByCategory('Employment');
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hello! I'm here to help you find government schemes. You can ask me about schemes for farmers, education, women, health, business, housing, or any other category you're interested in.";
    } else if (lowerMessage.includes('help')) {
        return "I can help you find government schemes based on your needs. Try asking about:<br>• Schemes for farmers<br>• Education benefits<br>• Women empowerment programs<br>• Health schemes<br>• Business loans<br>• Housing schemes<br>• Employment programs<br><br>What would you like to know more about?";
    } else {
        return performGeneralSearch(message);
    }
}

function findSchemesByCategory(category) {
    if (!window.chatbotSchemes || window.chatbotSchemes.length === 0) {
        return "I'm still loading scheme data. Please try again in a moment.";
    }

    const schemes = window.chatbotSchemes.filter(scheme => 
        scheme.category && scheme.category.toLowerCase() === category.toLowerCase()
    );

    if (schemes.length === 0) {
        return `I couldn't find specific schemes for ${category}. However, I can help you search for other categories. Try asking about farmers, education, women, health, business, housing, or employment schemes.`;
    }

    let response = `I found ${schemes.length} schemes for ${category}:<br><br>`;
    schemes.slice(0, 5).forEach((scheme, index) => {
        response += `<strong>${index + 1}. ${scheme.name}</strong><br>`;
        response += `${scheme.description}<br>`;
        response += `<em>Level: ${scheme.level}</em><br><br>`;
    });

    if (schemes.length > 5) {
        response += `<br>And ${schemes.length - 5} more schemes available. <a href="/schemes.html?category=${category}">View all ${category} schemes</a>`;
    }

    return response;
}

function performGeneralSearch(query) {
    if (!window.chatbotSchemes || window.chatbotSchemes.length === 0) {
        return "I'm still loading scheme data. Please try again in a moment.";
    }

    const searchResults = window.chatbotSchemes.filter(scheme => 
        scheme.name.toLowerCase().includes(query.toLowerCase()) ||
        scheme.description.toLowerCase().includes(query.toLowerCase()) ||
        (scheme.keywords && scheme.keywords.some(keyword => 
            keyword.toLowerCase().includes(query.toLowerCase())
        ))
    );

    if (searchResults.length === 0) {
        return `I couldn't find schemes matching "${query}". Try asking about specific categories like farmers, education, women, health, business, housing, or employment schemes.`;
    }

    let response = `I found ${searchResults.length} schemes matching "${query}":<br><br>`;
    searchResults.slice(0, 3).forEach((scheme, index) => {
        response += `<strong>${index + 1}. ${scheme.name}</strong><br>`;
        response += `${scheme.description}<br>`;
        response += `<em>Category: ${scheme.category} | Level: ${scheme.level}</em><br><br>`;
    });

    if (searchResults.length > 3) {
        response += `<br>And ${searchResults.length - 3} more schemes available. <a href="/schemes.html?search=${encodeURIComponent(query)}">View all search results</a>`;
    }

    return response;
}

// Export functions for global access
window.chatbotFunctions = {
    sendChatMessage,
    addChatMessage,
    processUserMessage
};