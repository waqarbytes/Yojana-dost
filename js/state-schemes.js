// State Schemes Page JavaScript
let allSchemes = [];
let states = [];
let selectedState = '';
let filteredStateSchemes = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeStateSchemes();
    loadStatesAndSchemes();
    setupEventListeners();
});

function initializeStateSchemes() {
    console.log('State schemes page initialized');
    
    // Check for state parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const stateParam = urlParams.get('state');
    
    if (stateParam) {
        selectedState = stateParam;
        document.getElementById('stateSelect').value = stateParam;
        setTimeout(() => {
            selectState(stateParam);
        }, 1000);
    }
}

async function loadStatesAndSchemes() {
    const loadingContainer = document.getElementById('loadingContainer');
    
    try {
        loadingContainer.classList.add('active');
        
        const response = await fetch('data/schemes.json');
        if (!response.ok) {
            throw new Error('Failed to load schemes data');
        }
        
        allSchemes = await response.json();
        states = generateStates();
        
        displayStatesGrid();
        loadingContainer.classList.remove('active');
        
    } catch (error) {
        console.error('Error loading state schemes:', error);
        showErrorMessage();
        loadingContainer.classList.remove('active');
    }
}

function generateStates() {
    const stateMap = new Map();
    
    // Define state information
    const stateInfo = {
        'central': {
            name: 'Central Government',
            description: 'Schemes applicable across all states and union territories',
            code: 'IN'
        },
        'andhra-pradesh': {
            name: 'Andhra Pradesh',
            description: 'State schemes for Andhra Pradesh',
            code: 'AP'
        },
        'assam': {
            name: 'Assam',
            description: 'State schemes for Assam',
            code: 'AS'
        },
        'bihar': {
            name: 'Bihar',
            description: 'State schemes for Bihar',
            code: 'BR'
        },
        'chhattisgarh': {
            name: 'Chhattisgarh',
            description: 'State schemes for Chhattisgarh',
            code: 'CG'
        },
        'goa': {
            name: 'Goa',
            description: 'State schemes for Goa',
            code: 'GA'
        },
        'gujarat': {
            name: 'Gujarat',
            description: 'State schemes for Gujarat',
            code: 'GJ'
        },
        'haryana': {
            name: 'Haryana',
            description: 'State schemes for Haryana',
            code: 'HR'
        },
        'himachal-pradesh': {
            name: 'Himachal Pradesh',
            description: 'State schemes for Himachal Pradesh',
            code: 'HP'
        },
        'jharkhand': {
            name: 'Jharkhand',
            description: 'State schemes for Jharkhand',
            code: 'JH'
        },
        'karnataka': {
            name: 'Karnataka',
            description: 'State schemes for Karnataka',
            code: 'KA'
        },
        'kerala': {
            name: 'Kerala',
            description: 'State schemes for Kerala',
            code: 'KL'
        },
        'madhya-pradesh': {
            name: 'Madhya Pradesh',
            description: 'State schemes for Madhya Pradesh',
            code: 'MP'
        },
        'maharashtra': {
            name: 'Maharashtra',
            description: 'State schemes for Maharashtra',
            code: 'MH'
        },
        'manipur': {
            name: 'Manipur',
            description: 'State schemes for Manipur',
            code: 'MN'
        },
        'meghalaya': {
            name: 'Meghalaya',
            description: 'State schemes for Meghalaya',
            code: 'ML'
        },
        'mizoram': {
            name: 'Mizoram',
            description: 'State schemes for Mizoram',
            code: 'MZ'
        },
        'nagaland': {
            name: 'Nagaland',
            description: 'State schemes for Nagaland',
            code: 'NL'
        },
        'odisha': {
            name: 'Odisha',
            description: 'State schemes for Odisha',
            code: 'OR'
        },
        'punjab': {
            name: 'Punjab',
            description: 'State schemes for Punjab',
            code: 'PB'
        },
        'rajasthan': {
            name: 'Rajasthan',
            description: 'State schemes for Rajasthan',
            code: 'RJ'
        },
        'sikkim': {
            name: 'Sikkim',
            description: 'State schemes for Sikkim',
            code: 'SK'
        },
        'tamil-nadu': {
            name: 'Tamil Nadu',
            description: 'State schemes for Tamil Nadu',
            code: 'TN'
        },
        'telangana': {
            name: 'Telangana',
            description: 'State schemes for Telangana',
            code: 'TG'
        },
        'tripura': {
            name: 'Tripura',
            description: 'State schemes for Tripura',
            code: 'TR'
        },
        'uttar-pradesh': {
            name: 'Uttar Pradesh',
            description: 'State schemes for Uttar Pradesh',
            code: 'UP'
        },
        'uttarakhand': {
            name: 'Uttarakhand',
            description: 'State schemes for Uttarakhand',
            code: 'UK'
        },
        'west-bengal': {
            name: 'West Bengal',
            description: 'State schemes for West Bengal',
            code: 'WB'
        }
    };
    
    // Count schemes per state
    allSchemes.forEach(scheme => {
        const state = scheme.state;
        if (!stateMap.has(state) && stateInfo[state]) {
            stateMap.set(state, {
                ...stateInfo[state],
                key: state,
                schemes: [],
                count: 0
            });
        }
        
        if (stateMap.has(state)) {
            const stateData = stateMap.get(state);
            stateData.schemes.push(scheme);
            stateData.count++;
        }
    });
    
    return Array.from(stateMap.values());
}

