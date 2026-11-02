
export interface ServiceLocation {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: 'Beauty' | 'Plumbing' | 'Roofing' | 'Handyman' | 'Electric' | 'Pest Control' | 'Party Planner' | 'Cloud Kitchen';
  image: string;
  providerName: string;
  providerRating: number;
  providerId?: string;
  location?: ServiceLocation;
  distance?: number; // Calculated distance in miles from user
  relativeDistanceMiles?: number; // Target reference distance for near-me simulation
  bearingDegrees?: number; // Direction bearing in degrees
}

export interface Booking {
  id: string;
  bookingRefId?: string;
  serviceId: string;
  serviceName: string;
  category?: string;
  duration?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'done' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'cancelled' | string;
  price: number;
  providerId: string;
  providerName?: string;
  providerPhone?: string;
  address?: string;
  createdAt: any;
  cancelledAt?: any;
  cancelledBy?: 'seeker' | 'provider' | 'admin' | string;
  cancellationReason?: string;
  cancellationNotes?: string;
}

export interface SpecialOffer {
  id?: string;
  providerId: string;
  providerName: string;
  category: 'Cloud Kitchen' | 'Beauty' | 'Beauty & Wellness' | string;
  title: string;
  description: string;
  discount: string;
  specificDate: string; // YYYY-MM-DD
  endDate?: string;
  promoCode?: string;
  recipientCount?: number;
  status: 'active' | 'expired';
  createdAt?: any;
}

export interface ProductArticleColor {
  name: string;
  hex: string;
}

export interface ProductArticle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  department: string;
  brand: string;
  image: string;
  rating: number;
  reviewsCount?: number;
  sizes: string[];
  colors: ProductArticleColor[];
  inStock: boolean;
  stockCount?: number;
  sku: string;
  tags?: string[];
  sellerUid?: string;
  sellerEmail?: string;
  sellerCompanyName?: string;
  sellerAddress?: string;
  createdAt?: any;
}

export interface SelectedProductArticle {
  id: string; // unique key combining product id, size, color
  article: ProductArticle;
  product?: ProductArticle; // Alias for test compatibility
  selectedSize: string;
  selectedColor: ProductArticleColor;
  quantity: number;
}

export interface CarrierShippingOption {
  carrierId: string;
  carrierName: 'USPS' | 'FedEx' | 'UPS' | 'Standard' | string;
  serviceName: string;
  rate: number;
  transitDays: number;
  estimatedDeliveryDate: string;
  deliveryGuarantee: string;
  carrierLogoText: string;
  trackingNumberFormat: string;
}

export interface ShipmentTrackingRecord {
  trackingNumber: string;
  carrier: string;
  serviceName: string;
  trackingUrl: string;
  status: 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered';
  estimatedDelivery: string;
  destination: string;
  checkpoints: {
    status: string;
    location: string;
    timestamp: string;
    description: string;
  }[];
}

export interface OrderItem {
  id?: string;
  name: string;
  brand?: string;
  category?: string;
  price?: number;
  unitPrice?: number;
  size?: string;
  color?: string;
  colorHex?: string;
  quantity: number;
  sku?: string;
}

