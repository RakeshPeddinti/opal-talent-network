# Opal Portal

> **Luxury On-Demand Services, Artisan Department Storefront, and Multi-Role Merchant & Provider Ecosystem**

Opal Portal is a high-end, multi-service marketplace and retail platform. It seamlessly unifies on-demand local service appointments, a department-based e-commerce boutique, and dedicated management portals for service professionals and retail merchants.

---

## 🌐 Live Environments & Tester Access

| Environment | Live URL | Purpose |
| :--- | :--- | :--- |
| **Active Development** | [https://ais-dev-32xkdd2dv73ju2zkm6slam-138344312531.us-west2.run.app](https://ais-dev-32xkdd2dv73ju2zkm6slam-138344312531.us-west2.run.app) | Live dev instance for continuous iteration & validation |
| **Shared Preview** | [https://ais-pre-32xkdd2dv73ju2zkm6slam-138344312531.us-west2.run.app](https://ais-pre-32xkdd2dv73ju2zkm6slam-138344312531.us-west2.run.app) | Production container build for QA testers and stakeholders |

---

## ⚡ 1-Click Fast-Access for QA Testers

To enable instant, zero-friction testing without signing up for accounts or entering credentials, the portal includes built-in **1-Click QA Fast-Access buttons** inside the Authentication modal.

### How to Access:
1. Open either live URL in any desktop or mobile browser.
2. In the footer, click **"Staff Portal"** (or click any **"Book"** / **"Sign In"** prompt).
3. Under the **"⚡ Fast-Access for Testing (1-Click Login)"** section, click any persona chip:

| QA Persona Chip | Role / Company | Permissions & Test Scope |
| :--- | :--- | :--- |
| **Customer** | Elena Vance (`elena.customer@opalportal.com`) | Public storefront booking, appointment scheduling, Boutique Bag checkout, Carrier delivery (FedEx/USPS/UPS), Showroom Pickup pass, SMS alerts. |
| **Beauty Provider** | Salon Opal Beverly Hills (`salon.opal@opalportal.com`) | Beauty & Wellness services only (Facials, Massages, Manicures). Schedule manager, service CRUD, revenue tracking. Locked to Beauty category. |
| **Handyman** | Apex Craftsmen LLC (`apex.handyman@opalportal.com`) | Home repair & maintenance only (Drywall, TV Mounts, Electrical). Zero cross-pollution with beauty/food. Locked business attribution. |
| **Product Seller** | Milano Sartoriale (`seller@opalportal.com`) | Retail catalog studio. Create clothing/accessories, hex color swatches, department size chips, inventory stock controls, and showroom address for in-store pickup. |
| **Platform Admin** | Super Admin (`rakesh2xplore@gmail.com`) | Full multi-trade oversight. Interactive Category View Switcher (Handyman ↔ Beauty ↔ Cloud Kitchen), platform analytics, and cross-category inspections. |

> 💡 **Tip**: Clicking **Logout** in the top-right corner of the global navbar instantly cleans all session state and returns to the guest storefront.

---

## 🌟 Key Architectural Pillars

```
                     ┌──────────────────────────────────────────────┐
                     │                 Opal Portal                  │
                     └──────────────────────┬───────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         ▼                                  ▼                                  ▼
 ┌───────────────┐                  ┌───────────────┐                  ┌───────────────┐
 │    Client     │                  │    Service    │                  │    Product    │
 │  Storefront   │                  │   Provider    │                  │    Seller     │
 └───────┬───────┘                  └───────┬───────┘                  └───────┬───────┘
         │                                  │                                  │
 ┌───────┴──────────────┐           ┌───────┴──────────────┐           ┌───────┴──────────────┐
 │ • Dual Dropdown Nav  │           │ • Category Isolation │           │ • Catalog Studio     │
 │ • Services Booking   │           │ • Handyman / Beauty  │           │ • Color Swatches     │
 │ • Retail Department  │           │ • Cloud Kitchen      │           │ • Size Presets       │
 │ • Boutique Bag       │           │ • Party Planner      │           │ • Showroom Address   │
 │ • Carrier Shipping   │           │ • Calendar & Rev     │           │ • Stock Control      │
 │ • Boutique Pickup    │           │ • Business Locking   │           │ • Analytics Bar      │
 └──────────────────────┘           └──────────────────────┘           └──────────────────────┘
```

The portal operates across three primary user perspectives and an administrative tier:

1. **Client / Guest Storefront**: Interactive discovery experience with dual-dropdown navigation to book vetted services or purchase luxury retail goods. Includes real-time carrier shipping quotes (FedEx, USPS, UPS), Boutique Showroom pickup with driving directions, and an interactive milestone tracking modal.
2. **Service Provider Dashboard**: Dedicated operational workspace for service professionals (**Handyman**, **Beauty**, **Cloud Kitchen**, **Party Planner**) featuring strict category isolation, schedule management, revenue analytics, and verified business attribution.
3. **Product Seller Portal**: Real-time merchant studio to create, configure, and publish retail articles into **Shop by Department** with visual color swatches, size presets, stock controls, and showroom address settings for in-store pickup.
4. **Platform Administrator**: Multi-trade oversight, sample appointment seeding, and catalog metrics management.

---

## ✨ Features & Functional Workflows

### 1. Header Navigation & Authentication Rules
* **Unauthenticated Guest State**: When a user is not logged in, the **Storefront**, **Seller Portal**, and **Provider View** switcher tabs are strictly hidden from the navigation bar. This delivers an uncluttered, luxury guest experience.
* **Top-Right Role Switcher**: Once authenticated, authorized users can switch seamlessly between their relevant workspaces (**Storefront**, **Seller Portal**, **Provider View**).
* **Top-Right Standardized Logout**: A consistent Logout button in the top-right corner automatically clears all active sessions, purges the Boutique Shopping Bag, resets form fields, and restores the view to the default client storefront.

### 2. Dual Dropdown Navigation (Services vs. Shop by Department)
* **Single-Select Dropdowns**: Features a **Services** dropdown alongside a dedicated **SHOP BY DEPARTMENT** dropdown.
* **Mutual Exclusivity**: Both dropdowns default to `SELECT`. Selecting any retail department immediately displays retail goods and resets the services dropdown to `SELECT`. Conversely, selecting a service category clears retail articles and displays vetted service professionals.
* **Retail Departments**:
  * `Clothing`
  * `Shoes`
  * `Kitchen wear`
  * `Autocare`
  * `Home & Living`
  * `Electronics`
  * `Beauty & Personal Care`
* **Footer Navigation**: Quick links to all active service trades and department shopping.

### 3. Retail Boutique Catalog (Articles with Zero Service Durations)
Unlike service appointments (which require duration in hours/minutes and time slots), product articles are pure retail merchandise:
* **Product Card Specifications**:
  * Retail selling price and strike-through compare price with discount badge.
  * Interactive **Color Swatches** with hex circles, color labels, and visual selection rings.
  * **Size Selection Chips** tailored to department taxonomy (e.g., `S`–`XL` for Clothing; `US 8`–`US 11` for Shoes; `Chef Set (7-Piece)` for Kitchen wear; `Complete Kit` / `32 oz` for Autocare).
  * Real-time stock status indicator (`In Stock` / `Sold Out`) and SKU tracking.
  * Instant **Boutique Bag** drawer with quantity controls, subtotal calculation, and dual fulfillment methods.

### 4. 'Track My Order & Booking' Feature (Services & Product Deliveries)
Logged-in users can track the live progress of their service appointments or retail orders at any time:
* **Authenticated Access Points (Visible Only When Logged In)**:
  * **Top Navbar**: Dedicated **"Track Order"** button (desktop) and **"📦 Track My Order / Booking"** action (mobile menu).
  * **Hero Header**: Prominent **"Track My Order"** button alongside "Explore Services & Retail" and "Watch Video Guide".
  * **Catalog Header**: Direct **"Track Order"** button right next to GPS location switching.
  * **Footer**: Quick navigation link under **"Services & Tour"**.
  * **Post-Checkout / Post-Booking Confirmation Screens**: One-click **"Track My Booking"** and **"Track My Order"** action cards prefilled with the customer's unique reference code.
  * *Note: When unauthenticated/logged out, these Track Order buttons are automatically hidden to protect customer activity; any direct attempt prompts the user to log in first.*
* **Unified Lookup Engine (`/api/tracking/lookup/:id` & Firestore)**:
  * Accepts any **Service Booking ID** (`OPAL-BK-...` or Firestore document ID).
  * Accepts any **Product Order ID** (`OPAL-ORD-...`).
  * Accepts any **Carrier Barcode Tracking Number** (FedEx `7946...`, USPS `9400...`, UPS `1Z...`, or Standard Ground).
* **Comprehensive Multi-Modal Displays**:
  * **For Service Bookings (Beauty, Handyman, Party Planner, Cloud Kitchen)**:
    * Displays Service Name, Category Badge, Provider / Salon Company Name, Scheduled Date & Time Slot, Duration, Client Name, and Service Address.
    * 4-Stage visual milestone progress bar: **Booking Received** → **Confirmed by Provider** → **Specialist En Route** → **Service Completed**.
    * Direct 1-click **"Call Provider"** phone link.
  * **For Carrier Retail Deliveries (FedEx, USPS, UPS, Standard)**:
    * Carrier Badge, live Courier Tracking Number with 1-click copy, and external link to official carrier portal.
    * Guaranteed Arrival Date and destination address.
    * 4-Stage visual progress bar: **Order Placed** → **Manifest & Packed** → **In Transit with Carrier** → **Delivered**.
    * Real-time carrier checkpoint scan history with timestamps and sorting facility locations.
    * Articles breakdown with sizes, colors, and pricing.
  * **For Boutique Showroom Pickups**:
    * Digital **Showroom Pickup Pass** with authorization passcode and scannable barcode illustration.
    * Physical Showroom Flagship address (e.g., `450 N Rodeo Dr, Beverly Hills, CA 90210`) and operating hours.
    * Instant **"Get Directions (Google Maps)"** GPS navigation link.
* **Instant Demo Testing Chips**:
  * The modal provides 3 clickable demo test chips for zero-effort evaluation:
    * `💆 Service Booking (OPAL-BK-BEAUTY)`
    * `🚚 FedEx Express (OPAL-ORD-FEDEX)`
    * `🛍️ Showroom Pickup (OPAL-ORD-PICKUP)`
  * Includes device-level recent lookups history saved in `localStorage`.

### 5. Order History Tab (Seeker Dashboard / AdminDashboard)
* **Unified Chronological Timeline**:
  * Logged-in service seekers and customers can view their complete past and active activity in one dedicated **"Order History"** tab inside the dashboard.
  * **Zero ID Requirement**: Customers never need to remember or re-type booking IDs, order numbers, or tracking codes.
  * Combines both **Retail Boutique Orders** (Carrier Deliveries & Boutique Showroom Pickups) and **Service Appointments** (Beauty, Handyman, Cloud Kitchen, Party Planner) sorted chronologically.
* **Top Metric Overview**:
  * Displays real-time summary statistics: **Total History Items**, **Retail Purchases**, **Service Appointments**, and **Total Cumulative Spend**.
* **Smart Filter & Search Controls**:
  * **Type Tabs**: View `All (N)`, `Retail Orders (N)`, or `Service Bookings (N)`.
  * **Status Filter**: Filter by `All Statuses`, `Active / In Transit`, `Completed / Delivered`, or `Cancelled`.
  * **Real-Time Keyword Search**: Instantly searches by product name, item brand, service category, provider name, shipping carrier, or showroom location street.
* **Service Booking Cancellation Workflow (`CancelBookingModal.tsx`)**:
  * For any upcoming service appointment (`status !== 'completed'` and `status !== 'cancelled'`), customers can click **`Cancel Booking`**.
  * Opens a confirmation modal displaying the service title, provider name, scheduled date/time slot, and booking reference ID.
  * Allows selecting a reason for cancellation (e.g., schedule conflict, personal emergency, booked by mistake) and optional specialist notes.
  * Upon confirmation, atomically updates the Firestore document with `status: 'cancelled'`, `cancelledAt`, `cancelledBy: 'seeker'`, and `cancellationReason`.
  * Real-time listener immediately reflects the updated state: displays a red `Cancelled` badge and releases the appointment slot.
* **1-Click Interactive Live Tracking Action**:
  * Every card provides a direct **"Track Milestones"** action button that opens the interactive milestone modal (`onOpenTracking(id)`) pre-loaded with the exact transaction reference code.
  * Boutique Showroom Pickup cards provide instant **"View Showroom Pass"** opening store address, hours, and GPS navigation.
* **QA Seeding Support**:
  * Includes a **"+ Sample Orders"** button in both the header and the empty state that immediately writes 2 realistic luxury retail transactions (one FedEx Priority delivery, one Rodeo Dr Boutique pickup) to Firestore for the user's account for rapid testing.

### 6. Boutique Showroom Pickup & Seller Address Attribution
* **Seller Physical Showroom Configuration**:
  * In the **Seller Dashboard**, merchants configure their official physical showroom address (`showroomAddress`), operating hours (`storeHours`), curbside pickup guidelines (`pickupInstructions`), and customer support phone (`phone`).
  * Stored in the merchant profile and attached to published product articles.
* **Customer Pickup Experience**:
  * When a customer selects **Boutique Pickup** in the Boutique Bag:
    * The cart dynamically displays the seller's verified showroom location, business hours, and instructions.
    * Generates a **"Get Driving Directions"** button linking directly to Google Maps navigation.
    * Eliminates shipping fees and estimated transit wait times.
    * Generates an in-store **Digital Pickup Pass** with reference barcode.
    * Dispatches an SMS pickup alert with address and pickup window to the customer's phone.

### 6. Service Provider Category Isolation & Security
* **Category View Isolation**:
  * Handyman providers exclusively view, edit, and create Handyman services.
  * Beauty specialists exclusively manage salon and aesthetic treatments.
  * Cloud Kitchen chefs manage meal packages (without requiring arbitrary time-slot constraints).
  * Party Planners manage event packages and luxury styling.
* **Provider Identity & Permanent Locking**: Service Provider Name is permanently locked to the provider's verified company name, preventing cross-tenant impersonation.
* **"By Provider" Directory**: Grouped provider directory enabling customers to view verified provider profile cards (company name, star rating, service count, distance calculation) and filter services by provider.

### 7. Product Seller Studio (`SellerDashboard`)
* **3-Role Authentication**: Dedicated **Product Seller** tab in the login/registration modal.
* **Seller Registration**: Captures official **Seller Company Name**, **Primary Department**, and **Physical Showroom Address**.
* **Product Catalog Studio**:
  * **Image Management**: Upload local product images or input high-resolution image URLs with live card preview.
  * **Color Swatches Builder**: Luxury preset swatches (Onyx Black, Camel Tan, Burgundy Wine, Champagne Gold, etc.) or custom hex color picker with custom color naming.
  * **Department-Specific Size Presets**: 1-click standard sizes plus custom size tag input.
  * **Showroom Address Setup**: Configures physical store location for in-store boutique pickups.
  * **Inventory Analytics**: Real-time metrics for Total Products, Stock Units, Active Departments, and Catalog Average Price.

### 8. SMS Dispatch Gateway
* `/api/send-sms` formats phone numbers into international E.164 standard.
* Real carrier delivery via Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) when configured.
* Graceful fallback with formatted simulated carrier delivery and unique booking/pickup reference IDs (`OPAL-XXXXX`).

### 9. Interactive Walkthrough Video Guide (Downloadable HD Video & Script)
* **High-Definition 1280x720 Walkthrough Video**:
  * Pristine MP4 video asset with continuous voice narration and synchronized presentation slides:
    * **Step 1: All Services (4 Core Trades)**: Beauty & Wellness, certified Handyman repairs, gourmet Cloud Kitchen dining, and bespoke Party Planning with verified locked business attribution.
    * **Step 2: Shopping by Department**: Pure retail articles (Clothing, Shoes, Kitchen wear, Autocare, Home & Living) with interactive color swatches, department sizing chips, and instant Boutique Bag checkout.
    * **Step 3: Carrier Shipment & Showroom Pickup**: Real commercial carrier shipping (FedEx 2Day Express $19.95, USPS Priority Express $21.50, UPS Air $20.75, Ground Free) with milestone tracking, alongside Boutique Showroom Pickup with physical storefront address (450 N Rodeo Dr, Beverly Hills) and Google Maps GPS navigation.
    * **Step 4: Payment Methods (4 Options)**: Transparent zero-risk settlements including Cash on completion, instant direct Zelle, encrypted cards, and in-store boutique showroom pay upon pickup.
* **Interactive Player Modal (`PortalVideoModal`)**:
  * Direct access via the **Footer** under **"Services & Tour"** (`🎥 Video Guide (Services, Retail, Shipping & Payments)`).
  * Synchronized numbered step tabs to jump directly to any topic with instant timestamp seeking.
  * Active teleprompter subtitle display tracking live spoken narration.
  * Replay, playback speed selector (`0.85x`, `1.0x`, `1.25x`, `1.5x`), mute toggle, and fullscreen support.
  * 1-Click **"Download Video (.mp4)"** button (`opal-portal-walkthrough-guide.mp4`, ~1.2 MB).
  * 1-Click **"Download Script (.txt)"** button (`opal-portal-guide-script.txt`).

### 10. Star-Rating & Verified Review System (Customer Order History, Provider & Seller Dashboards)
* **Customer Feedback Workflow in Order History**:
  * Customers navigate to **Order History** in their Seeker / Admin Dashboard without entering reference IDs.
  * For any completed service appointment (`status === 'completed'`) or delivered/picked-up retail order (`status === 'delivered'` or `'picked_up'`), an action button is displayed:
    * Unreviewed: **`★ Rate & Review`** button in warm gold.
    * Reviewed: **`Rated X.0★ (Edit)`** chip with gold stars and compliment tags preview.
* **Interactive Luxury Review Modal (`ReviewModal.tsx`)**:
  * **Interactive Star Rating**: 1 to 5 stars with hover states and sentiment descriptors (*1★ Needs Improvement*, *2★ Fair*, *3★ Good*, *4★ Great Experience*, *5★ Exceptional Luxury*).
  * **Role-Tailored Compliment Badges**:
    * *Service Providers*: On Time & Punctual, Master Craftsmanship, Clean & Courteous, Transparent Pricing, Exceeded Expectations, Will Rebook.
    * *Product Sellers*: Exquisite Packaging, Premium Fabric & Finish, True to Size & Color, Lightning Delivery, Authentic Luxury, Highly Recommended.
  * **Detailed Feedback & Title**: Headline summary and feedback textarea with a 600-character counter.
  * **Recommendation Toggle**: "I would recommend this provider/seller to others" checkbox.
  * **Public Signature & Verified Buyer Attribution**: Configurable customer signature with an automatic **Verified Buyer / Client** badge.
  * **Direct Firestore Storage**: Persists to the secured `/reviews` collection with target attribution (`targetType: 'provider' | 'seller'`, `providerId`, `sellerId`, `referenceId`, `rating`, `tags`).
* **Provider & Seller Rating Transparency**:
  * **Service Provider Dashboard (`AdminDashboard.tsx`)**:
    * Header shows live aggregate rating badge: `★ 4.9 (14 Reviews)`.
    * Dedicated **Reviews** view mode with rating score card, star breakdown distribution (5★ to 1★ percentages), recommendation rate, and filterable client testimonial cards with compliment badges.
  * **Seller Dashboard (`SellerDashboard.tsx`)**:
    * Header shows live store rating chip: `★ 5.0 Rating (8 Reviews)`.
    * 5th Metric Card: **Store Rating** showing overall score and verified review count.
    * Expandable **Verified Customer Testimonials** showcase displaying recent product buyer feedback with article references and compliments.

### 11. Home-Based Business Article Availability & In-Person Visit Scheduling (`ArticleAvailabilityModal.tsx`)
Designed specifically for independent entrepreneurs running businesses from home (artisans, bespoke tailors, boutiques):
* **Real-Time Stock & Availability Verification**:
  * Every article in **Shop by Department** features a **"📍 Check Availability / Book Visit"** action button.
  * Checks live stock counts, SKUs, and size/color availability before booking an in-person meeting.
* **Dual In-Person Visit Modalities**:
  * **🏬 Home Studio / Store Showroom Visit**: The client books a reserved time window to visit the merchant's home studio or private showroom. Displays full studio address, operating hours, and parking/entrance guidance.
  * **🏡 Home Visit by Specialist**: The artisan or specialist travels directly to the client's residence with the selected merchandise for a private fitting, inspection, or consultation.
* **Zero-Risk Complimentary Trial ($0.00 Non-Taxable)**:
  * Inspection visits carry zero booking fees ($0.00) and zero tax liability.
  * No commercial sales tax or formal invoices are issued for consultations unless the client decides to purchase the goods.
* **Database & SMS Automation**:
  * Saves appointments atomically to Firestore `visits` and `bookings` collections with tracking reference code (`OPAL-VST-XXXXX`).
  * Instant SMS appointment confirmation sent via the notification gateway.
  * Trackable in real-time via the unified tracking lookup modal.

### 12. Tax & Commercial Invoicing (Exclusively for Portal Buyers)
Compliant sales tax and formal commercial invoicing implemented strictly for clients purchasing goods through the portal:
* **Selective Commercial Tax Calculation**:
  * **Buyers Only**: Sales tax applies exclusively to finalized merchandise checkouts through the Boutique Bag.
  * **Standard Commercial Rate**: Automatically applies state/local commercial retail tax (default **8.25%** for California home-business hubs, with multi-state jurisdiction table support).
  * **Transparent Checkout Breakdown**: Displays itemized *Subtotal*, *Shipping & Handling*, and *Sales Tax (8.25%)* with a **"Commercial Tax Invoice Included"** badge before payment.
* **Official Commercial Tax Invoice Modal (`TaxInvoiceModal.tsx`)**:
  * **Seller Legal Details**: Atelier business name, Proprietor name, Federal Tax ID / EIN (`US-EIN-95-4819201`), studio showroom address, phone, and email.
  * **Buyer Coordinates**: Customer name, phone, email, and verified delivery destination or showroom pickup pass.
  * **Itemized Merchandise Table**: SKU codes, article names, sizes, color swatches, quantities, unit prices, and line totals.
  * **Financial Reconciliation**: Subtotal, percentage sales tax rate, tax amount, shipping tariff, and grand total paid with `PAID` status.
  * **Commercial Tax Notice**: Clarifies that tax applies strictly to purchased merchandise and not to complimentary home/store visits.
* **1-Click Export & Archiving (`pdfInvoiceGenerator.ts`)**:
  * **📄 Downloadable PDF Invoice (`downloadPdfInvoice`)**: Standalone vector PDF invoice generator built on `jsPDF` that renders brand monogram, official tax invoice headers, seller/buyer credentials, itemized SKU line items table, subtotal, sales tax calculation, shipping tariff, grand total, and system authentication seal.
  * **🖨️ Print / Browser PDF**: Formatted for standard paper printing (`window.print()`).
  * **📥 Download (.txt)**: Generates a structured ASCII commercial tax invoice document download.
* **Permanent Customer Access Points**:
  * Immediate **"📥 Download PDF"** and **"📄 View Invoice"** buttons on the post-checkout confirmation screen.
  * Dedicated **"📄 Tax Invoice"** and **"📥 PDF"** action buttons on every retail transaction card in the **Order History** tab.

### 13. Service Provider View: Conditional Dropdowns & Tab Cleanup
Tailored to eliminate interface clutter and simplify business operations for single-trade versus multi-service specialists:
* **Removal of Storefront, Seller Portal & Provider View Tabs**:
  * In the **Service Provider View** (`view === 'admin'`), the quick switcher pill tabs (`STOREFRONT`, `SELLER PORTAL`, `PROVIDER VIEW`) have been **completely removed** from the top navigation bar. Providers maintain an uncluttered workspace focused exclusively on their business appointments, catalog, reviews, and revenue.
* **Multi-Service Providers (> 1 Service)**:
  * In the **Provider Dashboard Booked Services View** (`AdminDashboard.tsx`), a specialized **Service Filter dropdown** is visible, allowing the provider to filter incoming appointments by individual service name (`Drywall Repair`, `Furniture Assembly`, etc.) or view `All Services`.
  * In the **Header Category Switcher**, providers with multiple services retain the switcher dropdown to manage cross-category offerings.
  * In the **Client Reservation Screen Preview** (`BookingSection.tsx`), providers with more than 1 service retain the category/service dropdown to navigate their full offerings.
* **Single-Service Providers (<= 1 Service)**:
  * When a provider only offers or has booked a single service (or 0 services), the service dropdown is **completely removed** from the appointments view.
  * The redundant category dropdown in the header is also removed, replaced with a clean, static `{Category} View` badge.
  * In the reservation screen (`BookingSection.tsx`), the dropdown element `<select>` is removed and replaced with an elegant single-service overview badge indicating their exact service name, duration, and price without unnecessary select controls.
### 14. Talent Network: Executive Professional Workspace for Talents & Talent Seekers
* **Module Identity & Branding**:
  * **Module Name**: `Talent Network`
  * **Designated Tagline**: `Create Your Profile. Get Discovered. Connect with Opportunities.`
  * **Executive Sober Design Language**: Unlike consumer shopping sites (which feature warm cream and gold), Talent Network uses a crisp, sober professional palette: calm light-slate canvas (`bg-slate-50`), structured white cards (`bg-white`), refined slate borders (`border-slate-200`), dark charcoal typography (`text-slate-900`), and corporate indigo/navy accents (`#4f46e5`). It adheres to strict zero-pill discipline for metadata, professional monospace wage benchmarks, and LinkedIn-style career timelines.
* **When Logged In as "Talent"**:
  * **LinkedIn-Style Profile**: Displays professional headline, summary bio, verified skills tags, employment history timeline (role title, company name, tenure, current status, key achievements), formal education, certifications (e.g. C-10 Electrician, OSHA 30), and attached resume documents.
  * **Single-Liner Open Vendor Requirements**: Displays all vendor job postings as concise, high-density **single-liners** detailing Vendor Name, Role Title, Required Skills, Experience Level, Wage Benchmark, and City.
  * **Application Workflow**: Quick Apply captures the candidate's verified resume and registered contact phone number.
  * **Vendor SMS Notification**: Upon successful application submission, an automated carrier-grade SMS notification (`/api/send-sms`) is immediately dispatched to the talent's registered mobile number from the posting vendor.
* **When Logged In as "Talent Seeker"**:
  * **Publish Requirement**: Dedicated publisher interface to post requisitions with required skills, experience level (e.g., `5+ years`), wage levels (hourly or annual salary), city, employment type, and project scope.
  * **City-Filtered Candidate Search**: Search and filter candidate directory strictly limited to talents **registered with the Talent Network** in that specific city. Non-network users and candidates from other cities are strictly excluded.
  * **Direct SMS Candidate Outreach**: Select any qualified candidate and dispatch an instant SMS notification directly to their phone with tailored compensation and contact details.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Payload / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check | — |
| `GET` | `/api/detect-location` | Client IP geolocation detection | Headers: `x-forwarded-for` |
| `POST` | `/api/send-sms` | Dispatches SMS confirmation or pickup alert | `{ to, message, customerName, ... }` |
| `POST` | `/api/shipping/rates` | Calculates live commercial carrier rates | `{ destinationZip, destinationCity, destinationState, itemsCount, packageWeightLbs }` |
| `POST` | `/api/shipping/create-shipment` | Creates carrier shipment & manifest | `{ orderId, carrierId, customerName, customerPhone, shippingAddress, items, totalPrice }` |
| `GET` | `/api/shipping/track/:trackingNumber` | Retrieves live milestone checkpoint history | Param: `trackingNumber` |
| `GET` | `/api/tracking/lookup/:id` | Universal tracking engine for Service Bookings (`OPAL-BK-...`), Orders (`OPAL-ORD-...`), Visits (`OPAL-VST-...`), and Carrier tracking numbers | Param: `id` |
| `POST` | `/api/tax/calculate` | Calculates commercial sales tax exclusively for retail buyers | `{ subtotal, state, itemsCount }` |
| `GET` | `/api/invoices/:invoiceNumber` | Retrieves official commercial tax invoice details | Param: `invoiceNumber` |

---

## 🐳 Container & Cloud Run Deployment Architecture

The application is engineered for production deployment on Google Cloud Run and containerized environments:

### 1. Dynamic Port Binding
Cloud Run dynamically injects the target port via the `PORT` environment variable:
```typescript
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```
The server binds to `0.0.0.0`, ensuring traffic routed by Cloud Run proxies is accepted.

### 2. Production Start Command (`package.json`)
The container runs the full-stack server using:
```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build",
    "start": "tsx server.ts"
  }
}
```
`tsx` is listed under `dependencies` (production runtime), allowing instant execution of the TypeScript server in Node without extra transpilation steps.

### 3. Hybrid Development & Production Serving
* **Development (`NODE_ENV !== "production"`)**: Mounts Vite middleware (`vite.middlewares`) for instant hot reload.
* **Production (`NODE_ENV === "production"`)**: Serves pre-compiled production assets directly from `/dist`:
  ```typescript
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  ```

---

## 🧪 Comprehensive Automated Testing

The repository contains an automated test suite with **148 passing Vitest tests** across **13 test suites** covering positive, negative, and edge-case functional scenarios:

```bash
npm test
```

### Test Suite Breakdown:

```
✓ src/__tests__/all-flows-e2e.test.ts                 (16 tests)
  - Flow 1: Dual Dropdown Navigation & Discovery Flow (single-select, mutual exclusion)
  - Flow 2: Service Booking & Time Slot Selection Flow
  - Flow 3: Retail Boutique Article Selection Flow (color swatches, size chips, stock)
  - Flow 4: Boutique Bag Checkout & Carrier Shipping vs Showroom Pickup
  - Flow 5: Commercial Tax Calculation & Downloadable PDF Invoice Flow
  - Flow 6: Home & Store Visit Scheduling Flow ($0.00 Trial Consultation, non-taxable)
  - Flow 7: Universal Tracking Engine Flow (OPAL-BK, OPAL-ORD, OPAL-VST, carrier)
  - Flow 8: Order History & Appointment Cancellation Flow
  - Flow 9: Customer Star Rating & Testimonial Reviews Flow
  - Flow 10: Provider View & Trade Category Isolation Flow
  - Flow 11: Provider View Dropdown & Tab Removal Flow (STOREFRONT/SELLER/PROVIDER tabs hidden)
  - Flow 12: Seller Dashboard & Catalog Governance Flow

✓ src/__tests__/talent-network.test.ts                (9 tests)
  - Module Name & Tagline ("Create Your Profile. Get Discovered. Connect with Opportunities.")
  - Talent LinkedIn-style profile: skills, experience timeline, certifications, and resume
  - Single-liner open vendor requirements: vendor, role, skills, experience, and wage level
  - Talent application flow with verified resume and registered contact phone
  - Automated vendor SMS notification dispatched to talent's registered mobile number
  - Talent Seeker requirement publisher with required skills, experience level, and wage
  - City-filtered candidate search strictly displaying registered Talent Network members
  - Candidate selection and outbound SMS notification dispatch
  - Executive dark slate styling discipline distinct from consumer shopping storefront

✓ src/__tests__/products-and-bag.test.ts              (21 tests)
  - Color swatches & hex codes
  - Department size configurations
  - Stock validation & sold-out behavior
  - Boutique bag add, update quantity, remove, and subtotal
  - Carrier shipping calculation
  - Showroom physical address attribution (Positive & Negative)
  - Bag session teardown on logout

✓ src/__tests__/order-history.test.ts                 (17 tests)
  - Unified chronological timeline for retail and service appointments
  - Zero-ID requirement for past orders
  - Service booking cancellation workflow (reason, atomic status update)
  - 1-click tracking action and digital showroom pass retrieval
  - Sample orders QA seeding

✓ src/__tests__/reviews-and-ratings.test.ts           (12 tests)
  - Customer review modal with 1-5 star ratings and sentiment labels
  - Role-tailored compliment badges (specialists vs merchants)
  - Verified buyer badge and recommendation toggle
  - Provider & seller dashboard rating metrics and testimonials

✓ src/__tests__/order-tracking.test.ts                (12 tests)
  - Universal tracking engine (/api/tracking/lookup/:id)
  - Carrier deliveries (FedEx, USPS, UPS, Ground) with checkpoint scans
  - Showroom pickup pass with GPS directions
  - Service appointments (Beauty, Handyman) 4-stage milestones
  - Home and store visits (OPAL-VST-...) complimentary inspection status

✓ src/__tests__/seller-and-provider-isolation.test.ts (11 tests)
  - Strict category isolation (Handyman, Beauty, Cloud Kitchen, Party Planner)
  - Provider service CRUD operations
  - Multi-trade admin switching
  - Verified provider business name locking

✓ src/__tests__/auth-and-business-attribution.test.ts  (11 tests)
  - 3-Role authentication (Customer, Provider, Seller)
  - Company name capture during registration
  - In-dashboard business rebranding
  - Unauthenticated header hiding rules
  - 1-Click QA Fast-Access persona profiles

✓ src/__tests__/tax-and-visits.test.ts                (8 tests)
  - Article availability check and real-time stock inspection
  - Home visit specialist fitting vs Store/Studio showroom booking
  - Zero-risk $0.00 trial policy (non-taxable consultation)
  - Commercial sales tax calculation (8.25% standard, multi-state table)
  - Official TaxInvoiceData generation with seller EIN and itemized SKUs
  - Strict tax isolation (applies exclusively to buyers, not visit bookings)

✓ src/__tests__/pdf-invoice.test.ts                   (5 tests)
  - Normalization of TaxInvoiceData and raw RetailOrderRecord structures
  - High-resolution A4 vector PDF document generation (jsPDF)
  - Data integrity for line items, sizes, colors, SKUs, and unit prices
  - Sales tax calculation, shipping rate, and grand total reconciliation
  - Download trigger verification with custom and automated filenames

✓ src/__tests__/dropdown-navigation.test.ts           (9 tests)
  - Single-select behavior for Services & Departments
  - Mutual exclusivity (Services resets Department, and vice versa)
  - Initial SELECT default state
  - Department catalog filtering

✓ src/__tests__/walkthrough-video-guide.test.ts       (7 tests)
  - MP4 video asset verification (> 500 KB, valid H.264/AAC)
  - Transcript script verification and offline access
  - Step 1: 4 service trades definition (Beauty, Handyman, Cloud Kitchen, Party)
  - Step 2: Shop by Department retail rules (Color swatches, size chips, stock)
  - Step 3: Carrier delivery (FedEx, USPS, UPS) & Showroom Pickup address
  - Step 4: 4 payment methods (Cash, Zelle, Card, In-Store)
  - Sequential, contiguous 57-second timeline integrity

✓ src/__tests__/provider-service-dropdown.test.ts     (10 tests)
  - Complete removal of STOREFRONT, SELLER PORTAL, and PROVIDER VIEW tabs in service provider view
  - Conditional visibility: service filter dropdown renders ONLY when provider has > 1 service
  - Single-service providers (<= 1 service): dropdown is completely removed
  - Service filtering across booked appointments (individual service vs All Services)
  - Redundant header category switch dropdown removed for single-service providers
  - Reservation screen single-service badge rendering vs multi-service select dropdown
  - Standard customer marketplace browsing preserves full category discovery
```

### 🎭 Playwright End-to-End Automation Testing

Playwright is configured via `playwright.config.ts` to run browser-level end-to-end automation across critical user journeys:

```bash
# Run all end-to-end scenarios
npm run test:e2e

# Run with interactive UI mode
npx playwright test --ui

# Target specific user journey specs
npx playwright test tests/new-user-registration.spec.ts
npx playwright test tests/service-booking-flow.spec.ts
npx playwright test tests/product-purchase-flow.spec.ts
```

#### Critical User Journeys Scaffolded:
1. **New User Registration (`tests/new-user-registration.spec.ts`)**:
   - Modal toggle between Login & Register modes
   - Seeker (Client) registration with name, email, and phone
   - Service Provider registration with locked business name & category assignment
   - Product Seller registration with merchant company name, product department, and showroom pickup address
2. **Service Booking Flow (`tests/service-booking-flow.spec.ts`)**:
   - Trade category discovery & mutual exclusivity with retail departments
   - Service card selection with dynamic price calculation
   - Real-time date & time slot selection with collision detection
   - Booking confirmation, `OPAL-BK-...` Reference ID generation, and simulated SMS dispatch
3. **Product Purchase Flow (`tests/product-purchase-flow.spec.ts`)**:
   - Shop by Department selection (`#shop-department-dropdown`)
   - Article customization (size chips and color swatches) & adding to boutique bag
   - Carrier delivery (FedEx, USPS, UPS) vs. Boutique Showroom Pickup
   - Commercial sales tax calculation (8.25%) and grand total reconciliation
   - Checkout placement (`OPAL-ORD-...`) and downloadable PDF tax invoice generation

> 📋 **Functional QA Guide**: For manual testing steps, verification checklists, and end-to-end acceptance scenarios, refer to [`FUNCTIONAL_TEST_USECASES.md`](./FUNCTIONAL_TEST_USECASES.md).

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS v4, Motion (Framer Motion)
* **Icons**: Lucide React
* **Charts & Analytics**: Recharts
* **Backend**: Node.js & Express (`server.ts`)
* **Database & Auth**: Firebase Firestore (NoSQL) & Firebase Authentication
* **Testing**: Vitest, Playwright, Supertest
* **Date Utilities**: `date-fns`

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18 or higher)
* npm (v9 or higher)

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```env
# Server & Port (Cloud Run binds dynamically via PORT)
PORT=3000
APP_URL="http://localhost:3000"

# AI Capabilities (Optional - Assistant Consultant)
GEMINI_API_KEY="your_gemini_api_key_here"

# SMS Dispatch (Optional - Twilio Gateway)
TWILIO_ACCOUNT_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1xxxxxxxxxx"

# Live Carrier API (Optional - Shippo Gateway)
SHIPPO_API_KEY="your_shippo_token"
```

### 4. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 5. Run Test Suite
```bash
npm test
```

### 6. Build and Run Production Container
```bash
npm run build
npm start
```

---

## 📄 License
Private & Proprietary — Opal Portal Ecosystem.
