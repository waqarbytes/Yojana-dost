// About Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeAboutPage();
    setupAnimations();
    initializeCounters();
});

function initializeAboutPage() {
    console.log('About page initialized');
    
    // Add intersection observer for animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll(
        '.visual-card, .feature-card, .step-card, .commitment-card, .mission-card, .vision-card'
    );
    
    animatedElements.forEach(el => observer.observe(el));
}

function setupAnimations() {
    // Stagger animations for better visual effect
    setTimeout(() => {
        animateOverviewCards();
    }, 500);
    
    setTimeout(() => {
        animateMissionVision();
    }, 1000);
    
    setTimeout(() => {
        animateFeatures();
    }, 1500);
    
    setTimeout(() => {
        animateSteps();
    }, 2000);
    
    setTimeout(() => {
        animateCommitments();
    }, 2500);
}

function animateOverviewCards() {
    const overviewCards = document.querySelectorAll('.visual-card');
    overviewCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate-in');
        }, index * 200);
    });
}

function animateMissionVision() {
    const missionCard = document.querySelector('.mission-card');
    const visionCard = document.querySelector('.vision-card');
    
    if (missionCard) {
        setTimeout(() => {
            missionCard.classList.add('animate-in');
        }, 200);
    }
    
    if (visionCard) {
        setTimeout(() => {
            visionCard.classList.add('animate-in');
        }, 400);
    }
}

function animateFeatures() {
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate-in');
        }, index * 150);
    });
}

function animateSteps() {
    const stepCards = document.querySelectorAll('.step-card');
    stepCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate-in');
        }, index * 200);
    });
}

function animateCommitments() {
    const commitmentCards = document.querySelectorAll('.commitment-card');
    commitmentCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate-in');
        }, index * 200);
    });
}

function initializeCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(counter) {
    const target = counter.textContent;
    const isNumeric = /^\d+/.test(target);
    
    if (isNumeric) {
        const finalValue = parseInt(target.match(/\d+/)[0]);
        let currentValue = 0;
        const increment = finalValue / 50;
        const suffix = target.replace(/^\d+/, '');
        
        counter.classList.add('counting');
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                counter.textContent = finalValue + suffix;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(currentValue) + suffix;
            }
        }, 40);
    } else {
        // For non-numeric values like "24/7"
        counter.style.opacity = '0';
        setTimeout(() => {
            counter.style.opacity = '1';
            counter.style.transition = 'opacity 0.5s ease-in-out';
            counter.classList.add('counting');
        }, 200);
    }
}

// Interactive hover effects for cards
document.addEventListener('mouseenter', function(e) {
    if (e.target.closest('.feature-card, .commitment-card, .visual-card')) {
        const card = e.target.closest('.feature-card, .commitment-card, .visual-card');
        const icon = card.querySelector('.feature-icon, .commitment-icon, .card-icon');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
        }
    }
}, true);

document.addEventListener('mouseleave', function(e) {
    if (e.target.closest('.feature-card, .commitment-card, .visual-card')) {
        const card = e.target.closest('.feature-card, .commitment-card, .visual-card');
        const icon = card.querySelector('.feature-icon, .commitment-icon, .card-icon');
        if (icon) {
            icon.style.transform = '';
        }
    }
}, true);

// Parallax effect for mission and vision cards
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const missionCard = document.querySelector('.mission-card');
    const visionCard = document.querySelector('.vision-card');
    
    if (missionCard && visionCard) {
        const rate = scrolled * 0.1;
        missionCard.style.transform = `translateY(${rate}px)`;
        visionCard.style.transform = `translateY(${-rate}px)`;
    }
});

// Interactive statistics
function createStatisticsTooltips() {
    const statItems = document.querySelectorAll('.stat-item');
    
    statItems.forEach(item => {
        const statNumber = item.querySelector('.stat-number');
        const statLabel = item.querySelector('.stat-label');
        
        if (statNumber && statLabel) {
            item.setAttribute('title', `${statNumber.textContent} ${statLabel.textContent}`);
            
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.transition = 'transform 0.3s ease';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        }
    });
}

