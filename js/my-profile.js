// My Profile Page JavaScript
let isEditMode = false;
let bookmarkedSchemes = [];
let userApplications = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeProfilePage();
    loadUserData();
    setupEventListeners();
});

function initializeProfilePage() {
    console.log('Profile page initialized');
    loadBookmarkedSchemes();
    loadUserApplications();
    updateStatistics();
}

function loadUserData() {
    // Load user preferences from localStorage
    const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    
    // Apply preferences
    if (preferences.emailNotifications !== undefined) {
        document.getElementById('emailNotifications').checked = preferences.emailNotifications;
    }
    if (preferences.smsNotifications !== undefined) {
        document.getElementById('smsNotifications').checked = preferences.smsNotifications;
    }
    if (preferences.pushNotifications !== undefined) {
        document.getElementById('pushNotifications').checked = preferences.pushNotifications;
    }
    if (preferences.language) {
        document.getElementById('language').value = preferences.language;
    }
    if (preferences.profileVisibility !== undefined) {
        document.getElementById('profileVisibility').checked = preferences.profileVisibility;
    }
    if (preferences.dataSharing !== undefined) {
        document.getElementById('dataSharing').checked = preferences.dataSharing;
    }
}

function setupEventListeners() {
    // Navigation between sections
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Form inputs for real-time validation
    const profileInputs = document.querySelectorAll('#personal-section input, #personal-section select, #personal-section textarea');
    profileInputs.forEach(input => {
        input.addEventListener('input', validateProfileField);
    });
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.classList.add('animate-in');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Load section-specific data
    switch (sectionName) {
        case 'bookmarks':
            displayBookmarkedSchemes();
            break;
        case 'applications':
            displayApplications();
            break;
    }
}

function editProfile() {
    isEditMode = true;
    
    // Enable form fields
    const formFields = document.querySelectorAll('#personal-section input, #personal-section select, #personal-section textarea');
    formFields.forEach(field => {
        field.removeAttribute('readonly');
        field.removeAttribute('disabled');
    });
    
    // Show form actions
    document.getElementById('profileActions').style.display = 'flex';
    
    // Update button text
    const editBtn = document.querySelector('.section-header .btn');
    editBtn.textContent = 'Cancel Edit';
    editBtn.onclick = cancelEdit;
}

function cancelEdit() {
    isEditMode = false;
    
    // Disable form fields
    const formFields = document.querySelectorAll('#personal-section input, #personal-section select, #personal-section textarea');
    formFields.forEach(field => {
        field.setAttribute('readonly', true);
        if (field.tagName === 'SELECT') {
            field.setAttribute('disabled', true);
        }
    });
    
    // Hide form actions
    document.getElementById('profileActions').style.display = 'none';
    
    // Reset button
    const editBtn = document.querySelector('.section-header .btn');
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
    editBtn.onclick = editProfile;
    
    // Reset form values (you might want to reload from saved data)
    showNotification('Changes discarded', 'info');
}

function saveProfile() {
    if (!validateProfileForm()) {
        showNotification('Please fix the errors before saving', 'error');
        return;
    }
    
    // Simulate saving
    setTimeout(() => {
        isEditMode = false;
        
        // Disable form fields
        const formFields = document.querySelectorAll('#personal-section input, #personal-section select, #personal-section textarea');
        formFields.forEach(field => {
            field.setAttribute('readonly', true);
            if (field.tagName === 'SELECT') {
                field.setAttribute('disabled', true);
            }
        });
        
        // Hide form actions
        document.getElementById('profileActions').style.display = 'none';
        
        // Reset button
        const editBtn = document.querySelector('.section-header .btn');
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
        editBtn.onclick = editProfile;
        
        showNotification('Profile updated successfully!', 'success');
    }, 1000);
}

function validateProfileForm() {
    const requiredFields = document.querySelectorAll('#personal-section [required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    // Email validation
    const email = document.getElementById('email');
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        showFieldError(email, 'Please enter a valid email address');
        isValid = false;
    }
    
    // Phone validation
    const phone = document.getElementById('phone');
    if (phone.value && !/^[+]?[1-9][\d\s\-\(\)]{7,15}$/.test(phone.value)) {
        showFieldError(phone, 'Please enter a valid phone number');
        isValid = false;
    }
    
    return isValid;
}

