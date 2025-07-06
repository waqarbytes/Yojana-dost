// Global JavaScript Functions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize global features
    initializeNavigation();
    initializeChatbot();
    addAnimationObserver();
    initializeBackToTop();
    initializeFooterFunctionality();
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
    
    if (!chatbotPopup || !chatbotToggle) return;
    
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
    if (!messagesContainer) return;
    
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
    if (!messagesContainer) return;
    
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

if (!document.getElementById('error-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'error-styles';
    styleSheet.textContent = errorStyles;
    document.head.appendChild(styleSheet);
}

// Global Search Functionality
function toggleGlobalSearch() {
    // Create search modal if it doesn't exist
    if (!document.getElementById('globalSearchModal')) {
        createGlobalSearchModal();
    }
    
    const modal = document.getElementById('globalSearchModal');
    modal.classList.toggle('active');
    
    if (modal.classList.contains('active')) {
        document.getElementById('globalSearchInput').focus();
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function createGlobalSearchModal() {
    const modalHTML = `
        <div id="globalSearchModal" class="global-search-modal">
            <div class="search-modal-content">
                <div class="search-modal-header">
                    <h3>Search Government Schemes</h3>
                    <button onclick="toggleGlobalSearch()" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="search-input-container">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" id="globalSearchInput" placeholder="Search by scheme name, category, benefits..." onkeyup="performGlobalSearch()" />
                </div>
                <div id="globalSearchResults" class="search-results">
                    <div class="search-placeholder">
                        <i class="fas fa-search"></i>
                        <p>Start typing to search through 200+ government schemes</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add modal styles
    const styles = `
        .global-search-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .global-search-modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .search-modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .search-modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .search-modal-header h3 {
            margin: 0;
            color: #1f2937;
        }
        
        .search-input-container {
            position: relative;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .search-input-container .search-icon {
            position: absolute;
            left: 2.5rem;
            top: 50%;
            transform: translateY(-50%);
            color: #6b7280;
        }
        
        .search-input-container input {
            width: 100%;
            padding: 1rem 1rem 1rem 3rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            outline: none;
            transition: border-color 0.3s ease;
        }
        
        .search-input-container input:focus {
            border-color: #74b9ff;
        }
        
        .search-results {
            max-height: 400px;
            overflow-y: auto;
            padding: 1rem;
        }
        
        .search-placeholder {
            text-align: center;
            padding: 3rem 1rem;
            color: #6b7280;
        }
        
        .search-placeholder i {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.5;
        }
        
        .search-result-item {
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .search-result-item:hover {
            background: #f8fafc;
            border-color: #74b9ff;
        }
        
        .search-result-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        
        .search-result-category {
            display: inline-block;
            background: #74b9ff;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            margin-right: 0.5rem;
        }
        
        .search-result-description {
            color: #6b7280;
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

async function performGlobalSearch() {
    const query = document.getElementById('globalSearchInput').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('globalSearchResults');
    
    if (query.length < 2) {
        resultsContainer.innerHTML = `
            <div class="search-placeholder">
                <i class="fas fa-search"></i>
                <p>Start typing to search through 200+ government schemes</p>
            </div>
        `;
        return;
    }
    
    try {
        const response = await fetch('/data/schemes.json');
        const schemes = await response.json();
        
        const filteredSchemes = schemes.filter(scheme => 
            scheme.title.toLowerCase().includes(query) ||
            scheme.description.toLowerCase().includes(query) ||
            scheme.category.toLowerCase().includes(query) ||
            scheme.benefits.toLowerCase().includes(query) ||
            scheme.eligibility.toLowerCase().includes(query)
        );
        
        if (filteredSchemes.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-placeholder">
                    <i class="fas fa-search"></i>
                    <p>No schemes found for "${query}"</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Try different keywords or browse by categories</p>
                </div>
            `;
            return;
        }
        
        const resultsHTML = filteredSchemes.slice(0, 10).map(scheme => `
            <div class="search-result-item" onclick="openSchemeFromSearch('${scheme.id}')">
                <div class="search-result-title">${scheme.title}</div>
                <div>
                    <span class="search-result-category">${scheme.category}</span>
                    <span class="search-result-category">${scheme.type}</span>
                </div>
                <div class="search-result-description">${scheme.description}</div>
            </div>
        `).join('');
        
        resultsContainer.innerHTML = resultsHTML;
        
    } catch (error) {
        console.error('Error performing global search:', error);
        resultsContainer.innerHTML = `
            <div class="search-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading search results</p>
            </div>
        `;
    }
}

function openSchemeFromSearch(schemeId) {
    toggleGlobalSearch();
    window.location.href = `schemes.html?search=${encodeURIComponent(schemeId)}`;
}

// Back to Top Functionality
function initializeBackToTop() {
    // Create back to top button if it doesn't exist
    if (!document.querySelector('.back-to-top')) {
        const backToTopBtn = document.createElement('button');
        backToTopBtn.className = 'back-to-top';
        backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        backToTopBtn.setAttribute('aria-label', 'Back to top');
        document.body.appendChild(backToTopBtn);
        
        backToTopBtn.addEventListener('click', scrollToTop);
    }
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        const backToTopBtn = document.querySelector('.back-to-top');
        if (backToTopBtn && window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else if (backToTopBtn) {
            backToTopBtn.classList.remove('show');
        }
    });
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Footer Functionality
function initializeFooterFunctionality() {
    // Newsletter subscription
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input').value;
            if (email) {
                showNotification('Thank you for subscribing to our newsletter!', 'success');
                this.querySelector('input').value = '';
            }
        });
    }
    
    // Social media links analytics
    document.querySelectorAll('.social-links a').forEach(link => {
        link.addEventListener('click', function() {
            const platform = this.getAttribute('aria-label') || 'social';
            console.log(`Social media click: ${platform}`);
        });
    });
}

// Add to global scope for external access
window.validateForm = validateForm;
window.showNotification = showNotification;
window.getUrlParameter = getUrlParameter;
window.scrollToTop = scrollToTop;
