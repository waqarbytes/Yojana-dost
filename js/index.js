// Index Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeHomePage();
    initializeHeroAnimations();
    initializeCounters();
});

function initializeHomePage() {
    // Add any page-specific initialization
    console.log('Home page initialized');
    
    // Initialize search functionality
    const searchInput = document.getElementById('quickSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performQuickSearch();
            }
        });
    }
}

function initializeHeroAnimations() {
    // Animate hero elements on load
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroButtons = document.querySelector('.hero-buttons');
    const floatingCards = document.querySelectorAll('.floating-cards .card');
    
    if (heroTitle) {
        setTimeout(() => {
            heroTitle.style.animation = 'fadeIn 1s ease-out forwards';
        }, 300);
    }
    
    if (heroSubtitle) {
        setTimeout(() => {
            heroSubtitle.style.animation = 'fadeIn 1s ease-out forwards';
        }, 600);
    }
    
    if (heroButtons) {
        setTimeout(() => {
            heroButtons.style.animation = 'fadeIn 1s ease-out forwards';
        }, 900);
    }
    
    // Animate floating cards
    floatingCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.animation = `fadeIn 0.8s ease-out forwards, float 3s ease-in-out infinite ${index * 0.5}s`;
        }, 1200 + (index * 200));
    });
}

function initializeCounters() {
    // Animate counters when they come into view
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(counter) {
    const target = counter.textContent;
    const isNumber = /^\d+$/.test(target);
    
    if (isNumber) {
        const finalValue = parseInt(target);
        let currentValue = 0;
        const increment = finalValue / 50;
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                counter.textContent = finalValue;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(currentValue);
            }
        }, 50);
    } else {
        // For non-numeric values like "24/7", just animate opacity
        counter.style.opacity = '0';
        setTimeout(() => {
            counter.style.opacity = '1';
            counter.style.transition = 'opacity 0.5s ease-in-out';
        }, 100);
    }
}

// Service card interactions
document.addEventListener('click', function(e) {
    if (e.target.closest('.service-card')) {
        const card = e.target.closest('.service-card');
        
        // Add click animation
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
    }
});

// Category card interactions
document.addEventListener('click', function(e) {
    if (e.target.closest('.category-card')) {
        const card = e.target.closest('.category-card');
        
        // Add click animation
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
    }
});

// Parallax effect for hero background
window.addEventListener('scroll', function() {
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        heroBackground.style.transform = `translateY(${rate}px)`;
    }
});

// Add hover effects for floating cards
document.addEventListener('mouseenter', function(e) {
    if (e.target.classList.contains('card') && e.target.closest('.floating-cards')) {
        e.target.style.transform = 'translateY(-15px) scale(1.1)';
    }
}, true);

document.addEventListener('mouseleave', function(e) {
    if (e.target.classList.contains('card') && e.target.closest('.floating-cards')) {
        e.target.style.transform = '';
    }
}, true);

// Search suggestions
function initializeSearchSuggestions() {
    const searchInput = document.getElementById('quickSearch');
    if (!searchInput) return;
    
    const suggestions = [
        'PM-KISAN',
        'PMAY Housing Scheme',
        'Ayushman Bharat',
        'Women empowerment schemes',
        'Education scholarships',
        'Farmer welfare schemes',
        'Health insurance schemes',
        'Employment schemes',
        'Digital India initiatives',
        'Skill development programs'
    ];
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        if (query.length > 2) {
            const filteredSuggestions = suggestions.filter(suggestion => 
                suggestion.toLowerCase().includes(query)
            );
            
            // Show suggestions (implement dropdown if needed)
            if (filteredSuggestions.length > 0) {
                console.log('Suggestions:', filteredSuggestions);
            }
        }
    });
}

// Initialize search suggestions
initializeSearchSuggestions();
