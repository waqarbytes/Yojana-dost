// Schemes Page JavaScript
let allSchemes = [];
let filteredSchemes = [];
let currentPage = 1;
let itemsPerPage = 12;
let currentView = 'grid';

document.addEventListener('DOMContentLoaded', function() {
    initializeSchemesPage();
    loadSchemes();
    setupEventListeners();
});

function initializeSchemesPage() {
    console.log('Schemes page initialized');
    
    // Check for search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery) {
        document.getElementById('schemeSearch').value = searchQuery;
    }
}

async function loadSchemes() {
    const loadingContainer = document.getElementById('loadingContainer');
    const schemesContainer = document.getElementById('schemesContainer');
    
    try {
        loadingContainer.style.display = 'flex';
        schemesContainer.style.display = 'none';
        
        const response = await fetch('/data/schemes.json');
        if (!response.ok) {
            throw new Error('Failed to load schemes data');
        }
        
        const data = await response.json();
        console.log('Loaded schemes data:', data.length, 'schemes');
        
        allSchemes = data;
        filteredSchemes = [...allSchemes];
        
        // Apply initial search if present
        const searchQuery = document.getElementById('schemeSearch')?.value;
        if (searchQuery) {
            searchSchemes();
        } else {
            displaySchemes();
        }
        
        loadingContainer.style.display = 'none';
        schemesContainer.style.display = currentView === 'grid' ? 'grid' : 'flex';
        
    } catch (error) {
        console.error('Error loading schemes:', error);
        loadingContainer.style.display = 'none';
        
        const container = document.getElementById('schemesContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 2rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; margin: 2rem 0;">
                    <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 2rem; margin-bottom: 1rem;"></i>
                    <h3 style="color: #ef4444; margin-bottom: 1rem;">Failed to load schemes</h3>
                    <p style="color: #6b7280; margin-bottom: 1rem;">Unable to load scheme data. Please try again later.</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
            container.style.display = 'block';
        }
    }
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('schemeSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchSchemes, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchSchemes();
            }
        });
    }
}

function searchSchemes() {
    const query = document.getElementById('schemeSearch').value.toLowerCase().trim();
    
    if (query === '') {
        filteredSchemes = [...allSchemes];
    } else {
        filteredSchemes = allSchemes.filter(scheme => 
            scheme.title.toLowerCase().includes(query) ||
            scheme.description.toLowerCase().includes(query) ||
            scheme.category.toLowerCase().includes(query) ||
            scheme.state.toLowerCase().includes(query) ||
            (scheme.keywords && scheme.keywords.some(keyword => keyword.toLowerCase().includes(query)))
        );
    }
    
    currentPage = 1;
    displaySchemes();
}

function filterSchemes() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stateFilter = document.getElementById('stateFilter').value;
    const searchQuery = document.getElementById('schemeSearch').value.toLowerCase().trim();
    
    filteredSchemes = allSchemes.filter(scheme => {
        const matchesCategory = !categoryFilter || scheme.category === categoryFilter;
        const matchesState = !stateFilter || scheme.state === stateFilter;
        const matchesSearch = !searchQuery || 
            scheme.title.toLowerCase().includes(searchQuery) ||
            scheme.description.toLowerCase().includes(searchQuery) ||
            scheme.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery));
        
        return matchesCategory && matchesState && matchesSearch;
    });
    
    currentPage = 1;
    displaySchemes();
}

function sortSchemes() {
    const sortBy = document.getElementById('sortFilter').value;
    
    switch (sortBy) {
        case 'name':
            filteredSchemes.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredSchemes.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'category':
            filteredSchemes.sort((a, b) => a.category.localeCompare(b.category));
            break;
        case 'recent':
            filteredSchemes.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
            break;
    }
    
    displaySchemes();
}

function clearFilters() {
    document.getElementById('schemeSearch').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('stateFilter').value = '';
    document.getElementById('sortFilter').value = 'name';
    
    filteredSchemes = [...allSchemes];
    currentPage = 1;
    displaySchemes();
}

function changeView(view) {
    currentView = view;
    
    // Update view buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Update container classes
    const container = document.getElementById('schemesContainer');
    container.className = view === 'grid' ? 'schemes-grid' : 'schemes-list';
    
    displaySchemes();
}

