// Categories Page JavaScript
let allSchemes = [];
let categories = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeCategoriesPage();
    loadCategories();
    setupEventListeners();
});

function initializeCategoriesPage() {
    console.log('Categories page initialized');
    
    // Check for category hash in URL
    const hash = window.location.hash.substring(1);
    if (hash) {
        // Wait for categories to load, then show the specific category
        setTimeout(() => {
            showCategoryDetails(hash);
        }, 1000);
    }
}

async function loadCategories() {
    try {
        const response = await fetch('/data/schemes.json');
        if (!response.ok) {
            throw new Error('Failed to load schemes data');
        }
        
        allSchemes = await response.json();
        categories = generateCategories();
        displayCategories();
        
    } catch (error) {
        console.error('Error loading categories:', error);
        showErrorMessage();
    }
}

function generateCategories() {
    const categoryMap = new Map();
    
    // Define category information
    const categoryInfo = {
        'Health': {
            title: 'Health & Medical',
            description: 'Healthcare schemes, medical insurance, and health-related benefits',
            icon: 'fas fa-heartbeat',
            color: '#10b981'
        },
        'Education': {
            title: 'Education & Scholarships',
            description: 'Educational support, scholarships, and skill development programs',
            icon: 'fas fa-graduation-cap',
            color: '#3b82f6'
        },
        'Agriculture': {
            title: 'Agriculture & Farming',
            description: 'Farmer welfare schemes, agricultural support, and rural development',
            icon: 'fas fa-seedling',
            color: '#22c55e'
        },
        'Women': {
            title: 'Women Empowerment',
            description: 'Women-centric schemes, empowerment programs, and gender equality initiatives',
            icon: 'fas fa-female',
            color: '#ec4899'
        },
        'Housing': {
            title: 'Housing & Shelter',
            description: 'Affordable housing schemes, home loans, and shelter programs',
            icon: 'fas fa-home',
            color: '#f59e0b'
        },
        'Employment': {
            title: 'Employment & Skills',
            description: 'Job creation, employment guarantee, and skill development programs',
            icon: 'fas fa-briefcase',
            color: '#8b5cf6'
        },
        'Business': {
            title: 'Business & Entrepreneurship',
            description: 'Business loans, startup support, and entrepreneurship schemes',
            icon: 'fas fa-handshake',
            color: '#06b6d4'
        },
        'Pension': {
            title: 'Pension & Social Security',
            description: 'Pension schemes, social security, and elderly welfare programs',
            icon: 'fas fa-coins',
            color: '#ef4444'
        },
        'Rural': {
            title: 'Rural Development',
            description: 'Rural infrastructure, village development, and community programs',
            icon: 'fas fa-tractor',
            color: '#84cc16'
        },
        'Digital': {
            title: 'Digital India',
            description: 'Digital services, technology initiatives, and e-governance programs',
            icon: 'fas fa-laptop',
            color: '#6366f1'
        }
    };
    
    // Count schemes per category
    allSchemes.forEach(scheme => {
        const category = scheme.category;
        if (!categoryMap.has(category)) {
            categoryMap.set(category, {
                ...(categoryInfo[category] || {
                    title: category,
                    description: `${category} related government schemes and programs`,
                    icon: 'fas fa-file-alt',
                    color: '#6b7280'
                }),
                key: category,
                schemes: [],
                count: 0
            });
        }
        
        const categoryData = categoryMap.get(category);
        categoryData.schemes.push(scheme);
        categoryData.count++;
    });
    
    return Array.from(categoryMap.values());
}

