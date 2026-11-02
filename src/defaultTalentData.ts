import { TalentProfile, TalentJobRequirement } from './types';

export const INDIAN_METROPOLITAN_CITIES = [
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Kochi',
  'Chandigarh'
];

export interface CountryLocaleConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  metroLabel: string;
  cities: string[];
}

export const COUNTRY_LOCALE_CONFIGS: Record<string, CountryLocaleConfig> = {
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    metroLabel: 'Indian Metros',
    cities: [
      'Bengaluru',
      'Mumbai',
      'Delhi NCR',
      'Hyderabad',
      'Chennai',
      'Pune',
      'Kolkata',
      'Ahmedabad',
      'Jaipur',
      'Kochi',
      'Chandigarh'
    ]
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    metroLabel: 'US Metros',
    cities: [
      'San Francisco',
      'New York',
      'Los Angeles',
      'Chicago',
      'Seattle',
      'Austin',
      'Dallas',
      'Houston',
      'Phoenix',
      'San Diego',
      'Boston',
      'Denver'
    ]
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    metroLabel: 'UK Metros',
    cities: [
      'London',
      'Manchester',
      'Birmingham',
      'Leeds',
      'Glasgow',
      'Edinburgh',
      'Liverpool',
      'Bristol'
    ]
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: 'CA$',
    metroLabel: 'Canadian Metros',
    cities: [
      'Toronto',
      'Vancouver',
      'Montreal',
      'Calgary',
      'Ottawa',
      'Edmonton'
    ]
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    currencySymbol: 'A$',
    metroLabel: 'Australian Metros',
    cities: [
      'Sydney',
      'Melbourne',
      'Brisbane',
      'Perth',
      'Adelaide'
    ]
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    currencySymbol: 'AED',
    metroLabel: 'UAE Metros',
    cities: [
      'Dubai',
      'Abu Dhabi',
      'Sharjah',
      'Ajman'
    ]
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD',
    currencySymbol: 'S$',
    metroLabel: 'Singapore Districts',
    cities: [
      'Central Region',
      'Jurong',
      'Tampines',
      'Woodlands',
      'Marina Bay'
    ]
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    currencySymbol: '€',
    metroLabel: 'German Metros',
    cities: [
      'Berlin',
      'Munich',
      'Frankfurt',
      'Hamburg',
      'Cologne',
      'Stuttgart'
    ]
  }
};

export const detectLocaleCountry = (): string => {
  if (typeof window === 'undefined') return 'IN';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.startsWith('Asia/Kolkata')) return 'IN';
    if (tz.startsWith('America/') && (tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago') || tz.includes('Denver') || tz.includes('Phoenix') || tz.includes('San_Francisco'))) return 'US';
    if (tz.startsWith('Europe/London')) return 'GB';
    if (tz.startsWith('Australia/')) return 'AU';
    if (tz.startsWith('America/Toronto') || tz.startsWith('America/Vancouver') || tz.startsWith('America/Montreal')) return 'CA';
    if (tz.startsWith('Asia/Dubai')) return 'AE';
    if (tz.startsWith('Asia/Singapore')) return 'SG';
    if (tz.startsWith('Europe/Berlin')) return 'DE';
  } catch (e) {}

  try {
    const lang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toUpperCase();
    if (lang.includes('IN')) return 'IN';
    if (lang.includes('US')) return 'US';
    if (lang.includes('GB') || lang.includes('UK')) return 'GB';
    if (lang.includes('CA')) return 'CA';
    if (lang.includes('AU')) return 'AU';
    if (lang.includes('AE')) return 'AE';
    if (lang.includes('SG')) return 'SG';
    if (lang.includes('DE')) return 'DE';
  } catch (e) {}

  return 'IN';
};

