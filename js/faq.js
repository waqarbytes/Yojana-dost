// FAQ Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeFAQPage();
});

function initializeFAQPage() {
    loadFAQs();
    setupEventListeners();
    setupSearchFunctionality();
    setupCategoryFilters();
    addAnimationObserver();
}

function loadFAQs() {
    const faqData = [
        {
            category: 'General',
            questions: [
                {
                    question: 'What is Yojana Dost?',
                    answer: 'Yojana Dost is a comprehensive web portal that provides information about 400+ government schemes across India. It helps citizens discover and access various government welfare programs, subsidies, and benefits available at both central and state levels.'
                },
                {
                    question: 'Is Yojana Dost an official government website?',
                    answer: 'Yojana Dost is an information portal that aggregates government scheme data from official sources. While we provide accurate information, we recommend verifying details from official government websites before applying.'
                },
                {
                    question: 'How often is the information updated?',
                    answer: 'We regularly update our database with new schemes and changes to existing ones. However, government policies can change frequently, so we recommend checking official sources for the most current information.'
                },
                {
                    question: 'Is there any cost to use Yojana Dost?',
                    answer: 'No, Yojana Dost is completely free to use. We do not charge any fees for accessing scheme information or using our services.'
                }
            ]
        },
        {
            category: 'Schemes',
            questions: [
                {
                    question: 'How can I find schemes relevant to me?',
                    answer: 'You can use our search function to find schemes by keywords, browse by categories (like Health, Education, Women, etc.), or filter by your state. Our AI chatbot can also help you find relevant schemes based on your specific needs.'
                },
                {
                    question: 'Are both central and state schemes included?',
                    answer: 'Yes, our database includes both central government schemes that are applicable across India and state-specific schemes. You can filter schemes by state to see programs specific to your location.'
                },
                {
                    question: 'How do I know if I\'m eligible for a scheme?',
                    answer: 'Each scheme listing includes detailed eligibility criteria, required documents, and application process. We recommend reading these carefully and consulting official sources for complete eligibility requirements.'
                },
                {
                    question: 'Can I apply for schemes through Yojana Dost?',
                    answer: 'Yojana Dost provides information about schemes and application processes. For actual applications, you will need to visit the official government websites or designated application centers as specified in each scheme.'
                }
            ]
        },
        {
            category: 'Account',
            questions: [
                {
                    question: 'Do I need to create an account to use Yojana Dost?',
                    answer: 'No, you can browse and search schemes without creating an account. However, creating an account allows you to bookmark schemes, track your applications, and receive personalized recommendations.'
                },
                {
                    question: 'How do I create an account?',
                    answer: 'Click on the "Login/Register" button in the top navigation. You can create an account using your email address or phone number. Account creation is free and only takes a few minutes.'
                },
                {
                    question: 'I forgot my password. How can I reset it?',
                    answer: 'On the login page, click "Forgot Password" and enter your registered email address. You will receive a password reset link to create a new password.'
                },
                {
                    question: 'Can I change my account information?',
                    answer: 'Yes, you can update your profile information, contact details, and preferences from your account dashboard. Go to "My Profile" after logging in.'
                }
            ]
        },
        {
            category: 'Technical',
            questions: [
                {
                    question: 'Why is the website loading slowly?',
                    answer: 'Slow loading can be due to internet connectivity or high traffic. Try refreshing the page, clearing your browser cache, or accessing the site during off-peak hours. If the problem persists, contact our support team.'
                },
                {
                    question: 'Which browsers are supported?',
                    answer: 'Yojana Dost works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.'
                },
                {
                    question: 'Is Yojana Dost mobile-friendly?',
                    answer: 'Yes, our website is fully responsive and optimized for mobile devices. You can access all features from your smartphone or tablet.'
                },
                {
                    question: 'How do I report a bug or technical issue?',
                    answer: 'You can report technical issues through our contact form or email our support team. Please provide details about the issue, your browser, and steps to reproduce the problem.'
                }
            ]
        },
        {
            category: 'Support',
            questions: [
                {
                    question: 'How can I contact support?',
                    answer: 'You can reach our support team through the contact form on our website, email us directly, or use the live chat feature. We aim to respond to all inquiries within 24 hours.'
                },
                {
                    question: 'What languages is Yojana Dost available in?',
                    answer: 'Currently, Yojana Dost is available in English and Hindi. We are working on adding support for more regional languages in future updates.'
                },
                {
                    question: 'Can I suggest new features or improvements?',
                    answer: 'Absolutely! We welcome user feedback and suggestions. You can submit your ideas through our contact form or feedback section. Your input helps us improve the platform.'
                },
                {
                    question: 'How do I stay updated with new schemes?',
                    answer: 'You can subscribe to our newsletter, follow us on social media, or enable notifications in your account settings to receive updates about new schemes and important announcements.'
                }
            ]
        }
    ];

    displayFAQs(faqData);
}

