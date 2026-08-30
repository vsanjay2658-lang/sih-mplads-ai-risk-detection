// Unspent Funds and AI Welfare Reallocation Data computed from MPLADS National Database
export const SURPLUS_FUNDS_SUMMARY = {
  totalSurplusCr: 103.69,       // ₹103.69 Cr saved
  completedProjectsWithSavings: 5951,
  constituenciesWithSavings: 246,
  averageSavingsPerProject: 174234, // ₹1.74 Lakhs
  topCategoriesSaved: [
    { category: "Road & Bridge Works", savedCr: 38.4, pct: 37 },
    { category: "Community Infrastructure", savedCr: 28.1, pct: 27 },
    { category: "Drinking Water Supply", savedCr: 19.5, pct: 19 },
    { category: "Education & Schools", savedCr: 11.2, pct: 11 },
    { category: "Public Health", savedCr: 6.49, pct: 6 },
  ]
};

export const CONSTITUENCY_SURPLUS_OPPORTUNITIES = [
  {
    id: "barrackpur",
    constituency: "BARRACKPUR",
    state: "West Bengal",
    ida: "North 24 Parganas DM",
    mp_name: "Shri Arjun Singh",
    project_count: 2,
    total_sanction: 32000000,
    total_spent: 20600000,
    total_savings: 11400000,
    savings_formatted: "₹1.14 Cr",
    savings_percentage: 35.6,
    source_projects: [
      { work_id: "WS/MP041/2023-2024/11024", name: "Drainage & Sewerage Upgradation Scheme", sanction: 20000000, spent: 12500000, savings: 7500000 },
      { work_id: "WS/MP041/2023-2024/11029", name: "High-Mast Flood Lighting & Civic Pavilion", sanction: 12000000, spent: 8100000, savings: 3900000 },
    ],
    recommended_welfare_works: [
      {
        id: "w1",
        title: "Solar Mini-Grid & Smart Street Lighting in 14 Wards",
        category: "Renewable Energy",
        estimated_cost: 3500000,
        estimated_cost_formatted: "₹35.0 L",
        beneficiaries: "45,000 residents",
        priority: "High Priority",
        impact_score: 94,
        description: "Installation of 220 decentralized solar LED street lights in high-traffic public walkways and school zones to improve night safety and reduce municipal grid bills."
      },
      {
        id: "w2",
        title: "Modern STEM & Digital Smart Classrooms in 8 Govt High Schools",
        category: "Education & Youth",
        estimated_cost: 4000000,
        estimated_cost_formatted: "₹40.0 L",
        beneficiaries: "3,200 students",
        priority: "High Priority",
        impact_score: 91,
        description: "Equipping underprivileged government schools with interactive smart boards, coding lab computers, and STEM robotics learning kits."
      },
      {
        id: "w3",
        title: "Community RO Water Purification Plants (4 Units)",
        category: "Drinking Water & Sanitation",
        estimated_cost: 2500000,
        estimated_cost_formatted: "₹25.0 L",
        beneficiaries: "18,000 residents",
        priority: "Medium Priority",
        impact_score: 88,
        description: "Setting up 4 heavy-duty 1000 LPH RO water dispensing kiosks in semi-urban resettlement colonies."
      },
      {
        id: "w4",
        title: "Primary Health Center Cold-Chain & Diagnostic Gear",
        category: "Public Healthcare",
        estimated_cost: 1400000,
        estimated_cost_formatted: "₹14.0 L",
        beneficiaries: "12,500 patients/yr",
        priority: "Medium Priority",
        impact_score: 86,
        description: "Procurement of automated hematology analyzers, solar vaccine refrigerators, and emergency ECG units."
      }
    ]
  },
  {
    id: "hamirpur_up",
    constituency: "HAMIRPUR_UP",
    state: "Uttar Pradesh",
    ida: "Hamirpur District Magistrate",
    mp_name: "Kunwar Pushpendra Singh Chandel",
    project_count: 28,
    total_sanction: 21500000,
    total_spent: 16580000,
    total_savings: 4920000,
    savings_formatted: "₹49.2 L",
    savings_percentage: 22.9,
    source_projects: [
      { work_id: "WS/MP188/2023-2024/44120", name: "Rural Connectivity Link Roads (12 Patches)", sanction: 12000000, spent: 9200000, savings: 2800000 },
      { work_id: "WS/MP188/2023-2024/44135", name: "Village Handpump Installation & Recharging", sanction: 5500000, spent: 4100000, savings: 1400000 },
      { work_id: "WS/MP188/2023-2024/44140", name: "Panchayat Community Shed Construction", sanction: 4000000, spent: 3280000, savings: 720000 },
    ],
    recommended_welfare_works: [
      {
        id: "w5",
        title: "Solar Powered Agricultural Water Pumps & Channelling",
        category: "Rural Agriculture",
        estimated_cost: 2200000,
        estimated_cost_formatted: "₹22.0 L",
        beneficiaries: "350 farming families",
        priority: "High Priority",
        impact_score: 95,
        description: "Deploying 8 solar irrigation borewell systems in water-scarce Bundelkhand farming clusters."
      },
      {
        id: "w6",
        title: "Model Anganwadi Learning & Nutrition Upgradation (10 Centers)",
        category: "Child & Maternal Welfare",
        estimated_cost: 1600000,
        estimated_cost_formatted: "₹16.0 L",
        beneficiaries: "1,400 infants & mothers",
        priority: "High Priority",
        impact_score: 92,
        description: "Transforming 10 rural Anganwadis into joyful learning centers with water filters, play equipment, and fortified storage."
      },
      {
        id: "w7",
        title: "Village Youth Open Gymnasium & Sports Arena",
        category: "Sports & Youth",
        estimated_cost: 1100000,
        estimated_cost_formatted: "₹11.0 L",
        beneficiaries: "2,200 rural youth",
        priority: "Medium Priority",
        impact_score: 84,
        description: "All-weather open gym apparatus and track paving in central Gram Panchayat grounds."
      }
    ]
  },
  {
    id: "bardhaman_durgapur",
    constituency: "BARDHAMAN-DURGAPUR",
    state: "West Bengal",
    ida: "Paschim Bardhaman DM",
    mp_name: "Shri S.S. Ahluwalia",
    project_count: 3,
    total_sanction: 18000000,
    total_spent: 13600000,
    total_savings: 4400000,
    savings_formatted: "₹44.0 L",
    savings_percentage: 24.4,
    source_projects: [
      { work_id: "WS/MP038/2023-2024/19820", name: "Industrial Corridor Drainage & Paving", sanction: 11000000, spent: 8200000, savings: 2800000 },
      { work_id: "WS/MP038/2023-2024/19824", name: "Public Park & Community Green Belt", sanction: 7000000, spent: 5400000, savings: 1600000 },
    ],
    recommended_welfare_works: [
      {
        id: "w8",
        title: "Digital Community Library & Free Wi-Fi Study Hub",
        category: "Youth Empowerment",
        estimated_cost: 2000000,
        estimated_cost_formatted: "₹20.0 L",
        beneficiaries: "5,000 students/yr",
        priority: "High Priority",
        impact_score: 90,
        description: "Air-conditioned public reading room with 20 internet workstations for competitive exam aspirants."
      },
      {
        id: "w9",
        title: "Mobile Veterinary Clinic & Cattle Health Unit",
        category: "Animal Welfare & Dairy",
        estimated_cost: 1500000,
        estimated_cost_formatted: "₹15.0 L",
        beneficiaries: "1,200 dairy farmers",
        priority: "Medium Priority",
        impact_score: 87,
        description: "Customized mobile healthcare van for prompt livestock diagnosis and vaccination in rural pockets."
      },
      {
        id: "w10",
        title: "Rainwater Harvesting & Ground Water Recharge Pits",
        category: "Water Conservation",
        estimated_cost: 900000,
        estimated_cost_formatted: "₹9.0 L",
        beneficiaries: "Entire peri-urban zone",
        priority: "Medium Priority",
        impact_score: 85,
        description: "Construction of 15 groundwater recharge filtration shafts at municipal buildings."
      }
    ]
  },
  {
    id: "alappuzha",
    constituency: "ALAPPUZHA",
    state: "Kerala",
    ida: "Alappuzha District Collector",
    mp_name: "Shri A.M. Ariff",
    project_count: 5,
    total_sanction: 16500000,
    total_spent: 12540000,
    total_savings: 3960000,
    savings_formatted: "₹39.6 L",
    savings_percentage: 24.0,
    source_projects: [
      { work_id: "WS/MP132/2023-2024/77102", name: "Canal Bank Retaining Wall Construction", sanction: 10000000, spent: 7600000, savings: 2400000 },
      { work_id: "WS/MP132/2023-2024/77108", name: "Coastal Fishing Hamlet Boat Landing Jetty", sanction: 6500000, spent: 4940000, savings: 1560000 },
    ],
    recommended_welfare_works: [
      {
        id: "w11",
        title: "Solar Water Ambulance & Emergency Rescue Craft",
        category: "Emergency & Health",
        estimated_cost: 2400000,
        estimated_cost_formatted: "₹24.0 L",
        beneficiaries: "22,000 backwater islanders",
        priority: "High Priority",
        impact_score: 96,
        description: "Eco-friendly solar powered emergency medical transit boat for isolated Kuttanad island villages."
      },
      {
        id: "w12",
        title: "Fishermen Safety GPS & Coastal Early Warning Beacons",
        category: "Coastal Welfare",
        estimated_cost: 1500000,
        estimated_cost_formatted: "₹15.0 L",
        beneficiaries: "3,800 traditional fishermen",
        priority: "High Priority",
        impact_score: 93,
        description: "Deployment of marine distress transmitter units and coastal storm warning towers."
      }
    ]
  },
  {
    id: "ajmer",
    constituency: "AJMER",
    state: "Rajasthan",
    ida: "District Collector Ajmer",
    mp_name: "Shri Bhagirath Choudhary",
    project_count: 4,
    total_sanction: 14000000,
    total_spent: 10910000,
    total_savings: 3090000,
    savings_formatted: "₹30.9 L",
    savings_percentage: 22.1,
    source_projects: [
      { work_id: "WS/MP221/2023-2024/88210", name: "Desert Water Kiosk Network (6 Locations)", sanction: 8000000, spent: 6200000, savings: 1800000 },
      { work_id: "WS/MP221/2023-2024/88218", name: "Community Cattle Shed & Fodder Depot", sanction: 6000000, spent: 4710000, savings: 1290000 },
    ],
    recommended_welfare_works: [
      {
        id: "w13",
        title: "Solar High-Mast Lighting at Rural Bus Stops & Markets",
        category: "Rural Infrastructure",
        estimated_cost: 1800000,
        estimated_cost_formatted: "₹18.0 L",
        beneficiaries: "28,000 commuters",
        priority: "High Priority",
        impact_score: 91,
        description: "Illumination of 12 unlit rural bus junctions with automated dusk-to-dawn solar high mast systems."
      },
      {
        id: "w14",
        title: "Govt Girls College Sanitary Hygiene & Rest Center",
        category: "Women Welfare & Health",
        estimated_cost: 1200000,
        estimated_cost_formatted: "₹12.0 L",
        beneficiaries: "1,800 female students",
        priority: "High Priority",
        impact_score: 94,
        description: "Construction of hygienic restroom complex with incinerators and sanitary pad dispensing kiosks."
      }
    ]
  },
  {
    id: "nizamabad",
    constituency: "NIZAMABAD",
    state: "Telangana",
    ida: "District Collector Nizamabad",
    mp_name: "Dharmapuri Arvind",
    project_count: 56,
    total_sanction: 15500000,
    total_spent: 12500000,
    total_savings: 3000000,
    savings_formatted: "₹30.0 L",
    savings_percentage: 19.4,
    source_projects: [
      { work_id: "WS/MP512/2023-2024/99120", name: "Turmeric Farmer Drying Yard Paving", sanction: 9000000, spent: 7200000, savings: 1800000 },
      { work_id: "WS/MP512/2023-2024/99125", name: "CC Road & Internal Colony Drains", sanction: 6500000, spent: 5300000, savings: 1200000 },
    ],
    recommended_welfare_works: [
      {
        id: "w15",
        title: "Cold Storage Processing Equipment for Turmeric Growers",
        category: "Agriculture & Farmers",
        estimated_cost: 1800000,
        estimated_cost_formatted: "₹18.0 L",
        beneficiaries: "900 turmeric farmers",
        priority: "High Priority",
        impact_score: 93,
        description: "Post-harvest spice cleaning and mechanical moisture testing equipment for farmer collectives."
      },
      {
        id: "w16",
        title: "Skill Development Sewing & Computer Lab for Self-Help Groups",
        category: "Women Empowerment",
        estimated_cost: 1200000,
        estimated_cost_formatted: "₹12.0 L",
        beneficiaries: "450 women artisans",
        priority: "High Priority",
        impact_score: 90,
        description: "Equipping 3 Mahila Mandal centers with industrial sewing machines and computer literacy labs."
      }
    ]
  },
  {
    id: "chennai_south",
    constituency: "CHENNAI SOUTH",
    state: "Tamil Nadu",
    ida: "Greater Chennai Corporation (GCC)",
    mp_name: "Dr. T. Sumathy (alias) Thamizhachi Thangapandian",
    project_count: 3,
    total_sanction: 11000000,
    total_spent: 8860000,
    total_savings: 2140000,
    savings_formatted: "₹21.4 L",
    savings_percentage: 19.5,
    source_projects: [
      { work_id: "WS/MP168/2023-2024/31045", name: "Model School Science Laboratory & Audio-Visual Hall", sanction: 7000000, spent: 5600000, savings: 1400000 },
      { work_id: "WS/MP168/2023-2024/31050", name: "Community Health Center Maternity Ward Renovation", sanction: 4000000, spent: 3260000, savings: 740000 },
    ],
    recommended_welfare_works: [
      {
        id: "w17",
        title: "Sensory Park & Accessible Play Zone for Specially-Abled Children",
        category: "Inclusion & Welfare",
        estimated_cost: 1200000,
        estimated_cost_formatted: "₹12.0 L",
        beneficiaries: "600 children with disabilities",
        priority: "High Priority",
        impact_score: 95,
        description: "Wheelchair-accessible sensory playground with tactile paving and specialized swings in corporation park."
      },
      {
        id: "w18",
        title: "Elderly Citizen Day Care & Wellness Recreational Facility",
        category: "Senior Citizen Welfare",
        estimated_cost: 940000,
        estimated_cost_formatted: "₹9.4 L",
        beneficiaries: "1,100 senior citizens",
        priority: "Medium Priority",
        impact_score: 89,
        description: "Physiotherapy gear, resting recliners, and indoor reading materials in public community center."
      }
    ]
  }
];
