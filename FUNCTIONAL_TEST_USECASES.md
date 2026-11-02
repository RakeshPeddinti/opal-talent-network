# Opal Portal — Functional QA Test Guide & Use Cases

This document serves as the comprehensive manual and functional testing manual for the **Opal Portal** platform. It provides QA engineers and testers with complete end-to-end use case specifications, step-by-step test execution flows, pre-conditions, and expected verification criteria across all user personas.

---

## 👥 Platform Personas

| Persona | Primary Goal | Dashboard / Workspace |
| :--- | :--- | :--- |
| **Service Seeker (Customer)** | Discovers verified local services, books appointments, browses retail articles, and completes checkout. | Client Storefront (`view === 'client'`) |
| **Handyman Provider** | Manages home repair, electrical, plumbing, mounting, and structural services. | Provider Dashboard (`category === 'Handyman'`) |
| **Beauty Specialist** | Manages salon, hair styling, facials, wellness, and aesthetic treatments. | Provider Dashboard (`category === 'Beauty'`) |
| **Cloud Kitchen Chef** | Manages meal prep packages, gourmet tasting boxes, and culinary deliveries. | Provider Dashboard (`category === 'Cloud Kitchen'`) |
| **Party Planner** | Manages event styling, luxury birthdays, weddings, and celebration packages. | Provider Dashboard (`category === 'Party Planner'`) |
| **Product Seller** | Publishes and maintains brand new retail goods across departments in **Shop by Department**. | Seller Portal (`SellerDashboard`) |
| **Platform Administrator** | Oversees multi-category providers, sample data seeding, and platform metrics. | Admin Dashboard (`rakesh2xplore@gmail.com`) |

---

## 📑 Use Case Index

### Section 1: Customer Storefront & Navigation
* **UC-CUST-001**: Storefront Initialization & Default `SELECT` State
* **UC-CUST-002**: Mutual Exclusivity between Services & Shop by Department
* **UC-CUST-003**: Customer Service Booking (Date, Time, & Distance Calculation)
* **UC-CUST-004**: Customer Retail Shopping (Size, Color Selection, & Boutique Bag)
* **UC-CUST-005**: Customer Checkout & Simulated SMS Dispatch
* **UC-CUST-006**: Session Teardown & Boutique Bag Clearing on Logout
* **UC-CUST-007**: 'Track My Order' Lookup for Service Appointments & Product Deliveries
* **UC-CUST-008**: Seeker Dashboard 'Order History' Tab (Bookings & Retail Orders Without ID Entry)
* **UC-CUST-009**: Star-Rating & Review Submission in Order History for Providers and Sellers
* **UC-CUST-010**: Cancel Upcoming Service Appointment in Order History with Confirmation Dialog

### Section 2: Service Provider Use Cases (By Trade)
* **UC-PROV-001**: Provider Registration & Business Name Capture (Email/Password)
* **UC-PROV-002**: Provider Registration via Google OAuth (Direct vs. Pre-Filled Form)
* **UC-PROV-003**: In-Dashboard Business Name Editing & Rebranding
* **UC-PROV-004**: Handyman Service Isolation (Zero Cross-Pollution)
* **UC-PROV-005**: Beauty Specialist Service Isolation
* **UC-PROV-006**: Cloud Kitchen Provider (No Time Slot Required for Delivery)
* **UC-PROV-007**: Multi-Trade Administrator Category Switcher
* **UC-PROV-008**: Permanent Provider Attribution & Business Name Locking
* **UC-PROV-009**: Provider Service CRUD & Industry Template Import
* **UC-PROV-010**: Appointment Schedule & Payment Status Tracking (Cash / Zelle)
* **UC-PROV-011**: Sample Appointments Seeding for Demo & Verification

### Section 3: Product Seller Use Cases
* **UC-SELL-001**: Product Seller Registration & Landing Page Routing
* **UC-SELL-002**: Creating a Brand New Product Article (No Duration Rule)
* **UC-SELL-003**: Color Palette & Swatches Configuration (Hex Picker & Presets)
* **UC-SELL-004**: Department-Specific Size Presets & Custom Size Tags
* **UC-SELL-005**: Product Image Upload & High-Resolution URL Preview
* **UC-SELL-006**: Real-Time Inventory & Stock Status Toggle (In Stock / Sold Out)
* **UC-SELL-007**: Real-Time Catalog Analytics Bar Verification
* **UC-SELL-008**: Storefront Preview & Client Visibility Verification

### Section 4: Global & Cross-Cutting Workflows
* **UC-GLOB-001**: Consistent Top-Right Corner Logout Verification
* **UC-GLOB-002**: Mobile Header & Slide-Out Drawer Navigation