export const DEFAULT_TALENT_JOBS: TalentJobRequirement[] = [
  {
    id: 'JOB-OPAL-101',
    vendorUid: 'vendor-apex-solutions',
    vendorName: 'Apex Precision Contracting India',
    vendorEmail: 'careers@apexprecision.in',
    vendorPhone: '+91 98450 48190',
    title: 'Lead Commercial Electrician & Power Systems',
    skillsRequired: ['Commercial Wiring', 'NEC Compliance', 'High-Voltage Panels', 'Blueprint Reading'],
    experienceLevel: '5+ years',
    wageLevel: '₹850 – ₹1,100 / hr',
    wageType: 'hourly',
    city: 'Bengaluru',
    state: 'Karnataka',
    description: 'Directing complex commercial tech park wiring, 11kV substation installations, and safety code compliance across Whitefield and Electronic City.',
    employmentType: 'Full-time',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    applicationsCount: 3
  },
  {
    id: 'JOB-OPAL-102',
    vendorUid: 'vendor-luxe-artisan',
    vendorName: 'Milano Artisan Interiors India',
    vendorEmail: 'talent@milanocraft.in',
    vendorPhone: '+91 98201 34012',
    title: 'Senior Architectural Finish Carpenter',
    skillsRequired: ['Custom Cabinetry', 'Finish Trim', 'Crown Molding', 'CNC Milling'],
    experienceLevel: '4-6 years',
    wageLevel: '₹750 – ₹950 / hr',
    wageType: 'hourly',
    city: 'Mumbai',
    state: 'Maharashtra',
    description: 'Crafting bespoke luxury residential cabinetry, veneer wall paneling, and hand-finished hardwood moldings for premier residences in Bandra and South Mumbai.',
    employmentType: 'Full-time',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    applicationsCount: 2
  },
  {
    id: 'JOB-OPAL-103',
    vendorUid: 'vendor-summit-climate',
    vendorName: 'Summit Climate & HVAC Systems India',
    vendorEmail: 'hr@summithvac.in',
    vendorPhone: '+91 98112 88145',
    title: 'Master HVAC Technician & Heat Pump Specialist',
    skillsRequired: ['EPA Universal', 'VRF Heat Pumps', 'Refrigerant Diagnostics', 'Ductless Mini-Splits'],
    experienceLevel: '5+ years',
    wageLevel: '₹800 – ₹1,050 / hr',
    wageType: 'hourly',
    city: 'Delhi NCR',
    state: 'Haryana',
    description: 'Diagnosing, retrofitting, and balancing commercial climate infrastructure and high-efficiency VRF heat pumps in Gurgaon Cyber City and Noida commercial hubs.',
    employmentType: 'Full-time',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    applicationsCount: 4
  },
  {
    id: 'JOB-OPAL-104',
    vendorUid: 'vendor-austin-craft',
    vendorName: 'Deccan Smart Infrastructure',
    vendorEmail: 'ops@deccansmart.in',
    vendorPhone: '+91 98490 70144',
    title: 'Smart Home Automation & Low-Voltage Integrator',
    skillsRequired: ['Control4', 'Lutron Lighting', 'Structured Cabling', 'Audio/Video Rack Wiring'],
    experienceLevel: '3-5 years',
    wageLevel: '₹700 – ₹900 / hr',
    wageType: 'hourly',
    city: 'Hyderabad',
    state: 'Telangana',
    description: 'Commissioning estate automation, Lutron shading/lighting, and enterprise gigabit low-voltage networking in HITEC City and Jubilee Hills.',
    employmentType: 'Contract',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    applicationsCount: 1
  },
  {
    id: 'JOB-OPAL-105',
    vendorUid: 'vendor-gourmet-collective',
    vendorName: 'Atelier Gourmet Cloud Kitchens',
    vendorEmail: 'chef@ateliergourmet.in',
    vendorPhone: '+91 98501 61288',
    title: 'Commercial Kitchen Refrigeration & HVAC Lead',
    skillsRequired: ['Commercial Wiring', 'VRF Systems', 'EPA Universal', 'HACCP Safety'],
    experienceLevel: '4+ years',
    wageLevel: '₹650 – ₹850 / hr',
    wageType: 'hourly',
    city: 'Pune',
    state: 'Maharashtra',
    description: 'Leading refrigeration cooling systems, cold room maintenance, and electrical backup power across Viman Nagar and Koregaon Park facilities.',
    employmentType: 'Full-time',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    applicationsCount: 5
  }
];