function validateProfileField(event) {
    const field = event.target;
    
    // Clear previous errors
    clearFieldError(field);
    
    // Validate based on field type
    if (field.hasAttribute('required') && !field.value.trim()) {
        showFieldError(field, 'This field is required');
    } else if (field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        showFieldError(field, 'Please enter a valid email address');
    } else if (field.type === 'tel' && field.value && !/^[+]?[1-9][\d\s\-\(\)]{7,15}$/.test(field.value)) {
        showFieldError(field, 'Please enter a valid phone number');
    }
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('error');
    
    // Remove existing error
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

function loadBookmarkedSchemes() {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedSchemes') || '[]');
    bookmarkedSchemes = bookmarks;
    updateStatistics();
}

async function displayBookmarkedSchemes() {
    const container = document.getElementById('bookmarksGrid');
    
    if (bookmarkedSchemes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bookmark"></i>
                <h3>No bookmarked schemes</h3>
                <p>Start bookmarking schemes to see them here</p>
                <a href="schemes.html" class="btn btn-primary">
                    <i class="fas fa-search"></i>
                    Browse Schemes
                </a>
            </div>
        `;
        return;
    }
    
    try {
        // Load schemes data to get full details
        const response = await fetch('data/schemes.json');
        const allSchemes = await response.json();
        
        const bookmarkedSchemeDetails = bookmarkedSchemes.map(id => 
            allSchemes.find(scheme => scheme.id === id)
        ).filter(Boolean);
        
        container.innerHTML = bookmarkedSchemeDetails.map(scheme => createBookmarkCard(scheme)).join('');
        
        // Add animation
        setTimeout(() => {
            container.querySelectorAll('.bookmark-card').forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('animate-in');
                }, index * 100);
            });
        }, 100);
        
    } catch (error) {
        console.error('Error loading bookmarked schemes:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading bookmarks</h3>
                <p>Unable to load your bookmarked schemes</p>
            </div>
        `;
    }
}

function createBookmarkCard(scheme) {
    return `
        <div class="bookmark-card">
            <div class="bookmark-header">
                <span class="bookmark-category">${scheme.category}</span>
                <button class="bookmark-remove" onclick="removeBookmark('${scheme.id}')" title="Remove bookmark">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <h3 class="bookmark-title">${scheme.title}</h3>
            <p class="bookmark-description">${scheme.description}</p>
            <div class="bookmark-actions">
                <button class="btn btn-primary" onclick="viewSchemeDetails('${scheme.id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="btn btn-secondary" onclick="shareScheme('${scheme.id}')">
                    <i class="fas fa-share"></i> Share
                </button>
            </div>
        </div>
    `;
}

function removeBookmark(schemeId) {
    bookmarkedSchemes = bookmarkedSchemes.filter(id => id !== schemeId);
    localStorage.setItem('bookmarkedSchemes', JSON.stringify(bookmarkedSchemes));
    
    updateStatistics();
    displayBookmarkedSchemes();
    showNotification('Bookmark removed', 'info');
}

function clearAllBookmarks() {
    if (bookmarkedSchemes.length === 0) {
        showNotification('No bookmarks to clear', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to remove all bookmarks?')) {
        bookmarkedSchemes = [];
        localStorage.setItem('bookmarkedSchemes', JSON.stringify(bookmarkedSchemes));
        
        updateStatistics();
        displayBookmarkedSchemes();
        showNotification('All bookmarks cleared', 'success');
    }
}

function loadUserApplications() {
    // Simulate user applications
    userApplications = [
        {
            id: 'APP001',
            schemeName: 'PM-KISAN Samman Nidhi',
            applicationDate: '2024-12-15',
            status: 'approved',
            applicationId: 'PMK2024001234',
            category: 'Agriculture'
        },
        {
            id: 'APP002',
            schemeName: 'Ayushman Bharat',
            applicationDate: '2024-12-10',
            status: 'under-review',
            applicationId: 'AB2024005678',
            category: 'Health'
        },
        {
            id: 'APP003',
            schemeName: 'National Scholarship Portal',
            applicationDate: '2024-12-01',
            status: 'pending',
            applicationId: 'NSP2024009876',
            category: 'Education'
        }
    ];
    
    updateStatistics();
}

function displayApplications() {
    const container = document.getElementById('applicationsList');
    
    if (userApplications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>No applications submitted</h3>
                <p>Your scheme applications will appear here</p>
                <a href="schemes.html" class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Apply for Schemes
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userApplications.map(application => createApplicationCard(application)).join('');
    
    // Add animation
    setTimeout(() => {
        container.querySelectorAll('.application-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }, 100);
}

function createApplicationCard(application) {
    const statusColors = {
        'pending': 'pending',
        'under-review': 'under-review',
        'approved': 'approved',
        'rejected': 'rejected'
    };
    
    const statusTexts = {
        'pending': 'Pending',
        'under-review': 'Under Review',
        'approved': 'Approved',
        'rejected': 'Rejected'
    };
    
    return `
        <div class="application-card">
            <div class="application-header">
                <h3>${application.schemeName}</h3>
                <span class="application-status ${statusColors[application.status]}">
                    ${statusTexts[application.status]}
                </span>
            </div>
            <div class="application-details">
                <div class="detail-item">
                    <span class="detail-label">Application ID</span>
                    <span class="detail-value">${application.applicationId}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Category</span>
                    <span class="detail-value">${application.category}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Applied Date</span>
                    <span class="detail-value">${formatDate(application.applicationDate)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="detail-value">${statusTexts[application.status]}</span>
                </div>
            </div>
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function updateStatistics() {
    document.getElementById('bookmarkedSchemes').textContent = bookmarkedSchemes.length;
    document.getElementById('appliedSchemes').textContent = userApplications.length;
}

function refreshApplications() {
    // Simulate refreshing applications
    showNotification('Applications refreshed', 'success');
    displayApplications();
}

function savePreferences() {
    const preferences = {
        emailNotifications: document.getElementById('emailNotifications').checked,
        smsNotifications: document.getElementById('smsNotifications').checked,
        pushNotifications: document.getElementById('pushNotifications').checked,
        language: document.getElementById('language').value,
        timezone: document.getElementById('timezone').value,
        profileVisibility: document.getElementById('profileVisibility').checked,
        dataSharing: document.getElementById('dataSharing').checked
    };
    
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    showNotification('Preferences saved successfully!', 'success');
}

function resetPreferences() {
    if (confirm('Are you sure you want to reset all preferences to default?')) {
        // Reset to defaults
        document.getElementById('emailNotifications').checked = true;
        document.getElementById('smsNotifications').checked = true;
        document.getElementById('pushNotifications').checked = false;
        document.getElementById('language').value = 'en';
        document.getElementById('timezone').value = 'IST';
        document.getElementById('profileVisibility').checked = true;
        document.getElementById('dataSharing').checked = false;
        
        // Clear from localStorage
        localStorage.removeItem('userPreferences');
        
        showNotification('Preferences reset to default', 'success');
    }
}

function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters long', 'error');
        return;
    }
    
    // Simulate password change
    showNotification('Password changed successfully!', 'success');
    
    // Clear form
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

function setupTwoFactor() {
    showNotification('Two-factor authentication setup coming soon!', 'info');
}

function deactivateAccount() {
    if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
        showNotification('Account deactivation request submitted. You will receive an email confirmation.', 'info');
    }
}

function editAvatar() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('profileImage').src = e.target.result;
                showNotification('Profile picture updated!', 'success');
            };
            reader.readAsDataURL(file);
        }
    };
    
    fileInput.click();
}

function viewSchemeDetails(schemeId) {
    // Navigate to scheme details
    window.location.href = `schemes.html?id=${schemeId}`;
}

function shareScheme(schemeId) {
    const shareUrl = `${window.location.origin}/schemes.html?id=${schemeId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Government Scheme',
            url: shareUrl
        });
    } else {
        navigator.clipboard.writeText(shareUrl);
        showNotification('Scheme link copied to clipboard!', 'success');
    }
}

// Add validation styles
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
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = validationStyles;
document.head.appendChild(styleSheet);