---

## 🛠️ Detailed Use Cases

---

### Section 1: Customer Storefront & Navigation

#### UC-CUST-001: Storefront Initialization & Default `SELECT` State
* **Persona**: Service Seeker / Visitor
* **Pre-conditions**: App loaded in browser (`http://localhost:3000`).
* **Test Steps**:
  1. Navigate to the homepage.
  2. Scroll down to the booking and shopping selection section.
  3. Inspect the two main dropdown controls.
* **Expected Result**:
  * Both dropdowns have the default placeholder value **`SELECT`**.
  * No service cards or product articles are rendered initially.
  * A prompt message is displayed: *"Please select a Service Category or Shop Department above to browse offerings."*

#### UC-CUST-002: Mutual Exclusivity between Services & Shop by Department
* **Persona**: Service Seeker
* **Test Steps**:
  1. Click the **Services** dropdown and choose **"Handyman"**.
  2. Verify Handyman service cards appear.
  3. Now click the **"SHOP BY DEPARTMENT"** dropdown and select **"Clothing"**.
* **Expected Result**:
  * The **Services** dropdown automatically resets back to **`SELECT`**.
  * Handyman service cards disappear immediately.
  * Brand new clothing articles are displayed.
  * Repeat vice-versa: Selecting a service category resets **SHOP BY DEPARTMENT** back to `SELECT`.
  * Services and retail products are **never** shown at the same time.

#### UC-CUST-003: Customer Service Booking
* **Persona**: Service Seeker
* **Test Steps**:
  1. Select **Beauty** in the service dropdown.
  2. Click on a service card *(e.g. "24K Gold Luxury Facial")*.
  3. Choose an available calendar date and preferred time slot.
  4. Fill in customer details: Name, Email, Phone number.
  5. Click **"Confirm Appointment"**.
* **Expected Result**:
  * Appointment is saved in Firestore `bookings` collection.
  * A confirmation banner appears displaying the appointment ID, total price, and the assigned provider's business name.
  * Simulated SMS dispatch notification appears on screen.

#### UC-CUST-004: Customer Retail Shopping (Size, Color Selection, & Boutique Bag)
* **Persona**: Customer
* **Test Steps**:
  1. Select **"Clothing"** in **SHOP BY DEPARTMENT**.
  2. Click on a product article card *(e.g. "Milano Sartoriale 100% Extrafine Merino Overcoat")*.
  3. Select size chip **"L"**.
  4. Click on the color swatch circle **"Camel Tan"**.
  5. Click **"Add to Boutique Bag"**.
* **Expected Result**:
  * Boutique Bag counter badge in navigation updates from 0 to 1.
  * Opening the Boutique Bag displays the product thumbnail, title, selected size (`L`), selected color (`Camel Tan`), quantity (1), and price tag (`$295`).
  * Price tags show original compare price with discount percentage badge.
  * **Zero duration** is displayed anywhere on the product card.

#### UC-CUST-005: Customer Checkout & Simulated SMS Dispatch
* **Persona**: Customer
* **Test Steps**:
  1. Open the Boutique Bag.
  2. Increase item quantity from 1 to 2.
  3. Verify calculated Subtotal, Tax (8.25%), and Total Order Amount.
  4. Enter Customer Name, Phone, and valid Shipping Address.
  5. Click **"Place Boutique Order"**.
* **Expected Result**:
  * Order is saved in Firestore `orders` collection with items, shipping details, and total.
  * Success toast notification displays the simulated SMS dispatch text sent to customer's phone.
  * Order summary modal clears and closes.

#### UC-CUST-006: Session Teardown & Boutique Bag Clearing on Logout
* **Persona**: Logged-In Customer
* **Pre-conditions**: User has 2 items in their Boutique Bag and has partially typed in checkout address fields.
* **Test Steps**:
  1. Click the red **Logout** button on the top right corner of the navigation bar.
* **Expected Result**:
  * User is signed out immediately.
  * The Boutique Bag count drops to 0.
  * Opening the bag reveals an empty state.
  * All customer form fields (name, phone, address, date/time) are cleared.
  * Storefront view resets to default.