export interface TaxInvoiceData {
  invoiceNumber: string;
  orderId: string;
  invoiceDate: string;
  dueDate?: string;
  status: 'paid' | 'pending' | 'due_on_arrival' | string;
  seller: {
    businessName: string;
    ownerName?: string;
    taxId: string;
    studioAddress: string;
    phone: string;
    email: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  fulfillmentType: string;
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  taxRatePercentage: string;
  taxAmount: number;
  shippingFee: number;
  grandTotal: number;
  paymentMethod: string;
}

export interface HomeStoreVisitRecord {
  id?: string;
  visitId: string;
  visitType: 'home_visit' | 'store_visit';
  articleId: string;
  articleName: string;
  articleBrand: string;
  articlePrice: number;
  articleImage?: string;
  articleSku?: string;
  selectedSize: string;
  selectedColor: { name: string; hex: string };
  sellerCompanyName?: string;
  sellerStudioAddress?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  visitDate: string;
  timeSlot: string;
  notes?: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  createdAt: any;
}

export interface RetailOrderRecord {
  id: string; // Firestore document ID or reference ID
  orderId: string; // e.g. OPAL-ORD-XXXXX
  department?: string;
  items: OrderItem[];
  itemsSubtotal?: number;
  subtotal?: number;
  taxRate?: number;
  taxRatePercentage?: string;
  taxAmount?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  sellerTaxId?: string;
  shippingFee?: number;
  totalPrice: number;
  currency?: string;
  paymentMethod?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerUid?: string | null;
  fulfillmentType: 'delivery' | 'pickup' | string;
  shippingCarrier?: string;
  shippingService?: string;
  carrierRate?: number;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDelivery?: string;
  shippingAddress?: string;
  pickupAddress?: string | null;
  pickupShowroom?: string | null;
  pickupInstructions?: string;
  status: 'confirmed' | 'in_transit' | 'ready_for_pickup' | 'delivered' | 'cancelled' | string;
  paymentStatus: string;
  createdAt: any;
}

export interface ReviewRecord {
  id?: string;
  targetType: 'provider' | 'seller';
  targetId?: string;
  targetName: string;
  referenceId: string; // Booking reference ID or Order ID
  referenceType: 'booking' | 'order';
  itemTitle: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  tags?: string[];
  recommend?: boolean;
  customerUid?: string;
  customerName: string;
  customerEmail?: string;
  verified?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// =========================================================================
// Talent Network Module Interfaces
// Tagline: "Create Your Profile. Get Discovered. Connect with Opportunities."
// =========================================================================

export interface TalentExperience {
  id: string;
  roleTitle: string;
  companyName: string;
  employmentType?: string; // 'Full-time' | 'Contract' | 'Freelance' | 'Apprenticeship'
  location?: string;
  startDate: string; // e.g. "Jan 2021" or "2021-01"
  endDate?: string;   // e.g. "Present" or "Dec 2023"
  current: boolean;
  description?: string;
}

export interface TalentProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  headline: string;
  city: string;
  state?: string;
  bio?: string;
  skills: string[];
  experiences: TalentExperience[];
  education?: string;
  certifications?: string[];
  wageExpectation?: string;
  yearsOfExperience?: number;
  availabilityStatus: 'available' | 'actively_interviewing' | 'placed';
  resumeName?: string;
  resumeText?: string;
  registeredAt: any;
  updatedAt?: any;
}

export interface TalentJobRequirement {
  id: string;
  vendorUid: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  title: string;
  skillsRequired: string[];
  experienceLevel: string; // e.g. "3-5 years"
  wageLevel: string; // e.g. "$48 - $55 / hr"
  wageType: 'hourly' | 'annual' | 'contract';
  city: string;
  state?: string;
  description?: string;
  employmentType?: string;
  status: 'open' | 'closed';
  createdAt: any;
  applicationsCount?: number;
}

export interface TalentApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  vendorName: string;
  vendorPhone?: string;
  vendorEmail?: string;
  talentUid: string;
  talentName: string;
  talentEmail: string;
  talentPhone: string;
  resumeText: string;
  resumeName?: string;
  coverNote?: string;
  status: 'applied' | 'reviewed' | 'contacted' | 'accepted';
  appliedAt: any;
  smsNotificationSent: boolean;
  smsTimestamp?: any;
}

export interface TalentSmsNotification {
  id: string;
  recipientPhone: string;
  recipientName: string;
  senderName: string;
  senderRole: 'vendor' | 'talent';
  message: string;
  jobId?: string;
  jobTitle?: string;
  timestamp: any;
  status: 'delivered' | 'sent';
}


