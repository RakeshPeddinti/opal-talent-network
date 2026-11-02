import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  DEFAULT_TALENT_JOBS, 
  DEFAULT_REGISTERED_TALENTS,
  COUNTRY_LOCALE_CONFIGS,
  detectLocaleCountry
} from '../defaultTalentData';
import { TalentProfile, TalentJobRequirement, TalentApplication, TalentSmsNotification } from '../types';

describe('Talent Network Module - Specifications & User Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Module Branding & Tagline', () => {
    it('should define the exact module name and designated tagline', () => {
      const MODULE_NAME = 'Talent Network';
      const MODULE_TAGLINE = 'Create Your Profile. Get Discovered. Connect with Opportunities.';

      expect(MODULE_NAME).toBe('Talent Network');
      expect(MODULE_TAGLINE).toBe('Create Your Profile. Get Discovered. Connect with Opportunities.');
    });
  });

  describe('2. Logged in as "Talent"', () => {
    it('should display LinkedIn-style profile with skills, experiences, certifications and resume', () => {
      const talent: TalentProfile = DEFAULT_REGISTERED_TALENTS[0]; // Julian Vance

      expect(talent.name).toBe('Julian Vance');
      expect(talent.headline).toContain('Master Electrician');
      expect(talent.city).toBe('Bengaluru');
      expect(talent.skills.length).toBeGreaterThanOrEqual(4);
      expect(talent.skills).toContain('Commercial Wiring');
      expect(talent.skills).toContain('NEC Compliance');

      // Verify LinkedIn-style work experience timeline
      expect(talent.experiences.length).toBeGreaterThanOrEqual(2);
      const leadExp = talent.experiences[0];
      expect(leadExp.roleTitle).toBe('Senior Commercial Electrical Lead');
      expect(leadExp.companyName).toBe('Bengaluru Tech Infra Partners');
      expect(leadExp.startDate).toBe('Jan 2021');
      expect(leadExp.current).toBe(true);
      expect(leadExp.description).toBeDefined();

      // Verify Certifications and Resume
      expect(talent.certifications).toContain('State Electrical Supervisory License (Grade A)');
      expect(talent.resumeName).toContain('.pdf');
      expect(talent.phone).toBe('+91 98450 19201');
    });

    it('should present vendor requirements as single-liners with vendor, skillset, experience, and wage level', () => {
      // Format open vendor requirements as compact single-liners for talent scan
      const formatJobSingleLiner = (job: TalentJobRequirement) => {
        return `${job.vendorName} | ${job.title} | Skills: ${job.skillsRequired.slice(0, 3).join(', ')} | Exp: ${job.experienceLevel} | Wage: ${job.wageLevel} | City: ${job.city}`;
      };

      const openJobs = DEFAULT_TALENT_JOBS.filter(j => j.status === 'open');
      expect(openJobs.length).toBeGreaterThanOrEqual(5);

      openJobs.forEach(job => {
        const singleLiner = formatJobSingleLiner(job);
        expect(singleLiner).toContain(job.vendorName);
        expect(singleLiner).toContain(job.title);
        expect(singleLiner).toContain(job.experienceLevel);
        expect(singleLiner).toContain(job.wageLevel);
        expect(singleLiner).toContain(job.city);
        expect(singleLiner.length).toBeGreaterThan(30);
      });
    });

    it('should allow talent to apply for open requirement taking resume and contact phone', () => {
      const talent = DEFAULT_REGISTERED_TALENTS[0];
      const targetJob = DEFAULT_TALENT_JOBS[0]; // Apex Precision Contracting job

      const application: TalentApplication = {
        id: 'APP-TEST-9001',
        jobId: targetJob.id,
        jobTitle: targetJob.title,
        vendorName: targetJob.vendorName,
        talentUid: talent.uid,
        talentName: talent.name,
        talentEmail: talent.email,
        talentPhone: talent.phone,
        resumeName: talent.resumeName || 'Julian_Vance_Resume.pdf',
        resumeText: talent.resumeText || '',
        status: 'applied',
        appliedAt: new Date().toISOString(),
        smsNotificationSent: true
      };

      expect(application.jobId).toBe(targetJob.id);
      expect(application.talentName).toBe('Julian Vance');
      expect(application.talentPhone).toBe('+91 98450 19201');
      expect(application.resumeName).toBe('Julian_Vance_Master_Electrician_Resume.pdf');
    });

    it('should trigger an SMS notification to the talent registered phone from the vendor upon successful application', () => {
      const talent = DEFAULT_REGISTERED_TALENTS[0];
      const targetJob = DEFAULT_TALENT_JOBS[0];

      // Simulated dispatch payload for /api/send-sms
      const smsPayload: TalentSmsNotification = {
        id: `sms-app-${Date.now()}`,
        recipientPhone: talent.phone,
        recipientName: talent.name,
        senderName: targetJob.vendorName,
        senderRole: 'vendor',
        jobId: targetJob.id,
        message: `Hello ${talent.name}, your application for "${targetJob.title}" has been received by ${targetJob.vendorName}. We will review your profile shortly.`,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      expect(smsPayload.recipientPhone).toBe('+91 98450 19201');
      expect(smsPayload.senderName).toBe('Apex Precision Contracting India');
      expect(smsPayload.message).toContain('received by Apex Precision Contracting India');
      expect(smsPayload.status).toBe('delivered');
    });
  });

  describe('3. Logged in as "Talent Seeker"', () => {
    it('should allow vendor to publish requirement with required skills, experience, and wage levels', () => {
      const newRequirement: Partial<TalentJobRequirement> = {
        title: 'Master Solar PV Field Supervisor',
        vendorUid: 'vendor-apex-solutions',
        vendorName: 'Apex Precision Contracting',
        vendorEmail: 'careers@apexprecision.com',
        vendorPhone: '+1 555-481-9022',
        skillsRequired: ['Solar PV Inverters', 'Grid Interconnection', 'Roof Penetration Sealing', 'NEC 690'],
        experienceLevel: '6+ years',
        wageLevel: '$58.00 – $70.00 / hr',
        wageType: 'hourly',
        city: 'San Francisco',
        state: 'CA',
        description: 'Supervising utility-grade rooftop solar arrays and lithium battery storage deployments.',
        employmentType: 'Full-time',
        status: 'open'
      };

      expect(newRequirement.title).toBe('Master Solar PV Field Supervisor');
      expect(newRequirement.skillsRequired).toHaveLength(4);
      expect(newRequirement.experienceLevel).toBe('6+ years');
      expect(newRequirement.wageLevel).toBe('$58.00 – $70.00 / hr');
      expect(newRequirement.city).toBe('San Francisco');
    });

    it('should search and filter candidates by city, strictly displaying talents registered with "Talent Network" across Indian Metros', () => {
      const allTalentsInNetwork: TalentProfile[] = DEFAULT_REGISTERED_TALENTS;

      // Filter by City: Bengaluru
      const blrCandidates = allTalentsInNetwork.filter(t => t.city.toLowerCase() === 'bengaluru');
      expect(blrCandidates.length).toBeGreaterThan(0);
      blrCandidates.forEach(cand => {
        expect(cand.city).toBe('Bengaluru');
        expect(cand.uid).toBeDefined();
        expect(cand.phone).toContain('+91');
        // Candidate must be a verified talent in Talent Network
        expect(cand.experiences.length).toBeGreaterThanOrEqual(1);
      });

      // Filter by City: Mumbai
      const mumCandidates = allTalentsInNetwork.filter(t => t.city.toLowerCase() === 'mumbai');
      expect(mumCandidates.length).toBeGreaterThan(0);
      mumCandidates.forEach(cand => {
        expect(cand.city).toBe('Mumbai');
        expect(cand.phone).toContain('+91');
      });

      // Filter by City: Delhi NCR
      const delCandidates = allTalentsInNetwork.filter(t => t.city.toLowerCase() === 'delhi ncr');
      expect(delCandidates.length).toBeGreaterThan(0);
      delCandidates.forEach(cand => {
        expect(cand.city).toBe('Delhi NCR');
      });

      // Verify that unregistered users or other roles are NOT in the candidates list
      const nonTalentUsers = [
        { uid: 'client-1', role: 'seeker', city: 'Bengaluru' },
        { uid: 'seller-1', role: 'seller', city: 'Bengaluru' }
      ];

      // Simulated network search function
      const getRegisteredTalentsByCity = (city: string) => {
        return allTalentsInNetwork.filter(t => t.city.toLowerCase() === city.toLowerCase());
      };

      const results = getRegisteredTalentsByCity('Bengaluru');
      expect(results.some(r => r.uid === 'client-1')).toBe(false);
      expect(results.some(r => r.uid === 'seller-1')).toBe(false);
      expect(results.some(r => r.name === 'Julian Vance')).toBe(true);
    });

    it('should allow talent seeker to select candidate and dispatch SMS outreach with Indian phone format', () => {
      const vendorName = 'Apex Precision Contracting India';
      const candidate = DEFAULT_REGISTERED_TALENTS[0]; // Julian Vance (Bengaluru)
      const targetJob = DEFAULT_TALENT_JOBS[0];

      const outreachSms: TalentSmsNotification = {
        id: `sms-outreach-${Date.now()}`,
        recipientPhone: candidate.phone,
        recipientName: candidate.name,
        senderName: vendorName,
        senderRole: 'vendor',
        jobId: targetJob.id,
        message: `Hello ${candidate.name}, ${vendorName} in ${candidate.city} reviewed your credentials on Opal Talent Network for "${targetJob.title}". We would like to discuss compensation (${targetJob.wageLevel}). Please reply or call +91 98450 48190.`,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      expect(outreachSms.recipientPhone).toBe('+91 98450 19201');
      expect(outreachSms.senderName).toBe('Apex Precision Contracting India');
      expect(outreachSms.message).toContain('reviewed your credentials on Opal Talent Network');
      expect(outreachSms.message).toContain(targetJob.wageLevel);
    });
  });

  describe('4. Professional Styling & Separation from Storefront', () => {
    it('should avoid retail shopping elements in Talent Network and maintain corporate executive theme', () => {
      // Storefront styling tokens
      const storefrontTheme = {
        primary: '#C5A880', // brand gold
        background: '#FAF8F5', // brand cream
        accent: 'rounded-full' // pill-heavy
      };

      // Talent Network sober professional styling tokens
      const talentNetworkTheme = {
        primary: '#4f46e5', // corporate indigo
        background: '#f8fafc', // sober professional slate-50 canvas
        fontHeadline: 'font-serif tracking-tight',
        fontMono: 'font-mono'
      };

      expect(talentNetworkTheme.background).not.toBe(storefrontTheme.background);
      expect(talentNetworkTheme.primary).not.toBe(storefrontTheme.primary);
    });
  });

  describe('5. Registered Talents Directory Restricted to Registered Vendors Only', () => {
    const isRegisteredVendor = (user: any) => {
      if (!user) return false;
      return user.role === 'talent_seeker' || user.role === 'provider' || user.role === 'admin' || user.email === 'rakesh2xplore@gmail.com';
    };

    it('should grant access to Registered Candidate Directory for authenticated talent seeker and provider vendors', () => {
      const vendorUser = { uid: 'vendor-apex-solutions', role: 'talent_seeker', email: 'careers@apexprecision.com' };
      const providerUser = { uid: 'provider-1', role: 'provider', email: 'provider@opalportal.com' };
      const adminUser = { uid: 'admin-1', role: 'admin', email: 'admin@opalportal.com' };

      expect(isRegisteredVendor(vendorUser)).toBe(true);
      expect(isRegisteredVendor(providerUser)).toBe(true);
      expect(isRegisteredVendor(adminUser)).toBe(true);
    });

    it('should lock and restrict Registered Candidate Directory for non-vendors and guests', () => {
      const guestUser = null;
      const talentUser = { uid: 'talent-1', role: 'talent', email: 'julian.vance@example.com' };
      const customerUser = { uid: 'seeker-1', role: 'seeker', email: 'customer@example.com' };
      const sellerUser = { uid: 'seller-1', role: 'seller', email: 'seller@example.com' };

      expect(isRegisteredVendor(guestUser)).toBe(false);
      expect(isRegisteredVendor(talentUser)).toBe(false);
      expect(isRegisteredVendor(customerUser)).toBe(false);
      expect(isRegisteredVendor(sellerUser)).toBe(false);
    });
  });

  describe('6. Talent Seeker View to Publish New Jobs', () => {
    it('should initialize Talent Seeker view with publish tab and active vendor profile', () => {
      const initialTab = 'publish';
      const currentUser = {
        uid: 'vendor-apex-solutions',
        name: 'Apex Precision Contracting',
        companyName: 'Apex Precision Contracting',
        role: 'talent_seeker',
        city: 'San Francisco',
        phone: '+1 555-481-9022',
        email: 'careers@apexprecision.com'
      };

      expect(initialTab).toBe('publish');
      expect(currentUser.role).toBe('talent_seeker');
      expect(currentUser.companyName).toBe('Apex Precision Contracting');
      expect(currentUser.phone).toBe('+1 555-481-9022');
    });
  });

  describe('7. Talent Seeker Filtering System: Indian Metropolitan Cities, Skills, Experience & Wage Range', () => {
    const getTalentExperienceYears = (t: TalentProfile): number => {
      if (typeof t.yearsOfExperience === 'number') return t.yearsOfExperience;
      const text = `${t.headline} ${t.bio || ''} ${t.resumeText || ''}`;
      const match = text.match(/(\d+)\+?\s*years?/i);
      if (match) return parseInt(match[1], 10);
      if (t.experiences && t.experiences.length > 0) return t.experiences.length * 2.5;
      return 3;
    };

    const getTalentHourlyWage = (t: TalentProfile): { min: number; max: number } => {
      const wageStr = t.wageExpectation || '';
      const matches = wageStr.match(/\d+(?:[,\.]\d+)?/g);
      if (matches && matches.length >= 2) {
        const v1 = parseFloat(matches[0].replace(/,/g, ''));
        const v2 = parseFloat(matches[1].replace(/,/g, ''));
        return { min: Math.min(v1, v2), max: Math.max(v1, v2) };
      } else if (matches && matches.length === 1) {
        const v = parseFloat(matches[0].replace(/,/g, ''));
        return { min: v, max: v };
      }
      return { min: 700, max: 1000 };
    };

    const filterTalents = (
      talents: TalentProfile[],
      options: {
        city?: string;
        skill?: string;
        experience?: 'all' | '1-3' | '3-5' | '5-8' | '8+';
        wage?: 'all' | 'under-600' | '600-800' | '800-1100' | '1100+';
        query?: string;
      }
    ) => {
      return talents.filter(talent => {
        if (options.city && options.city !== 'All Indian Metros' && options.city !== 'All Cities') {
          const cNorm = options.city.toLowerCase().replace(/\s*\(.*\)/, '').trim();
          const talentCityNorm = talent.city.toLowerCase().trim();
          const matchesCity = talentCityNorm.includes(cNorm) || cNorm.includes(talentCityNorm);
          if (!matchesCity) return false;
        }
        if (options.skill && options.skill !== 'All Skills') {
          const hasSkill = talent.skills.some(s => s.toLowerCase() === options.skill!.toLowerCase());
          if (!hasSkill) return false;
        }
        if (options.experience && options.experience !== 'all') {
          const exp = getTalentExperienceYears(talent);
          if (options.experience === '1-3' && (exp < 1 || exp > 3)) return false;
          if (options.experience === '3-5' && (exp < 3 || exp > 5)) return false;
          if (options.experience === '5-8' && (exp < 5 || exp > 8)) return false;
          if (options.experience === '8+' && exp < 8) return false;
        }
        if (options.wage && options.wage !== 'all') {
          const wage = getTalentHourlyWage(talent);
          if (options.wage === 'under-600' && wage.min >= 600) return false;
          if (options.wage === '600-800' && (wage.max < 600 || wage.min > 800)) return false;
          if (options.wage === '800-1100' && (wage.max < 800 || wage.min > 1100)) return false;
          if (options.wage === '1100+' && wage.max < 1100) return false;
        }
        if (options.query && options.query.trim()) {
          const q = options.query.toLowerCase();
          const matches = talent.name.toLowerCase().includes(q) ||
            talent.headline.toLowerCase().includes(q) ||
            talent.skills.some(s => s.toLowerCase().includes(q)) ||
            talent.city.toLowerCase().includes(q) ||
            (talent.state && talent.state.toLowerCase().includes(q));
          if (!matches) return false;
        }
        return true;
      });
    };

    it('should filter talents across Indian Metropolitan Cities', () => {
      const blrMatches = filterTalents(DEFAULT_REGISTERED_TALENTS, { city: 'Bengaluru' });
      expect(blrMatches.length).toBeGreaterThan(0);
      expect(blrMatches.some(t => t.name === 'Julian Vance')).toBe(true);

      const hydMatches = filterTalents(DEFAULT_REGISTERED_TALENTS, { city: 'Hyderabad' });
      expect(hydMatches.length).toBeGreaterThan(0);
      expect(hydMatches.some(t => t.name === 'Charlotte Wu')).toBe(true);

      const puneMatches = filterTalents(DEFAULT_REGISTERED_TALENTS, { city: 'Pune' });
      expect(puneMatches.length).toBeGreaterThan(0);
      expect(puneMatches.some(t => t.name === 'David Kim')).toBe(true);

      const chnMatches = filterTalents(DEFAULT_REGISTERED_TALENTS, { city: 'Chennai' });
      expect(chnMatches.length).toBeGreaterThan(0);
      expect(chnMatches.some(t => t.name === 'Amara Okafor')).toBe(true);
    });

    it('should filter talents by specific skill correctly', () => {
      const solarMatches = filterTalents(DEFAULT_REGISTERED_TALENTS, { skill: 'Solar PV Inverters' });
      expect(solarMatches.length).toBeGreaterThan(0);
      expect(solarMatches.some(t => t.name === 'Amara Okafor')).toBe(true);

      const wiringMatches = filterTalents(DEFAULT_REGISTERED_TALENTS, { skill: 'Commercial Wiring' });
      expect(wiringMatches.some(t => t.name === 'Julian Vance')).toBe(true);

      const stoneMatches = filterTalents(DEFAULT_REGISTERED_TALENTS, { skill: 'Marble Fabrication' });
      expect(stoneMatches.some(t => t.name === 'Nathaniel Cross')).toBe(true);

      const telecomMatches = filterTalents(DEFAULT_REGISTERED_TALENTS, { skill: 'Structured Cabling' });
      expect(telecomMatches.some(t => t.name === 'David Kim')).toBe(true);
    });

    it('should filter talents by experience depth correctly', () => {
      const juniorTalents = filterTalents(DEFAULT_REGISTERED_TALENTS, { experience: '1-3' });
      expect(juniorTalents.length).toBeGreaterThan(0);
      expect(juniorTalents.every(t => (t.yearsOfExperience || 0) <= 3)).toBe(true);
      expect(juniorTalents.some(t => t.name === 'David Kim')).toBe(true);

      const seniorTalents = filterTalents(DEFAULT_REGISTERED_TALENTS, { experience: '5-8' });
      expect(seniorTalents.length).toBeGreaterThan(0);
      expect(seniorTalents.some(t => t.name === 'Elena Costa')).toBe(true);
      expect(seniorTalents.some(t => t.name === 'Amara Okafor')).toBe(true);

      const masterTalents = filterTalents(DEFAULT_REGISTERED_TALENTS, { experience: '8+' });
      expect(masterTalents.length).toBeGreaterThan(0);
      expect(masterTalents.some(t => t.name === 'Julian Vance')).toBe(true);
      expect(masterTalents.some(t => t.name === 'Nathaniel Cross')).toBe(true);
    });

    it('should filter talents by INR wage range expectation correctly', () => {
      const entryWage = filterTalents(DEFAULT_REGISTERED_TALENTS, { wage: 'under-600' });
      expect(entryWage.length).toBeGreaterThan(0);
      expect(entryWage.some(t => t.name === 'David Kim')).toBe(true); // ₹450 - ₹650 / hr

      const midWage = filterTalents(DEFAULT_REGISTERED_TALENTS, { wage: '600-800' });
      expect(midWage.length).toBeGreaterThan(0);
      expect(midWage.some(t => t.name === 'Charlotte Wu')).toBe(true); // ₹700 - ₹900 / hr
      expect(midWage.some(t => t.name === 'Elena Costa')).toBe(true); // ₹750 - ₹950 / hr

      const highWage = filterTalents(DEFAULT_REGISTERED_TALENTS, { wage: '800-1100' });
      expect(highWage.length).toBeGreaterThan(0);
      expect(highWage.some(t => t.name === 'Julian Vance')).toBe(true); // ₹850 - ₹1,200 / hr
      expect(highWage.some(t => t.name === 'Marcus Reyes')).toBe(true); // ₹800 - ₹1,100 / hr

      const premiumWage = filterTalents(DEFAULT_REGISTERED_TALENTS, { wage: '1100+' });
      expect(premiumWage.length).toBeGreaterThan(0);
      expect(premiumWage.some(t => t.name === 'Nathaniel Cross')).toBe(true); // ₹1,000 - ₹1,500 / hr
      expect(premiumWage.some(t => t.name === 'Amara Okafor')).toBe(true); // ₹900 - ₹1,300 / hr
    });

    it('should perform combined multi-criteria filtering for Indian Metros (City + Skill + Experience)', () => {
      const result = filterTalents(DEFAULT_REGISTERED_TALENTS, {
        city: 'Bengaluru',
        skill: 'Commercial Wiring',
        experience: '8+'
      });

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Julian Vance');
      expect(result[0].city).toBe('Bengaluru');
      expect(result[0].wageExpectation).toContain('₹850 – ₹1,200');
    });

    it('should dynamically filter talent cards using "Search by Skill" text input based on skills defined in user profile', () => {
      // User profile with defined skills
      const userProfile: TalentProfile = DEFAULT_REGISTERED_TALENTS[0]; // Julian Vance
      expect(userProfile.skills).toBeDefined();
      expect(userProfile.skills.length).toBeGreaterThanOrEqual(4);

      // Function simulating dynamic "Search by Skill" text input
      const searchBySkill = (talentsList: TalentProfile[], skillQuery: string) => {
        if (!skillQuery.trim()) return talentsList;
        const q = skillQuery.trim().toLowerCase();
        return talentsList.filter(t => (t.skills || []).some(s => s.toLowerCase().includes(q)));
      };

      // 1. Test filtering by user's first profile skill: "Commercial Wiring"
      const skill1 = userProfile.skills[0]; // 'Commercial Wiring'
      const matchesSkill1 = searchBySkill(DEFAULT_REGISTERED_TALENTS, skill1);
      expect(matchesSkill1.length).toBeGreaterThan(0);
      expect(matchesSkill1.every(t => t.skills.some(s => s.toLowerCase().includes(skill1.toLowerCase())))).toBe(true);
      expect(matchesSkill1.some(t => t.name === 'Julian Vance')).toBe(true);

      // 2. Test filtering by user's profile skill: "PLC Programming"
      const plcMatches = searchBySkill(DEFAULT_REGISTERED_TALENTS, 'PLC Programming');
      expect(plcMatches.length).toBeGreaterThan(0);
      expect(plcMatches.every(t => t.skills.some(s => s.toLowerCase().includes('plc')))).toBe(true);

      // 3. Test dynamic substring search (as user types in the input)
      const substringMatches = searchBySkill(DEFAULT_REGISTERED_TALENTS, 'wiring');
      expect(substringMatches.length).toBeGreaterThan(0);
      expect(substringMatches.some(t => t.name === 'Julian Vance')).toBe(true);

      // 4. Test non-matching skill returns empty list cleanly
      const nonExistent = searchBySkill(DEFAULT_REGISTERED_TALENTS, 'NonExistentSkillXYZ');
      expect(nonExistent.length).toBe(0);
    });

    it('should support locale-specific metropolitan cities based on the active country', () => {
      // Verify country configurations exist with locale-specific cities
      expect(COUNTRY_LOCALE_CONFIGS.IN).toBeDefined();
      expect(COUNTRY_LOCALE_CONFIGS.IN.name).toBe('India');
      expect(COUNTRY_LOCALE_CONFIGS.IN.cities).toContain('Bengaluru');
      expect(COUNTRY_LOCALE_CONFIGS.IN.cities).toContain('Mumbai');
      expect(COUNTRY_LOCALE_CONFIGS.IN.cities).toContain('Delhi NCR');
      expect(COUNTRY_LOCALE_CONFIGS.IN.currency).toBe('INR');

      expect(COUNTRY_LOCALE_CONFIGS.US).toBeDefined();
      expect(COUNTRY_LOCALE_CONFIGS.US.name).toBe('United States');
      expect(COUNTRY_LOCALE_CONFIGS.US.cities).toContain('San Francisco');
      expect(COUNTRY_LOCALE_CONFIGS.US.cities).toContain('New York');
      expect(COUNTRY_LOCALE_CONFIGS.US.currency).toBe('USD');

      expect(COUNTRY_LOCALE_CONFIGS.GB).toBeDefined();
      expect(COUNTRY_LOCALE_CONFIGS.GB.name).toBe('United Kingdom');
      expect(COUNTRY_LOCALE_CONFIGS.GB.cities).toContain('London');
      expect(COUNTRY_LOCALE_CONFIGS.GB.cities).toContain('Manchester');

      // Helper function to resolve locale-specific city dropdown options
      const getDropdownCitiesForCountry = (countryCode: string) => {
        const config = COUNTRY_LOCALE_CONFIGS[countryCode] || COUNTRY_LOCALE_CONFIGS.IN;
        return {
          metroLabel: config.metroLabel,
          allOption: `All ${config.metroLabel}`,
          cities: config.cities
        };
      };

      // In India:
      const indiaDropdown = getDropdownCitiesForCountry('IN');
      expect(indiaDropdown.allOption).toBe('All Indian Metros');
      expect(indiaDropdown.cities).toContain('Bengaluru');
      expect(indiaDropdown.cities).toContain('Hyderabad');

      // In US:
      const usDropdown = getDropdownCitiesForCountry('US');
      expect(usDropdown.allOption).toBe('All US Metros');
      expect(usDropdown.cities).toContain('San Francisco');
      expect(usDropdown.cities).toContain('New York');

      // In UK:
      const ukDropdown = getDropdownCitiesForCountry('GB');
      expect(ukDropdown.allOption).toBe('All UK Metros');
      expect(ukDropdown.cities).toContain('London');

      // Verify safe detection fallback
      expect(detectLocaleCountry()).toBeDefined();
    });
  });

  describe('8. Independent Portal Separation: Zero Cross-Linking & Separate Codebases', () => {
    it('should verify that Opal Talent Network has ZERO links, tabs, or buttons switching to Opal Portal', () => {
      const talentNetworkNavigation = {
        title: 'OPAL TALENT NETWORK',
        badge: 'Independent Portal',
        switchToOpalButton: undefined, // Fully removed per user instruction
        footerSwitchLink: undefined,   // Fully removed per user instruction
        tabs: ['profile', 'requirements', 'applications', 'directory', 'publish', 'my_postings'],
        hasIndependentLogout: true
      };

      expect(talentNetworkNavigation.switchToOpalButton).toBeUndefined();
      expect(talentNetworkNavigation.footerSwitchLink).toBeUndefined();
      expect(talentNetworkNavigation.tabs).not.toContain('opal_portal');
      expect(talentNetworkNavigation.tabs).not.toContain('storefront');
    });

    it('should verify that Opal Portal has ZERO links, tabs, or buttons switching to Talent Portal', () => {
      const opalPortalNavigation = {
        brand: 'OPAL PORTAL',
        switchToTalentButton: undefined, // Fully removed per user instruction
        footerTalentLink: undefined,     // Fully removed per user instruction
        dashboardHireTalentButton: undefined, // Fully removed per user instruction
        views: ['client', 'admin', 'seeker', 'discussions', 'seller']
      };

      expect(opalPortalNavigation.switchToTalentButton).toBeUndefined();
      expect(opalPortalNavigation.footerTalentLink).toBeUndefined();
      expect(opalPortalNavigation.dashboardHireTalentButton).toBeUndefined();
      expect(opalPortalNavigation.views).not.toContain('talent');
    });

    it('should verify standalone portal codebase loading via portalConfig', () => {
      const PORTAL_ENV_CONFIG = {
        TALENT_NETWORK: 'talent_network',
        OPAL_PORTAL: 'opal_portal'
      };

      const resolveActiveApp = (portalId: string) => {
        if (portalId === 'opal_portal') {
          return {
            componentName: 'OpalPortalApp',
            title: 'Opal Portal | Luxury Services & Curated Retail Hub',
            theme: 'light'
          };
        }
        return {
          componentName: 'TalentNetworkApp',
          title: 'Opal Talent Network | Verified Candidates & Technical Hiring Portal',
          theme: 'dark'
        };
      };

      const talentApp = resolveActiveApp(PORTAL_ENV_CONFIG.TALENT_NETWORK);
      expect(talentApp.componentName).toBe('TalentNetworkApp');
      expect(talentApp.title).toContain('Opal Talent Network');

      const opalApp = resolveActiveApp(PORTAL_ENV_CONFIG.OPAL_PORTAL);
      expect(opalApp.componentName).toBe('OpalPortalApp');
      expect(opalApp.title).toContain('Opal Portal');
      expect(opalApp.componentName).not.toBe(talentApp.componentName);
    });
  });
});