#### UC-CUST-007: 'Track My Order' Lookup for Service Appointments & Product Deliveries
* **Persona**: Logged-In Customer (Authenticated Only)
* **Pre-conditions**: Customer has an order ID (e.g., `OPAL-ORD-FEDEX`, `OPAL-ORD-PICKUP`), booking reference (`OPAL-BK-BEAUTY`), or carrier tracking number (`7946...`, `9400...`, `1Z...`).
* **Test Steps**:
  1. **Verify Unauthenticated State (Logged Out)**:
     - Visit the storefront homepage while logged out.
     - Inspect the top navbar, mobile menu drawer, hero section, catalog header, and footer.
     - Verify **"Track Order"** and **"Track My Order"** buttons are completely hidden for non-logged-in visitors.
  2. **Authenticate User**:
     - Click **"Login"** and sign in using the fast-access **Customer** demo chip (`elena.customer@opalportal.com`) or any registered account.
  3. **Verify Authenticated Visibility**:
     - Verify **"Track Order"** button now appears in:
       - Top Navigation Bar (desktop header).
       - Mobile slide-out menu drawer.
       - Hero section CTA banner (**"Track My Order"**).
       - Booking & retail catalog header (next to Detect GPS).
       - Footer under **"Services & Tour"**.
  4. Click the **"Track Order"** button:
     - Verify the **"Track My Order & Booking"** modal appears with a search input and 3 instant demo chips (`OPAL-BK-BEAUTY`, `OPAL-ORD-FEDEX`, `OPAL-ORD-PICKUP`).
  5. Click **"💆 Service Booking (OPAL-BK-BEAUTY)"**:
     - Verify it renders the **Service Booking** card with status `Confirmed`.
     - Verify 4-stage visual progress: **Booking Received** → **Confirmed by Provider** → **Specialist En Route** → **Service Completed**.
     - Verify scheduled date/time, duration (`90 min`), assigned salon (`L'Étoile Sanctuary`), and 1-click **"Call Provider"** button.
  6. Enter or click **"🚚 FedEx Express (OPAL-ORD-FEDEX)"**:
     - Verify it displays the **Retail Order - Carrier Delivery** card with status `In Transit`.
     - Verify FedEx 2Day tracking number, copy button, and link to carrier tracking portal.
     - Verify guaranteed delivery window, shipping address, 4-stage milestone bar, and live scan checkpoints.
  7. Enter or click **"🛍️ Showroom Pickup (OPAL-ORD-PICKUP)"**:
     - Verify it displays the **Boutique Showroom Pickup Pass** with status `Ready for Pickup`.
     - Verify physical showroom address (`450 N Rodeo Dr, Beverly Hills, CA 90210`), store hours, digital barcode pass, and Google Maps GPS navigation link.
  8. Enter an invalid reference ID (e.g., `INVALID-99999`) and click **"Track Status"**:
     - Verify a clear, non-blocking error banner appears with helpful guidance to check confirmation SMS or click demo samples.
* **Expected Result**:
  * Track Order is strictly visible only for logged-in users. When authenticated, customers can seamlessly track any booking or retail order in seconds.

#### UC-CUST-008: Seeker Dashboard 'Order History' Tab (Bookings & Retail Orders Without ID Entry)
* **Persona**: Logged-In Customer / Service Seeker (e.g. Elena Vance)
* **Pre-conditions**:
  * Customer is authenticated via 1-Click Fast-Access chip **"Customer"** (`elena.customer@opalportal.com`) or Google Sign-In.
* **Test Steps**:
  1. Once logged in as a Customer, notice the top navigation displays the **Client** badge and a **"My Orders & Bookings"** switcher button.
  2. Click **"My Orders & Bookings"** (or in the dashboard, select the **"Order History"** tab).
  3. Verify the **Order History** overview header renders with summary metrics:
     - **Total History Items** count badge
     - **Retail Purchases** count badge
     - **Service Appointments** count badge
     - **Total Cumulative Spend** formatted in USD
  4. If history is currently empty, click the **"+ Sample Orders"** button:
     - Verify two realistic luxury orders are seeded to Firestore:
       - 1 carrier delivery order (`OPAL-ORD-90210-LUX`) via **FedEx Priority Overnight** with tracking number `FDX-9948271038`.
       - 1 boutique pickup order (`OPAL-ORD-77341-PKP`) at **Opal Beverly Hills Flagship Boutique** (`468 N Rodeo Dr`).
  5. Test Type Filtering:
     - Click **"Retail Orders"** filter tab: only physical product orders are shown.
     - Click **"Service Bookings"** filter tab: only service appointments (Beauty, Handyman, etc.) are shown.
     - Click **"All"**: all transactions appear unified in chronological order.
  6. Test Status Filtering:
     - Click **"Active / In Transit"**: filters to `in_transit`, `ready_for_pickup`, or `confirmed`.
     - Click **"Completed / Delivered"**: filters to finished records.
  7. Test Real-Time Search Without Exact ID:
     - Type a product keyword like `Obsidian` or a brand like `Opal Pure`: verify matching orders appear instantly.
     - Type a service category like `Handyman`: verify matching appointment appears.
     - Type a street name like `Rodeo Dr`: verify boutique pickup showroom appears.
  8. Test 1-Click Live Tracking Action:
     - On any retail delivery order card, click **"Track Milestones"**:
       - Verify the `OrderTrackingModal` opens directly pre-populated with the tracking reference without requiring manual typing.
     - On a boutique pickup card, click **"View Showroom Pass"**:
       - Verify pickup instructions, store hours, and Google Maps GPS navigation link are displayed.
