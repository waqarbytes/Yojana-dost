// Global JavaScript Functions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize global features
    initializeNavigation();
    initializeChatbot();
    addAnimationObserver();
});

// Navigation Functions
function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Add scroll effect to navbar
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// Chatbot Functions
let chatbotData = [];
let isChatbotOpen = false;

async function initializeChatbot() {
    try {
        const response = await fetch('data/schemes.json');
        chatbotData = await response.json();
        console.log('Chatbot data loaded:', chatbotData.length, 'schemes');
    } catch (error) {
        console.error('Failed to load chatbot data:', error);
    }
}

function toggleChatbot() {
    const chatbotPopup = document.getElementById('chatbot-popup');
    const chatbotToggle = document.querySelector('.chatbot-toggle');
    
    if (isChatbotOpen) {
        chatbotPopup.classList.remove('active');
        chatbotToggle.innerHTML = '<i class="fas fa-comments"></i>';
        isChatbotOpen = false;
    } else {
        chatbotPopup.classList.add('active');
        chatbotToggle.innerHTML = '<i class="fas fa-times"></i>';
        isChatbotOpen = true;
        
        // Focus on input
        const input = document.getElementById('chatbot-input');
        if (input) {
            input.focus();
        }
    }
}

function sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (message) {
        addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Process message and respond
        setTimeout(() => {
            const response = processChatbotMessage(message);
            hideTypingIndicator();
            addMessage(response, 'bot');
        }, 1000);
    }
}

function addMessage(message, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${message}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="loading"></div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function processChatbotMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! I'm here to help you with information about government schemes. Ask me about any scheme, benefit, or eligibility criteria.";
    }
    
    // Check for thanks
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        return "You're welcome! Feel free to ask if you need more information about any government schemes.";
    }
    
    // Search for schemes
    const matchedSchemes = searchSchemes(lowerMessage);
    
    if (matchedSchemes.length > 0) {
        const scheme = matchedSchemes[0];
        return `📋 <strong>${scheme.title}</strong><br><br>${scheme.description}<br><br>💡 <em>Keywords: ${scheme.keywords.join(', ')}</em>`;
    }
    
    // No match found
    return "❓ Sorry, I couldn't find that information. Please try rephrasing your question or ask about specific schemes like 'PM-KISAN', 'PMAY', or 'Ayushman Bharat'.";
}

function searchSchemes(query) {
    if (!chatbotData.length) return [];
    
    const results = [];
    
    // Exact match search
    for (const scheme of chatbotData) {
        if (scheme.title.toLowerCase().includes(query) || 
            scheme.description.toLowerCase().includes(query)) {
            results.push(scheme);
        }
    }
    
    // Keyword search if no exact match
    if (results.length === 0) {
        for (const scheme of chatbotData) {
            for (const keyword of scheme.keywords) {
                if (keyword.toLowerCase().includes(query) || 
                    query.includes(keyword.toLowerCase())) {
                    results.push(scheme);
                    break;
                }
            }
        }
    }
    
    return results;
}

// Add Enter key support for chatbot
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.id === 'chatbot-input') {
        sendMessage();
    }
});

// Animation Observer
function addAnimationObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    });
    
    // Observe all cards and sections
    const animatedElements = document.querySelectorAll('.card, .service-card, .category-card, .stat-card');
    animatedElements.forEach(el => observer.observe(el));
}

// Utility Functions
function performQuickSearch() {
    const searchInput = document.getElementById('quickSearch');
    const query = searchInput.value.trim();
    
    if (query) {
        // Redirect to schemes page with search query
        window.location.href = `schemes.html?search=${encodeURIComponent(query)}`;
    }
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Smooth scrolling for anchor links
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Form validation helper
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

// Add error styles
const errorStyles = `
    .error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = errorStyles;
document.head.appendChild(styleSheet);