function displayCategories() {
    const container = document.getElementById('categoriesGrid');
    
    if (!container || !categories || categories.length === 0) {
        console.error('Container or categories data not found');
        return;
    }
    
    container.innerHTML = categories.map(category => createCategoryCard(category)).join('');
    
    // Add animation
    setTimeout(() => {
        container.querySelectorAll('.category-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }, 100);
}

function createCategoryCard(category) {
    const recentSchemes = category.schemes ? category.schemes.slice(0, 3) : [];
    const tags = category.schemes ? [...new Set(category.schemes.flatMap(s => s.keywords || []))].slice(0, 5) : [];
    
    return `
        <div class="category-card" data-category="${category.key}" onclick="showCategoryDetails('${category.key}')">
            <div class="category-icon" style="background: ${category.color}">
                <i class="${category.icon}"></i>
            </div>
            
            <h3 class="category-title">${category.title}</h3>
            <p class="category-description">${category.description}</p>
            
            <div class="category-stats">
                <div class="stat-item">
                    <span class="stat-number">${category.count}</span>
                    <span class="stat-label">Schemes</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${countCentralSchemes(category.schemes)}</span>
                    <span class="stat-label">Central</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${countStateSchemes(category.schemes)}</span>
                    <span class="stat-label">State</span>
                </div>
            </div>
            
            <div class="category-tags">
                ${tags.map(tag => `<span class="category-tag">${tag}</span>`).join('')}
            </div>
            
            <div class="category-actions">
                <button class="action-btn btn-primary" onclick="event.stopPropagation(); browseCategory('${category.key}')">
                    <i class="fas fa-eye"></i> Browse Schemes
                </button>
                <button class="action-btn btn-secondary" onclick="event.stopPropagation(); showCategoryDetails('${category.key}')">
                    <i class="fas fa-info-circle"></i> View Details
                </button>
            </div>
        </div>
    `;
}

function countCentralSchemes(schemes) {
    return schemes.filter(s => s.type === 'Central').length;
}

function countStateSchemes(schemes) {
    return schemes.filter(s => s.type === 'State').length;
}

function showCategoryDetails(categoryKey) {
    const category = categories.find(c => c.key === categoryKey);
    if (!category) return;
    
    const modal = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = category.title;
    modalBody.innerHTML = createCategoryDetailsContent(category);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function createCategoryDetailsContent(category) {
    const topSchemes = category.schemes ? category.schemes.slice(0, 10) : [];
    const keywords = category.schemes ? [...new Set(category.schemes.flatMap(s => s.keywords || []))] : [];
    
    return `
        <div class="category-overview">
            <h3>About ${category.title}</h3>
            <p>${category.description}</p>
            
            <div class="category-stats">
                <div class="stat-item">
                    <span class="stat-number">${category.count}</span>
                    <span class="stat-label">Total Schemes</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${countCentralSchemes(category.schemes)}</span>
                    <span class="stat-label">Central Schemes</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${countStateSchemes(category.schemes)}</span>
                    <span class="stat-label">State Schemes</span>
                </div>
            </div>
            
            <div class="category-actions">
                <button class="action-btn btn-primary" onclick="browseCategory('${category.key}')">
                    <i class="fas fa-search"></i> Browse All ${category.title} Schemes
                </button>
            </div>
        </div>
        
        <div class="schemes-list">
            <h3>Top ${category.title} Schemes</h3>
            ${topSchemes.map(scheme => `
                <div class="scheme-item">
                    <h4>${scheme.title}</h4>
                    <p>${scheme.description}</p>
                    <div class="scheme-keywords">
                        ${scheme.keywords.slice(0, 3).map(keyword => 
                            `<span class="scheme-keyword">${keyword}</span>`
                        ).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="category-keywords">
            <h3>Related Keywords</h3>
            <div class="category-tags">
                ${keywords.slice(0, 15).map(keyword => 
                    `<span class="category-tag">${keyword}</span>`
                ).join('')}
            </div>
        </div>
    `;
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function browseCategory(categoryKey) {
    window.location.href = `schemes.html?category=${categoryKey}`;
}

function setupEventListeners() {
    // Close modal when clicking outside
    document.getElementById('categoryModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCategoryModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCategoryModal();
        }
    });
}

function showErrorMessage() {
    const container = document.getElementById('categoriesGrid');
    container.innerHTML = `
        <div class="error-message">
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Load Categories</h3>
                <p>There was an error loading the categories. Please try again later.</p>
                <button class="btn btn-primary" onclick="loadCategories()">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        </div>
    `;
    
    // Add error styles
    const errorStyles = `
        .error-message {
            grid-column: 1 / -1;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
        }
        
        .error-content {
            text-align: center;
            max-width: 400px;
        }
        
        .error-content i {
            font-size: 4rem;
            color: #ef4444;
            margin-bottom: 1rem;
        }
        
        .error-content h3 {
            color: var(--text-primary);
            margin-bottom: 1rem;
        }
        
        .error-content p {
            color: var(--text-secondary);
            margin-bottom: 2rem;
        }
    `;
    
    if (!document.querySelector('#error-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'error-styles';
        styleSheet.textContent = errorStyles;
        document.head.appendChild(styleSheet);
    }
}

// Handle category navigation from other pages
function navigateToCategory(categoryKey) {
    window.location.href = `categories.html#${categoryKey}`;
}