* **Expected Result**:
  * Logged-in users can browse, search, and track all past and current bookings and retail purchases in one single unified timeline without having to memorize or enter transaction IDs.

#### UC-CUST-009: Star-Rating & Review Submission in Order History for Providers and Sellers
* **Persona**: Logged-In Customer / Seeker
* **Pre-conditions**: Customer has at least one completed service appointment (`status: 'completed'`) or delivered/picked-up retail order (`status: 'delivered'` or `'picked_up'`). Alternatively, click `+ Sample Orders` in the Order History view.
* **Test Steps**:
  1. Open dashboard and switch to the **"Order History"** tab.
  2. Locate a completed service booking (e.g. `Balayage & Hair Styling` or Handyman appointment):
     - Verify an amber/gold **`★ Rate & Review`** button is displayed next to the status card.
  3. Click **`★ Rate & Review`**:
     - Verify the **Review & Feedback** modal opens displaying:
       - Target Name: Provider business name (e.g., `Luxury Glow Salon` or `Apex Handyman Solutions`).
       - Service/Product reference title and reference code badge (`OPAL-BK-...`).
       - Interactive 5-star rating widget.
  4. Hover and click 5 stars:
     - Verify the star preview turns solid gold and the sentiment label displays `Exceptional Luxury (5/5)`.
  5. Select Compliment Tags:
     - Click `Master Craftsmanship`, `On Time & Punctual`, and `Will Rebook`.
     - Verify badges highlight in gold with checkmarks.
  6. Fill in Review Content:
     - Headline: `World-class service from start to finish`.
     - Feedback: `The specialist was punctual, attentive, and the results exceeded every expectation. Highly recommended!`
     - Verify the character counter accurately updates (`113 / 600`).
     - Check `I would recommend this provider to others`.
     - Verify Customer Signature defaults to the logged-in customer's name with `Verified Client` badge enabled.
  7. Click **`Submit Verified Review`**:
     - Verify a success toast notification appears: `★ Thank you! Your review for [Target] has been published.`
     - In Order History, verify the card immediately updates without page reload to display:
       - Inline review card with 5 gold stars and compliment tags.
       - Footer action button toggles to **`Rated 5.0★ (Edit)`**.
  8. Repeat for a delivered Retail Order (e.g. `Milano Sartoriale` Suit):
     - Click **`★ Rate & Review`**.
     - Verify the compliment tags automatically adapt to retail qualities (`Premium Fabric & Finish`, `Exquisite Packaging`, `Lightning Delivery`).
     - Submit a 5-star review.
  9. Verify Feedback in Provider / Seller Portals:
     - Switch to Provider view (`AdminDashboard`): verify header rating shows `★ 5.0 (N Reviews)` and the **Reviews** tab displays the client testimonial.
     - Switch to Seller view (`SellerDashboard`): verify header rating chip and **Store Rating** metric card update, and the review appears in **Verified Customer Testimonials**.
* **Expected Result**:
  * Customers can review completed services and purchases directly from Order History. Star ratings, sentiment tags, and verified reviews persist to Firestore and instantly update provider and seller aggregates and dashboards.

