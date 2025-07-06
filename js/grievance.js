// Grievance Page JavaScript
let selectedGrievanceType = '';

document.addEventListener('DOMContentLoaded', function() {
    initializeGrievancePage();
    setupEventListeners();
});

function initializeGrievancePage() {
    console.log('Grievance page initialized');
    
    // Add animations to option cards
    setTimeout(() => {
        document.querySelectorAll('.option-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 200);
        });
    }, 300);
    
    // Add animation to form container
    setTimeout(() => {
        document.querySelector('.form-container').classList.add('animate-in');
    }, 800);
}

function setupEventListeners() {
    // Form submission
    const grievanceForm = document.getElementById('grievanceForm');
    if (grievanceForm) {
        grievanceForm.addEventListener('submit', handleFormSubmission);
    }
    
    // File upload handling
    const fileInput = document.getElementById('attachments');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    // Form validation on input
    const formInputs = grievanceForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
    
    // Aadhaar number formatting
    const aadhaarInput = document.getElementById('aadhaar');
    if (aadhaarInput) {
        aadhaarInput.addEventListener('input', formatAadhaarNumber);
    }
    
    // Mobile number validation
    const mobileInput = document.getElementById('mobile');
    if (mobileInput) {
        mobileInput.addEventListener('input', validateMobileNumber);
    }
}

function selectGrievanceType(type) {
    selectedGrievanceType = type;
    document.getElementById('grievanceType').value = type;
    
    // Scroll to form
    document.querySelector('.grievance-form-section').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    // Highlight selected option
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.target.closest('.option-card').classList.add('selected');
    
    // Update form title based on selection
    updateFormTitle(type);
}

function updateFormTitle(type) {
    const titles = {
        'complaint': 'File Your Complaint',
        'suggestion': 'Submit Your Suggestion',
        'feedback': 'Share Your Feedback',
        'inquiry': 'Ask Your Question'
    };
    
    const formTitle = document.querySelector('.form-header h2');
    if (formTitle && titles[type]) {
        formTitle.textContent = titles[type];
    }
}

