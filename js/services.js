// Services Page JavaScript
let allServices = [];
let filteredServices = [];
let currentCategory = 'all';

document.addEventListener('DOMContentLoaded', function() {
    initializeServicesPage();
    loadServices();
    setupEventListeners();
});

function initializeServicesPage() {
    console.log('Services page initialized');
}

function loadServices() {
    // Generate comprehensive government services data
    allServices = [
        // Citizen Services
        {
            id: 'digilocker',
            title: 'DigiLocker',
            description: 'Store and access your important documents digitally',
            category: 'citizen',
            features: ['Digital Storage', 'Secure Access', 'Document Verification'],
            requirements: ['Aadhaar Number', 'Mobile Number', 'Email Address'],
            url: 'https://digilocker.gov.in',
            featured: true
        },
        {
            id: 'passport-seva',
            title: 'Passport Seva',
            description: 'Apply for passport and track application status',
            category: 'citizen',
            features: ['Online Apply', 'Track Status', 'Appointment Booking'],
            requirements: ['Birth Certificate', 'Address Proof', 'Identity Proof'],
            url: 'https://passportindia.gov.in',
            featured: true
        },
        {
            id: 'aadhaar-services',
            title: 'Aadhaar Services',
            description: 'Update Aadhaar details and download e-Aadhaar',
            category: 'citizen',
            features: ['Update Details', 'Download e-Aadhaar', 'Verify Aadhaar'],
            requirements: ['Aadhaar Number', 'OTP Verification'],
            url: 'https://uidai.gov.in'
        },
        {
            id: 'income-certificate',
            title: 'Income Certificate',
            description: 'Apply for income certificate online',
            category: 'citizen',
            features: ['Online Application', 'Status Tracking', 'Digital Certificate'],
            requirements: ['Income Documents', 'Identity Proof', 'Address Proof'],
            url: '#'
        },
        {
            id: 'caste-certificate',
            title: 'Caste Certificate',
            description: 'Apply for caste certificate verification',
            category: 'citizen',
            features: ['Online Application', 'Document Upload', 'Verification'],
            requirements: ['Birth Certificate', 'Community Certificate', 'Identity Proof'],
            url: '#'
        },

        // Employment Services
        {
            id: 'epfo',
            title: 'EPFO Portal',
            description: 'Manage your provident fund and pension services',
            category: 'employment',
            features: ['PF Balance', 'Pension', 'Withdrawal', 'Transfer'],
            requirements: ['UAN Number', 'Aadhaar Linking', 'Bank Details'],
            url: 'https://epfindia.gov.in',
            featured: true
        },
        {
            id: 'esic',
            title: 'ESIC Services',
            description: 'Employee State Insurance Corporation services',
            category: 'employment',
            features: ['Medical Benefits', 'Disability Benefits', 'Unemployment Allowance'],
            requirements: ['ESIC Number', 'Medical Card', 'Employment Proof'],
            url: 'https://esic.nic.in'
        },
        {
            id: 'ncs',
            title: 'National Career Service',
            description: 'Job search and career guidance portal',
            category: 'employment',
            features: ['Job Search', 'Skill Assessment', 'Career Counseling'],
            requirements: ['Registration', 'Resume Upload', 'Skill Verification'],
            url: 'https://ncs.gov.in'
        },
        {
            id: 'pmkvy',
            title: 'PM Kaushal Vikas Yojana',
            description: 'Skill development and certification programs',
            category: 'employment',
            features: ['Skill Training', 'Certification', 'Job Placement'],
            requirements: ['Age 18-45', 'Educational Qualification', 'Aadhaar'],
            url: 'https://pmkvyofficial.org'
        },

        // Business Services
        {
            id: 'udyam-registration',
            title: 'Udyam Registration',
            description: 'Register your MSME business online',
            category: 'business',
            features: ['Online Registration', 'Certificate Generation', 'Benefits Access'],
            requirements: ['Aadhaar', 'Business Details', 'Bank Account'],
            url: 'https://udyamregistration.gov.in'
        },
        {
            id: 'gst-portal',
            title: 'GST Portal',
            description: 'Goods and Services Tax registration and filing',
            category: 'business',
            features: ['GST Registration', 'Return Filing', 'Payment'],
            requirements: ['PAN Card', 'Business Registration', 'Bank Details'],
            url: 'https://gst.gov.in'
        },
        {
            id: 'startup-india',
            title: 'Startup India',
            description: 'Registration and support for startups',
            category: 'business',
            features: ['Startup Recognition', 'Tax Benefits', 'Funding Support'],
            requirements: ['Business Plan', 'Incorporation Certificate', 'Innovation Proof'],
            url: 'https://startupindia.gov.in'
        },
        {
            id: 'mca-services',
            title: 'MCA Services',
            description: 'Ministry of Corporate Affairs services',
            category: 'business',
            features: ['Company Registration', 'Annual Filing', 'Compliance'],
            requirements: ['DIN', 'DSC', 'Company Documents'],
            url: 'https://mca.gov.in'
        },

        // Education Services
        {
            id: 'nsp-portal',
            title: 'National Scholarship Portal',
            description: 'Apply for various scholarships and track status',
            category: 'education',
            features: ['Scholarship Application', 'Status Tracking', 'Document Upload'],
            requirements: ['Academic Records', 'Income Certificate', 'Bank Details'],
            url: 'https://scholarships.gov.in'
        },
        {
            id: 'swayam',
            title: 'SWAYAM Portal',
            description: 'Online courses and educational content',
            category: 'education',
            features: ['Free Courses', 'Certification', 'Credits Transfer'],
            requirements: ['Registration', 'Educational Background'],
            url: 'https://swayam.gov.in'
        },
        {
            id: 'diksha',
            title: 'DIKSHA Platform',
            description: 'Digital learning platform for teachers and students',
            category: 'education',
            features: ['Learning Content', 'Teacher Training', 'Assessment'],
            requirements: ['Teacher ID', 'School Registration'],
            url: 'https://diksha.gov.in'
        },
        {
            id: 'samagra-shiksha',
            title: 'Samagra Shiksha',
            description: 'School education scheme services',
            category: 'education',
            features: ['School Grants', 'Teacher Training', 'Infrastructure'],
            requirements: ['School Code', 'Principal Authorization'],
            url: '#'
        },

        // Health Services
        {
            id: 'cowin',
            title: 'CoWIN Portal',
            description: 'COVID-19 vaccination registration and certificates',
            category: 'health',
            features: ['Vaccination Registration', 'Certificate Download', 'Appointment Booking'],
            requirements: ['Mobile Number', 'Identity Proof', 'Age Verification'],
            url: 'https://cowin.gov.in'
        },
        {
            id: 'ayushman-bharat',
            title: 'Ayushman Bharat',
            description: 'Health insurance scheme services',
            category: 'health',
            features: ['Beneficiary Verification', 'Hospital Search', 'Treatment Coverage'],
            requirements: ['Beneficiary ID', 'Identity Proof', 'Medical Records'],
            url: 'https://pmjay.gov.in'
        },
        {
            id: 'esanjeevani',
            title: 'eSanjeevani',
            description: 'Telemedicine and online consultation',
            category: 'health',
            features: ['Online Consultation', 'Digital Prescription', 'Health Records'],
            requirements: ['Registration', 'Medical History', 'Symptoms Description'],
            url: 'https://esanjeevani.in'
        },
        {
            id: 'blood-donation',
            title: 'e-Raktkosh',
            description: 'Blood bank and donation services',
            category: 'health',
            features: ['Blood Availability', 'Donation Registration', 'Blood Bank Search'],
            requirements: ['Age 18-65', 'Health Certificate', 'Identity Proof'],
            url: 'https://eraktkosh.in'
        },

        // Finance Services
        {
            id: 'pm-jan-dhan',
            title: 'PM Jan Dhan Yojana',
            description: 'Financial inclusion and banking services',
            category: 'finance',
            features: ['Bank Account Opening', 'Insurance Benefits', 'Pension Scheme'],
            requirements: ['Aadhaar Card', 'Address Proof', 'Photograph'],
            url: '#'
        },
        {
            id: 'pfms',
            title: 'PFMS Portal',
            description: 'Public Financial Management System',
            category: 'finance',
            features: ['Payment Tracking', 'Beneficiary Status', 'Financial Transparency'],
            requirements: ['Beneficiary ID', 'Bank Account Details'],
            url: 'https://pfms.nic.in'
        },
        {
            id: 'rtgs-neft',
            title: 'RTGS/NEFT Services',
            description: 'Real-time fund transfer services',
            category: 'finance',
            features: ['Fund Transfer', 'Transaction Status', 'Bank Integration'],
            requirements: ['Bank Account', 'Beneficiary Details', 'IFSC Code'],
            url: '#'
        },
        {
            id: 'mudra-loan',
            title: 'MUDRA Loan',
            description: 'Micro Units Development and Refinance Agency',
            category: 'finance',
            features: ['Loan Application', 'Status Tracking', 'Subsidy Calculation'],
            requirements: ['Business Plan', 'Identity Proof', 'Business Registration'],
            url: 'https://mudra.org.in'
        }
    ];

    filteredServices = [...allServices];
    displayServices();
}