#### UC-CUST-010: Cancel Upcoming Service Appointment in Order History with Confirmation Dialog
* **Persona**: Logged-In Customer / Service Seeker
* **Pre-conditions**: Customer has an upcoming service appointment in `confirmed`, `pending`, or `requested` status (e.g. from storefront booking or seeded sample bookings).
* **Test Steps**:
  1. Open the dashboard and navigate to the **"Order History"** tab.
  2. Locate an upcoming service appointment card (e.g. `Balayage & Hair Styling` or `Apex Handyman` service):
     - Verify an amber/red **`Cancel Booking`** button is displayed in the card footer next to `Track Live Milestones`.
     - Verify that for completed, delivered, or already cancelled appointments, this button is NOT shown.
  3. Click **`Cancel Booking`**:
     - Verify the **Cancel Appointment** confirmation dialog (`CancelBookingModal`) opens.
     - Verify the appointment summary card shows: Service Title, Specialist Provider Name, Date, Time slot, Address, and Booking Reference ID.
     - Verify the cancellation reason selector presents standard choices:
       - `Schedule conflict / need to reschedule`
       - `Booked by mistake or duplicate reservation`
       - `Selected an alternative specialist or timing`
       - `Personal emergency / unexpected change of plans`
       - `Service no longer required`
     - Verify the optional specialist message textarea (`0/200` characters limit).
  4. Test Dismissal / Keep Appointment:
     - Click **`Keep Appointment`** (or the close `X` button).
     - Verify the modal closes without making any changes to the database or appointment status.
  5. Test Confirmation:
     - Re-open **`Cancel Booking`**.
     - Select `Schedule conflict / need to reschedule`.
     - Type optional note: `Need to reschedule for next week`.
     - Click **`Yes, Cancel Booking`**:
       - Verify loading spinner displays while Firestore updates.
       - Verify a green success toast notification appears: `Appointment [Ref ID] has been cancelled successfully.`
  6. Verify Live UI Update:
     - Verify the appointment card status immediately updates to `cancelled` with a red badge.
     - Verify the milestone bar displays the red **Appointment Cancelled** notice with the chosen cancellation reason.
     - Verify the **`Cancel Booking`** button is removed and replaced by a **`Booking Cancelled`** indicator.
     - Click the **"Cancelled"** status filter tab: verify this booking appears in the cancelled view.
* **Expected Result**:
  * Upcoming appointments can be cancelled directly by service seekers with explicit modal confirmation and reason capture. The Firestore database updates in real time with complete cancellation audit fields, releasing the specialist slot.

---

### Section 2: Service Provider Use Cases (By Trade)

#### UC-PROV-001: Provider Registration (Email/Password)
* **Persona**: New Service Provider
* **Test Steps**:
  1. Click **"Login"** in the top navigation.
  2. Click **"Don't have an account? Register"**.
  3. Select the **"Provider"** role tab.
  4. Enter Email: `provider@apexsolutions.com`.
  5. Enter Full Name: `Marcus Vance`.
  6. Enter **Service Provider Name**: `Apex Handyman Solutions`.
  7. Select Category: **`Handyman`**.
  8. Enter Phone and submit.
* **Expected Result**:
  * Account created in Firestore `users/{uid}` with:
    * `role: "provider"`
    * `businessName: "Apex Handyman Solutions"`
    * `category: "Handyman"`
    * `isProfileCompleted: true`
  * Provider is redirected immediately to the **Provider Dashboard**.

#### UC-PROV-002: Provider Registration via Google OAuth
* **Persona**: New Service Provider
* **Test Steps (Path A — Form First):**
  1. Open Register modal → select **Provider** tab.
  2. Type Service Provider Name: `Luxury Glow Studio` and select `Beauty`.
  3. Click **"Continue with Google Account"**.
  * **Expected Result**: User signs in with Google; the portal captures `Luxury Glow Studio` from the form and saves it as `businessName` in Firestore.
* **Test Steps (Path B — Direct Google Sign-In):**
  1. Open Register modal → select **Provider** tab.
  2. Click **"Continue with Google Account"** directly without typing anything.
  * **Expected Result**:
    * User profile created with placeholder `displayName's Services` and `isProfileCompleted: false`.
    * Provider lands on Dashboard.
    * An automated **"Service Provider Profile"** modal pops up asking to confirm their official Business Name and Primary Category.
    * Once submitted, `businessName` updates and `isProfileCompleted` becomes `true`.

#### UC-PROV-003: In-Dashboard Business Name Editing & Rebranding
* **Persona**: Service Provider
* **Pre-conditions**: Signed into Provider Dashboard.
* **Test Steps**:
  1. Observe the dashboard title on the top left.
  2. Click the **"Edit Business Name"** button (pencil icon) directly next to the title.
  3. Change the name to `Apex Master Craftsmen LLC` and click **"Save Business Profile"**.
* **Expected Result**:
  * Dashboard header updates immediately to `Apex Master Craftsmen LLC Dashboard`.
  * The change is persisted to `users/{uid}` in Firestore.
  * Any new services created use the new official name.

#### UC-PROV-004: Handyman Service Isolation (Zero Cross-Pollution)
* **Persona**: Handyman Provider (`Apex Handyman Solutions`)
* **Test Steps**:
  1. Log in as Handyman Provider.
  2. Navigate to **Service Manager** tab in the dashboard.
  3. Inspect the listed services.
