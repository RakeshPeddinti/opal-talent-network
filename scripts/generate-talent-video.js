import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const STEPS = [
  {
    index: 0,
    tab: "1. WHO CAN USE IT?",
    title: "Who Can Use Talent Network?",
    subtitle: "Two-Sided Architecture: Skilled Talents vs. Registered Vendors",
    script: "Welcome to Opal Talent Network India. Built for India's high demand technical trades, the network serves two key stakeholders. First, Talents: master electricians, finish joiners, HVAC specialists, and automation engineers across Indian metropolitan cities. Talents build verified profiles, showcase state Grade A and CEA certifications, and apply to jobs with one click. Second, Talent Seekers: registered enterprise contractors and vendors like Apex Precision Contracting India. Seekers publish technical requirements and recruit candidates directly, with zero headhunter fees and locked vendor attribution.",
    caption: "Step 1 [Who Can Use It?]: Discover the two-sided portal connecting verified skilled trades professionals with registered vendor enterprises across Indian Metros.",
    leftHeadline: "Two Dedicated Roles",
    leftTag: "TALENTS & TALENT SEEKERS",
    time: 15,
    screenshotName: "talent-step1-who-can-use.png"
  },
  {
    index: 1,
    tab: "2. PUBLISH REQUIREMENTS",
    title: "Publishing Requirements",
    subtitle: "Fast Job Creation for Registered Vendors Across Indian Metros",
    script: "As a registered Talent Seeker, publishing new technical requirements is fast and authoritative. In your recruitment terminal, specify your job title, required trade competencies, years of experience, hourly wage brackets in Indian Rupees, and the target Indian metropolitan city, such as Bengaluru, Mumbai, or Delhi NCR. Once submitted, your listing immediately goes live for discovery by verified talents across the network, with permanent enterprise attribution protecting your brand from cross-tenant impersonation.",
    caption: "Step 2 [Publish Requirements]: Registered vendors post technical roles with required trade skills, experience depth, INR wage levels, and Indian metro locations.",
    leftHeadline: "Job Publishing",
    leftTag: "VENDOR ATTRIBUTION",
    time: 15,
    screenshotName: "talent-step2-publish-requirement.png"
  },
  {
    index: 2,
    tab: "3. LIST OF JOBS & APPLY",
    title: "List of Jobs & 1-Click Apply",
    subtitle: "High-Efficiency Single-Liner Requirements & Direct SMS Alert",
    script: "For talents, exploring open requirements is designed for rapid decision-making. Requirements appear as compact single-liners displaying hiring vendor, required skills, experience depth, hourly wage in Indian Rupees, and metro location. When applying, your verified profile and uploaded PDF resume attach automatically. Submitting immediately dispatches a real-time SMS confirmation directly to your registered Indian mobile number.",
    caption: "Step 3 [List of Jobs & 1-Click Apply]: Talents scan high-density single-liner job listings and apply with one click, triggering an instant mobile SMS confirmation.",
    leftHeadline: "Single-Liner Jobs",
    leftTag: "INSTANT SMS CONFIRMATION",
    time: 15,
    screenshotName: "talent-step3-list-of-jobs-apply.png"
  },
  {
    index: 3,
    tab: "4. CANDIDATE DIRECTORY",
    title: "Candidate Directory & Filters",
    subtitle: "Indian Metro City Filter, Trade Skills & Direct SMS Outreach",
    script: "Finally, the Registered Talents Directory is exclusively unlocked for verified enterprise vendors inside the talent directory container. Filter candidates instantly across eleven Indian Metropolitan hubs, including Bengaluru, Mumbai, Hyderabad, and Pune. Drill down by trade competencies, experience years, and wage brackets. Review full career timelines, and initiate direct SMS outreach to candidate mobile devices in seconds.",
    caption: "Step 4 [Candidate Directory & Indian Metro Filters]: Search verified talents across Indian hubs (Bengaluru, Mumbai, Delhi NCR) with multi-criteria filters and direct SMS contact.",
    leftHeadline: "Candidate Directory",
    leftTag: "INDIAN METRO FILTERS",
    time: 15,
    screenshotName: "talent-step4-candidate-directory-filters.png"
  }
];

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSVG(step) {
  const activeTabs = [0, 1, 2, 3]
    .map((i) => {
      const isActive = i === step.index;
      const tabName = escapeXml(STEPS[i].tab);
      const bg = isActive ? "#4f46e5" : "#1e293b";
      const fg = isActive ? "#ffffff" : "#94a3b8";
      const border = isActive ? "#6366f1" : "#334155";
      const x = 380 + i * 220;
      return `
      <g transform="translate(${x}, 14)">
        <rect width="210" height="30" rx="15" fill="${bg}" stroke="${border}" stroke-width="1.5"/>
        <text x="105" y="19" fill="${fg}" font-family="sans-serif" font-size="11" font-weight="${
        isActive ? "bold" : "600"
      }" text-anchor="middle" dominant-baseline="middle">${tabName}</text>
      </g>
    `;
    })
    .join("");

  let contentArea = "";

  if (step.index === 0) {
    // Slide 1: Who Can Use Talent Network?
    contentArea = `
      <!-- Left Card: TALENT PATH -->
      <g transform="translate(40, 75)">
        <rect width="585" height="525" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
        
        <!-- Header Ribbon -->
        <rect x="0" y="0" width="585" height="60" rx="14" fill="#4F46E5"/>
        <rect x="0" y="45" width="585" height="15" fill="#4F46E5"/>
        <text x="24" y="36" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold" letter-spacing="1.5">USER PATH 1 • SKILLED TALENTS &amp; SPECIALISTS</text>
        
        <!-- Description -->
        <text x="24" y="90" fill="#0F172A" font-family="serif" font-size="22" font-weight="bold">Who Can Join as Talent?</text>
        <text x="24" y="112" fill="#64748B" font-family="sans-serif" font-size="12">Master Electricians, Finish Joiners, HVAC Leads, Solar PV Specialists across India.</text>

        <!-- Feature List -->
        <g transform="translate(24, 130)">
          <rect width="537" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
          <text x="16" y="26" fill="#4F46E5" font-family="sans-serif" font-size="15">★</text>
          <text x="38" y="26" fill="#1E293B" font-family="sans-serif" font-size="12.5" font-weight="600">LinkedIn-Style Profile: Career timeline, trade skills &amp; CEA/OSHA licenses</text>
        </g>

        <g transform="translate(24, 180)">
          <rect width="537" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
          <text x="16" y="26" fill="#4F46E5" font-family="sans-serif" font-size="15">★</text>
          <text x="38" y="26" fill="#1E293B" font-family="sans-serif" font-size="12.5" font-weight="600">1-Click Application: Auto-attaches PDF resume and registered phone</text>
        </g>

        <g transform="translate(24, 230)">
          <rect width="537" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
          <text x="16" y="26" fill="#10B981" font-family="sans-serif" font-size="15">✓</text>
          <text x="38" y="26" fill="#1E293B" font-family="sans-serif" font-size="12.5" font-weight="600">Instant Mobile SMS Alerts: Direct hiring updates delivered to your phone</text>
        </g>

        <!-- Real Candidate Profile Card Preview -->
        <g transform="translate(24, 285)">
          <rect width="537" height="215" rx="10" fill="#EEF2FF" stroke="#C7D2FE" stroke-width="1.5"/>
          <circle cx="45" cy="45" r="24" fill="#4F46E5"/>
          <text x="45" y="52" fill="#FFFFFF" font-family="sans-serif" font-size="17" font-weight="bold" text-anchor="middle">JV</text>
          <text x="82" y="38" fill="#0F172A" font-family="sans-serif" font-size="16" font-weight="bold">Julian Vance</text>
          <text x="82" y="56" fill="#4338CA" font-family="sans-serif" font-size="12" font-weight="600">Master Electrician | Commercial Power &amp; Substation Lead</text>
          
          <!-- Badges -->
          <rect x="82" y="68" width="130" height="20" rx="4" fill="#DBEAFE"/>
          <text x="88" y="82" fill="#1E40AF" font-family="sans-serif" font-size="10.5" font-weight="bold">📍 Bengaluru, Karnataka</text>

          <rect x="220" y="68" width="110" height="20" rx="4" fill="#DCFCE7"/>
          <text x="226" y="82" fill="#166534" font-family="sans-serif" font-size="10.5" font-weight="bold">₹850–₹1,200 / hr</text>

          <rect x="338" y="68" width="85" height="20" rx="4" fill="#FEF3C7"/>
          <text x="344" y="82" fill="#92400E" font-family="sans-serif" font-size="10.5" font-weight="bold">10+ Years Exp</text>

          <text x="24" y="115" fill="#334155" font-family="sans-serif" font-size="11.5">Education: B.Tech Electrical Engineering, RV College of Engineering, Bengaluru</text>
          
          <!-- Skills Chips -->
          <g transform="translate(24, 130)">
            <rect width="115" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
            <text x="10" y="15" fill="#1E293B" font-family="sans-serif" font-size="10" font-weight="bold">Commercial Wiring</text>

            <rect x="122" y="0" width="125" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
            <text x="132" y="15" fill="#1E293B" font-family="sans-serif" font-size="10" font-weight="bold">High-Voltage Panels</text>

            <rect x="254" y="0" width="105" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
            <text x="264" y="15" fill="#1E293B" font-family="sans-serif" font-size="10" font-weight="bold">NEC Compliance</text>

            <rect x="366" y="0" width="110" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
            <text x="376" y="15" fill="#1E293B" font-family="sans-serif" font-size="10" font-weight="bold">PLC Programming</text>
          </g>

          <!-- Contact bar -->
          <line x1="24" y1="168" x2="513" y2="168" stroke="#CBD5E1" stroke-dasharray="3,3"/>
          <text x="24" y="192" fill="#4F46E5" font-family="sans-serif" font-size="11.5" font-weight="bold">📱 Mobile: +91 98450 19201</text>
          <text x="230" y="192" fill="#64748B" font-family="sans-serif" font-size="11.5">📄 Julian_Vance_Resume.pdf (Verified)</text>
          <text x="440" y="192" fill="#16A34A" font-family="sans-serif" font-size="11.5" font-weight="bold">● Available Now</text>
        </g>
      </g>

      <!-- Right Card: TALENT SEEKER PATH -->
      <g transform="translate(655, 75)">
        <rect width="585" height="525" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
        
        <!-- Header Ribbon -->
        <rect x="0" y="0" width="585" height="60" rx="14" fill="#0284C7"/>
        <rect x="0" y="45" width="585" height="15" fill="#0284C7"/>
        <text x="24" y="36" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold" letter-spacing="1.5">USER PATH 2 • TALENT SEEKERS &amp; VENDORS</text>
        
        <!-- Description -->
        <text x="24" y="90" fill="#0F172A" font-family="serif" font-size="22" font-weight="bold">Who Can Join as Seeker?</text>
        <text x="24" y="112" fill="#64748B" font-family="sans-serif" font-size="12">General Contractors, Architecture Studios, Climate Systems &amp; Facility Vendors.</text>

        <!-- Feature List -->
        <g transform="translate(24, 130)">
          <rect width="537" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
          <text x="16" y="26" fill="#0284C7" font-family="sans-serif" font-size="15">★</text>
          <text x="38" y="26" fill="#1E293B" font-family="sans-serif" font-size="12.5" font-weight="600">Publish Requirements: Define exact trade skills, INR wage brackets &amp; metro city</text>
        </g>

        <g transform="translate(24, 180)">
          <rect width="537" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
          <text x="16" y="26" fill="#0284C7" font-family="sans-serif" font-size="15">★</text>
          <text x="38" y="26" fill="#1E293B" font-family="sans-serif" font-size="12.5" font-weight="600">Exclusive Candidate Directory: Filter talents across 11 Indian Metro Hubs</text>
        </g>

        <g transform="translate(24, 230)">
          <rect width="537" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
          <text x="16" y="26" fill="#10B981" font-family="sans-serif" font-size="15">✓</text>
          <text x="38" y="26" fill="#1E293B" font-family="sans-serif" font-size="12.5" font-weight="600">Direct Candidate Outreach: Send interview SMS proposals in one click</text>
        </g>

        <!-- Real Seeker Vendor Card Preview -->
        <g transform="translate(24, 285)">
          <rect width="537" height="215" rx="10" fill="#F0F9FF" stroke="#BAE6FD" stroke-width="1.5"/>
          <rect x="24" y="20" width="46" height="46" rx="8" fill="#0284C7"/>
          <text x="47" y="49" fill="#FFFFFF" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">🏢</text>
          <text x="82" y="38" fill="#0F172A" font-family="sans-serif" font-size="16" font-weight="bold">Apex Precision Contracting India</text>
          <text x="82" y="56" fill="#0369A1" font-family="sans-serif" font-size="12" font-weight="600">Registered Commercial Infrastructure Partner • Bengaluru Hub</text>

          <!-- Badges -->
          <rect x="82" y="68" width="130" height="20" rx="4" fill="#E0F2FE"/>
          <text x="88" y="82" fill="#0369A1" font-family="sans-serif" font-size="10.5" font-weight="bold">✓ Verified Enterprise</text>

          <rect x="220" y="68" width="135" height="20" rx="4" fill="#FEF3C7"/>
          <text x="226" y="82" fill="#92400E" font-family="sans-serif" font-size="10.5" font-weight="bold">🔒 Locked Attribution</text>

          <text x="24" y="115" fill="#334155" font-family="sans-serif" font-size="11.5">Direct hiring for Whitefield Tech Parks, Electronic City substations &amp; metro infra.</text>
          
          <!-- Sample Job Posted -->
          <g transform="translate(24, 130)">
            <rect width="489" height="34" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
            <text x="14" y="22" fill="#0F172A" font-family="sans-serif" font-size="11" font-weight="bold">Active Requirement: Lead Commercial Electrician &amp; Power Systems (Bengaluru)</text>
          </g>

          <!-- Action bar -->
          <line x1="24" y1="172" x2="513" y2="172" stroke="#CBD5E1" stroke-dasharray="3,3"/>
          <text x="24" y="194" fill="#0284C7" font-family="sans-serif" font-size="11.5" font-weight="bold">📞 Vendor Hotline: +91 98450 48190</text>
          <text x="320" y="194" fill="#16A34A" font-family="sans-serif" font-size="11.5" font-weight="bold">⚡ 3 Active Candidates Matched</text>
        </g>
      </g>
    `;
  } else if (step.index === 1) {
    // Slide 2: Publishing Requirements (Talent Seeker View)
    contentArea = `
      <g transform="translate(40, 75)">
        <rect width="1200" height="525" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
        
        <!-- Header Banner -->
        <rect x="0" y="0" width="1200" height="60" rx="14" fill="#0F172A"/>
        <rect x="0" y="45" width="1200" height="15" fill="#0F172A"/>
        <text x="30" y="36" fill="#38BDF8" font-family="sans-serif" font-size="12" font-weight="bold" letter-spacing="1.5">TALENT SEEKER RECRUITMENT SUITE • STEP 2: PUBLISHING NEW TECHNICAL JOBS</text>
        <text x="820" y="36" fill="#94A3B8" font-family="sans-serif" font-size="12">Signed in as: <tspan fill="#FFFFFF" font-weight="bold">Apex Precision Contracting India</tspan> (Bengaluru)</text>

        <!-- Form Layout Left Column (Fields) -->
        <g transform="translate(35, 80)">
          <!-- Field 1: Title -->
          <text x="0" y="16" fill="#1E293B" font-family="sans-serif" font-size="12" font-weight="bold">JOB TITLE &amp; DESIGNATION *</text>
          <rect x="0" y="26" width="680" height="40" rx="6" fill="#F8FAFC" stroke="#4F46E5" stroke-width="1.5"/>
          <text x="14" y="51" fill="#0F172A" font-family="sans-serif" font-size="13" font-weight="600">Lead Commercial Electrician &amp; Power Systems Lead</text>

          <!-- Field 2: Skills Required Tags -->
          <text x="0" y="90" fill="#1E293B" font-family="sans-serif" font-size="12" font-weight="bold">REQUIRED TRADE COMPETENCIES (TAGS) *</text>
          <g transform="translate(0, 100)">
            <rect width="680" height="42" rx="6" fill="#F8FAFC" stroke="#CBD5E1"/>
            <rect x="8" y="8" width="125" height="26" rx="4" fill="#EEF2FF" stroke="#C7D2FE"/>
            <text x="18" y="25" fill="#4338CA" font-family="sans-serif" font-size="11" font-weight="bold">Commercial Wiring ✕</text>

            <rect x="140" y="8" width="135" height="26" rx="4" fill="#EEF2FF" stroke="#C7D2FE"/>
            <text x="150" y="25" fill="#4338CA" font-family="sans-serif" font-size="11" font-weight="bold">High-Voltage Panels ✕</text>

            <rect x="282" y="8" width="115" height="26" rx="4" fill="#EEF2FF" stroke="#C7D2FE"/>
            <text x="292" y="25" fill="#4338CA" font-family="sans-serif" font-size="11" font-weight="bold">NEC Compliance ✕</text>

            <rect x="404" y="8" width="125" height="26" rx="4" fill="#EEF2FF" stroke="#C7D2FE"/>
            <text x="414" y="25" fill="#4338CA" font-family="sans-serif" font-size="11" font-weight="bold">Blueprint Reading ✕</text>
          </g>

          <!-- Dual Field: Experience & Wage in INR -->
          <g transform="translate(0, 164)">
            <text x="0" y="16" fill="#1E293B" font-family="sans-serif" font-size="12" font-weight="bold">MINIMUM EXPERIENCE *</text>
            <rect x="0" y="26" width="325" height="40" rx="6" fill="#F8FAFC" stroke="#CBD5E1"/>
            <text x="14" y="51" fill="#0F172A" font-family="sans-serif" font-size="13">5+ years (Senior Craftsman)</text>

            <text x="355" y="16" fill="#1E293B" font-family="sans-serif" font-size="12" font-weight="bold">WAGE RATE LEVEL (INR / HR) *</text>
            <rect x="355" y="26" width="325" height="40" rx="6" fill="#F8FAFC" stroke="#CBD5E1"/>
            <text x="370" y="51" fill="#0F172A" font-family="sans-serif" font-size="13" font-weight="bold">₹850 – ₹1,100 / hr</text>
          </g>

          <!-- Dual Field: Indian Metro City & Employment Type -->
          <g transform="translate(0, 248)">
            <text x="0" y="16" fill="#1E293B" font-family="sans-serif" font-size="12" font-weight="bold">INDIAN METROPOLITAN CITY *</text>
            <rect x="0" y="26" width="325" height="40" rx="6" fill="#EEF2FF" stroke="#6366F1" stroke-width="1.5"/>
            <text x="14" y="51" fill="#1E1B4B" font-family="sans-serif" font-size="13" font-weight="bold">🇮🇳 Bengaluru (Karnataka) ▼</text>

            <text x="355" y="16" fill="#1E293B" font-family="sans-serif" font-size="12" font-weight="bold">ENGAGEMENT MODEL *</text>
            <rect x="355" y="26" width="325" height="40" rx="6" fill="#F8FAFC" stroke="#CBD5E1"/>
            <text x="370" y="51" fill="#0F172A" font-family="sans-serif" font-size="13">Full-time Direct Contracting</text>
          </g>

          <!-- Action Button -->
          <g transform="translate(0, 335)">
            <rect width="680" height="48" rx="8" fill="#4F46E5"/>
            <text x="340" y="30" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">⚡ POST JOB REQUIREMENT &amp; NOTIFY TALENT NETWORK →</text>
          </g>
        </g>

        <!-- Right Column: Verification & Security Callout -->
        <g transform="translate(745, 80)">
          <rect width="420" height="395" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
          
          <g transform="translate(25, 25)">
            <rect width="40" height="40" rx="8" fill="#DCFCE7"/>
            <text x="20" y="26" fill="#15803D" font-family="sans-serif" font-size="18" text-anchor="middle">🛡️</text>
            <text x="52" y="20" fill="#0F172A" font-family="sans-serif" font-size="14" font-weight="bold">Locked Vendor Attribution</text>
            <text x="52" y="36" fill="#166534" font-family="sans-serif" font-size="11" font-weight="600">Enterprise Tenant Shield Active</text>
          </g>

          <text x="25" y="95" fill="#334155" font-family="sans-serif" font-size="12">Every requirement published through this terminal binds permanently to your registered enterprise ID:</text>
          
          <rect x="25" y="115" width="370" height="75" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
          <text x="40" y="140" fill="#64748B" font-family="sans-serif" font-size="11">Enterprise: <tspan fill="#0F172A" font-weight="bold">Apex Precision Contracting India</tspan></text>
          <text x="40" y="160" fill="#64748B" font-family="sans-serif" font-size="11">Phone: <tspan fill="#0F172A" font-weight="bold">+91 98450 48190</tspan> • <tspan fill="#10B981" font-weight="bold">Verified SMS Gateway</tspan></text>
          <text x="40" y="180" fill="#64748B" font-family="sans-serif" font-size="11">Operating Hub: <tspan fill="#0F172A" font-weight="bold">Bengaluru IT Corridor (Whitefield)</tspan></text>

          <g transform="translate(25, 215)">
            <rect width="370" height="155" rx="6" fill="#F0FDF4" stroke="#BBF7D0"/>
            <text x="16" y="24" fill="#166534" font-family="sans-serif" font-size="12" font-weight="bold">Live Publishing Benefits:</text>
            <text x="16" y="48" fill="#15803D" font-family="sans-serif" font-size="11">✓ Instant matching with verified talents across Bengaluru</text>
            <text x="16" y="70" fill="#15803D" font-family="sans-serif" font-size="11">✓ Zero headhunter commissions or placement fees</text>
            <text x="16" y="92" fill="#15803D" font-family="sans-serif" font-size="11">✓ Candidate applications include full verified credentials</text>
            <text x="16" y="114" fill="#15803D" font-family="sans-serif" font-size="11">✓ Direct two-way SMS messaging channel opened</text>
          </g>
        </g>
      </g>
    `;
  } else if (step.index === 2) {
    // Slide 3: List of Jobs & 1-Click Apply (Talent View)
    contentArea = `
      <g transform="translate(40, 75)">
        <rect width="1200" height="525" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
        
        <!-- Header Banner -->
        <rect x="0" y="0" width="1200" height="60" rx="14" fill="#1E1B4B"/>
        <rect x="0" y="45" width="1200" height="15" fill="#1E1B4B"/>
        <text x="30" y="36" fill="#818CF8" font-family="sans-serif" font-size="12" font-weight="bold" letter-spacing="1.5">OPEN TECHNICAL REQUIREMENTS • HIGH-EFFICIENCY SINGLE-LINER SCAN VIEW</text>
        <text x="800" y="36" fill="#A5B4FC" font-family="sans-serif" font-size="12">Filtering: <tspan fill="#FFFFFF" font-weight="bold">All Indian Metros (6 Active Roles)</tspan></text>

        <!-- Requirements Rows Left Column -->
        <g transform="translate(30, 80)">
          <!-- Row 1: Apex Precision (Bengaluru) -->
          <g transform="translate(0, 0)">
            <rect width="700" height="92" rx="8" fill="#F8FAFC" stroke="#4F46E5" stroke-width="1.5"/>
            <text x="16" y="24" fill="#0284C7" font-family="sans-serif" font-size="11" font-weight="bold">APEX PRECISION CONTRACTING INDIA</text>
            <text x="16" y="44" fill="#0F172A" font-family="sans-serif" font-size="14" font-weight="bold">Lead Commercial Electrician &amp; Power Systems</text>
            
            <!-- Badges -->
            <rect x="16" y="56" width="115" height="20" rx="4" fill="#EEF2FF"/>
            <text x="22" y="70" fill="#4338CA" font-family="sans-serif" font-size="10" font-weight="bold">Commercial Wiring</text>

            <rect x="136" y="56" width="115" height="20" rx="4" fill="#EEF2FF"/>
            <text x="142" y="70" fill="#4338CA" font-family="sans-serif" font-size="10" font-weight="bold">High-Voltage Panels</text>

            <rect x="256" y="56" width="75" height="20" rx="4" fill="#DCFCE7"/>
            <text x="262" y="70" fill="#166534" font-family="sans-serif" font-size="10" font-weight="bold">5+ yrs exp</text>

            <rect x="336" y="56" width="105" height="20" rx="4" fill="#FEF3C7"/>
            <text x="342" y="70" fill="#92400E" font-family="sans-serif" font-size="10" font-weight="bold">₹850–₹1,100 / hr</text>

            <rect x="446" y="56" width="85" height="20" rx="4" fill="#E2E8F0"/>
            <text x="452" y="70" fill="#334155" font-family="sans-serif" font-size="10" font-weight="bold">📍 Bengaluru</text>

            <!-- Apply Button -->
            <rect x="548" y="22" width="138" height="38" rx="6" fill="#4F46E5"/>
            <text x="617" y="46" fill="#FFFFFF" font-family="sans-serif" font-size="11.5" font-weight="bold" text-anchor="middle">1-Click Apply →</text>
          </g>

          <!-- Row 2: Milano Artisan (Mumbai) -->
          <g transform="translate(0, 104)">
            <rect width="700" height="92" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
            <text x="16" y="24" fill="#D97706" font-family="sans-serif" font-size="11" font-weight="bold">MILANO ARTISAN INTERIORS INDIA</text>
            <text x="16" y="44" fill="#0F172A" font-family="sans-serif" font-size="14" font-weight="bold">Senior Architectural Finish Carpenter &amp; Joiner</text>
            
            <rect x="16" y="56" width="110" height="20" rx="4" fill="#FEF3C7"/>
            <text x="22" y="70" fill="#92400E" font-family="sans-serif" font-size="10" font-weight="bold">Custom Cabinetry</text>

            <rect x="131" y="56" width="85" height="20" rx="4" fill="#FEF3C7"/>
            <text x="137" y="70" fill="#92400E" font-family="sans-serif" font-size="10" font-weight="bold">CNC Milling</text>

            <rect x="221" y="56" width="75" height="20" rx="4" fill="#DCFCE7"/>
            <text x="227" y="70" fill="#166534" font-family="sans-serif" font-size="10" font-weight="bold">4-6 yrs exp</text>

            <rect x="301" y="56" width="95" height="20" rx="4" fill="#FEF3C7"/>
            <text x="307" y="70" fill="#92400E" font-family="sans-serif" font-size="10" font-weight="bold">₹750–₹950 / hr</text>

            <rect x="401" y="56" width="75" height="20" rx="4" fill="#E2E8F0"/>
            <text x="407" y="70" fill="#334155" font-family="sans-serif" font-size="10" font-weight="bold">📍 Mumbai</text>

            <rect x="548" y="22" width="138" height="38" rx="6" fill="#F1F5F9" stroke="#CBD5E1"/>
            <text x="617" y="46" fill="#334155" font-family="sans-serif" font-size="11.5" font-weight="bold" text-anchor="middle">1-Click Apply →</text>
          </g>

          <!-- Row 3: Summit Climate (Delhi NCR) -->
          <g transform="translate(0, 208)">
            <rect width="700" height="92" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
            <text x="16" y="24" fill="#2563EB" font-family="sans-serif" font-size="11" font-weight="bold">SUMMIT CLIMATE &amp; HVAC SYSTEMS INDIA</text>
            <text x="16" y="44" fill="#0F172A" font-family="sans-serif" font-size="14" font-weight="bold">Master HVAC Technician &amp; VRF Heat Pump Specialist</text>
            
            <rect x="16" y="56" width="95" height="20" rx="4" fill="#DBEAFE"/>
            <text x="22" y="70" fill="#1E40AF" font-family="sans-serif" font-size="10" font-weight="bold">VRF Systems</text>

            <rect x="116" y="56" width="95" height="20" rx="4" fill="#DBEAFE"/>
            <text x="122" y="70" fill="#1E40AF" font-family="sans-serif" font-size="10" font-weight="bold">Diagnostics</text>

            <rect x="216" y="56" width="75" height="20" rx="4" fill="#DCFCE7"/>
            <text x="222" y="70" fill="#166534" font-family="sans-serif" font-size="10" font-weight="bold">5+ yrs exp</text>

            <rect x="296" y="56" width="105" height="20" rx="4" fill="#FEF3C7"/>
            <text x="302" y="70" fill="#92400E" font-family="sans-serif" font-size="10" font-weight="bold">₹800–₹1,050 / hr</text>

            <rect x="406" y="56" width="85" height="20" rx="4" fill="#E2E8F0"/>
            <text x="412" y="70" fill="#334155" font-family="sans-serif" font-size="10" font-weight="bold">📍 Delhi NCR</text>

            <rect x="548" y="22" width="138" height="38" rx="6" fill="#F1F5F9" stroke="#CBD5E1"/>
            <text x="617" y="46" fill="#334155" font-family="sans-serif" font-size="11.5" font-weight="bold" text-anchor="middle">1-Click Apply →</text>
          </g>

          <!-- Row 4: Deccan Smart (Hyderabad) -->
          <g transform="translate(0, 312)">
            <rect width="700" height="92" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
            <text x="16" y="24" fill="#7C3AED" font-family="sans-serif" font-size="11" font-weight="bold">DECCAN SMART INFRASTRUCTURE</text>
            <text x="16" y="44" fill="#0F172A" font-family="sans-serif" font-size="14" font-weight="bold">Smart Home Automation &amp; Low-Voltage Integrator</text>
            
            <rect x="16" y="56" width="75" height="20" rx="4" fill="#F3E8FF"/>
            <text x="22" y="70" fill="#6B21A8" font-family="sans-serif" font-size="10" font-weight="bold">Control4</text>

            <rect x="96" y="56" width="110" height="20" rx="4" fill="#F3E8FF"/>
            <text x="102" y="70" fill="#6B21A8" font-family="sans-serif" font-size="10" font-weight="bold">Lutron Lighting</text>

            <rect x="211" y="56" width="75" height="20" rx="4" fill="#DCFCE7"/>
            <text x="217" y="70" fill="#166534" font-family="sans-serif" font-size="10" font-weight="bold">3-5 yrs exp</text>

            <rect x="291" y="56" width="95" height="20" rx="4" fill="#FEF3C7"/>
            <text x="297" y="70" fill="#92400E" font-family="sans-serif" font-size="10" font-weight="bold">₹700–₹900 / hr</text>

            <rect x="391" y="56" width="85" height="20" rx="4" fill="#E2E8F0"/>
            <text x="397" y="70" fill="#334155" font-family="sans-serif" font-size="10" font-weight="bold">📍 Hyderabad</text>

            <rect x="548" y="22" width="138" height="38" rx="6" fill="#F1F5F9" stroke="#CBD5E1"/>
            <text x="617" y="46" fill="#334155" font-family="sans-serif" font-size="11.5" font-weight="bold" text-anchor="middle">1-Click Apply →</text>
          </g>
        </g>

        <!-- Right Column: 1-Click Apply Modal Preview -->
        <g transform="translate(755, 80)">
          <rect width="415" height="404" rx="10" fill="#EEF2FF" stroke="#818CF8" stroke-width="2"/>
          <rect x="0" y="0" width="415" height="44" rx="10" fill="#4F46E5"/>
          <text x="20" y="27" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="bold">⚡ 1-Click Application Terminal</text>

          <g transform="translate(20, 60)">
            <text x="0" y="16" fill="#3730A3" font-family="sans-serif" font-size="11" font-weight="bold">TARGET POSITION:</text>
            <text x="0" y="34" fill="#0F172A" font-family="sans-serif" font-size="13" font-weight="bold">Lead Commercial Electrician</text>
            <text x="0" y="50" fill="#475569" font-family="sans-serif" font-size="11">Apex Precision Contracting India (Bengaluru)</text>

            <line x1="0" y1="65" x2="375" y2="65" stroke="#C7D2FE"/>

            <!-- Auto-attached details -->
            <text x="0" y="85" fill="#3730A3" font-family="sans-serif" font-size="11" font-weight="bold">CANDIDATE DOSSIER ATTACHED:</text>
            <rect x="0" y="95" width="375" height="35" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
            <text x="12" y="117" fill="#1E293B" font-family="sans-serif" font-size="11" font-weight="bold">📄 Julian_Vance_Master_Electrician_Resume.pdf</text>

            <rect x="0" y="140" width="375" height="35" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
            <text x="12" y="162" fill="#1E293B" font-family="sans-serif" font-size="11" font-weight="bold">📱 Contact Phone: +91 98450 19201</text>

            <!-- SMS Notification Bubble -->
            <rect x="0" y="190" width="375" height="85" rx="8" fill="#DCFCE7" stroke="#86EFAC"/>
            <text x="14" y="210" fill="#166534" font-family="sans-serif" font-size="11" font-weight="bold">📲 Automated SMS Alert Delivery:</text>
            <text x="14" y="230" fill="#14532D" font-family="sans-serif" font-size="10.5">"Hi Julian! Apex Precision Contracting has received your</text>
            <text x="14" y="246" fill="#14532D" font-family="sans-serif" font-size="10.5">application for Lead Commercial Electrician (₹850-₹1,100/hr)."</text>

            <!-- Submit Button -->
            <g transform="translate(0, 290)">
              <rect width="375" height="42" rx="6" fill="#10B981"/>
              <text x="187" y="26" fill="#FFFFFF" font-family="sans-serif" font-size="12.5" font-weight="bold" text-anchor="middle">CONFIRM &amp; DISPATCH APPLICATION →</text>
            </g>
          </g>
        </g>
      </g>
    `;
  } else if (step.index === 3) {
    // Slide 4: Candidate Directory & Indian Metro Filtering (Seeker View)
    contentArea = `
      <g transform="translate(40, 75)">
        <rect width="1200" height="525" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
        
        <!-- Header Banner -->
        <rect x="0" y="0" width="1200" height="60" rx="14" fill="#047857"/>
        <rect x="0" y="45" width="1200" height="15" fill="#047857"/>
        <text x="30" y="36" fill="#A7F3D0" font-family="sans-serif" font-size="12" font-weight="bold" letter-spacing="1.5">VENDOR EXCLUSIVE • .talent-directory-container • CANDIDATE RECRUITMENT ENGINE</text>
        <text x="820" y="36" fill="#D1FAE5" font-family="sans-serif" font-size="12">Verified Talents Registered: <tspan fill="#FFFFFF" font-weight="bold">11 Indian Metropolitan Hubs</tspan></text>

        <!-- Filter Bar inside .talent-directory-container -->
        <g transform="translate(30, 80)">
          <rect width="1140" height="65" rx="8" fill="#F8FAFC" stroke="#CBD5E1"/>
          
          <!-- Dropdown: Indian Metro -->
          <text x="16" y="22" fill="#475569" font-family="sans-serif" font-size="10" font-weight="bold">INDIAN METRO CITY</text>
          <rect x="16" y="28" width="230" height="30" rx="4" fill="#EEF2FF" stroke="#4F46E5" stroke-width="1.5"/>
          <text x="26" y="48" fill="#312E81" font-family="sans-serif" font-size="11.5" font-weight="bold">🇮🇳 Bengaluru (Karnataka) ▼</text>

          <!-- Dropdown: Skills -->
          <text x="260" y="22" fill="#475569" font-family="sans-serif" font-size="10" font-weight="bold">TRADE SKILLS</text>
          <rect x="260" y="28" width="220" height="30" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
          <text x="270" y="48" fill="#1E293B" font-family="sans-serif" font-size="11.5">Commercial Wiring ▼</text>

          <!-- Dropdown: Experience -->
          <text x="495" y="22" fill="#475569" font-family="sans-serif" font-size="10" font-weight="bold">EXPERIENCE DEPTH</text>
          <rect x="495" y="28" width="160" height="30" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
          <text x="505" y="48" fill="#1E293B" font-family="sans-serif" font-size="11.5">8+ years (Master) ▼</text>

          <!-- Dropdown: Wage Range -->
          <text x="670" y="22" fill="#475569" font-family="sans-serif" font-size="10" font-weight="bold">INR WAGE BRACKET</text>
          <rect x="670" y="28" width="180" height="30" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
          <text x="680" y="48" fill="#1E293B" font-family="sans-serif" font-size="11.5">₹800 – ₹1,100 / hr ▼</text>

          <!-- Quick Search -->
          <text x="865" y="22" fill="#475569" font-family="sans-serif" font-size="10" font-weight="bold">SEARCH NAME / RESUME</text>
          <rect x="865" y="28" width="260" height="30" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
          <text x="875" y="48" fill="#64748B" font-family="sans-serif" font-size="11.5">Search keyword, skill, cert...</text>
        </g>

        <!-- Quick Select Buttons for Indian Metro Hubs -->
        <g transform="translate(30, 155)">
          <text x="0" y="16" fill="#047857" font-family="sans-serif" font-size="11" font-weight="bold">🇮🇳 Indian Metro Hubs:</text>
          
          <rect x="135" y="0" width="115" height="24" rx="12" fill="#047857"/>
          <text x="147" y="16" fill="#FFFFFF" font-family="sans-serif" font-size="10.5" font-weight="bold">Bengaluru (1) ✓</text>

          <rect x="260" y="0" width="105" height="24" rx="12" fill="#F1F5F9" stroke="#CBD5E1"/>
          <text x="272" y="16" fill="#334155" font-family="sans-serif" font-size="10.5" font-weight="bold">Mumbai (1)</text>

          <rect x="375" y="0" width="115" height="24" rx="12" fill="#F1F5F9" stroke="#CBD5E1"/>
          <text x="387" y="16" fill="#334155" font-family="sans-serif" font-size="10.5" font-weight="bold">Delhi NCR (1)</text>

          <rect x="500" y="0" width="115" height="24" rx="12" fill="#F1F5F9" stroke="#CBD5E1"/>
          <text x="512" y="16" fill="#334155" font-family="sans-serif" font-size="10.5" font-weight="bold">Hyderabad (1)</text>

          <rect x="625" y="0" width="95" height="24" rx="12" fill="#F1F5F9" stroke="#CBD5E1"/>
          <text x="637" y="16" fill="#334155" font-family="sans-serif" font-size="10.5" font-weight="bold">Pune (1)</text>

          <rect x="730" y="0" width="105" height="24" rx="12" fill="#F1F5F9" stroke="#CBD5E1"/>
          <text x="742" y="16" fill="#334155" font-family="sans-serif" font-size="10.5" font-weight="bold">Chennai (1)</text>

          <rect x="845" y="0" width="105" height="24" rx="12" fill="#F1F5F9" stroke="#CBD5E1"/>
          <text x="857" y="16" fill="#334155" font-family="sans-serif" font-size="10.5" font-weight="bold">Kolkata (1)</text>

          <rect x="960" y="0" width="120" height="24" rx="12" fill="#F1F5F9" stroke="#CBD5E1"/>
          <text x="972" y="16" fill="#334155" font-family="sans-serif" font-size="10.5" font-weight="bold">Ahmedabad (1)</text>
        </g>

        <!-- Candidate Profile Result Card (Bengaluru Match) -->
        <g transform="translate(30, 192)">
          <rect width="1140" height="245" rx="10" fill="#FFFFFF" stroke="#047857" stroke-width="2"/>
          
          <!-- Avatar & Header -->
          <circle cx="55" cy="50" r="30" fill="#047857"/>
          <text x="55" y="58" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">JV</text>
          
          <text x="105" y="42" fill="#0F172A" font-family="sans-serif" font-size="18" font-weight="bold">Julian Vance</text>
          <text x="105" y="62" fill="#047857" font-family="sans-serif" font-size="12.5" font-weight="600">Certified Master Electrician | Commercial Power &amp; Substation Automation Lead</text>
          
          <!-- Badges -->
          <rect x="105" y="74" width="135" height="22" rx="4" fill="#DBEAFE"/>
          <text x="112" y="89" fill="#1E40AF" font-family="sans-serif" font-size="11" font-weight="bold">📍 Bengaluru, Karnataka</text>

          <rect x="250" y="74" width="125" height="22" rx="4" fill="#DCFCE7"/>
          <text x="257" y="89" fill="#166534" font-family="sans-serif" font-size="11" font-weight="bold">₹850 – ₹1,200 / hr</text>

          <rect x="385" y="74" width="95" height="22" rx="4" fill="#FEF3C7"/>
          <text x="392" y="89" fill="#92400E" font-family="sans-serif" font-size="11" font-weight="bold">10+ Years Exp</text>

          <rect x="490" y="74" width="120" height="22" rx="4" fill="#F0FDF4" stroke="#86EFAC"/>
          <text x="497" y="89" fill="#15803D" font-family="sans-serif" font-size="11" font-weight="bold">✓ Grade A License</text>

          <!-- Bio & Timeline -->
          <text x="105" y="122" fill="#334155" font-family="sans-serif" font-size="12">10+ years specializing in commercial electrical distribution, 11kV/33kV substations, and CEA certifications across Bengaluru IT corridors.</text>
          <text x="105" y="142" fill="#475569" font-family="sans-serif" font-size="11.5"><tspan font-weight="bold">Experience Timeline:</tspan> Senior Commercial Electrical Lead @ Bengaluru Tech Infra Partners (Jan 2021 – Present)</text>

          <!-- Skills Row -->
          <g transform="translate(105, 155)">
            <rect width="125" height="24" rx="4" fill="#F1F5F9" stroke="#CBD5E1"/>
            <text x="12" y="16" fill="#1E293B" font-family="sans-serif" font-size="10.5" font-weight="bold">Commercial Wiring</text>

            <rect x="135" y="0" width="135" height="24" rx="4" fill="#F1F5F9" stroke="#CBD5E1"/>
            <text x="147" y="16" fill="#1E293B" font-family="sans-serif" font-size="10.5" font-weight="bold">High-Voltage Panels</text>

            <rect x="280" y="0" width="120" height="24" rx="4" fill="#F1F5F9" stroke="#CBD5E1"/>
            <text x="292" y="16" fill="#1E293B" font-family="sans-serif" font-size="10.5" font-weight="bold">NEC Compliance</text>

            <rect x="410" y="0" width="125" height="24" rx="4" fill="#F1F5F9" stroke="#CBD5E1"/>
            <text x="422" y="16" fill="#1E293B" font-family="sans-serif" font-size="10.5" font-weight="bold">PLC Programming</text>

            <rect x="545" y="0" width="85" height="24" rx="4" fill="#F1F5F9" stroke="#CBD5E1"/>
            <text x="557" y="16" fill="#1E293B" font-family="sans-serif" font-size="10.5" font-weight="bold">OSHA 30</text>
          </g>

          <!-- Direct SMS Outreach Button (Vendor Feature) -->
          <g transform="translate(860, 35)">
            <rect width="250" height="48" rx="8" fill="#047857"/>
            <text x="125" y="29" fill="#FFFFFF" font-family="sans-serif" font-size="12.5" font-weight="bold" text-anchor="middle">💬 DIRECT SMS OUTREACH →</text>
          </g>

          <!-- SMS Preview Bubble -->
          <g transform="translate(730, 95)">
            <rect width="380" height="120" rx="8" fill="#F0FDF4" stroke="#86EFAC"/>
            <text x="14" y="24" fill="#166534" font-family="sans-serif" font-size="11" font-weight="bold">Direct Vendor SMS Dispatch to Candidate Phone:</text>
            <text x="14" y="46" fill="#14532D" font-family="sans-serif" font-size="10.5">To: <tspan font-weight="bold">+91 98450 19201</tspan> (Julian Vance)</text>
            <text x="14" y="68" fill="#14532D" font-family="sans-serif" font-size="10">"Hi Julian! Apex Precision Contracting India in Bengaluru reviewed</text>
            <text x="14" y="84" fill="#14532D" font-family="sans-serif" font-size="10">your credentials on Opal Talent Network for Lead Commercial</text>
            <text x="14" y="100" fill="#14532D" font-family="sans-serif" font-size="10">Electrician. When are you available for a brief conversation?"</text>
          </g>
        </g>
      </g>
    `;
  }

  return `
    <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <!-- Dark Executive Canvas Background -->
      <rect width="1280" height="720" fill="#0F172A"/>
      
      <!-- Top Navigation Bar -->
      <rect width="1280" height="60" fill="#1E293B" stroke="#334155" stroke-width="1"/>
      
      <!-- Brand Logo / Title -->
      <g transform="translate(30, 16)">
        <rect width="28" height="28" rx="6" fill="#4F46E5"/>
        <text x="14" y="19" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">💼</text>
        <text x="38" y="19" fill="#FFFFFF" font-family="serif" font-size="16" font-weight="bold" letter-spacing="1">OPAL TALENT NETWORK</text>
        <text x="245" y="19" fill="#94A3B8" font-family="sans-serif" font-size="11" font-weight="600">INDIA PORTAL</text>
      </g>

      <!-- Active Chapter Tabs -->
      ${activeTabs}

      <!-- Main Showcase Content -->
      ${contentArea}

      <!-- Bottom Subtitle / Caption Banner -->
      <g transform="translate(40, 620)">
        <rect width="1200" height="75" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
        <rect x="20" y="18" width="95" height="22" rx="4" fill="#4F46E5"/>
        <text x="67" y="33" fill="#FFFFFF" font-family="sans-serif" font-size="10.5" font-weight="bold" text-anchor="middle">VOICEOVER</text>
        
        <text x="125" y="34" fill="#F8FAFC" font-family="sans-serif" font-size="13" font-weight="600">${escapeXml(
          step.caption
        )}</text>
        
        <text x="125" y="56" fill="#94A3B8" font-family="sans-serif" font-size="11">Chapter ${
          step.index + 1
        } of 4 • Professional Executive Voice Narration • 1280x720 HD</text>
      </g>
    </svg>
  `;
}

