// Contact Page JavaScript
let formSubmitted = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeContactPage();
    setupEventListeners();
    addAnimations();
});

function initializeContactPage() {
    console.log('Contact page initialized');
    
    // Add animations to contact info and form
    setTimeout(() => {
        document.querySelector('.contact-info').classList.add('animate-in');
    }, 300);
    
    setTimeout(() => {
        document.querySelector('.contact-form-section').classList.add('animate-in');
    }, 600);
    
    setTimeout(() => {
        document.querySelectorAll('.help-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 200);
        });
    }, 1000);
}

function setupEventListeners() {
    // Form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmission);
    }
    
    // Real-time form validation
    const formInputs = contactForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
    
    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhoneNumber);
    }
    
    // Character count for message
    const messageTextarea = document.getElementById('message');
    if (messageTextarea) {
        messageTextarea.addEventListener('input', updateCharacterCount);
        addCharacterCounter(messageTextarea);
    }
    
    // Form reset
    const resetBtn = contactForm.querySelector('button[type="reset"]');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }
}

function handleFormSubmission(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        showFormMessage('Please fix the errors below before submitting.', 'error');
        return;
    }
    
    if (formSubmitted) {
        showFormMessage('Form has already been submitted. Please wait before submitting again.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Message...';
    submitBtn.disabled = true;
    formSubmitted = true;
    
    // Simulate form submission
    setTimeout(() => {
        const formData = new FormData(event.target);
        const contactData = Object.fromEntries(formData.entries());
        
        // Process form data
        processContactForm(contactData);
        
        // Show success message
        showSuccessModal();
        
        // Reset form
        resetForm();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        formSubmitted = false;
    }, 2000);
}

function validateForm() {
    const form = document.getElementById('contactForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    // Clear any existing form messages
    clearFormMessage();
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    // Check terms agreement
    const termsCheckbox = document.getElementById('agreeTerms');
    if (!termsCheckbox.checked) {
        showFieldError(termsCheckbox, 'You must agree to the terms and conditions');
        isValid = false;
    }
    
    return isValid;
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    let isValid = true;
    
    // Clear previous errors
    clearFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        isValid = false;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'Please enter a valid email address');
            isValid = false;
        }
    }
    
    // Phone number validation
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
        if (!phoneRegex.test(value)) {
            showFieldError(field, 'Please enter a valid phone number');
            isValid = false;
        }
    }
    
    // Message minimum length
    if (field.id === 'message' && value && value.length < 10) {
        showFieldError(field, 'Message must be at least 10 characters long');
        isValid = false;
    }
    
    // Name validation (no numbers)
    if ((field.id === 'firstName' || field.id === 'lastName') && value) {
        if (!/^[a-zA-Z\s]+$/.test(value)) {
            showFieldError(field, 'Name should only contain letters');
            isValid = false;
        }
    }
    
    return isValid;
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('error');
    
    // Remove existing error message
    const existingError = formGroup.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    formGroup.appendChild(errorDiv);
}

function clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('error', 'success');
    
    const errorDiv = formGroup.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    
    // Add success state for valid fields
    if (field.value.trim() && validateField({ target: field })) {
        formGroup.classList.add('success');
    }
}

function formatPhoneNumber(event) {
    let value = event.target.value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers, or keep as entered for international
    if (value.length <= 10) {
        if (value.length >= 6) {
            value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
        } else if (value.length >= 3) {
            value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        }
    }
    
    event.target.value = value;
}

function addCharacterCounter(textarea) {
    const maxLength = 500;
    const counter = document.createElement('div');
    counter.className = 'character-counter';
    counter.style.cssText = `
        text-align: right;
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-top: 0.5rem;
    `;
    
    textarea.parentNode.appendChild(counter);
    updateCharacterCount();
    
    function updateCharacterCount() {
        const currentLength = textarea.value.length;
        counter.textContent = `${currentLength}/${maxLength} characters`;
        
        if (currentLength > maxLength * 0.8) {
            counter.style.color = '#f59e0b';
        } else if (currentLength >= maxLength) {
            counter.style.color = '#ef4444';
        } else {
            counter.style.color = 'var(--text-secondary)';
        }
    }
    
    textarea.addEventListener('input', updateCharacterCount);
}

function updateCharacterCount() {
    // This function is called by the event listener
    const textarea = document.getElementById('message');
    const counter = textarea.parentNode.querySelector('.character-counter');
    
    if (counter) {
        const maxLength = 500;
        const currentLength = textarea.value.length;
        counter.textContent = `${currentLength}/${maxLength} characters`;
        
        if (currentLength > maxLength * 0.8) {
            counter.style.color = '#f59e0b';
        } else if (currentLength >= maxLength) {
            counter.style.color = '#ef4444';
        } else {
            counter.style.color = 'var(--text-secondary)';
        }
    }
}

function processContactForm(data) {
    console.log('Processing contact form data:', data);
    
    // Here you would typically send the data to your backend
    // For now, we'll just log it and show success
    
    // Generate a ticket ID
    const ticketId = generateTicketId();
    
    // Store in localStorage for demo purposes
    const contacts = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
    contacts.push({
        ...data,
        ticketId: ticketId,
        submittedAt: new Date().toISOString(),
        status: 'received'
    });
    localStorage.setItem('contactSubmissions', JSON.stringify(contacts));
}