* **Expected Result**:
  * **ONLY** Handyman services *(e.g. Drywall Repair, TV Mounting, Furniture Assembly)* are displayed.
  * **NO** Beauty treatments, Facial sessions, or Cloud Kitchen menus appear.
  * Services belonging to other Handyman providers do not appear.

#### UC-PROV-005: Beauty Specialist Service Isolation
* **Persona**: Beauty Specialist (`Opal Luxury Salon & Spa`)
* **Test Steps**:
  1. Log in as Beauty Specialist.
  2. Navigate to **Service Manager**.
* **Expected Result**:
  * **ONLY** Beauty & Wellness services *(e.g. 24K Gold Facial, Hot Stone Massage, Deluxe Manicure)* are displayed.
  * No handyman tools or food items appear.

#### UC-PROV-006: Cloud Kitchen Provider (No Time Slot Required)
* **Persona**: Cloud Kitchen Chef
* **Test Steps**:
  1. Sign in as Cloud Kitchen provider.
  2. Switch to Storefront and simulate placing an order for a gourmet tasting box.
* **Expected Result**:
  * Cloud Kitchen orders do **not** require customer to pick a rigid 60-minute service time slot.
  * Bookings list in dashboard displays Date/Time as `N/A` or delivery schedule with customer phone and notes.

#### UC-PROV-007: Multi-Trade Administrator Category Switcher
* **Persona**: Platform Administrator / Multi-Trade Manager
* **Test Steps**:
  1. Sign in with `rakesh2xplore@gmail.com`.
  2. In the dashboard header, locate the **Category View Switcher** dropdown.
  3. Switch from `Handyman View` → `Beauty View`.
  4. Switch from `Beauty View` → `Cloud Kitchen View`.
* **Expected Result**:
  * Dashboard appointments, services, and statistics update dynamically to match the selected category view.
  * Zero page reloads required.

#### UC-PROV-008: Permanent Provider Attribution & Business Name Locking
* **Persona**: Service Provider
* **Test Steps**:
  1. In Provider Dashboard, click **"+ Add Service"**.
  2. Inspect the **"Service Provider Name"** input field.
* **Expected Result**:
  * The field is visually locked with a padlock icon (`Lock`).
  * The input is `disabled` and displays the provider's verified company name.
  * The user cannot manually alter the company name to impersonate another provider.

#### UC-PROV-009: Provider Service CRUD & Industry Template Import
* **Persona**: Service Provider
* **Test Steps**:
  1. In **Service Manager**, click **"+ Create Custom Service"**.
  2. Enter Name, Description, Price ($140), Duration ("60 mins"), and Image URL.
  3. Click **"Save Service"**.
  4. Click **"Edit"** on the newly created service, update price to $155, and save.
  5. Click **"Delete"** on the service and confirm deletion in modal.
* **Expected Result**:
  * Service creates, updates, and deletes in real-time Firestore database.
  * Feedback alerts display green success toast notifications.

#### UC-PROV-010: Appointment Schedule & Payment Status Tracking (Cash / Zelle)
* **Persona**: Service Provider
* **Test Steps**:
  1. In Dashboard, click the **"List"** view.
  2. Locate an unpaid pending booking.
  3. Click **"Paid (Cash)"** or **"Paid (Zelle)"**.
  4. Click **"Mark Done"**.
* **Expected Result**:
  * Payment status badge updates from red `unpaid` to green `paid (Cash)` or `paid (Zelle)`.
  * Status badge updates from yellow `pending` to green `done`.
  * Total revenue calculations update in real-time.

#### UC-PROV-011: Sample Appointments Seeding
* **Persona**: Provider / Tester
* **Test Steps**:
  1. In Provider Dashboard, click **"+ Sample Bookings"**.
* **Expected Result**:
  * Two realistic sample appointments matching the provider's active trade category are inserted into Firestore.
  * Appointments appear in the List view and Calendar view with client names, dates, and prices.

---

### Section 3: Product Seller Use Cases

#### UC-SELL-001: Product Seller Registration & Landing Page Routing
* **Persona**: New Product Seller
* **Test Steps**:
  1. Open Login modal → click **"Register"**.
  2. Select **"Product Seller"** tab.
  3. Enter Email: `seller@milano.com`.
  4. Enter Name: `Marco Rossi`.
  5. Enter **Seller Company Name**: `Milano Sartoriale`.
  6. Select Primary Department: **`Clothing`**.
  7. Submit.