function handleFormSubmission(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        showNotification('Please fix the errors in the form before submitting.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    // Simulate form submission
    setTimeout(() => {
        const grievanceId = generateGrievanceId();
        showSuccessModal(grievanceId);
        
        // Reset form
        resetForm();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

function validateForm() {
    const form = document.getElementById('grievanceForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
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
    
    // Mobile number validation
    if (field.id === 'mobile' && value) {
        if (!/^[6-9]\d{9}$/.test(value)) {
            showFieldError(field, 'Please enter a valid 10-digit mobile number');
            isValid = false;
        }
    }
    
    // Aadhaar validation
    if (field.id === 'aadhaar' && value) {
        if (!/^\d{12}$/.test(value.replace(/\s/g, ''))) {
            showFieldError(field, 'Please enter a valid 12-digit Aadhaar number');
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
    formGroup.classList.remove('error');
    
    const errorDiv = formGroup.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function formatAadhaarNumber(event) {
    let value = event.target.value.replace(/\s/g, '');
    let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
    
    if (formattedValue.length > 14) {
        formattedValue = formattedValue.substring(0, 14);
    }
    
    event.target.value = formattedValue;
}

function validateMobileNumber(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.substring(0, 10);
    }
    event.target.value = value;
}

function handleFileUpload(event) {
    const files = event.target.files;
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    
    for (let file of files) {
        if (file.size > maxSize) {
            showNotification(`File ${file.name} is too large. Maximum size is 10MB.`, 'error');
            event.target.value = '';
            return;
        }
        
        if (!allowedTypes.includes(file.type)) {
            showNotification(`File ${file.name} is not a supported format.`, 'error');
            event.target.value = '';
            return;
        }
    }
    
    // Display selected files
    displaySelectedFiles(files);
}

function displaySelectedFiles(files) {
    const fileUploadArea = document.querySelector('.file-upload-area');
    let existingList = fileUploadArea.querySelector('.file-list');
    
    if (!existingList) {
        existingList = document.createElement('div');
        existingList.className = 'file-list';
        fileUploadArea.appendChild(existingList);
    }
    
    existingList.innerHTML = '<h4>Selected Files:</h4>';
    
    for (let file of files) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name}</span>
            <small>(${formatFileSize(file.size)})</small>
        `;
        existingList.appendChild(fileItem);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateGrievanceId() {
    const prefix = 'GRV';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${prefix}${year}${random}`;
}

function showSuccessModal(grievanceId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content success-modal">
            <div class="modal-header success-header">
                <i class="fas fa-check-circle"></i>
                <h2>Grievance Submitted Successfully!</h2>
            </div>
            <div class="modal-body">
                <div class="grievance-info">
                    <h3>Your Grievance ID</h3>
                    <div class="grievance-id">${grievanceId}</div>
                    <p>Please save this ID for future reference. You can use it to track the status of your grievance.</p>
                    
                    <div class="next-steps">
                        <h4>What happens next?</h4>
                        <ul>
                            <li>Your grievance will be reviewed within 24 hours</li>
                            <li>You will receive an email confirmation</li>
                            <li>We will respond within 7 working days</li>
                            <li>You can track progress using your Grievance ID</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="copyGrievanceId('${grievanceId}')">
                    <i class="fas fa-copy"></i> Copy ID
                </button>
                <button class="btn btn-secondary" onclick="closeSuccessModal()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add success modal styles
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
        
        .grievance-info {
            text-align: center;
        }
        
        .grievance-id {
            font-size: 1.5rem;
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

function copyGrievanceId(grievanceId) {
    navigator.clipboard.writeText(grievanceId).then(() => {
        showNotification('Grievance ID copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = grievanceId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Grievance ID copied to clipboard!', 'success');
    });
}

function closeSuccessModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function resetForm() {
    const form = document.getElementById('grievanceForm');
    form.reset();
    
    // Clear all error states
    form.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
        const errorDiv = group.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    });
    
    // Clear file list
    const fileList = document.querySelector('.file-list');
    if (fileList) {
        fileList.remove();
    }
    
    // Reset selected grievance type
    selectedGrievanceType = '';
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
}

function trackGrievance() {
    const trackingId = document.getElementById('trackingId').value.trim();
    
    if (!trackingId) {
        showNotification('Please enter a valid Grievance ID', 'error');
        return;
    }
    
    // Validate grievance ID format
    if (!/^GRV\d{9}$/.test(trackingId)) {
        showNotification('Please enter a valid Grievance ID format (e.g., GRV202500001)', 'error');
        return;
    }
    
    // Show tracking modal
    showTrackingModal(trackingId);
}

function showTrackingModal(grievanceId) {
    const modal = document.createElement('div');
    modal.className = 'status-modal active';
    modal.innerHTML = `
        <div class="status-content">
            <div class="status-header">
                <h2>Grievance Status</h2>
                <p>Tracking ID: ${grievanceId}</p>
            </div>
            <div class="status-body">
                <div class="status-timeline">
                    <div class="timeline-item completed">
                        <div class="timeline-icon">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Grievance Submitted</h4>
                            <p>Your grievance has been successfully submitted</p>
                            <small>2 days ago</small>
                        </div>
                    </div>
                    <div class="timeline-item completed">
                        <div class="timeline-icon">
                            <i class="fas fa-eye"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Under Review</h4>
                            <p>Your grievance is being reviewed by our team</p>
                            <small>1 day ago</small>
                        </div>
                    </div>
                    <div class="timeline-item active">
                        <div class="timeline-icon">
                            <i class="fas fa-cogs"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>In Progress</h4>
                            <p>We are working on resolving your grievance</p>
                            <small>Current status</small>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-icon">
                            <i class="fas fa-flag-checkered"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Resolved</h4>
                            <p>Your grievance will be marked as resolved</p>
                            <small>Pending</small>
                        </div>
                    </div>
                </div>
                
                <div class="estimated-time">
                    <h4>Estimated Resolution Time</h4>
                    <p>3-5 working days from submission</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeTrackingModal()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeTrackingModal() {
    const modal = document.querySelector('.status-modal');
    if (modal) {
        modal.remove();
    }
}

// Add styles for form validation
const validationStyles = `
    .form-group.error input,
    .form-group.error select,
    .form-group.error textarea {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
    
    .field-error {
        color: #ef4444;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .file-list {
        margin-top: 1rem;
        padding: 1rem;
        background: var(--surface);
        border-radius: var(--border-radius);
    }
    
    .file-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border);
    }
    
    .file-item:last-child {
        border-bottom: none;
    }
    
    .option-card.selected {
        border-color: var(--primary-color);
        background: rgba(99, 102, 241, 0.05);
    }
    
    .estimated-time {
        margin-top: 2rem;
        padding: 1rem;
        background: var(--surface);
        border-radius: var(--border-radius);
        text-align: center;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = validationStyles;
document.head.appendChild(styleSheet);
