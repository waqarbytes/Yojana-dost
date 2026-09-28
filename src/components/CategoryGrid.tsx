import React from "react";

export interface CategoryGridProps {
  onSelectCategory: (categoryId: string) => void;
  selectedCategory?: string;
}

export interface SchemeCategoryInfo {
  id: string;
  nameEn: string;
  nameHi: string;
  icon: string;
  count: number;
  colorClass: string;
  description: string;
}

export const OFFICIAL_CATEGORIES: SchemeCategoryInfo[] = [
  {
    id: "Agriculture",
    nameEn: "Agriculture, Rural & Environment",
    nameHi: "कृषि, ग्रामीण और पर्यावरण",
    icon: "🌾",
    count: 24,
    colorClass: "cat-agri",
    description: "PM-KISAN, PMFBY crop insurance, Soil health card, KCC credit",
  },
  {
    id: "Financial Services",
    nameEn: "Banking, Financial & Insurance",
    nameHi: "बैंकिंग, वित्तीय सेवाएं और बीमा",
    icon: "💳",
    count: 19,
    colorClass: "cat-banking",
    description: "PM Jan Dhan, PMJJBY insurance, PMSBY accident cover, APY pension",
  },
  {
    id: "Business & Employment",
    nameEn: "Business & Entrepreneurship",
    nameHi: "व्यापार और उद्यमिता",
    icon: "💼",
    count: 16,
    colorClass: "cat-business",
    description: "PM MUDRA loans, Stand-Up India, PM SVANidhi, PM Vishwakarma",
  },
  {
    id: "Education",
    nameEn: "Education & Learning",
    nameHi: "शिक्षा और शिक्षण",
    icon: "🎓",
    count: 18,
    colorClass: "cat-edu",
    description: "National Scholarship Portal, PM-SHRI, Post-Matric fellowships",
  },
  {
    id: "Health",
    nameEn: "Health & Wellness",
    nameHi: "स्वास्थ्य और कल्याण",
    icon: "🏥",
    count: 14,
    colorClass: "cat-health",
    description: "Ayushman Bharat PM-JAY ₹5L cover, Jan Aushadhi, PM-ABHIM",
  },
  {
    id: "Housing",
    nameEn: "Housing & Shelter",
    nameHi: "आवास और आश्रय",
    icon: "🏠",
    count: 8,
    colorClass: "cat-housing",
    description: "PM Awas Yojana (PMAY-Gramin & PMAY-Urban) interest subsidy",
  },
  {
    id: "Public Safety",
    nameEn: "Public Safety, Law & Justice",
    nameHi: "सार्वजनिक सुरक्षा, कानून और न्याय",
    icon: "⚖️",
    count: 6,
    colorClass: "cat-law",
    description: "Tele-Law free legal advice, NALSA legal aid, Nyaya Bandhu",
  },
  {
    id: "Science & IT",
    nameEn: "Science, IT & Communications",
    nameHi: "विज्ञान, आईटी और संचार",
    icon: "🔬",
    count: 7,
    colorClass: "cat-tech",
    description: "Digital India initiatives, PM-WANI public Wi-Fi, Cyber Surakshit",
  },
  {
    id: "Skills & Employment",
    nameEn: "Skills & Employment",
    nameHi: "कौशल और रोजगार",
    icon: "🛠️",
    count: 12,
    colorClass: "cat-skills",
    description: "PM Kaushal Vikas Yojana (PMKVY), National Apprenticeship Mela",
  },
  {
    id: "Social Welfare",
    nameEn: "Social Welfare & Empowerment",
    nameHi: "सामाजिक कल्याण और अधिकारिता",
    icon: "🤝",
    count: 15,
    colorClass: "cat-social",
    description: "NSAP Old Age Pension, Divyangjan disability benefits, Senior care",
  },
  {
    id: "Sports & Culture",
    nameEn: "Sports & Culture",
    nameHi: "खेल और संस्कृति",
    icon: "🏆",
    count: 5,
    colorClass: "cat-sports",
    description: "Khelo India youth sports scholarship, National Sports Talent Search",
  },
  {
    id: "Transport & Infra",
    nameEn: "Transport & Infrastructure",
    nameHi: "परिवहन और बुनियादी ढांचा",
    icon: "🚗",
    count: 6,
    colorClass: "cat-transport",
    description: "PM Gram Sadak Yojana (PMGSY), Bharatmala connectivity",
  },
  {
    id: "Travel & Tourism",
    nameEn: "Travel & Tourism",
    nameHi: "यात्रा और पर्यटन",
    icon: "✈️",
    count: 4,
    colorClass: "cat-tourism",
    description: "Dekho Apna Desh, Swadesh Darshan, PRASHAD pilgrimage scheme",
  },
  {
    id: "Utility & Sanitation",
    nameEn: "Utility & Sanitation",
    nameHi: "उपयोगिता और स्वच्छता",
    icon: "🚰",
    count: 9,
    colorClass: "cat-utility",
    description: "Jal Jeevan Mission Har Ghar Jal, Swachh Bharat Mission (Grameen)",
  },
  {
    id: "Women & Child",
    nameEn: "Women and Child",
    nameHi: "महिला एवं बाल विकास",
    icon: "👩",
    count: 17,
    colorClass: "cat-women",
    description: "Sukanya Samriddhi Yojana, Beti Bachao Beti Padhao, PM Ujjwala LPG",
  },
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  onSelectCategory,
  selectedCategory = "all",
}) => {
  return (
    <section className="yd-categories-section container">
      <div className="section-title-wrap">
        <span className="section-eyebrow">BROWSE BY SECTOR</span>
        <h2 className="section-title">Explore Schemes by Category</h2>
        <p className="section-desc">
          Browse through 15 official government welfare sectors or select a category to view all matching schemes.
        </p>
      </div>

      <div className="yd-categories-grid">
        {OFFICIAL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
          return (
            <div
              key={cat.id}
              className={`yd-category-card ${cat.colorClass} ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectCategory(cat.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelectCategory(cat.id);
                }
              }}
            >
              <div className="category-card-top">
                <div className="category-icon-box">{cat.icon}</div>
                <span className="category-count-pill">{cat.count} Schemes</span>
              </div>

              <h3 className="category-name-en">{cat.nameEn}</h3>
              <p className="category-name-hi">{cat.nameHi}</p>
              <p className="category-summary">{cat.description}</p>

              <div className="category-card-footer">
                <span className="view-link">Explore Schemes ➔</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