* **Expected Result**:
  * User created with `role: "seller"` and `companyName: "Milano Sartoriale"`.
  * Automatically lands on the **Product Seller Portal (`SellerDashboard`)**.
  * Top navigation bar displays the **Verified Product Seller** badge and company name.

#### UC-SELL-002: Creating a Brand New Product Article (No Duration Rule)
* **Persona**: Product Seller
* **Test Steps**:
  1. In Seller Portal, click **"+ Add Product"**.
  2. Enter Title: `Italian Goodyear Calfskin Chelsea Boots`.
  3. Select Department: **`Shoes`**.
  4. Enter Retail Price: `280`.
  5. Enter Compare-at Original Price: `350`.
  6. Inspect the form to verify there is **no Duration field**.
* **Expected Result**:
  * Form only contains retail fields: Price, Compare Price, Inventory Stock Units, SKU, Sizes, Colors, and Images.
  * No service duration (minutes/hours) exists.

#### UC-SELL-003: Color Palette & Swatches Configuration
* **Persona**: Product Seller
* **Test Steps**:
  1. In the Add Product modal, locate the **"Color Options"** section.
  2. Click preset chips **"Onyx Black"** and **"Camel Tan"**.
  3. Use the custom hex input: type name `Deep Navy` and select hex `#1E3A8A`.
  4. Click **"+ Add Color"**.
* **Expected Result**:
  * 3 color swatches are added to the product.
  * Live Preview card inside the modal updates showing the 3 color circles with tooltips.

#### UC-SELL-004: Department-Specific Size Presets & Custom Size Tags
* **Persona**: Product Seller
* **Test Steps**:
  1. Change Department from `Clothing` to `Shoes`.
  2. Observe the suggested size buttons: `US 7`, `US 8`, `US 8.5`, `US 9`, `US 9.5`, `US 10`, `US 11`.
  3. Click `US 9` and `US 10` to add them.
  4. In the custom size input, type `Wide Fit (US 10.5)` and click **"Add"**.
* **Expected Result**:
  * Selected sizes are rendered as tags.
  * Clicking the `×` on any tag removes that size option.

#### UC-SELL-005: Product Image Upload & URL Preview
* **Persona**: Product Seller
* **Test Steps**:
  1. In the Image section, toggle between **"Upload File"** and **"Image URL"**.
  2. Paste a valid high-resolution image URL.
* **Expected Result**:
  * Real-time image preview renders instantly in the modal.
  * If file upload is selected, local image is converted to a base64 preview.

#### UC-SELL-006: Real-Time Inventory & Stock Status Toggle
* **Persona**: Product Seller
* **Test Steps**:
  1. Locate an existing product on the dashboard card grid.
  2. Toggle the stock pill from **"In Stock"** to **"Sold Out"**.
  3. Switch to **Storefront Preview**.
* **Expected Result**:
  * The product card on the client storefront now reflects **"Sold Out"** / `Out of Stock`.
  * Customers are prevented from adding it to their Boutique Bag.

#### UC-SELL-007: Real-Time Catalog Analytics Bar Verification
* **Persona**: Product Seller / Tester
* **Test Steps**:
  1. Count the number of active products on the dashboard.
  2. Add up all stock units across products.
  3. Compare against the 4 top metrics:
     * **Active Products**
     * **Total Inventory Units**
     * **Active Departments**
     * **Average Price**
* **Expected Result**:
  * All 4 metric cards match real-time Firestore catalog data.

#### UC-SELL-008: Storefront Preview & Client Visibility Verification
* **Persona**: Product Seller
* **Test Steps**:
  1. In Seller Dashboard header, click **"Storefront Preview"**.
  2. On the storefront, select the department of your product in **SHOP BY DEPARTMENT**.
* **Expected Result**:
  * Client storefront opens directly.
  * Your product article appears with your Seller Company Name branded on it.

---

### Section 4: Global & Cross-Cutting Workflows

#### UC-GLOB-001: Consistent Top-Right Corner Logout Verification
* **Persona**: Any Authenticated User (Provider, Seller, or Seeker)
* **Test Steps**:
  1. Visit the **Client Storefront** while logged in → Check top right corner.
  2. Navigate to the **Provider Dashboard** → Check top right corner.
  3. Navigate to the **Product Seller Portal** → Check top right corner.
  4. Inspect the body of `SellerDashboard` and `AdminDashboard`.
* **Expected Result**:
  * The red **Logout** button is present on the **top right corner** of the global navigation bar in every view.
  * Zero in-body logout buttons exist inside dashboard cards.
  * Clicking Logout terminates the session, resets role state, and redirects to the public storefront.