function setupEventListeners() {
    // Category filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(button => button.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            filterServices(category);
        });
    });
}

function filterServices(category) {
    currentCategory = category;
    
    if (category === 'all') {
        filteredServices = [...allServices];
    } else {
        filteredServices = allServices.filter(service => service.category === category);
    }
    
    displayServices();
}

function displayServices() {
    const container = document.getElementById('servicesGrid');
    
    container.innerHTML = filteredServices.map(service => createServiceCard(service)).join('');
    
    // Add animation
    setTimeout(() => {
        container.querySelectorAll('.service-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }, 100);
}

function createServiceCard(service) {
    return `
        <div class="service-card ${service.featured ? 'featured' : ''}" data-category="${service.category}">
            <div class="service-icon">
                <i class="${getServiceIcon(service.category)}"></i>
            </div>
            <h3>${service.title}</h3>
            <p>${service.description}</p>
            <div class="service-features">
                ${service.features.map(feature => 
                    `<span class="feature-tag">${feature}</span>`
                ).join('')}
            </div>
            <button class="service-btn" onclick="openService('${service.id}')">
                <i class="fas fa-external-link-alt"></i>
                Access Service
            </button>
        </div>
    `;
}

function getServiceIcon(category) {
    const icons = {
        'citizen': 'fas fa-user',
        'business': 'fas fa-briefcase',
        'employment': 'fas fa-handshake',
        'education': 'fas fa-graduation-cap',
        'health': 'fas fa-heartbeat',
        'finance': 'fas fa-coins'
    };
    return icons[category] || 'fas fa-cog';
}

function openService(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    if (!service) return;
    
    // Show service details modal
    showServiceModal(service);
}

function showServiceModal(service) {
    const modal = document.getElementById('serviceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = service.title;
    modalBody.innerHTML = createServiceDetailsContent(service);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function createServiceDetailsContent(service) {
    return `
        <div class="service-details">
            <h3>About ${service.title}</h3>
            <p>${service.description}</p>
            
            <div class="service-features">
                <h4>Key Features:</h4>
                <ul>
                    ${service.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                </ul>
            </div>
        </div>
        
        <div class="service-requirements">
            <h4>Requirements:</h4>
            <ul>
                ${service.requirements.map(req => `<li><i class="fas fa-document"></i> ${req}</li>`).join('')}
            </ul>
        </div>
        
        <div class="service-actions">
            ${service.url !== '#' ? 
                `<a href="${service.url}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt"></i> Visit Official Portal
                </a>` : 
                `<button class="btn btn-secondary" disabled>
                    <i class="fas fa-info-circle"></i> Coming Soon
                </button>`
            }
            <button class="btn btn-secondary" onclick="closeServiceModal()">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;
}

function closeServiceModal() {
    const modal = document.getElementById('serviceModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('serviceModal');
    if (e.target === modal) {
        closeServiceModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeServiceModal();
    }
});