function generateTicketId() {
    const prefix = 'TICKET';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

function showSuccessModal() {
    const ticketId = generateTicketId();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content success-modal">
            <div class="modal-header success-header">
                <i class="fas fa-check-circle"></i>
                <h2>Message Sent Successfully!</h2>
            </div>
            <div class="modal-body">
                <div class="success-info">
                    <h3>Thank you for contacting us</h3>
                    <div class="ticket-id">Ticket ID: ${ticketId}</div>
                    <p>We have received your message and will respond within 24 hours. Please save your ticket ID for reference.</p>
                    
                    <div class="next-steps">
                        <h4>What happens next?</h4>
                        <ul>
                            <li>We'll review your message within 2 hours</li>
                            <li>You'll receive an email confirmation</li>
                            <li>Our team will respond within 24 hours</li>
                            <li>You can reference your ticket ID for follow-ups</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="copyTicketId('${ticketId}')">
                    <i class="fas fa-copy"></i> Copy Ticket ID
                </button>
                <button class="btn btn-secondary" onclick="closeSuccessModal()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addSuccessModalStyles();
}

function addSuccessModalStyles() {
    if (document.querySelector('#success-modal-styles')) return;
    
    const styles = `
        .success-modal {
            max-width: 500px;
        }
        
        .success-header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-align: center;
            flex-direction: column;
            gap: 1rem;
        }
        
        .success-header i {
            font-size: 3rem;
        }
        
        .success-info {
            text-align: center;
        }
        
        .ticket-id {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--primary-color);
            background: var(--surface);
            padding: 1rem;
            border-radius: var(--border-radius);
            margin: 1rem 0;
            border: 2px dashed var(--primary-color);
        }
        
        .next-steps {
            text-align: left;
            margin-top: 2rem;
            padding: 1.5rem;
            background: var(--surface);
            border-radius: var(--border-radius);
        }
        
        .next-steps h4 {
            color: var(--text-primary);
            margin-bottom: 1rem;
        }
        
        .next-steps ul {
            list-style: none;
            padding: 0;
        }
        
        .next-steps li {
            padding: 0.5rem 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .next-steps li::before {
            content: '✓';
            color: #10b981;
            font-weight: bold;
            width: 20px;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'success-modal-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

function copyTicketId(ticketId) {
    navigator.clipboard.writeText(ticketId).then(() => {
        showNotification('Ticket ID copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = ticketId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Ticket ID copied to clipboard!', 'success');
    });
}

function closeSuccessModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function resetForm() {
    const form = document.getElementById('contactForm');
    form.reset();
    
    // Clear all error and success states
    form.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error', 'success');
        const errorDiv = group.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    });
    
    // Reset character counter
    const messageTextarea = document.getElementById('message');
    const counter = messageTextarea.parentNode.querySelector('.character-counter');
    if (counter) {
        counter.textContent = '0/500 characters';
        counter.style.color = 'var(--text-secondary)';
    }
    
    // Clear form message
    clearFormMessage();
    
    showNotification('Form reset successfully', 'info');
}

function showFormMessage(message, type) {
    clearFormMessage();
    
    const formHeader = document.querySelector('.form-header');
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    formHeader.parentNode.insertBefore(messageDiv, formHeader.nextSibling);
}

function clearFormMessage() {
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

function addAnimations() {
    // Add hover effects to contact methods
    document.querySelectorAll('.contact-method').forEach(method => {
        method.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(10px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        method.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
    
    // Add click animations to social links
    document.querySelectorAll('.social-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            showNotification('Social media link clicked!', 'info');
        });
    });
}

// Terms and Privacy modal functions
function openTermsModal() {
    showNotification('Terms and Conditions modal would open here', 'info');
}

function openPrivacyModal() {
    showNotification('Privacy Policy modal would open here', 'info');
}

// Enhanced form interactivity
function enhanceFormInteractivity() {
    const form = document.getElementById('contactForm');
    
    // Add progress indicator
    const progressBar = document.createElement('div');
    progressBar.className = 'form-progress';
    progressBar.style.cssText = `
        width: 100%;
        height: 4px;
        background: var(--border);
        border-radius: 2px;
        margin-bottom: 2rem;
        overflow: hidden;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.className = 'form-progress-fill';
    progressFill.style.cssText = `
        width: 0%;
        height: 100%;
        background: var(--gradient-primary);
        transition: width 0.3s ease;
    `;
    
    progressBar.appendChild(progressFill);
    form.insertBefore(progressBar, form.firstChild);
    
    // Update progress based on filled fields
    function updateProgress() {
        const requiredFields = form.querySelectorAll('[required]');
        const filledFields = Array.from(requiredFields).filter(field => field.value.trim() !== '');
        const progress = (filledFields.length / requiredFields.length) * 100;
        progressFill.style.width = progress + '%';
    }
    
    // Add listeners to update progress
    form.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('input', updateProgress);
        field.addEventListener('change', updateProgress);
    });
    
    updateProgress();
}

// Initialize enhanced form interactivity
setTimeout(enhanceFormInteractivity, 1000);

// Add form field focus animations
document.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('focus', function() {
        this.closest('.form-group').classList.add('focused');
    });
    
    field.addEventListener('blur', function() {
        this.closest('.form-group').classList.remove('focused');
    });
});

// Add CSS for focus animations
const focusStyles = `
    .form-group.focused {
        transform: translateY(-2px);
        transition: transform 0.2s ease;
    }
    
    .form-group.focused input,
    .form-group.focused select,
    .form-group.focused textarea {
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
`;

const focusStyleSheet = document.createElement('style');
focusStyleSheet.textContent = focusStyles;
document.head.appendChild(focusStyleSheet);