function displayFAQs(faqData) {
    const faqContent = document.getElementById('faq-content');
    if (!faqContent) return;

    faqContent.innerHTML = '';

    faqData.forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'faq-category-section';
        categorySection.setAttribute('data-category', category.category.toLowerCase());

        const categoryTitle = document.createElement('h2');
        categoryTitle.className = 'category-title';
        categoryTitle.textContent = category.category;

        const faqItems = document.createElement('div');
        faqItems.className = 'faq-items';

        category.questions.forEach(faq => {
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';

            const faqQuestion = document.createElement('button');
            faqQuestion.className = 'faq-question';
            faqQuestion.setAttribute('aria-expanded', 'false');
            faqQuestion.innerHTML = `
                <span>${faq.question}</span>
                <i class="fas fa-chevron-down"></i>
            `;

            const faqAnswer = document.createElement('div');
            faqAnswer.className = 'faq-answer';
            faqAnswer.innerHTML = `<p>${faq.answer}</p>`;

            faqItem.appendChild(faqQuestion);
            faqItem.appendChild(faqAnswer);
            faqItems.appendChild(faqItem);
        });

        categorySection.appendChild(categoryTitle);
        categorySection.appendChild(faqItems);
        faqContent.appendChild(categorySection);
    });
}

function setupEventListeners() {
    // FAQ item click handlers
    document.addEventListener('click', function(e) {
        if (e.target.closest('.faq-question')) {
            const question = e.target.closest('.faq-question');
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Close all other FAQ items
            document.querySelectorAll('.faq-item.active').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('active');
                    item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current FAQ item
            if (isActive) {
                faqItem.classList.remove('active');
                question.setAttribute('aria-expanded', 'false');
            } else {
                faqItem.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.target.classList.contains('faq-question')) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.target.click();
            }
        }
    });
}

function setupSearchFunctionality() {
    const searchInput = document.getElementById('faq-search');
    const searchButton = document.getElementById('search-btn');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(performSearch, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
}

function performSearch() {
    const searchInput = document.getElementById('faq-search');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    const faqItems = document.querySelectorAll('.faq-item');
    const categories = document.querySelectorAll('.faq-category-section');
    let hasResults = false;

    // Clear previous highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
        el.outerHTML = el.innerHTML;
    });

    categories.forEach(category => {
        let categoryHasResults = false;
        const categoryItems = category.querySelectorAll('.faq-item');

        categoryItems.forEach(item => {
            const question = item.querySelector('.faq-question span');
            const answer = item.querySelector('.faq-answer p');
            
            if (searchTerm === '') {
                // Show all items if search is empty
                item.classList.remove('highlight');
                item.style.display = 'block';
                categoryHasResults = true;
            } else {
                const questionText = question.textContent.toLowerCase();
                const answerText = answer.textContent.toLowerCase();

                if (questionText.includes(searchTerm) || answerText.includes(searchTerm)) {
                    item.classList.add('highlight');
                    item.style.display = 'block';
                    categoryHasResults = true;
                    hasResults = true;

                    // Highlight search terms
                    highlightSearchTerm(question, searchTerm);
                    highlightSearchTerm(answer, searchTerm);
                } else {
                    item.classList.remove('highlight');
                    item.style.display = 'none';
                }
            }
        });

        // Show/hide category based on results
        if (categoryHasResults || searchTerm === '') {
            category.style.display = 'block';
        } else {
            category.style.display = 'none';
        }
    });

    // Show/hide no results message
    showNoResultsMessage(!hasResults && searchTerm !== '');
}

function highlightSearchTerm(element, searchTerm) {
    const text = element.textContent;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const highlightedText = text.replace(regex, '<span class="search-highlight">$1</span>');
    element.innerHTML = highlightedText;
}

function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active filter button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter FAQ categories
            filterByCategory(category);
        });
    });
}

function filterByCategory(category) {
    const categories = document.querySelectorAll('.faq-category-section');
    
    categories.forEach(categorySection => {
        const categoryData = categorySection.getAttribute('data-category');
        
        if (category === 'all' || categoryData === category) {
            categorySection.classList.remove('hidden');
            categorySection.style.display = 'block';
        } else {
            categorySection.classList.add('hidden');
            categorySection.style.display = 'none';
        }
    });

    // Clear search if category filter is applied
    const searchInput = document.getElementById('faq-search');
    if (searchInput && category !== 'all') {
        searchInput.value = '';
    }
}

function showNoResultsMessage(show) {
    let noResultsEl = document.getElementById('no-results');
    
    if (show) {
        if (!noResultsEl) {
            noResultsEl = document.createElement('div');
            noResultsEl.id = 'no-results';
            noResultsEl.className = 'no-results';
            noResultsEl.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>No results found</h3>
                <p>We couldn't find any FAQs matching your search. Try different keywords or browse by category.</p>
            `;
            document.getElementById('faq-content').appendChild(noResultsEl);
        }
        noResultsEl.style.display = 'block';
    } else {
        if (noResultsEl) {
            noResultsEl.style.display = 'none';
        }
    }
}

function addAnimationObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        observer.observe(item);
    });

    // Observe category sections
    document.querySelectorAll('.faq-category-section').forEach(section => {
        observer.observe(section);
    });
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Print functionality
function printFAQs() {
    // Expand all FAQ items for printing
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.add('active');
    });
    
    window.print();
}

// Contact support functions
function openLiveChat() {
    // This would integrate with a live chat service
    console.log('Opening live chat...');
    showNotification('Live chat feature coming soon!', 'info');
}

function openContactForm() {
    window.location.href = 'contact.html';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+F or Cmd+F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('faq-search');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('faq-search');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            performSearch();
        }
    }
});

// Add to global scope for external access
window.faqFunctions = {
    printFAQs,
    openLiveChat,
    openContactForm,
    performSearch,
    filterByCategory
};