function displayStatesGrid() {
    const container = document.getElementById('statesGrid');
    
    container.innerHTML = states.map(state => createStateCard(state)).join('');
    
    // Add animation
    setTimeout(() => {
        container.querySelectorAll('.state-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }, 100);
}

function createStateCard(state) {
    const categories = [...new Set(state.schemes.map(s => s.category))];
    
    return `
        <div class="state-card" data-state="${state.key}" onclick="selectState('${state.key}')">
            <div class="state-flag">
                ${state.code}
            </div>
            <h3 class="state-name">${state.name}</h3>
            <p class="state-scheme-count">${state.count} schemes available</p>
            <div class="state-categories">
                ${categories.slice(0, 4).map(category => 
                    `<span class="state-category">${category}</span>`
                ).join('')}
                ${categories.length > 4 ? `<span class="state-category">+${categories.length - 4} more</span>` : ''}
            </div>
        </div>
    `;
}

function selectState(stateKey) {
    if (!stateKey) return;
    
    selectedState = stateKey;
    const state = states.find(s => s.key === stateKey);
    
    if (!state) return;
    
    // Hide states grid and show state details
    document.querySelector('.states-grid-section').style.display = 'none';
    document.getElementById('stateDetails').style.display = 'block';
    
    // Update state information
    document.getElementById('selectedStateName').textContent = state.name;
    document.getElementById('selectedStateDescription').textContent = state.description;
    document.getElementById('totalSchemes').textContent = state.count;
    document.getElementById('activeSchemes').textContent = state.count;
    
    // Update categories count
    const categories = [...new Set(state.schemes.map(s => s.category))];
    document.getElementById('categoriesCount').textContent = categories.length;
    
    // Populate category filter
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="">All Categories</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    
    // Display state schemes
    filteredStateSchemes = [...state.schemes];
    displayStateSchemes();
    
    // Scroll to state details
    document.getElementById('stateDetails').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function displayStateSchemes() {
    const container = document.getElementById('stateSchemesGrid');
    
    container.innerHTML = filteredStateSchemes.map(scheme => createStateSchemeCard(scheme)).join('');
    
    // Add animation
    setTimeout(() => {
        container.querySelectorAll('.state-scheme-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }, 100);
}

function createStateSchemeCard(scheme) {
    return `
        <div class="state-scheme-card" onclick="viewSchemeDetails('${scheme.id}')">
            <span class="scheme-category-badge" style="background: ${getCategoryColor(scheme.category)}">
                ${scheme.category}
            </span>
            <h3 class="scheme-title">${scheme.title}</h3>
            <p class="scheme-description">${scheme.description}</p>
            <div class="scheme-keywords">
                ${scheme.keywords.slice(0, 3).map(keyword => 
                    `<span class="scheme-keyword">${keyword}</span>`
                ).join('')}
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

function filterStateSchemes() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const state = states.find(s => s.key === selectedState);
    
    if (!state) return;
    
    filteredStateSchemes = state.schemes.filter(scheme => {
        return !categoryFilter || scheme.category === categoryFilter;
    });
    
    displayStateSchemes();
}

function sortStateSchemes() {
    const sortBy = document.getElementById('sortFilter').value;
    
    switch (sortBy) {
        case 'name':
            filteredStateSchemes.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredStateSchemes.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'category':
            filteredStateSchemes.sort((a, b) => a.category.localeCompare(b.category));
            break;
    }
    
    displayStateSchemes();
}

function viewSchemeDetails(schemeId) {
    const scheme = allSchemes.find(s => s.id === schemeId);
    if (scheme) {
        // Reuse the modal from schemes.js
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
    
    // Add modal styles if not already present
    if (!document.querySelector('#modal-styles')) {
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
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'modal-styles';
        styleSheet.textContent = modalStyles;
        document.head.appendChild(styleSheet);
    }
}

function setupEventListeners() {
    // State search functionality
    const stateSearch = document.getElementById('stateSearch');
    if (stateSearch) {
        stateSearch.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const stateCards = document.querySelectorAll('.state-card');
            
            stateCards.forEach(card => {
                const stateName = card.querySelector('.state-name').textContent.toLowerCase();
                if (stateName.includes(query)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

function showErrorMessage() {
    const statesGrid = document.getElementById('statesGrid');
    statesGrid.innerHTML = `
        <div class="error-message">
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Load State Schemes</h3>
                <p>There was an error loading the state schemes. Please try again later.</p>
                <button class="btn btn-primary" onclick="loadStatesAndSchemes()">
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
