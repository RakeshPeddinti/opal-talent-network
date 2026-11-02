import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const STEPS = [
  {
    index: 0,
    tab: "1. ALL SERVICES (4 TRADES)",
    title: "All Types of Services",
    subtitle: "Beauty, Handyman, Cloud Kitchen, and Party Planning",
    script: "Welcome to Opal Portal. Explore four distinct service categories tailored for everyday luxury: Salon Beauty and Wellness, certified Handyman repairs, gourmet Cloud Kitchen dining, and bespoke Party Planning. Each trade features verified provider attribution, accurate travel distance calculations, and instant time-slot reservations.",
    caption: 'Step 1 [All Services]: Explore 4 dedicated trades—Beauty, Handyman, Cloud Kitchen, and Party Planning—with locked provider attribution, distance calculations, and instant slot reservations.',
    leftHeadline: "4 Core Trades",
    leftTag: "INSTANT SLOT RESERVATION",
    time: 14
  },
  {
    index: 1,
    tab: "2. SHOPPING BY DEPARTMENT",
    title: "Department Shopping",
    subtitle: "Pure Retail Merchandise with Zero Duration Rules",
    script: "Second, explore our Shop by Department luxury retail catalog. From designer clothing and footwear to professional kitchen wear, automotive care, and home living. Each product article is a pure retail good with interactive color swatches, department-specific sizing, live stock control, and instant Boutique Bag checkout.",
    caption: 'Step 2 [Department Shopping]: Browse pure retail merchandise with interactive color swatches, department-specific sizing, live stock control, and instant boutique bag cart.',
    leftHeadline: "Shop by Dept",
    leftTag: "DUAL-DROPDOWN ARCHITECTURE",
    time: 14
  },
  {
    index: 2,
    tab: "3. CARRIER SHIPMENT & PICKUP",
    title: "Shipment & Fulfillment",
    subtitle: "Live Carrier Tariffs and Boutique Showroom Pickup",
    script: "Third, Opal provides two flexible fulfillment options. Choose Express Carrier Delivery with live calculated tariffs from FedEx, USPS, and UPS, complete with real-time barcode tracking milestones. Or select Boutique Showroom Pickup to collect directly from the seller's physical storefront with verified store hours and Google Maps GPS driving directions.",
    caption: 'Step 3 [Fulfillment & Delivery]: Choose between live-tariff Express Carrier Delivery (FedEx/USPS/UPS) with tracking milestones, or Boutique Showroom Pickup with Google Maps directions.',
    leftHeadline: "Delivery or Pickup",
    leftTag: "DUAL FULFILLMENT ENGINE",
    time: 15
  },
  {
    index: 3,
    tab: "4. PAYMENT METHODS (4 OPTIONS)",
    title: "Payment Methods",
    subtitle: "Cash, Instant Zelle, Encrypted Cards, and In-Store Pay",
    script: "Finally, Opal empowers clients with transparent, zero-risk payment methods. Settle in person upon completion using Cash, send instant fee-free direct transfers via Zelle, pay securely with encrypted credit cards, or complete your purchase in person with In-Store Showroom Pay upon collecting your retail bag.",
    caption: 'Step 4 [Payment Methods]: Complete flexibility with Cash on completion, instant fee-free Zelle, encrypted cards, and in-store pickup payment.',
    leftHeadline: "4 Ways to Pay",
    leftTag: "TRANSPARENT SETTLEMENTS",
    time: 14
  }
];

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function generateSVG(step) {
  const activeTabs = [0, 1, 2, 3].map(i => {
    const isActive = i === step.index;
    const tabName = escapeXml(STEPS[i].tab);
    const bg = isActive ? "#C5A880" : "#242220";
    const fg = isActive ? "#141312" : "#999088";
    const border = isActive ? "#E6CBA8" : "#383533";
    const x = 460 + i * 200;
    return `
      <g transform="translate(${x}, 12)">
        <rect width="190" height="28" rx="14" fill="${bg}" stroke="${border}" stroke-width="1"/>
        <text x="95" y="18" fill="${fg}" font-family="sans-serif" font-size="10.5" font-weight="${isActive ? 'bold' : 'normal'}" text-anchor="middle" dominant-baseline="middle">${tabName}</text>
      </g>
    `;
  }).join("");

  let contentArea = "";

  if (step.index === 0) {
    // Services
    contentArea = `
      <!-- Left Card: Trade Overview -->
      <g transform="translate(40, 68)">
        <rect width="320" height="530" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
        <rect x="20" y="24" width="130" height="22" rx="4" fill="#F0EDE4"/>
        <text x="28" y="39" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">STEP 1 • VETTED TRADES</text>
        <text x="20" y="80" fill="#181716" font-family="serif" font-size="28" font-weight="bold">4 Core Trades</text>
        <rect x="20" y="94" width="170" height="20" rx="10" fill="#EAE5DA"/>
        <text x="30" y="108" fill="#5A524A" font-family="sans-serif" font-size="9" font-weight="bold" letter-spacing="0.5">INSTANT SLOT RESERVATION</text>
        
        <!-- Trade 1 -->
        <g transform="translate(20, 130)">
          <rect width="280" height="65" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
          <text x="14" y="24" fill="#C5A880" font-family="sans-serif" font-size="16">🌸</text>
          <text x="40" y="24" fill="#181716" font-family="sans-serif" font-size="13" font-weight="bold">Beauty &amp; Wellness</text>
          <text x="40" y="42" fill="#7A7065" font-family="sans-serif" font-size="11">Hair Styling, Facials, Hot Stone Massage</text>
          <text x="40" y="56" fill="#10B981" font-family="sans-serif" font-size="10" font-weight="bold">✓ 3 Verified Salons • Instant Calendar</text>
        </g>
        
        <!-- Trade 2 -->
        <g transform="translate(20, 205)">
          <rect width="280" height="65" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
          <text x="14" y="24" fill="#C5A880" font-family="sans-serif" font-size="16">🔧</text>
          <text x="40" y="24" fill="#181716" font-family="sans-serif" font-size="13" font-weight="bold">Handyman &amp; Repairs</text>
          <text x="40" y="42" fill="#7A7065" font-family="sans-serif" font-size="11">Drywall, TV Mounts, Electrical &amp; Plumbing</text>
          <text x="40" y="56" fill="#10B981" font-family="sans-serif" font-size="10" font-weight="bold">✓ Licensed &amp; Insured • 2.4 mi Radius</text>
        </g>

        <!-- Trade 3 -->
        <g transform="translate(20, 280)">
          <rect width="280" height="65" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
          <text x="14" y="24" fill="#C5A880" font-family="sans-serif" font-size="16">🍳</text>
          <text x="40" y="24" fill="#181716" font-family="sans-serif" font-size="13" font-weight="bold">Cloud Kitchen Dining</text>
          <text x="40" y="42" fill="#7A7065" font-family="sans-serif" font-size="11">Gourmet Chef Boxes • No rigid time slot</text>
          <text x="40" y="56" fill="#3B82F6" font-family="sans-serif" font-size="10" font-weight="bold">✓ Flexible Dispatch • Savor at Home</text>
        </g>

        <!-- Trade 4 -->
        <g transform="translate(20, 355)">
          <rect width="280" height="65" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
          <text x="14" y="24" fill="#C5A880" font-family="sans-serif" font-size="16">✨</text>
          <text x="40" y="24" fill="#181716" font-family="sans-serif" font-size="13" font-weight="bold">Party &amp; Event Styling</text>
          <text x="40" y="42" fill="#7A7065" font-family="sans-serif" font-size="11">Bespoke Galas, Anniversaries, Staging</text>
          <text x="40" y="56" fill="#8B5CF6" font-family="sans-serif" font-size="10" font-weight="bold">✓ Full Event Architecture &amp; Sound</text>
        </g>

        <!-- Attribution Notice -->
        <g transform="translate(20, 435)">
          <rect width="280" height="75" rx="8" fill="#181716"/>
          <text x="14" y="24" fill="#C5A880" font-family="sans-serif" font-size="11" font-weight="bold">🔒 PERMANENT PROVIDER ATTRIBUTION</text>
          <text x="14" y="44" fill="#D4CEBE" font-family="sans-serif" font-size="10">Provider company names are securely locked to</text>
          <text x="14" y="59" fill="#D4CEBE" font-family="sans-serif" font-size="10">prevent multi-tenant impersonation or cross-pollution.</text>
        </g>
      </g>

      <!-- Right Area: Live Service Cards -->
      <g transform="translate(380, 68)">
        <!-- Service Card 1 -->
        <g transform="translate(0, 0)">
          <rect width="420" height="250" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
          <rect x="20" y="16" width="110" height="22" rx="11" fill="#FEF3C7" stroke="#FDE68A"/>
          <text x="75" y="31" fill="#92400E" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">BEAUTY SALON</text>
          <text x="140" y="31" fill="#7A7065" font-family="sans-serif" font-size="11">Salon Opal Beverly Hills • ⭐ 4.9 (128 reviews)</text>
          <text x="20" y="70" fill="#181716" font-family="serif" font-size="22" font-weight="bold">24K Gold Luxury Facial</text>
          <text x="20" y="95" fill="#5A524A" font-family="sans-serif" font-size="12">Deep skin cellular renewal, diamond microdermabrasion, gold leaf mask.</text>
          <text x="20" y="130" fill="#181716" font-family="sans-serif" font-size="20" font-weight="bold">$140 <tspan font-size="13" font-weight="normal" fill="#7A7065">/ 60 mins</tspan></text>
          
          <rect x="20" y="150" width="380" height="42" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
          <text x="35" y="175" fill="#181716" font-family="sans-serif" font-size="11" font-weight="bold">📅 Upcoming Slot:</text>
          <text x="140" y="175" fill="#047857" font-family="sans-serif" font-size="11" font-weight="bold">Today, 2:30 PM • Beverly Hills (1.8 mi)</text>
          
          <rect x="20" y="202" width="180" height="34" rx="17" fill="#181716"/>
          <text x="110" y="223" fill="#C5A880" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Instant Book Slot →</text>
        </g>

        <!-- Service Card 2 -->
        <g transform="translate(440, 0)">
          <rect width="420" height="250" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
          <rect x="20" y="16" width="130" height="22" rx="11" fill="#DBEAFE" stroke="#BFDBFE"/>
          <text x="85" y="31" fill="#1E40AF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">HANDYMAN REPAIRS</text>
          <text x="160" y="31" fill="#7A7065" font-family="sans-serif" font-size="11">Apex Craftsmen LLC • ⭐ 5.0 (94 reviews)</text>
          <text x="20" y="70" fill="#181716" font-family="serif" font-size="22" font-weight="bold">TV Mounting &amp; In-Wall Cable</text>
          <text x="20" y="95" fill="#5A524A" font-family="sans-serif" font-size="12">Precision bracket mounting up to 85", stud anchoring, concealed cables.</text>
          <text x="20" y="130" fill="#181716" font-family="sans-serif" font-size="20" font-weight="bold">$95 <tspan font-size="13" font-weight="normal" fill="#7A7065">/ 45 mins</tspan></text>
          
          <rect x="20" y="150" width="380" height="42" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
          <text x="35" y="175" fill="#181716" font-family="sans-serif" font-size="11" font-weight="bold">📍 Service Location:</text>
          <text x="155" y="175" fill="#1E40AF" font-family="sans-serif" font-size="11" font-weight="bold">To Your Doorstep (Within 25 Miles)</text>
          
          <rect x="20" y="202" width="180" height="34" rx="17" fill="#181716"/>
          <text x="110" y="223" fill="#C5A880" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Schedule Service →</text>
        </g>

        <!-- Service Card 3 & 4 Mini Bar -->
        <g transform="translate(0, 270)">
          <rect width="860" height="150" rx="12" fill="#FAF8F5" stroke="#E5E0D5" stroke-width="1.5"/>
          <text x="24" y="35" fill="#181716" font-family="serif" font-size="18" font-weight="bold">Additional Specialty Trade Categories</text>
          
          <!-- Cloud Kitchen Item -->
          <g transform="translate(24, 52)">
            <rect width="395" height="78" rx="8" fill="#FFFFFF" stroke="#E5E0D5"/>
            <text x="16" y="28" fill="#181716" font-family="sans-serif" font-size="13" font-weight="bold">🍳 Cloud Kitchen: 5-Course French Tasting Box</text>
            <text x="16" y="48" fill="#7A7065" font-family="sans-serif" font-size="11">Atelier Gourmet • $120.00 • No rigid 60-min time slot needed</text>
            <text x="16" y="66" fill="#059669" font-family="sans-serif" font-size="10" font-weight="bold">⚡ Delivered Fresh in Insulated Thermal Box</text>
          </g>

          <!-- Party Planner Item -->
          <g transform="translate(440, 52)">
            <rect width="395" height="78" rx="8" fill="#FFFFFF" stroke="#E5E0D5"/>
            <text x="16" y="28" fill="#181716" font-family="sans-serif" font-size="13" font-weight="bold">✨ Party Planner: Bespoke Gala &amp; Staging</text>
            <text x="16" y="48" fill="#7A7065" font-family="sans-serif" font-size="11">Celestial Events LLC • $450.00 • Complete Floral &amp; Lighting</text>
            <text x="16" y="66" fill="#8B5CF6" font-family="sans-serif" font-size="10" font-weight="bold">⚡ VIP Consultation &amp; On-Site Coordination</text>
          </g>
        </g>
      </g>
    `;
  } else if (step.index === 1) {
    // Shopping
    contentArea = `
      <!-- Left Card: Retail Taxonomy -->
      <g transform="translate(40, 68)">
        <rect width="320" height="530" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
        <rect x="20" y="24" width="130" height="22" rx="4" fill="#F0EDE4"/>
        <text x="28" y="39" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">STEP 2 • RETAIL CATALOG</text>
        <text x="20" y="80" fill="#181716" font-family="serif" font-size="28" font-weight="bold">Shop by Dept</text>
        <rect x="20" y="94" width="170" height="20" rx="10" fill="#EAE5DA"/>
        <text x="30" y="108" fill="#5A524A" font-family="sans-serif" font-size="9" font-weight="bold" letter-spacing="0.5">DUAL-DROPDOWN ARCHITECTURE</text>

        <!-- Dropdown simulator -->
        <g transform="translate(20, 130)">
          <rect width="280" height="85" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
          <text x="14" y="24" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold">MUTUALLY EXCLUSIVE DROP-DOWN SWITCHER</text>
          
          <rect x="14" y="36" width="115" height="34" rx="6" fill="#FFFFFF" stroke="#D1CAC0"/>
          <text x="22" y="57" fill="#999088" font-family="sans-serif" font-size="11">Services: SELECT</text>

          <text x="135" y="57" fill="#C5A880" font-family="sans-serif" font-size="14" font-weight="bold">⇄</text>

          <rect x="150" y="36" width="115" height="34" rx="6" fill="#181716" stroke="#C5A880"/>
          <text x="158" y="57" fill="#C5A880" font-family="sans-serif" font-size="11" font-weight="bold">DEPT: Clothing ▼</text>
        </g>

        <!-- Active Departments List -->
        <g transform="translate(20, 230)">
          <text x="0" y="18" fill="#181716" font-family="sans-serif" font-size="12" font-weight="bold">7 Curated Retail Departments:</text>
          
          <rect x="0" y="30" width="85" height="26" rx="6" fill="#181716"/>
          <text x="42" y="47" fill="#C5A880" font-family="sans-serif" font-size="10.5" font-weight="bold" text-anchor="middle">Clothing</text>

          <rect x="95" y="30" width="75" height="26" rx="6" fill="#F0EDE4"/>
          <text x="132" y="47" fill="#4A423A" font-family="sans-serif" font-size="10.5" font-weight="bold" text-anchor="middle">Shoes</text>

          <rect x="180" y="30" width="100" height="26" rx="6" fill="#F0EDE4"/>
          <text x="230" y="47" fill="#4A423A" font-family="sans-serif" font-size="10.5" font-weight="bold" text-anchor="middle">Kitchen wear</text>

          <rect x="0" y="66" width="85" height="26" rx="6" fill="#F0EDE4"/>
          <text x="42" y="83" fill="#4A423A" font-family="sans-serif" font-size="10.5" font-weight="bold" text-anchor="middle">Autocare</text>

          <rect x="95" y="66" width="95" height="26" rx="6" fill="#F0EDE4"/>
          <text x="142" y="83" fill="#4A423A" font-family="sans-serif" font-size="10.5" font-weight="bold" text-anchor="middle">Home &amp; Living</text>

          <rect x="200" y="66" width="80" height="26" rx="6" fill="#F0EDE4"/>
          <text x="240" y="83" fill="#4A423A" font-family="sans-serif" font-size="10.5" font-weight="bold" text-anchor="middle">Beauty</text>
        </g>

        <!-- Retail Rule Box -->
        <g transform="translate(20, 360)">
          <rect width="280" height="150" rx="8" fill="#181716"/>
          <text x="16" y="28" fill="#C5A880" font-family="sans-serif" font-size="12" font-weight="bold">PURE RETAIL ARTICLE DISCIPLINE</text>
          <text x="16" y="52" fill="#FFFFFF" font-family="sans-serif" font-size="11">✔ Zero duration rules or rigid calendar slots</text>
          <text x="16" y="74" fill="#FFFFFF" font-family="sans-serif" font-size="11">✔ Interactive color swatches with hex circles</text>
          <text x="16" y="96" fill="#FFFFFF" font-family="sans-serif" font-size="11">✔ Department size chips (S–XL, US 8–11)</text>
          <text x="16" y="118" fill="#FFFFFF" font-family="sans-serif" font-size="11">✔ Real-time SKU stock validation</text>
          <text x="16" y="138" fill="#10B981" font-family="sans-serif" font-size="11" font-weight="bold">✔ Instant Boutique Bag Drawer with Subtotal</text>
        </g>
      </g>

      <!-- Right Area: Product Showcase & Cart -->
      <g transform="translate(380, 68)">
        <!-- Product 1 -->
        <g transform="translate(0, 0)">
          <rect width="270" height="420" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
          <rect x="16" y="16" width="238" height="150" rx="8" fill="#ECE8DF"/>
          <text x="135" y="95" fill="#8C8275" font-family="serif" font-size="16" text-anchor="middle">🧥 Silk Blazer Preview</text>
          
          <rect x="26" y="26" width="70" height="20" rx="10" fill="#EF4444"/>
          <text x="61" y="40" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">20% OFF</text>

          <text x="16" y="190" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">CLOTHING • MILANO SARTORIALE</text>
          <text x="16" y="215" fill="#181716" font-family="serif" font-size="17" font-weight="bold">Italian Silk Evening Blazer</text>
          
          <text x="16" y="245" fill="#181716" font-family="sans-serif" font-size="20" font-weight="bold">$340.00 <tspan font-size="13" fill="#999088" text-decoration="line-through">$420.00</tspan></text>
          
          <!-- Swatches -->
          <text x="16" y="275" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold">SELECT COLOR:</text>
          <circle cx="28" cy="295" r="9" fill="#181716" stroke="#C5A880" stroke-width="2.5"/>
          <circle cx="56" cy="295" r="9" fill="#C5A880" stroke="#FFFFFF" stroke-width="1.5"/>
          <circle cx="84" cy="295" r="9" fill="#781D26" stroke="#FFFFFF" stroke-width="1.5"/>
          
          <!-- Sizes -->
          <text x="16" y="325" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold">SIZE CHIPS:</text>
          <rect x="16" y="335" width="26" height="24" rx="4" fill="#F0EDE4"/>
          <text x="29" y="351" fill="#181716" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">S</text>
          <rect x="48" y="335" width="26" height="24" rx="4" fill="#181716"/>
          <text x="61" y="351" fill="#C5A880" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">M</text>
          <rect x="80" y="335" width="26" height="24" rx="4" fill="#F0EDE4"/>
          <text x="93" y="351" fill="#181716" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">L</text>
          <rect x="112" y="335" width="28" height="24" rx="4" fill="#F0EDE4"/>
          <text x="126" y="351" fill="#181716" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">XL</text>
          
          <rect x="16" y="375" width="238" height="32" rx="16" fill="#10B981"/>
          <text x="135" y="395" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">✓ Added to Boutique Bag</text>
        </g>

        <!-- Product 2 -->
        <g transform="translate(290, 0)">
          <rect width="270" height="420" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
          <rect x="16" y="16" width="238" height="150" rx="8" fill="#ECE8DF"/>
          <text x="135" y="95" fill="#8C8275" font-family="serif" font-size="16" text-anchor="middle">👞 Calfskin Loafers</text>
          
          <text x="16" y="190" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">SHOES • FLORENCE ATELIER</text>
          <text x="16" y="215" fill="#181716" font-family="serif" font-size="17" font-weight="bold">Hand-Stitched Loafers</text>
          
          <text x="16" y="245" fill="#181716" font-family="sans-serif" font-size="20" font-weight="bold">$280.00 <tspan font-size="13" fill="#10B981">(In Stock)</tspan></text>
          
          <text x="16" y="275" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold">SELECT COLOR:</text>
          <circle cx="28" cy="295" r="9" fill="#583C28" stroke="#C5A880" stroke-width="2.5"/>
          <circle cx="56" cy="295" r="9" fill="#181716" stroke="#FFFFFF" stroke-width="1.5"/>
          
          <text x="16" y="325" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold">SHOE SIZES (US):</text>
          <rect x="16" y="335" width="40" height="24" rx="4" fill="#F0EDE4"/>
          <text x="36" y="351" fill="#181716" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">US 8</text>
          <rect x="62" y="335" width="40" height="24" rx="4" fill="#F0EDE4"/>
          <text x="82" y="351" fill="#181716" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">US 9</text>
          <rect x="108" y="335" width="42" height="24" rx="4" fill="#181716"/>
          <text x="129" y="351" fill="#C5A880" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">US 10</text>
          <rect x="156" y="335" width="42" height="24" rx="4" fill="#F0EDE4"/>
          <text x="177" y="351" fill="#181716" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">US 11</text>
          
          <rect x="16" y="375" width="238" height="32" rx="16" fill="#181716"/>
          <text x="135" y="395" fill="#C5A880" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">+ Add to Boutique Bag</text>
        </g>

        <!-- Right Cart Drawer Simulator -->
        <g transform="translate(580, 0)">
          <rect width="280" height="420" rx="12" fill="#181716" stroke="#C5A880" stroke-width="1.5"/>
          <text x="20" y="35" fill="#FFFFFF" font-family="serif" font-size="18" font-weight="bold">🛍️ Boutique Bag (2)</text>
          
          <rect x="20" y="55" width="240" height="70" rx="6" fill="#242220"/>
          <text x="32" y="78" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="bold">Italian Silk Blazer</text>
          <text x="32" y="96" fill="#999088" font-family="sans-serif" font-size="10">Onyx Black • Size M • Qty: 1</text>
          <text x="210" y="88" fill="#C5A880" font-family="sans-serif" font-size="13" font-weight="bold">$340</text>

          <rect x="20" y="135" width="240" height="70" rx="6" fill="#242220"/>
          <text x="32" y="158" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="bold">Hand-Stitched Loafers</text>
          <text x="32" y="176" fill="#999088" font-family="sans-serif" font-size="10">Espresso Brown • US 10 • Qty: 1</text>
          <text x="210" y="168" fill="#C5A880" font-family="sans-serif" font-size="13" font-weight="bold">$280</text>

          <line x1="20" y1="225" x2="260" y2="225" stroke="#383533" stroke-width="1"/>
          
          <text x="20" y="250" fill="#999088" font-family="sans-serif" font-size="11">Bag Subtotal:</text>
          <text x="210" y="250" fill="#FFFFFF" font-family="sans-serif" font-size="17" font-weight="bold">$620.00</text>

          <!-- Delivery Mode Selector -->
          <rect x="20" y="275" width="240" height="34" rx="6" fill="#242220" stroke="#C5A880"/>
          <circle cx="36" cy="292" r="5" fill="#C5A880"/>
          <text x="48" y="296" fill="#FFFFFF" font-family="sans-serif" font-size="10.5" font-weight="bold">Express Carrier (FedEx/USPS/UPS)</text>

          <rect x="20" y="320" width="240" height="34" rx="6" fill="#242220"/>
          <circle cx="36" cy="337" r="5" fill="#383533"/>
          <text x="48" y="341" fill="#999088" font-family="sans-serif" font-size="10.5">Boutique Showroom Pickup ($0)</text>

          <rect x="20" y="370" width="240" height="36" rx="18" fill="#C5A880"/>
          <text x="140" y="393" fill="#181716" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Proceed to Checkout →</text>
        </g>
      </g>
    `;
  } else if (step.index === 2) {
    // Shipment & Pickup
    contentArea = `
      <!-- Left Card: Dual Fulfillment Overview -->
      <g transform="translate(40, 68)">
        <rect width="320" height="530" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
        <rect x="20" y="24" width="160" height="22" rx="4" fill="#F0EDE4"/>
        <text x="28" y="39" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">STEP 3 • FULFILLMENT MODES</text>
        <text x="20" y="80" fill="#181716" font-family="serif" font-size="28" font-weight="bold">Ship or Pickup</text>
        <rect x="20" y="94" width="180" height="20" rx="10" fill="#EAE5DA"/>
        <text x="30" y="108" fill="#5A524A" font-family="sans-serif" font-size="9" font-weight="bold" letter-spacing="0.5">DUAL FULFILLMENT ENGINE</text>

        <!-- Mode 1 Pill -->
        <g transform="translate(20, 130)">
          <rect width="280" height="85" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
          <text x="14" y="26" fill="#C5A880" font-family="sans-serif" font-size="16">📦</text>
          <text x="40" y="26" fill="#181716" font-family="sans-serif" font-size="13" font-weight="bold">1. Express Carrier Shipping</text>
          <text x="40" y="46" fill="#7A7065" font-family="sans-serif" font-size="11">Real-time commercial tariffs from FedEx, USPS,</text>
          <text x="40" y="62" fill="#7A7065" font-family="sans-serif" font-size="11">UPS &amp; Standard Ground with live barcode tracking.</text>
        </g>

        <!-- Mode 2 Pill -->
        <g transform="translate(20, 230)">
          <rect width="280" height="85" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
          <text x="14" y="26" fill="#C5A880" font-family="sans-serif" font-size="16">🏬</text>
          <text x="40" y="26" fill="#181716" font-family="sans-serif" font-size="13" font-weight="bold">2. Boutique Showroom Pickup</text>
          <text x="40" y="46" fill="#7A7065" font-family="sans-serif" font-size="11">Collect directly from seller's physical address.</text>
          <text x="40" y="62" fill="#7A7065" font-family="sans-serif" font-size="11">$0 shipping fees + Google Maps GPS directions.</text>
        </g>

        <!-- Highlights Box -->
        <g transform="translate(20, 335)">
          <rect width="280" height="175" rx="8" fill="#181716"/>
          <text x="16" y="28" fill="#C5A880" font-family="sans-serif" font-size="11" font-weight="bold">AUTHENTIC TRACKING ARCHITECTURE</text>
          <text x="16" y="52" fill="#FFFFFF" font-family="sans-serif" font-size="10.5">✔ Dynamic weight &amp; destination calculation</text>
          <text x="16" y="74" fill="#FFFFFF" font-family="sans-serif" font-size="10.5">✔ Standard carrier tracking barcodes:</text>
          <text x="24" y="94" fill="#93C5FD" font-family="sans-serif" font-size="10">FedEx: 7946 XXXX XXXX</text>
          <text x="24" y="112" fill="#86EFAC" font-family="sans-serif" font-size="10">USPS: 9400 1118 9956 XXXX</text>
          <text x="24" y="130" fill="#FDE047" font-family="sans-serif" font-size="10">UPS: 1Z XXXXXX 02 XXXX</text>
          <text x="16" y="156" fill="#10B981" font-family="sans-serif" font-size="10.5" font-weight="bold">✔ SMS Dispatch to Customer's Mobile Phone</text>
        </g>
      </g>

      <!-- Right Area: Carrier Rates & Showroom Address Card -->
      <g transform="translate(380, 68)">
        <!-- Top Half: Real Carrier Rates -->
        <g transform="translate(0, 0)">
          <rect width="860" height="225" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
          <text x="24" y="32" fill="#181716" font-family="serif" font-size="18" font-weight="bold">Real Carrier Commercial Tariffs (/api/shipping/rates)</text>
          <text x="24" y="52" fill="#7A7065" font-family="sans-serif" font-size="11">Calculated for: Beverly Hills, CA 90210 • Parcel Weight: 2.5 lbs • 2 Items</text>

          <!-- Rates Grid -->
          <g transform="translate(24, 70)">
            <!-- FedEx Card -->
            <rect x="0" y="0" width="190" height="85" rx="8" fill="#FAF8F5" stroke="#C5A880" stroke-width="1.5"/>
            <text x="14" y="24" fill="#4B0082" font-family="sans-serif" font-size="12" font-weight="bold">FedEx 2Day® Express</text>
            <text x="14" y="44" fill="#181716" font-family="sans-serif" font-size="18" font-weight="bold">$19.95</text>
            <text x="14" y="62" fill="#059669" font-family="sans-serif" font-size="10" font-weight="bold">2 Business Days</text>
            <text x="14" y="76" fill="#7A7065" font-family="sans-serif" font-size="9.5">Guaranteed by 4:30 PM</text>

            <!-- USPS Card -->
            <rect x="205" y="0" width="190" height="85" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
            <text x="219" y="24" fill="#004B87" font-family="sans-serif" font-size="12" font-weight="bold">USPS Priority Express®</text>
            <text x="219" y="44" fill="#181716" font-family="sans-serif" font-size="18" font-weight="bold">$21.50</text>
            <text x="219" y="62" fill="#059669" font-family="sans-serif" font-size="10" font-weight="bold">1 Business Day</text>
            <text x="219" y="76" fill="#7A7065" font-family="sans-serif" font-size="9.5">Next-Day Money-Back</text>

            <!-- UPS Card -->
            <rect x="410" y="0" width="190" height="85" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
            <text x="424" y="24" fill="#644117" font-family="sans-serif" font-size="12" font-weight="bold">UPS 2nd Day Air®</text>
            <text x="424" y="44" fill="#181716" font-family="sans-serif" font-size="18" font-weight="bold">$20.75</text>
            <text x="424" y="62" fill="#059669" font-family="sans-serif" font-size="10" font-weight="bold">2 Business Days</text>
            <text x="424" y="76" fill="#7A7065" font-family="sans-serif" font-size="9.5">Guaranteed End of Day</text>

            <!-- Ground Card -->
            <rect x="615" y="0" width="195" height="85" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
            <text x="629" y="24" fill="#181716" font-family="sans-serif" font-size="12" font-weight="bold">Complimentary Ground</text>
            <text x="629" y="44" fill="#059669" font-family="sans-serif" font-size="18" font-weight="bold">$0.00 FREE</text>
            <text x="629" y="62" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold">3-5 Business Days</text>
            <text x="629" y="76" fill="#7A7065" font-family="sans-serif" font-size="9.5">Standard Dispatch</text>
          </g>

          <!-- Timeline Tracking Preview -->
          <g transform="translate(24, 168)">
            <rect width="810" height="42" rx="6" fill="#181716"/>
            <text x="18" y="26" fill="#C5A880" font-family="sans-serif" font-size="11" font-weight="bold">LIVE TRACKING:</text>
            <text x="130" y="26" fill="#34D399" font-family="sans-serif" font-size="11">● Electronic Manifest Transmitted</text>
            <text x="360" y="26" fill="#34D399" font-family="sans-serif" font-size="11">● Courier Pickup</text>
            <text x="500" y="26" fill="#60A5FA" font-family="sans-serif" font-size="11">● In Transit (Sort Hub)</text>
            <text x="680" y="26" fill="#FBBF24" font-family="sans-serif" font-size="11">● Delivery: Thursday</text>
          </g>
        </g>

        <!-- Bottom Half: Boutique Showroom Pickup Details -->
        <g transform="translate(0, 245)">
          <rect width="860" height="175" rx="12" fill="#FAF8F5" stroke="#E5E0D5" stroke-width="1.5"/>
          <text x="24" y="32" fill="#181716" font-family="serif" font-size="18" font-weight="bold">🏬 Seller Boutique Showroom Pickup (Address Attribution)</text>
          
          <g transform="translate(24, 46)">
            <!-- Left Info -->
            <rect width="470" height="110" rx="8" fill="#FFFFFF" stroke="#E5E0D5"/>
            <text x="18" y="26" fill="#181716" font-family="sans-serif" font-size="12" font-weight="bold">Seller Storefront: Milano Sartoriale Boutique</text>
            <text x="18" y="48" fill="#047857" font-family="sans-serif" font-size="11" font-weight="bold">📍 450 N Rodeo Dr, Beverly Hills, CA 90210</text>
            <text x="18" y="70" fill="#7A7065" font-family="sans-serif" font-size="10.5">Hours: Mon – Sat: 10:00 AM – 7:00 PM | Sun: 12:00 PM – 5:00 PM</text>
            <text x="18" y="90" fill="#7A7065" font-family="sans-serif" font-size="10.5">Instructions: Curbside attendant or 1st floor customer service desk.</text>

            <!-- Right Buttons -->
            <g transform="translate(490, 0)">
              <rect width="320" height="110" rx="8" fill="#FFFFFF" stroke="#E5E0D5"/>
              <text x="16" y="26" fill="#181716" font-family="sans-serif" font-size="11" font-weight="bold">CUSTOMER PICKUP EXPERIENCE</text>
              
              <rect x="16" y="36" width="288" height="30" rx="6" fill="#181716"/>
              <text x="160" y="55" fill="#C5A880" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">🗺️ Get Driving Directions (Google Maps)</text>

              <rect x="16" y="72" width="288" height="28" rx="6" fill="#ECFDF5" stroke="#A7F3D0"/>
              <text x="160" y="90" fill="#065F46" font-family="sans-serif" font-size="10.5" font-weight="bold" text-anchor="middle">📱 Digital Pickup Pass &amp; SMS Alert Sent</text>
            </g>
          </g>
        </g>
      </g>
    `;
  } else if (step.index === 3) {
    // Payment Methods
    contentArea = `
      <!-- Left Card: Revenue & Settlement Overview -->
      <g transform="translate(40, 68)">
        <rect width="320" height="530" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
        <rect x="20" y="24" width="160" height="22" rx="4" fill="#F0EDE4"/>
        <text x="28" y="39" fill="#7A7065" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">STEP 4 • PAYMENT FLEXIBILITY</text>
        <text x="20" y="80" fill="#181716" font-family="serif" font-size="28" font-weight="bold">4 Ways to Pay</text>
        <rect x="20" y="94" width="180" height="20" rx="10" fill="#EAE5DA"/>
        <text x="30" y="108" fill="#5A524A" font-family="sans-serif" font-size="9" font-weight="bold" letter-spacing="0.5">TRANSPARENT SETTLEMENTS</text>

        <!-- Provider Earnings Simulator -->
        <g transform="translate(20, 130)">
          <rect width="280" height="150" rx="8" fill="#181716"/>
          <text x="16" y="26" fill="#999088" font-family="sans-serif" font-size="10" font-weight="bold">PROVIDER EARNINGS (CASH + ZELLE)</text>
          <text x="16" y="60" fill="#34D399" font-family="sans-serif" font-size="28" font-weight="bold">$1,485.00</text>
          
          <g transform="translate(16, 75)">
            <rect width="115" height="42" rx="6" fill="#242220"/>
            <text x="12" y="20" fill="#999088" font-family="sans-serif" font-size="9.5">💵 CASH TOTAL</text>
            <text x="12" y="36" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="bold">$620.00</text>

            <rect x="125" y="0" width="120" height="42" rx="6" fill="#242220"/>
            <text x="137" y="20" fill="#999088" font-family="sans-serif" font-size="9.5">⚡ ZELLE TOTAL</text>
            <text x="137" y="36" fill="#C5A880" font-family="sans-serif" font-size="13" font-weight="bold">$865.00</text>
          </g>

          <text x="16" y="138" fill="#F87171" font-family="sans-serif" font-size="10">Awaiting Settlement: $205.00 (2 clients pending)</text>
        </g>

        <!-- Zero Trust Risk Notice -->
        <g transform="translate(20, 300)">
          <rect width="280" height="210" rx="8" fill="#FAF8F5" stroke="#EAE5DA"/>
          <text x="16" y="26" fill="#181716" font-family="sans-serif" font-size="12" font-weight="bold">ZERO-TRUST-RISK POLICY</text>
          <text x="16" y="48" fill="#5A524A" font-family="sans-serif" font-size="11">Clients never have to pay upfront for services.</text>
          <text x="16" y="68" fill="#5A524A" font-family="sans-serif" font-size="11">Inspect completed handyman work or enjoy</text>
          <text x="16" y="88" fill="#5A524A" font-family="sans-serif" font-size="11">your salon treatment first, then settle in cash</text>
          <text x="16" y="108" fill="#5A524A" font-family="sans-serif" font-size="11">or instant Zelle with 100% confidence.</text>
          
          <line x1="16" y1="125" x2="264" y2="125" stroke="#E5E0D5"/>
          <text x="16" y="148" fill="#181716" font-family="sans-serif" font-size="11" font-weight="bold">🔒 Privacy &amp; Direct Transfer:</text>
          <text x="16" y="168" fill="#7A7065" font-family="sans-serif" font-size="10.5">Zelle funds go 100% directly to the provider</text>
          <text x="16" y="188" fill="#7A7065" font-family="sans-serif" font-size="10.5">with 0% marketplace deduction.</text>
        </g>
      </g>

      <!-- Right Area: 4 Detailed Payment Methods -->
      <g transform="translate(380, 68)">
        <!-- Grid of 4 Payment Methods -->
        <g transform="translate(0, 0)">
          <!-- Method 1: Cash -->
          <g transform="translate(0, 0)">
            <rect width="420" height="190" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
            <rect x="20" y="20" width="100" height="24" rx="12" fill="#ECFDF5" stroke="#A7F3D0"/>
            <text x="70" y="36" fill="#065F46" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">OPTION 1</text>
            <text x="20" y="75" fill="#181716" font-family="serif" font-size="20" font-weight="bold">💵 Cash on Completion</text>
            <text x="20" y="102" fill="#5A524A" font-family="sans-serif" font-size="12">Pay the technician, stylist, or chef directly upon service</text>
            <text x="20" y="122" fill="#5A524A" font-family="sans-serif" font-size="12">completion. Ideal for in-person home repairs and salon visits.</text>
            <text x="20" y="152" fill="#059669" font-family="sans-serif" font-size="11" font-weight="bold">✓ Zero processing fees • Instant receipt voucher issued</text>
            <text x="20" y="172" fill="#7A7065" font-family="sans-serif" font-size="10">Provider records payment in dashboard with 1-click.</text>
          </g>

          <!-- Method 2: Zelle -->
          <g transform="translate(440, 0)">
            <rect width="420" height="190" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
            <rect x="20" y="20" width="100" height="24" rx="12" fill="#EFF6FF" stroke="#BFDBFE"/>
            <text x="70" y="36" fill="#1E40AF" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">OPTION 2</text>
            <text x="20" y="75" fill="#181716" font-family="serif" font-size="20" font-weight="bold">⚡ Instant Direct Zelle</text>
            <text x="20" y="102" fill="#5A524A" font-family="sans-serif" font-size="12">Direct bank-to-bank electronic transfer straight to the</text>
            <text x="20" y="122" fill="#5A524A" font-family="sans-serif" font-size="12">provider's registered mobile number or email.</text>
            <text x="20" y="152" fill="#2563EB" font-family="sans-serif" font-size="11" font-weight="bold">✓ Real-time settlement • Instant automated SMS alert</text>
            <text x="20" y="172" fill="#7A7065" font-family="sans-serif" font-size="10">Funds deposited directly with zero intermediary delays.</text>
          </g>

          <!-- Method 3: Cards -->
          <g transform="translate(0, 210)">
            <rect width="420" height="190" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
            <rect x="20" y="20" width="100" height="24" rx="12" fill="#FAF5FF" stroke="#E9D5FF"/>
            <text x="70" y="36" fill="#6B21A8" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">OPTION 3</text>
            <text x="20" y="75" fill="#181716" font-family="serif" font-size="20" font-weight="bold">💳 Encrypted Cards</text>
            <text x="20" y="102" fill="#5A524A" font-family="sans-serif" font-size="12">All major debit and credit cards (Visa, Mastercard, Amex).</text>
            <text x="20" y="122" fill="#5A524A" font-family="sans-serif" font-size="12">Processed via 256-bit AES encrypted gateway.</text>
            <text x="20" y="152" fill="#7C3AED" font-family="sans-serif" font-size="11" font-weight="bold">✓ PCI-DSS Level 1 Compliant • Fraud Protection</text>
            <text x="20" y="172" fill="#7A7065" font-family="sans-serif" font-size="10">Supports Apple Pay and Google Pay digital wallets.</text>
          </g>

          <!-- Method 4: In-Store Pay -->
          <g transform="translate(440, 210)">
            <rect width="420" height="190" rx="12" fill="#FFFFFF" stroke="#E5E0D5" stroke-width="1.5"/>
            <rect x="20" y="20" width="100" height="24" rx="12" fill="#FEF3C7" stroke="#FDE68A"/>
            <text x="70" y="36" fill="#92400E" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">OPTION 4</text>
            <text x="20" y="75" fill="#181716" font-family="serif" font-size="20" font-weight="bold">🛍️ In-Store Showroom Pay</text>
            <text x="20" y="102" fill="#5A524A" font-family="sans-serif" font-size="12">Pay in person when picking up your retail articles directly</text>
            <text x="20" y="122" fill="#5A524A" font-family="sans-serif" font-size="12">at the merchant's physical boutique showroom.</text>
            <text x="20" y="152" fill="#D97706" font-family="sans-serif" font-size="11" font-weight="bold">✓ Try before you finalize • Inspect merchandise in person</text>
            <text x="20" y="172" fill="#7A7065" font-family="sans-serif" font-size="10">Complete payment via store terminal upon pickup.</text>
          </g>
        </g>

        <!-- Provider Settlement Bar -->
        <g transform="translate(0, 420)">
          <rect width="860" height="0" rx="0" fill="transparent"/>
        </g>
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <!-- Master Background: Obsidian / Cream -->
  <rect width="1280" height="720" fill="#F7F5F0"/>
  
  <!-- Header Bar -->
  <rect width="1280" height="52" fill="#141312"/>
  <text x="40" y="32" fill="#E8D7C3" font-family="serif" font-size="16" font-weight="bold" letter-spacing="1">OPAL PORTAL • COMPREHENSIVE OVERVIEW GUIDE</text>
  
  <!-- Step Navigation Tabs -->
  ${activeTabs}
  
  <!-- Content Area -->
  ${contentArea}
  
  <!-- Bottom Teleprompter Caption Bar -->
  <g transform="translate(40, 620)">
    <rect width="1200" height="70" rx="10" fill="#141312" stroke="#C5A880" stroke-width="1.5"/>
    <text x="25" y="40" fill="#C5A880" font-family="sans-serif" font-size="13" font-weight="bold">📌 "${escapeXml(step.caption)}"</text>
  </g>
</svg>`;
}

async function main() {
  console.log("=== Generating Opal Portal Complete Walkthrough Video ===");
  const outputDir = path.join(process.cwd(), "public/assets/aistudio");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  });

  const tempDir = path.join("/tmp", "opal_video_render");
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const segmentVideoFiles = [];

  for (const step of STEPS) {
    console.log(`\n--- Step ${step.index + 1}: ${step.title} ---`);
    
    // 1. Generate SVG slide
    const svgPath = path.join(tempDir, `slide_${step.index}.svg`);
    const pngPath = path.join(tempDir, `slide_${step.index}.png`);
    const svgContent = generateSVG(step);
    fs.writeFileSync(svgPath, svgContent);

    // Convert SVG to PNG using ffmpeg
    execSync(`ffmpeg -y -i "${svgPath}" "${pngPath}"`, { stdio: "ignore" });
    console.log(`✓ Slide ${step.index + 1} PNG rendered: ${pngPath}`);

    // 2. Generate Voice Narration via Gemini TTS
    console.log(`Calling Gemini TTS for Step ${step.index + 1}...`);
    const audioPath = path.join(tempDir, `audio_${step.index}.wav`);
    
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [{
          role: "user",
          parts: [{
            text: step.script,
            speechMetadata: { style: "Warm, professional, elegant narrator" }
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
        fs.writeFileSync(audioPath, Buffer.from(audioBase64, "base64"));
        console.log(`✓ TTS audio saved for Step ${step.index + 1}`);
      } else {
        throw new Error("No audio returned from TTS");
      }
    } catch (err) {
      console.warn(`TTS error on Step ${step.index + 1}, using fallback tone:`, err.message);
      // Fallback: generate a silent wav of duration step.time
      execSync(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t ${step.time} "${audioPath}"`, { stdio: "ignore" });
    }

    // 3. Measure duration of the audio clip
    const durationOutput = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 "${audioPath}"`).toString().trim();
    const duration = parseFloat(durationOutput) || step.time;
    console.log(`Clip duration: ${duration.toFixed(2)}s`);

    // 4. Render video segment (image + audio) with 1280x720, h264, aac, 30fps
    const segVideoPath = path.join(tempDir, `segment_${step.index}.mp4`);
    execSync(`ffmpeg -y -loop 1 -framerate 30 -i "${pngPath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -t ${duration} -shortest "${segVideoPath}"`, { stdio: "ignore" });
    console.log(`✓ Video segment ${step.index + 1} encoded: ${segVideoPath}`);

    segmentVideoFiles.push(segVideoPath);
  }

  // 5. Concatenate segments seamlessly into final MP4
  console.log("\n--- Concatenating video segments ---");
  const concatListPath = path.join(tempDir, "concat_list.txt");
  const concatContent = segmentVideoFiles.map(f => `file '${f}'`).join("\n");
  fs.writeFileSync(concatListPath, concatContent);

  const finalVideoPath = path.join(outputDir, "opal-portal-walkthrough-guide.mp4");
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${finalVideoPath}"`, { stdio: "inherit" });
  console.log(`\n🎉 Final Walkthrough Video generated successfully at:\n${finalVideoPath}`);

  // Also write transcript text file for download
  const transcriptPath = path.join(outputDir, "opal-portal-guide-script.txt");
  const transcriptText = `OPAL PORTAL — COMPREHENSIVE WALKTHROUGH GUIDE
=====================================================
Video Duration: ~60 seconds | Resolution: 1280x720 HD

CHAPTER 1: ALL TYPES OF SERVICES
---------------------------------
${STEPS[0].script}

CHAPTER 2: SHOPPING BY DEPARTMENT
---------------------------------
${STEPS[1].script}

CHAPTER 3: SHIPMENT & FULFILLMENT
---------------------------------
${STEPS[2].script}

CHAPTER 4: PAYMENT METHODS
---------------------------------
${STEPS[3].script}

=====================================================
© 2026 Opal Portal Ecosystem. All rights reserved.
`;
  fs.writeFileSync(transcriptPath, transcriptText);
  console.log(`✓ Transcript saved at: ${transcriptPath}`);
}

main().catch(err => {
  console.error("FATAL ERROR generating walkthrough video:", err);
  process.exit(1);
});
