# Yojana Dost - Government Schemes Web Portal

## Overview

Yojana Dost is a comprehensive government schemes web portal inspired by the Indian Government's UMANG platform. It serves as a one-stop destination for citizens to discover, explore, and access 400+ government schemes across central and state levels. The portal features a modern, responsive design with integrated AI chatbot assistance for seamless user experience.

## System Architecture

### Frontend Architecture
- **Framework**: Vanilla HTML, CSS, and JavaScript (no frameworks)
- **Architecture Pattern**: Multi-page application with page-specific modules
- **Styling**: CSS modules with global styles and page-specific stylesheets
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Typography**: Inter font family for modern, clean appearance
- **Icons**: Font Awesome for consistent iconography

### File Structure
```
├── HTML Pages (9 files)
│   ├── index.html (Landing page)
│   ├── schemes.html (Schemes listing)
│   ├── categories.html (Scheme categories)
│   ├── state-schemes.html (State-wise schemes)
│   ├── services.html (Government services)
│   ├── my-profile.html (User profile)
│   ├── about.html (About page)
│   ├── contact.html (Contact form)
│   └── chatbot.html (AI assistant)
├── CSS Files (page-specific styling)
├── JS Files (page-specific functionality)
└── Data Files (JSON-based content)
```

## Key Components

### 1. Navigation System
- **Component**: Global navigation bar with responsive design
- **Features**: Sticky header, active state management, mobile hamburger menu
- **Implementation**: CSS transitions and JavaScript event handling

### 2. Scheme Management
- **Data Source**: JSON file containing 400+ government schemes
- **Features**: Search, filtering, categorization, pagination
- **Display Modes**: Grid and list views with detailed scheme cards

### 3. AI Chatbot Assistant
- **Architecture**: Rule-based chatbot with fuzzy matching
- **Implementation**: Pure JavaScript without external APIs
- **Features**: 
  - Floating widget on all pages
  - Full-screen interface on dedicated page
  - Keyword-based scheme recommendations
  - Offline functionality

### 4. Category System
- **Categories**: Health, Education, Farmers, Women, Pension, Business, Housing, etc.
- **Organization**: Scheme classification with visual indicators
- **Navigation**: Category-based browsing with breadcrumbs

### 5. State-wise Schemes
- **Feature**: State selection with localized scheme display
- **Implementation**: Dynamic filtering based on state selection
- **UI**: Interactive state grid with scheme count indicators

### 6. User Profile Management
- **Features**: Profile settings, bookmarked schemes, application tracking
- **Storage**: localStorage for client-side data persistence
- **Sections**: Personal info, preferences, notifications, privacy settings

## Data Flow

### 1. Scheme Data Loading
```
schemes.json → JavaScript modules → DOM rendering → User interaction
```

### 2. Search and Filtering
```
User input → Filter functions → Scheme matching → Results display → Pagination
```

### 3. Chatbot Interaction
```
User query → Fuzzy matching → Scheme database → Response generation → UI update
```

### 4. State Selection
```
State selection → Scheme filtering → Regional data display → Navigation update
```

## External Dependencies

### 1. Fonts
- **Google Fonts**: Inter font family (weights: 300, 400, 500, 600, 700)
- **Purpose**: Modern typography with excellent readability

### 2. Icons
- **Font Awesome 6.0.0**: Complete icon library via CDN
- **Usage**: UI icons, navigation, feature indicators

### 3. No Backend Dependencies
- **Data Storage**: Static JSON files
- **State Management**: Browser localStorage
- **No Database**: Client-side only architecture

## Deployment Strategy

### 1. Static Hosting
- **Recommended**: GitHub Pages, Netlify, Vercel, or any static file server
- **Requirements**: Simple HTTP server for JSON file serving
- **Configuration**: No server-side configuration needed

### 2. File Organization
- **Structure**: Modular approach with separate files for each page
- **Assets**: Centralized CSS and JS files with global styles
- **Data**: JSON files in data directory for scheme information

### 3. Performance Optimization
- **Loading**: Lazy loading for non-critical resources
- **Caching**: Browser caching for static assets
- **Compression**: Minification recommended for production

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 06, 2025. Initial setup