// Initialize tooltips after a delay
setTimeout(createStatisticsTooltips, 2000);

// Smooth scroll for CTA buttons
document.addEventListener('click', function(e) {
    if (e.target.closest('.cta-buttons .btn')) {
        const btn = e.target.closest('.cta-buttons .btn');
        
        // Add click animation
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 150);
    }
});

// Add floating animation to overview visual cards
function addFloatingAnimation() {
    const visualCards = document.querySelectorAll('.visual-card');
    
    visualCards.forEach((card, index) => {
        // Create a unique floating animation for each card
        const animationDelay = index * 0.5;
        const animationDuration = 3 + (index * 0.5);
        
        card.style.animation = `float ${animationDuration}s ease-in-out infinite ${animationDelay}s`;
    });
}

// Initialize floating animation after page load
setTimeout(addFloatingAnimation, 3000);

// Dynamic text typing effect for mission and vision
function addTypingEffect() {
    const missionText = document.querySelector('.mission-card p');
    const visionText = document.querySelector('.vision-card p');
    
    if (missionText && visionText) {
        // Store original text
        const missionOriginal = missionText.textContent;
        const visionOriginal = visionText.textContent;
        
        // Create typing effect (only on first view)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const text = entry.target;
                    const originalText = text === missionText ? missionOriginal : visionOriginal;
                    
                    // Clear text and start typing
                    text.textContent = '';
                    typeText(text, originalText, 50);
                    
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.8 });
        
        observer.observe(missionText);
        observer.observe(visionText);
    }
}

function typeText(element, text, speed) {
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
        }
    }, speed);
}

// Initialize typing effect
setTimeout(addTypingEffect, 4000);

// Add pulse effect to commitment icons
function addPulseEffects() {
    const commitmentIcons = document.querySelectorAll('.commitment-icon');
    
    commitmentIcons.forEach((icon, index) => {
        setTimeout(() => {
            icon.style.animation = 'pulse 2s infinite';
        }, index * 500);
    });
}

// Initialize pulse effects
setTimeout(addPulseEffects, 5000);

// Interactive feature discovery
function initializeFeatureDiscovery() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach((card, index) => {
        card.addEventListener('click', function() {
            // Add a discover animation
            this.style.transform = 'scale(1.02)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            
            setTimeout(() => {
                this.style.transform = '';
                this.style.boxShadow = '';
            }, 300);
            
            // Show feature details (you could expand this to show more info)
            showNotification(`Learn more about: ${this.querySelector('h3').textContent}`, 'info');
        });
    });
}

// Initialize feature discovery
setTimeout(initializeFeatureDiscovery, 1000);

// Page scroll progress indicator
function initializeScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 80px;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
        z-index: 999;
        transition: width 0.1s ease;
    `;
    
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', function() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.pageYOffset / scrollHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// Initialize scroll progress
initializeScrollProgress();

// Add keyboard navigation for cards
document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        // Add focus styles to cards
        const focusableCards = document.querySelectorAll('.feature-card, .commitment-card, .step-card');
        focusableCards.forEach(card => {
            if (!card.hasAttribute('tabindex')) {
                card.setAttribute('tabindex', '0');
            }
        });
    }
});

// Enhanced accessibility
function enhanceAccessibility() {
    // Add ARIA labels to interactive elements
    const interactiveCards = document.querySelectorAll('.feature-card, .commitment-card, .visual-card');
    
    interactiveCards.forEach(card => {
        const title = card.querySelector('h3');
        if (title) {
            card.setAttribute('aria-label', `Learn more about ${title.textContent}`);
            card.setAttribute('role', 'button');
        }
    });
    
    // Add screen reader friendly text for statistics
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const label = stat.nextElementSibling;
        if (label) {
            stat.setAttribute('aria-label', `${stat.textContent} ${label.textContent}`);
        }
    });
}

// Initialize accessibility enhancements
enhanceAccessibility();