#### UC-GLOB-002: Mobile Header & Slide-Out Drawer Navigation
* **Persona**: Mobile Tester (Viewport width <= 768px)
* **Test Steps**:
  1. Open Chrome DevTools and switch to Mobile Device mode (iPhone 14 / Pixel 7).
  2. Check the top right header: verify compact **Logout** button is visible next to hamburger menu.
  3. Tap the hamburger menu (`Menu` / `X` toggle).
  4. Inspect the slide-out mobile drawer.
* **Expected Result**:
  * Persistent mobile Logout button works from the top right.
  * Full-width Logout button is also rendered at the bottom of the drawer.
  * Tapping Logout closes drawer and cleans session.

---

### Section 5: Walkthrough Video Guide Suite (Services, Retail, Shipment & Payments)

#### UC-VID-001: Launch Video Guide Modal
* **Persona**: Guest, Client, or Tester
* **Test Steps**:
  1. Open the storefront at `/`.
  2. Scroll to the footer and click the **"🎥 Video Guide (Services, Retail, Shipping & Payments)"** link under Services & Tour.
* **Expected Result**:
  * `PortalVideoModal` launches with backdrop blur.
  * HD 1080p video player mounts and displays `/assets/aistudio/opal-portal-walkthrough-guide.mp4`.
  * Step tabs (`1. All Services`, `2. Department Shopping`, `3. Shipment & Pickup`, `4. Payment Methods`) render at the top.
  * Active teleprompter subtitle box renders below the video player.

#### UC-VID-002: Interactive Step Navigation & Timestamp Seeking
* **Persona**: QA Tester / Evaluator
* **Test Steps**:
  1. Click **"2. Department Shopping"** tab → Verify player seeks to 0:14s and subtitle updates to retail goods.
  2. Click **"3. Shipment & Pickup"** tab → Verify player seeks to 0:28s and subtitle updates to FedEx/USPS/UPS & showroom pickup.
  3. Click **"4. Payment Methods"** tab → Verify player seeks to 0:43s and subtitle updates to Cash, Zelle, Card, and In-Store pay.
  4. Click **"1. All Services"** tab → Verify player returns to 0:00s.
* **Expected Result**:
  * Player seeks accurately with smooth continuous playback and zero audio stuttering.

#### UC-VID-003: Video Player Playback Controls
* **Persona**: QA Tester
* **Test Steps**:
  1. Click Play / Pause → Verify video toggles smoothly.
  2. Click Replay (`RotateCcw`) → Verify video restarts at 0:00.
  3. Click Speed toggle (`1.0x` → `1.25x` → `1.5x` → `0.85x`) → Verify playback rate adjusts.
  4. Click Mute / Unmute → Verify volume state toggles.
  5. Click Fullscreen → Verify video enters fullscreen mode.
* **Expected Result**:
  * All controls respond smoothly with visual feedback.

#### UC-VID-004: Direct Video & Script Download Verification
* **Persona**: QA Tester / Marketing User
* **Test Steps**:
  1. In modal header, click **"Download Video (.mp4)"**.
  2. Verify browser downloads `opal-portal-walkthrough-guide.mp4` (~1.2 MB, 1280x720, H.264/AAC).
  3. Click **"Script"**.
  4. Verify browser downloads `opal-portal-guide-script.txt` with full narrative transcript.
* **Expected Result**:
  * Both assets download instantly and are fully readable and playable offline.

---

## 🎯 Verification Matrix & Sign-Off Checklist

| Test Suite | Total Scenarios | Automated Unit Tests (`npm test`) | Manual UI Verifications |
| :--- | :--- | :--- | :--- |
| **Dropdown Navigation** | 9 | `src/__tests__/dropdown-navigation.test.ts` (9/9 passed) | Storefront dropdown switcher |
| **Products & Boutique Bag** | 21 | `src/__tests__/products-and-bag.test.ts` (21/21 passed) | Size/color selection, carrier shipping & showroom address |
| **Seller & Provider Isolation** | 11 | `src/__tests__/seller-and-provider-isolation.test.ts` (11/11 passed) | Multi-trade dashboards & category isolation |
| **Authentication & Attribution** | 11 | `src/__tests__/auth-and-business-attribution.test.ts` (11/11 passed) | Google OAuth & 1-Click Fast-Access |
| **Walkthrough Video Guide** | 7 | `src/__tests__/walkthrough-video-guide.test.ts` (7/7 passed) | 4-step video tour, continuous audio & MP4/text download |
| **Total Test Coverage** | **59 Scenarios** | **59 Passed (100%)** | **Verified Across All Personas** |