export const DEFAULT_REGISTERED_TALENTS: TalentProfile[] = [
  {
    id: 'TALENT-OPAL-201',
    uid: 'talent-uid-julian-vance',
    name: 'Julian Vance',
    email: 'julian.vance@example.com',
    phone: '+91 98450 19201',
    headline: 'Certified Master Electrician | Commercial Power & Substation Automation Lead',
    city: 'Bengaluru',
    state: 'Karnataka',
    bio: '10+ years specializing in commercial electrical distribution, 11kV/33kV substations, NEC & CEA code certifications, and three-phase industrial transformer installations across Bengaluru IT corridors.',
    skills: ['Commercial Wiring', 'High-Voltage Panels', 'NEC Compliance', 'PLC Programming', 'OSHA 30', 'Transformer Testing'],
    experiences: [
      {
        id: 'exp-1',
        roleTitle: 'Senior Commercial Electrical Lead',
        companyName: 'Bengaluru Tech Infra Partners',
        employmentType: 'Full-time',
        location: 'Bengaluru, Karnataka',
        startDate: 'Jan 2021',
        endDate: 'Present',
        current: true,
        description: 'Supervised electrical fit-outs for 14 commercial high-rise campuses in Whitefield and Outer Ring Road. Managed 11kV switchboard upgrades with zero-downtime safety compliance.'
      },
      {
        id: 'exp-2',
        roleTitle: 'Journeyman Electrician',
        companyName: 'Karnataka Circuit Solutions',
        employmentType: 'Full-time',
        location: 'Bengaluru, Karnataka',
        startDate: 'Aug 2017',
        endDate: 'Dec 2020',
        current: false,
        description: 'Installed 415V distribution feeds, industrial busways, and programmable lighting relay panels across Electronic City Phase 1.'
      }
    ],
    education: 'Bachelor of Technology in Electrical Engineering, RV College of Engineering, Bengaluru (2017)',
    certifications: ['State Electrical Supervisory License (Grade A)', 'OSHA 30-Hour Construction Safety', 'NFPA 70E Arc Flash Safety'],
    wageExpectation: '₹850 – ₹1,200 / hr',
    yearsOfExperience: 10,
    availabilityStatus: 'available',
    resumeName: 'Julian_Vance_Master_Electrician_Resume.pdf',
    resumeText: 'Julian Vance | Master Electrician | 10+ Years Experience in Commercial Electrical & Power Systems | Bengaluru, Karnataka | Phone: +91 98450 19201 | Core Skills: Commercial Wiring, High-Voltage Panels, CEA & NEC Compliance, OSHA 30.',
    registeredAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'TALENT-OPAL-202',
    uid: 'talent-uid-elena-costa',
    name: 'Elena Costa',
    email: 'elena.costa@example.com',
    phone: '+91 98201 71020',
    headline: 'Architectural Finish Joiner & Custom Millwork Specialist',
    city: 'Mumbai',
    state: 'Maharashtra',
    bio: 'Artisan woodworker with 7 years crafting high-end architectural cabinetry, custom walnut veneer paneling, and historic moldings for prime luxury penthouses in South Mumbai and Bandra.',
    skills: ['Custom Cabinetry', 'Finish Trim', 'Veneer Pressing', 'CNC Milling', 'Festool Dustless Systems', 'Shop Drawings'],
    experiences: [
      {
        id: 'exp-3',
        roleTitle: 'Lead Joiner & Cabinet Artisan',
        companyName: 'Mumbai Heritage Woodcraft',
        employmentType: 'Full-time',
        location: 'Mumbai, Maharashtra',
        startDate: 'Mar 2020',
        endDate: 'Present',
        current: true,
        description: 'Fabricated and installed custom floating staircases, walk-in dressing suites, and fluted acoustic wall assemblies for luxury residences in Worli and Bandra West.'
      }
    ],
    education: 'Diploma in Fine Woodworking & Interior Architecture, Sir J.J. School of Art, Mumbai (2018)',
    certifications: ['Master Woodworkers Guild Member', 'Architectural Woodwork Institute (AWI) Certified'],
    wageExpectation: '₹750 – ₹950 / hr',
    yearsOfExperience: 7,
    availabilityStatus: 'available',
    resumeName: 'Elena_Costa_Artisan_Millwork_Resume.pdf',
    resumeText: 'Elena Costa | Architectural Millwork & Custom Joinery Specialist | Mumbai, Maharashtra | Phone: +91 98201 71020 | Custom Cabinetry, Veneer Pressing, CNC Milling, High-End Residential Experience.',
    registeredAt: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 'TALENT-OPAL-203',
    uid: 'talent-uid-marcus-reyes',
    name: 'Marcus Reyes',
    email: 'marcus.reyes@example.com',
    phone: '+91 98112 88319',
    headline: 'HVAC-R Master Technician | Heat Pumps & Building Energy Diagnostics',
    city: 'Delhi NCR',
    state: 'Haryana',
    bio: 'Licensed HVAC technician with 8 years specializing in Variable Refrigerant Flow (VRF) systems, chilled water loops, and energy compliance testing across Gurgaon Cyber City and Delhi NCR tech parks.',
    skills: ['EPA Universal', 'VRF Systems', 'Inverter Diagnostics', 'Airflow Balancing', 'BACnet Controls', 'Heat Recovery'],
    experiences: [
      {
        id: 'exp-4',
        roleTitle: 'Senior Commercial HVAC Field Technician',
        companyName: 'Capital Climate Systems',
        employmentType: 'Full-time',
        location: 'Delhi NCR (Gurgaon)',
        startDate: 'Feb 2019',
        endDate: 'Present',
        current: true,
        description: 'Serviced multi-zone VRV/VRF heat pump systems across 20+ commercial sites in Cyber City and Golf Course Road. Reduced corporate client energy costs by 28% through precision balance.'
      }
    ],
    education: 'Diploma in Refrigeration & Air Conditioning Engineering, Pusa Institute, Delhi (2017)',
    certifications: ['ISHRAE Certified HVAC Professional', 'EPA Section 608 Universal Certification'],
    wageExpectation: '₹800 – ₹1,100 / hr',
    yearsOfExperience: 8,
    availabilityStatus: 'actively_interviewing',
    resumeName: 'Marcus_Reyes_HVAC_Master_Resume.pdf',
    resumeText: 'Marcus Reyes | Master HVAC-R Technician | ISHRAE Certified | Delhi NCR | Phone: +91 98112 88319 | Specialization: VRF Systems, Ductless Mini-Splits, Commercial Air Balancing.',
    registeredAt: new Date(Date.now() - 3600000 * 96).toISOString()
  },
  {
    id: 'TALENT-OPAL-204',
    uid: 'talent-uid-charlotte-wu',
    name: 'Charlotte Wu',
    email: 'charlotte.wu@example.com',
    phone: '+91 98490 33492',
    headline: 'Smart Estate AV Engineer & Lutron Homeworks Certified Integrator',
    city: 'Hyderabad',
    state: 'Telangana',
    bio: '6 years delivering integrated whole-home automation architectures: enterprise Wi-Fi, Control4 OS3, Savant, and Lutron Homeworks lighting control in HITEC City and Jubilee Hills.',
    skills: ['Control4', 'Lutron Lighting', 'Savant Pro', 'Dante Audio', 'IP Networking', 'Fiber Splicing'],
    experiences: [
      {
        id: 'exp-5',
        roleTitle: 'Smart Home Systems Engineer',
        companyName: 'Deccan Automation Technologies',
        employmentType: 'Full-time',
        location: 'Hyderabad, Telangana',
        startDate: 'May 2020',
        endDate: 'Present',
        current: true,
        description: 'Engineered and wired 14 full-estate audio/video automation installations exceeding ₹1.5 Cr in integrated automation hardware.'
      }
    ],
    education: 'B.Tech in Electronics & Communication, JNTU Hyderabad (2019)',
    certifications: ['Lutron Homeworks QSX Certified', 'Control4 Automation Programmer Level II', 'CEDIA ESC-T Certified'],
    wageExpectation: '₹700 – ₹900 / hr',
    yearsOfExperience: 6,
    availabilityStatus: 'available',
    resumeName: 'Charlotte_Wu_Smart_Home_Engineer.pdf',
    resumeText: 'Charlotte Wu | Smart Estate Integrator & Systems Engineer | Hyderabad, Telangana | Phone: +91 98490 33492 | Expertise: Control4, Lutron Lighting, Dante Audio, Enterprise Networks.',
    registeredAt: new Date(Date.now() - 3600000 * 110).toISOString()
  },
  {
    id: 'TALENT-OPAL-205',
    uid: 'talent-uid-david-kim',
    name: 'David Kim',
    email: 'david.kim@example.com',
    phone: '+91 98501 91203',
    headline: 'Junior Instrumentation & Low-Voltage Cable Technician',
    city: 'Pune',
    state: 'Maharashtra',
    bio: '2 years of hands-on experience in telecommunications, Cat6A structured cabling, fiber optic fusion splicing, and network rack cable grooming in Hinjawadi IT Park.',
    skills: ['Structured Cabling', 'Fiber Splicing', 'Cat6A Termination', 'OTDR Testing', 'Multimeter Diagnostics', 'Blueprint Reading'],
    experiences: [
      {
        id: 'exp-6',
        roleTitle: 'Junior Field Cable Technician',
        companyName: 'Pune Telecom Infrastructure',
        employmentType: 'Full-time',
        location: 'Pune, Maharashtra',
        startDate: 'Aug 2022',
        endDate: 'Present',
        current: true,
        description: 'Pulled, dressed, and terminated over 45,000 meters of Cat6A cabling across enterprise data centres and commercial office builds in Hinjawadi Phase 2.'
      }
    ],
    education: 'Diploma in Telecommunication Engineering, Government Polytechnic Pune (2022)',
    certifications: ['BICSI Installer 1 Certified', 'OSHA 10 Safety Certified'],
    wageExpectation: '₹450 – ₹650 / hr',
    yearsOfExperience: 2,
    availabilityStatus: 'available',
    resumeName: 'David_Kim_Telecom_Tech_Resume.pdf',
    resumeText: 'David Kim | Junior Low-Voltage & Telecom Technician | Pune, Maharashtra | Phone: +91 98501 91203 | 2 Years Experience | Cat6A, Fiber Splicing, OTDR, Cable Dressing.',
    registeredAt: new Date(Date.now() - 3600000 * 140).toISOString()
  },
  {
    id: 'TALENT-OPAL-206',
    uid: 'talent-uid-amara-okafor',
    name: 'Amara Okafor',
    email: 'amara.okafor@example.com',
    phone: '+91 98401 44915',
    headline: 'Senior Commercial Solar PV & Lithium Storage Lead Engineer',
    city: 'Chennai',
    state: 'Tamil Nadu',
    bio: '6 years directing utility-scale rooftop solar array construction, grid tie-in interconnections, industrial battery storage, and CEIG statutory compliance across Sriperumbudur and OMR.',
    skills: ['Solar PV Inverters', 'Grid Interconnection', 'Lithium Storage', 'NEC Compliance', 'High-Voltage Panels', 'CAD Modeling'],
    experiences: [
      {
        id: 'exp-7',
        roleTitle: 'Lead Solar Field Engineer',
        companyName: 'Tamil Nadu Clean Power Systems',
        employmentType: 'Full-time',
        location: 'Chennai, Tamil Nadu',
        startDate: 'Jan 2020',
        endDate: 'Present',
        current: true,
        description: 'Commissioned 16MW of commercial rooftop solar PV installations and battery storage systems. Managed safety and TANGEDCO grid interconnections.'
      }
    ],
    education: 'B.E. in Electrical & Electronics Engineering, Anna University, Chennai (2018)',
    certifications: ['National Solar Science Certification', 'OSHA 30 Safety', 'NFPA 70E Arc Flash'],
    wageExpectation: '₹900 – ₹1,300 / hr',
    yearsOfExperience: 6,
    availabilityStatus: 'available',
    resumeName: 'Amara_Okafor_Solar_Lead_Resume.pdf',
    resumeText: 'Amara Okafor | Senior Solar PV & Storage Lead | Chennai, Tamil Nadu | Phone: +91 98401 44915 | 6 Years Exp | Solar PV, Battery Storage, Grid Interconnection.',
    registeredAt: new Date(Date.now() - 3600000 * 180).toISOString()
  },
  {
    id: 'TALENT-OPAL-207',
    uid: 'talent-uid-nathaniel-vance',
    name: 'Nathaniel Cross',
    email: 'nathaniel.cross@example.com',
    phone: '+91 98301 83146',
    headline: 'Master Architectural Stone Mason & 5-Axis CNC Sculptor',
    city: 'Kolkata',
    state: 'West Bengal',
    bio: '12 years executing luxury architectural stonework, Makrana and Italian marble fabrication, bookmatched feature slabs, waterjet cutting, and heritage restoration across Kolkata and Eastern India.',
    skills: ['Marble Fabrication', 'CNC Milling', 'Waterjet Cutting', 'Historic Masonry Restoration', 'Shop Drawings', 'Seismic Anchoring'],
    experiences: [
      {
        id: 'exp-8',
        roleTitle: 'Principal Stone Carver & Lead Fabricator',
        companyName: 'Bengal Artisan Marble & Stone',
        employmentType: 'Full-time',
        location: 'Kolkata, West Bengal',
        startDate: 'Feb 2016',
        endDate: 'Present',
        current: true,
        description: 'Fabricated and installed custom marble fireplace surrounds, temple archways, and bookmatched stone slabs for architectural award-winning private estates and heritage hotels.'
      }
    ],
    education: 'Master Craftsman Diploma in Classical Stonework, Kolkata School of Fine Crafts (2012)',
    certifications: ['Master Craftsman Certification, Natural Stone Institute', 'Safety Supervisor Certified'],
    wageExpectation: '₹1,000 – ₹1,500 / hr',
    yearsOfExperience: 12,
    availabilityStatus: 'actively_interviewing',
    resumeName: 'Nathaniel_Cross_Master_Mason_Resume.pdf',
    resumeText: 'Nathaniel Cross | Master Architectural Stone Mason | Kolkata, West Bengal | Phone: +91 98301 83146 | 12 Years Experience | Marble Fabrication, 5-Axis CNC, Historic Restoration.',
    registeredAt: new Date(Date.now() - 3600000 * 220).toISOString()
  },
  {
    id: 'TALENT-OPAL-208',
    uid: 'talent-uid-vikram-sen',
    name: 'Vikramaditya Sen',
    email: 'vikram.sen@example.in',
    phone: '+91 98100 55219',
    headline: 'Lead Industrial Automation & Siemens PLC Engineer',
    city: 'Delhi NCR',
    state: 'Delhi',
    bio: '9 years architecting industrial automation, Siemens S7-1500 PLC ladder logic, SCADA telemetries, and automated conveyor commissioning for automotive and aerospace manufacturing lines in Delhi NCR and Manesar.',
    skills: ['PLC Programming', 'Siemens S7', 'SCADA Systems', 'Industrial IoT', 'Automation Commissioning', 'High-Voltage Panels'],
    experiences: [
      {
        id: 'exp-9',
        roleTitle: 'Senior Industrial Automation Engineer',
        companyName: 'NCR Precision Robotics',
        employmentType: 'Full-time',
        location: 'Delhi NCR (Noida)',
        startDate: 'Jan 2019',
        endDate: 'Present',
        current: true,
        description: 'Engineered automated assembly lines and Siemens PLC controllers for tier-1 auto component manufacturers.'
      }
    ],
    education: 'B.Tech in Instrumentation & Control, Delhi Technological University (2016)',
    certifications: ['Siemens Certified Automation Professional', 'Certified SCADA Systems Specialist'],
    wageExpectation: '₹950 – ₹1,350 / hr',
    yearsOfExperience: 9,
    availabilityStatus: 'available',
    resumeName: 'Vikram_Sen_Automation_Engineer.pdf',
    resumeText: 'Vikramaditya Sen | Lead PLC & Industrial Automation Engineer | Delhi NCR | Phone: +91 98100 55219 | Siemens S7, SCADA, Industrial IoT, Commissioning.',
    registeredAt: new Date(Date.now() - 3600000 * 240).toISOString()
  },
  {
    id: 'TALENT-OPAL-209',
    uid: 'talent-uid-ananya-patel',
    name: 'Ananya Patel',
    email: 'ananya.patel@example.in',
    phone: '+91 98790 77412',
    headline: 'Cleanroom HVAC & Industrial Chillers Specialist',
    city: 'Ahmedabad',
    state: 'Gujarat',
    bio: '5 years commissioning pharmaceutical cleanroom HVAC, chilled water piping, static pressure balancing, and automated BMS controls across Ahmedabad and GIFT City facilities.',
    skills: ['Cleanroom HVAC', 'Industrial Chillers', 'BMS Automation', 'CAD Modeling', 'Air Balancing', 'EPA Universal'],
    experiences: [
      {
        id: 'exp-10',
        roleTitle: 'Cleanroom Systems Project Engineer',
        companyName: 'Gujarat Pharma Climate Tech',
        employmentType: 'Full-time',
        location: 'Ahmedabad, Gujarat',
        startDate: 'Jul 2020',
        endDate: 'Present',
        current: true,
        description: 'Led HVAC duct validation and ISO Class 5 to Class 8 cleanroom air handling certifications for biopharma manufacturing facilities.'
      }
    ],
    education: 'B.E. in Mechanical Engineering, Nirma University, Ahmedabad (2019)',
    certifications: ['Cleanroom Air Quality Testing Certified', 'ISHRAE Professional Member'],
    wageExpectation: '₹750 – ₹1,050 / hr',
    yearsOfExperience: 5,
    availabilityStatus: 'available',
    resumeName: 'Ananya_Patel_Cleanroom_HVAC.pdf',
    resumeText: 'Ananya Patel | Cleanroom HVAC & Chiller Specialist | Ahmedabad, Gujarat | Phone: +91 98790 77412 | 5 Years Exp | Cleanroom Validation, BMS, Chilled Water.',
    registeredAt: new Date(Date.now() - 3600000 * 260).toISOString()
  },
  {
    id: 'TALENT-OPAL-210',
    uid: 'talent-uid-arjun-singh',
    name: 'Arjun Singhania',
    email: 'arjun.singhania@example.in',
    phone: '+91 98290 88514',
    headline: 'Heritage Stone Restoration & CNC Architectural Sculptor',
    city: 'Jaipur',
    state: 'Rajasthan',
    bio: '8 years restoring palace heritage facades, intricate Jali sandstone carvings, waterjet stone inlays, and CNC architectural stonework across Jaipur and Rajasthan luxury hotels.',
    skills: ['Historic Masonry Restoration', 'Sandstone Carving', 'CNC Milling', 'Waterjet Cutting', 'Shop Drawings', 'Seismic Anchoring'],
    experiences: [
      {
        id: 'exp-11',
        roleTitle: 'Master Mason & Heritage Craftsman',
        companyName: 'Rajputana Heritage Craft Guild',
        employmentType: 'Full-time',
        location: 'Jaipur, Rajasthan',
        startDate: 'Mar 2018',
        endDate: 'Present',
        current: true,
        description: 'Restored historic sandstone jaali screens, marble fountains, and carved arches for heritage palace conversions.'
      }
    ],
    education: 'Diploma in Traditional Heritage Architecture & Masonry, Jaipur Crafts Institute (2016)',
    certifications: ['Master Craftsman License, Archaeological Heritage Restoration'],
    wageExpectation: '₹800 – ₹1,200 / hr',
    yearsOfExperience: 8,
    availabilityStatus: 'available',
    resumeName: 'Arjun_Singhania_Heritage_Mason.pdf',
    resumeText: 'Arjun Singhania | Heritage Stone Mason & Sculptor | Jaipur, Rajasthan | Phone: +91 98290 88514 | 8 Years Exp | Sandstone, Marble, CNC Milling, Heritage Restoration.',
    registeredAt: new Date(Date.now() - 3600000 * 280).toISOString()
  },
  {
    id: 'TALENT-OPAL-211',
    uid: 'talent-uid-pooja-nair',
    name: 'Pooja Nair',
    email: 'pooja.nair@example.in',
    phone: '+91 98470 66321',
    headline: 'Marine & Port Electrical Automation Specialist',
    city: 'Kochi',
    state: 'Kerala',
    bio: '6 years designing and inspecting 415V/11kV marine electrical switchboards, automated shipyard cranes, and power distribution systems at Cochin Port and shipyards.',
    skills: ['Marine Electrical Systems', 'High-Voltage Panels', 'PLC Programming', 'Transformer Testing', 'Commercial Wiring'],
    experiences: [
      {
        id: 'exp-12',
        roleTitle: 'Port Electrical Automation Lead',
        companyName: 'Kerala Maritime Electricals',
        employmentType: 'Full-time',
        location: 'Kochi, Kerala',
        startDate: 'Apr 2019',
        endDate: 'Present',
        current: true,
        description: 'Managed electrical maintenance and automated crane SCADA controls across deepwater berths and shipyard drydocks.'
      }
    ],
    education: 'B.Tech in Marine Electrical & Electronics, Cochin University of Science and Technology (2018)',
    certifications: ['Directorate General of Shipping Marine Electrical Certification', 'ClassNK Approved Electrical Inspector'],
    wageExpectation: '₹750 – ₹1,050 / hr',
    yearsOfExperience: 6,
    availabilityStatus: 'available',
    resumeName: 'Pooja_Nair_Marine_Electrical.pdf',
    resumeText: 'Pooja Nair | Marine & Industrial Electrical Automation | Kochi, Kerala | Phone: +91 98470 66321 | 6 Years Exp | High-Voltage Panels, Marine Systems, PLC Automation.',
    registeredAt: new Date(Date.now() - 3600000 * 300).toISOString()
  },
  {
    id: 'TALENT-OPAL-212',
    uid: 'talent-uid-harpreet-singh',
    name: 'Harpreet Singh',
    email: 'harpreet.singh@example.in',
    phone: '+91 98140 22341',
    headline: 'Renewable Power & Agro-Solar Infrastructure Engineer',
    city: 'Chandigarh',
    state: 'Punjab',
    bio: '5 years deploying commercial rooftop solar plants, agricultural pump solar grid interconnections, and net-metering systems across Punjab and Chandigarh.',
    skills: ['Solar PV Inverters', 'Grid Interconnection', 'Commercial Wiring', 'High-Voltage Panels', 'CAD Modeling'],
    experiences: [
      {
        id: 'exp-13',
        roleTitle: 'Solar Project Commissioning Engineer',
        companyName: 'Punjab Solar Infrastructure',
        employmentType: 'Full-time',
        location: 'Chandigarh, Punjab',
        startDate: 'Jan 2021',
        endDate: 'Present',
        current: true,
        description: 'Installed 12MW of rooftop and ground-mounted solar installations for agro-industrial and cold-storage facilities.'
      }
    ],
    education: 'B.Tech in Power Engineering, Punjab Engineering College, Chandigarh (2019)',
    certifications: ['Skill Council for Green Jobs Solar Professional', 'Safety First Level 2'],
    wageExpectation: '₹650 – ₹850 / hr',
    yearsOfExperience: 5,
    availabilityStatus: 'available',
    resumeName: 'Harpreet_Singh_Solar_Engineer.pdf',
    resumeText: 'Harpreet Singh | Solar Energy Infrastructure Engineer | Chandigarh, Punjab | Phone: +91 98140 22341 | Solar PV Inverters, Grid Interconnection, Net Metering.',
    registeredAt: new Date(Date.now() - 3600000 * 320).toISOString()
  },
  {
    id: 'TALENT-OPAL-209',
    uid: 'talent-uid-liam-oconnor',
    name: 'Liam O\'Connor',
    email: 'liam.oconnor@example.com',
    phone: '+1 415-555-0182',
    headline: 'Senior Commercial Automation Lead & Low-Voltage Integrator',
    city: 'San Francisco',
    state: 'CA',
    bio: '8+ years specializing in enterprise structured cabling, PLC building automation, and high-density datacenter power distribution across Silicon Valley and San Francisco.',
    skills: ['Commercial Wiring', 'PLC Programming', 'Structured Cabling', 'Control4', 'NEC Compliance'],
    experiences: [
      {
        id: 'exp-14',
        roleTitle: 'Senior Systems Integrator',
        companyName: 'Bay Area Automation Systems',
        employmentType: 'Full-time',
        location: 'San Francisco, CA',
        startDate: 'Feb 2020',
        endDate: 'Present',
        current: true,
        description: 'Supervised low-voltage systems and smart facility controls for commercial towers in downtown San Francisco.'
      }
    ],
    education: 'B.S. in Electrical Engineering, UC Berkeley (2018)',
    certifications: ['C-10 Electrical Contractor License', 'OSHA 30'],
    wageExpectation: '$65.00 – $85.00 / hr',
    yearsOfExperience: 8,
    availabilityStatus: 'available',
    resumeName: 'Liam_OConnor_Resume.pdf',
    resumeText: 'Liam O\'Connor | Commercial Automation Lead | San Francisco, CA | Phone: +1 415-555-0182 | Commercial Wiring, PLC Programming, Structured Cabling.',
    registeredAt: new Date(Date.now() - 3600000 * 400).toISOString()
  },
  {
    id: 'TALENT-OPAL-210',
    uid: 'talent-uid-maya-patel',
    name: 'Maya Patel',
    email: 'maya.patel@example.com',
    phone: '+1 212-555-0199',
    headline: 'Architectural Finish Carpenter & Bespoke Millwork Artisan',
    city: 'New York',
    state: 'NY',
    bio: '7 years designing and installing luxury residential millwork, custom cabinetry, and veneer paneling across Manhattan and Brooklyn.',
    skills: ['Custom Cabinetry', 'Finish Trim', 'CNC Milling', 'Veneer Pressing'],
    experiences: [
      {
        id: 'exp-15',
        roleTitle: 'Lead Artisan Carpenter',
        companyName: 'Manhattan Craft Woodworks',
        employmentType: 'Full-time',
        location: 'New York, NY',
        startDate: 'Jun 2019',
        endDate: 'Present',
        current: true,
        description: 'Handcrafted luxury interior architectural installations for boutique penthouses in Manhattan.'
      }
    ],
    education: 'Rhode Island School of Design, Furniture Design (2017)',
    certifications: ['Master Woodworking Guild Member'],
    wageExpectation: '$58.00 – $75.00 / hr',
    yearsOfExperience: 7,
    availabilityStatus: 'available',
    resumeName: 'Maya_Patel_Millwork_Resume.pdf',
    resumeText: 'Maya Patel | Architectural Finish Carpenter | New York, NY | Phone: +1 212-555-0199 | Custom Cabinetry, Finish Trim, CNC Milling.',
    registeredAt: new Date(Date.now() - 3600000 * 450).toISOString()
  }
];