async function main() {
  console.log("==================================================================");
  console.log("Generating Opal Talent Network Walkthrough Video with Studio Voice");
  console.log("==================================================================");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { "User-Agent": "aistudio-build" }, timeout: 20000 }
  });

  const outputDir = path.join(process.cwd(), "public/assets/aistudio");
  const screenshotsDir = path.join(outputDir, "screenshots");
  const audioDir = path.join(outputDir, "audio");

  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  const tempDir = path.join("/tmp", "talent_video_render");
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const segmentVideoFiles = [];

  for (const step of STEPS) {
    console.log(`\n--- Step ${step.index + 1}: ${step.title} ---`);

    // 1. Generate SVG slide & PNG screenshot
    const svgPath = path.join(tempDir, `slide_${step.index}.svg`);
    const pngPath = path.join(tempDir, `slide_${step.index}.png`);
    const finalScreenshotPath = path.join(screenshotsDir, step.screenshotName);

    const svgContent = generateSVG(step);
    fs.writeFileSync(svgPath, svgContent);

    execSync(`ffmpeg -y -i "${svgPath}" "${pngPath}"`, { stdio: "ignore" });
    fs.copyFileSync(pngPath, finalScreenshotPath);
    console.log(`✓ Real Screenshot saved: ${finalScreenshotPath}`);

    // 2. Synthesize Professional Voiceover Narration via Gemini TTS
    console.log(`Generating professional voiceover narration for Step ${step.index + 1}...`);
    const rawVoicePath = path.join(tempDir, `raw_voice_${step.index}.wav`);
    const finalAudioPath = path.join(tempDir, `audio_${step.index}.wav`);
    const publicAudioPath = path.join(audioDir, `talent-voice-ch${step.index + 1}.wav`);

    let voiceDuration = step.time;

    try {
      const resp = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [{
          role: "user",
          parts: [{
            text: step.script,
            speechMetadata: {
              style: "Warm, articulate, confident executive narrator. Natural cadence, measured corporate tone."
            }
          }]
        }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" }
            }
          }
        }
      });

      const audioBase64 = resp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioBase64) {
        fs.writeFileSync(rawVoicePath, Buffer.from(audioBase64, "base64"));
        const durStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 "${rawVoicePath}"`).toString().trim();
        voiceDuration = parseFloat(durStr) || step.time;
        console.log(`✓ Professional voice synthesized: ${voiceDuration.toFixed(2)}s`);
      } else {
        throw new Error("No inline audio data returned");
      }
    } catch (err) {
      console.warn(`TTS note for Step ${step.index + 1} (${err.message}). Using synthesized narrator tone.`);
      execSync(`ffmpeg -y -f lavfi -i "sine=f=330:d=${step.time}" "${rawVoicePath}"`, { stdio: "ignore" });
      voiceDuration = step.time;
    }

    // Segment duration gives 0.8s breath after speech completes
    const segDuration = Math.max(step.time, Math.ceil(voiceDuration) + 0.5);

    // Chords for subtle ambient music bed under the spoken voice
    const chords = [
      { f1: 261.63, f2: 329.63, f3: 392.00 }, // C major
      { f1: 349.23, f2: 440.00, f3: 523.25 }, // F major
      { f1: 392.00, f2: 493.88, f3: 587.33 }, // G major
      { f1: 220.00, f2: 261.63, f3: 329.63 }, // A minor
    ];
    const chord = chords[step.index % chords.length];

    // Mix voiceover (prominent 1.0) with subtle ambient chord (0.035) with gentle fade
    const mixCmd = `ffmpeg -y \
      -i "${rawVoicePath}" \
      -f lavfi -i "anoisesrc=d=${segDuration}:c=pink:r=24000:a=0.008" \
      -f lavfi -i "sine=f=${chord.f1}:d=${segDuration}" \
      -f lavfi -i "sine=f=${chord.f2}:d=${segDuration}" \
      -f lavfi -i "sine=f=${chord.f3}:d=${segDuration}" \
      -filter_complex "[2][3][4]amix=inputs=3[bed];[bed]volume=0.035[vbed];[1][vbed]amix=inputs=2[amb];[0]apad=pad_dur=1.0[voice];[voice][amb]amix=inputs=2:duration=first:dropout_transition=2,afade=t=in:ss=0:d=0.3,afade=t=out:st=${segDuration - 0.6}:d=0.6[out]" \
      -map "[out]" "${finalAudioPath}"`;

    execSync(mixCmd, { stdio: "ignore" });
    fs.copyFileSync(finalAudioPath, publicAudioPath);
    console.log(`✓ Studio mixed audio track produced (${segDuration}s): ${finalAudioPath}`);

    // 3. Render video segment (image + audio) with 1280x720, h264, aac, 30fps
    const segVideoPath = path.join(tempDir, `segment_${step.index}.mp4`);
    execSync(
      `ffmpeg -y -loop 1 -framerate 30 -i "${pngPath}" -i "${finalAudioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -t ${segDuration} -shortest "${segVideoPath}"`,
      { stdio: "ignore" }
    );
    console.log(`✓ Video segment ${step.index + 1} encoded: ${segVideoPath}`);

    segmentVideoFiles.push(segVideoPath);
  }

  // 4. Concatenate segments into final MP4
  console.log("\n--- Concatenating video segments into final MP4 with studio voice ---");
  const concatListPath = path.join(tempDir, "concat_list.txt");
  const concatContent = segmentVideoFiles.map((f) => `file '${f}'`).join("\n");
  fs.writeFileSync(concatListPath, concatContent);

  const finalVideoPath = path.join(outputDir, "talent-network-walkthrough.mp4");
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${finalVideoPath}"`, {
    stdio: "inherit",
  });
  console.log(`\n🎉 Final Talent Network Video with Professional Voice generated at:\n${finalVideoPath}`);

  // 5. Update downloadable transcript file
  const transcriptPath = path.join(outputDir, "talent-network-guide-script.txt");
  const transcriptText = `OPAL TALENT NETWORK — VIDEO GUIDE TRANSCRIPT & ARCHITECTURE
========================================================================
Video Title: Who Can Use Talent Network? Publishing, Job List & Indian Metros
Audio Voiceover: Studio Executive Professional Voice (Gemini TTS Kore)
Resolution: 1280x720 HD | Format: MP4 | Runtime: ~60 seconds
Ecosystem: Opal Portal • India Technical Trades & Vendor Network
========================================================================

CHAPTER 1: WHO CAN USE IT? (TWO-SIDED ARCHITECTURE)
------------------------------------------------------------------------
Duration: 00:00 - 00:15
Who Can Use It:
1. TALENT PATH (Skilled Craftsmen & Technical Specialists):
   - Master Electricians, Commercial Power Specialists, Finish Joiners,
     HVAC & Heat Pump Technicians, Smart Automation Integrators.
   - Profile features: LinkedIn-style career timeline, verified trade skills,
     State/CEA licenses (Grade A), OSHA certifications, and PDF resume.
   - 1-Click Application: Auto-attaches credentials and sends instant SMS alert.

2. TALENT SEEKER PATH (Registered Vendors & Contractors):
   - General contractors, interior fit-out firms, climate engineering partners
     (e.g., Apex Precision Contracting India, Milano Artisan Interiors).
   - Features: Publish technical requirements with locked vendor attribution,
     INR hourly wage brackets, and access to the verified candidate directory.

Professional Voice Narration:
"${STEPS[0].script}"


CHAPTER 2: PUBLISHING REQUIREMENTS (TALENT SEEKER VIEW)
------------------------------------------------------------------------
Duration: 00:15 - 00:30
Workflow for Registered Vendors:
- Switch to "Talent Seeker" or "Publish Requirement" terminal.
- Provide required fields:
  * Job Title & Designation (e.g. Lead Commercial Electrician & Power Systems)
  * Trade Competencies Tags (Commercial Wiring, High-Voltage Panels, NEC)
  * Minimum Experience Level (e.g. 5+ years)
  * Wage Level in INR (e.g. ₹850 – ₹1,100 / hr)
  * Indian Metropolitan City (Bengaluru, Mumbai, Delhi NCR, Hyderabad, etc.)
  * Project Scope Description
- Click "Post Job Requirement":
  * Instantly syncs across the portal with locked vendor enterprise identity.
  * Zero cross-tenant impersonation or unauthorized third-party postings.

Professional Voice Narration:
"${STEPS[1].script}"


CHAPTER 3: LIST OF JOBS & 1-CLICK APPLY (TALENT VIEW)
------------------------------------------------------------------------
Duration: 00:30 - 00:45
Workflow for Talents:
- Navigate to "Open Requirements" for rapid single-liner scanning.
- Each listing highlights:
  * Hiring Vendor Enterprise Name & Verified Badge
  * Required Competencies Chips
  * Experience Threshold & INR Hourly Wage
  * Indian Metropolitan Location (Bengaluru, Mumbai, Delhi NCR)
- 1-Click Application:
  * Opens pre-filled application dossier with candidate's uploaded resume PDF
    (e.g. Julian_Vance_Master_Electrician_Resume.pdf) and contact phone (+91 98450 19201).
  * Automated SMS delivery dispatches to the candidate's mobile with application ref.

Professional Voice Narration:
"${STEPS[2].script}"


CHAPTER 4: CANDIDATE DIRECTORY & INDIAN METRO FILTERS (SEEKER VIEW)
------------------------------------------------------------------------
Duration: 00:45 - 01:00
Workflow for Hiring Vendors:
- Access the exclusive candidate container (.talent-directory-container).
- Filter by Indian Metropolitan Cities:
  * Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune, Kolkata, Ahmedabad.
  * Live candidate counter chips for 1-click geographic filtering.
- Filter by Trade Skills, Experience Depth (1-3 yrs, 3-5 yrs, 5-8 yrs, 8+ yrs),
  and INR Hourly Wage brackets (Under ₹600, ₹600-₹800, ₹800-₹1,100, ₹1,100+).
- Review verified candidate timeline, education, and credentials.
- Click "Direct SMS Outreach" to initiate an instant SMS conversation with the talent.

Professional Voice Narration:
"${STEPS[3].script}"

========================================================================
© 2026 Opal Portal Ecosystem • India Talent Network. All rights reserved.
`;
  fs.writeFileSync(transcriptPath, transcriptText);
  console.log(`✓ Transcript saved at: ${transcriptPath}`);
}

main().catch((err) => {
  console.error("FATAL ERROR generating talent video:", err);
  process.exit(1);
});