function displaySchemes() {
    const container = document.getElementById('schemesContainer');
    const noResults = document.getElementById('noResults');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!container || !filteredSchemes) {
        console.error('Container or schemes data not found');
        return;
    }
    
    // Update results count
    if (resultsCount) {
        resultsCount.textContent = filteredSchemes.length;
    }
    
    if (filteredSchemes.length === 0) {
        container.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    container.style.display = currentView === 'grid' ? 'grid' : 'flex';
    noResults.style.display = 'none';
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const schemesToShow = filteredSchemes.slice(startIndex, endIndex);
    
    // Render schemes
    container.innerHTML = schemesToShow.map(scheme => createSchemeCard(scheme)).join('');
    
    // Update pagination
    updatePagination(totalPages);
    
    // Add animation
    setTimeout(() => {
        container.querySelectorAll('.scheme-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }, 100);
}

function createSchemeCard(scheme) {
    const isBookmarked = isSchemeBookmarked(scheme.id);
    const categoryColor = getCategoryColor(scheme.category);
    
    return `
        <div class="scheme-card" onclick="viewSchemeDetails('${scheme.id}')">
            <div class="scheme-header">
                <span class="scheme-category" style="background: ${categoryColor}">
                    ${scheme.category}
                </span>
                <span class="scheme-state">${scheme.state}</span>
            </div>
            
            <h3 class="scheme-title">${scheme.title}</h3>
            <p class="scheme-description">${scheme.description}</p>
            
            <div class="scheme-tags">
                ${scheme.keywords.slice(0, 3).map(keyword => 
                    `<span class="scheme-tag">${keyword}</span>`
                ).join('')}
            </div>
            
            <div class="scheme-footer">
                <div class="scheme-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); viewSchemeDetails('${scheme.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="action-btn" onclick="event.stopPropagation(); shareScheme('${scheme.id}')">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
                <i class="fas fa-bookmark scheme-bookmark ${isBookmarked ? 'bookmarked' : ''}" 
                   onclick="event.stopPropagation(); toggleBookmark('${scheme.id}')"></i>
            </div>
        </div>
    `;
}

function getCategoryColor(category) {
    const colors = {
        'health': '#10b981',
        'education': '#3b82f6',
        'agriculture': '#22c55e',
        'women': '#ec4899',
        'housing': '#f59e0b',
        'employment': '#8b5cf6',
        'social': '#06b6d4',
        'financial': '#ef4444',
        'rural': '#84cc16',
        'digital': '#6366f1'
    };
    return colors[category] || '#6b7280';
}

function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn" onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">${i}</button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn" onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displaySchemes();
    
    // Scroll to top
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function viewSchemeDetails(schemeId) {
    // For now, show scheme details in a modal or navigate to details page
    const scheme = allSchemes.find(s => s.id === schemeId);
    if (scheme) {
        showSchemeModal(scheme);
    }
}

function showSchemeModal(scheme) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${scheme.title}</h2>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="scheme-meta">
                    <span class="scheme-category">${scheme.category}</span>
                    <span class="scheme-state">${scheme.state}</span>
                </div>
                <p class="scheme-description">${scheme.description}</p>
                <div class="scheme-keywords">
                    <h4>Keywords:</h4>
                    <div class="scheme-tags">
                        ${scheme.keywords.map(keyword => 
                            `<span class="scheme-tag">${keyword}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles
    const modalStyles = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        }
        
        .modal-content {
            background: white;
            border-radius: 16px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2rem;
            border-bottom: 1px solid var(--border);
        }
        
        .modal-header h2 {
            margin: 0;
            color: var(--text-primary);
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text-secondary);
        }
        
        .modal-body {
            padding: 2rem;
        }
        
        .scheme-meta {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .scheme-keywords {
            margin-top: 1.5rem;
        }
        
        .scheme-keywords h4 {
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }
        
        .modal-footer {
            padding: 1rem 2rem 2rem;
            text-align: right;
        }
    `;
    
    if (!document.querySelector('#modal-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'modal-styles';
        styleSheet.textContent = modalStyles;
        document.head.appendChild(styleSheet);
    }
}

function toggleBookmark(schemeId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedSchemes') || '[]');
    const index = bookmarks.indexOf(schemeId);
    
    if (index === -1) {
        bookmarks.push(schemeId);
        showNotification('Scheme bookmarked successfully!', 'success');
    } else {
        bookmarks.splice(index, 1);
        showNotification('Scheme removed from bookmarks', 'info');
    }
    
    localStorage.setItem('bookmarkedSchemes', JSON.stringify(bookmarks));
    
    // Update bookmark icon
    const bookmarkIcon = document.querySelector(`[onclick*="${schemeId}"]`);
    if (bookmarkIcon) {
        bookmarkIcon.classList.toggle('bookmarked');
    }
}

function isSchemeBookmarked(schemeId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedSchemes') || '[]');
    return bookmarks.includes(schemeId);
}

function shareScheme(schemeId) {
    const scheme = allSchemes.find(s => s.id === schemeId);
    if (scheme) {
        const shareData = {
            title: scheme.title,
            text: scheme.description,
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(`${scheme.title}: ${scheme.description}`);
            showNotification('Scheme details copied to clipboard!', 'success');
        }
    }
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

