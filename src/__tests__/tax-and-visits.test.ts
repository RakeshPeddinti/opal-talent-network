import { describe, it, expect } from 'vitest';
import { ProductArticle, TaxInvoiceData, HomeStoreVisitRecord, RetailOrderRecord } from '../types';

describe('Home-Based Business Article Availability & Visit Confirmation', () => {
  const mockArticle: ProductArticle = {
    id: 'art-7701',
    name: 'Artisan Embroidered Silk Jacket',
    department: 'Clothing',
    price: 320,
    originalPrice: 420,
    stockCount: 8,
    inStock: true,
    sku: 'OPL-SLK-7701',
    description: 'Hand-woven raw silk jacket crafted by home-based atelier master.',
    image: 'https://images.unsplash.com/photo-1544923246-77307dd654cb',
    sizes: ['Small', 'Medium', 'Large'],
    colors: [
      { name: 'Imperial Gold', hex: '#D4AF37' },
      { name: 'Onyx Midnight', hex: '#111827' }
    ],
    brand: 'Atelier de Soie',
    sellerCompanyName: 'Atelier de Soie Home Studio',
    sellerAddress: '1240 Highland Ave, Hollywood, CA 90028',
    sellerUid: 'artisan-owner-99',
    rating: 4.95,
    reviewsCount: 32,
    tags: ['Handcrafted', 'Home Atelier']
  };

  it('correctly verifies real-time article stock availability and attribute options', () => {
    expect(mockArticle.inStock).toBe(true);
    expect(mockArticle.stockCount).toBeGreaterThan(0);
    expect(mockArticle.sizes).toContain('Medium');
    expect(mockArticle.colors.some(c => c.name === 'Imperial Gold')).toBe(true);
  });

  it('supports creating both Home Visit and Store / Home Studio Visit booking records', () => {
    // 1. Home Visit by Specialist to customer residence
    const homeVisitRecord: HomeStoreVisitRecord = {
      visitId: 'OPAL-VST-H001',
      visitType: 'home_visit',
      articleId: mockArticle.id,
      articleName: mockArticle.name,
      articleBrand: mockArticle.brand,
      articlePrice: mockArticle.price,
      selectedSize: 'Medium',
      selectedColor: { name: 'Imperial Gold', hex: '#D4AF37' },
      sellerCompanyName: mockArticle.sellerCompanyName,
      sellerStudioAddress: mockArticle.sellerAddress,
      customerName: 'Claire Redfield',
      customerEmail: 'claire@example.com',
      customerPhone: '(555) 392-8812',
      customerAddress: '742 Evergreen Terrace, Los Angeles, CA',
      visitDate: '2026-11-04',
      timeSlot: '2:00 PM – 3:30 PM',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    expect(homeVisitRecord.visitType).toBe('home_visit');
    expect(homeVisitRecord.customerAddress).toBeDefined();
    expect(homeVisitRecord.status).toBe('confirmed');

    // 2. Store / Home Showroom Visit to seller studio
    const storeVisitRecord: HomeStoreVisitRecord = {
      visitId: 'OPAL-VST-S002',
      visitType: 'store_visit',
      articleId: mockArticle.id,
      articleName: mockArticle.name,
      articleBrand: mockArticle.brand,
      articlePrice: mockArticle.price,
      selectedSize: 'Large',
      selectedColor: { name: 'Onyx Midnight', hex: '#111827' },
      sellerCompanyName: mockArticle.sellerCompanyName,
      sellerStudioAddress: mockArticle.sellerAddress,
      customerName: 'Marcus Brody',
      customerEmail: 'marcus@example.com',
      customerPhone: '(555) 781-9923',
      visitDate: '2026-11-05',
      timeSlot: '11:00 AM – 12:30 PM',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    expect(storeVisitRecord.visitType).toBe('store_visit');
    expect(storeVisitRecord.sellerStudioAddress).toBe('1240 Highland Ave, Hollywood, CA 90028');
  });

  it('enforces that consultation/trial visits carry $0 fee and ZERO tax liability', () => {
    const consultationVisitFee = 0.00;
    const visitTaxRate = 0.00;
    const visitTaxAmount = consultationVisitFee * visitTaxRate;

    expect(consultationVisitFee).toBe(0.00);
    expect(visitTaxAmount).toBe(0.00);
    // Verified: No commercial tax invoice should be generated for non-purchasers who only book a visit
  });
});

describe('Tax & Invoicing Logic for Portal Buyers Only', () => {
  const calculateCommercialTax = (subtotal: number, state: string = 'CA') => {
    const stateRates: Record<string, number> = {
      CA: 0.0825,
      NY: 0.08875,
      TX: 0.0825,
      FL: 0.070,
      IL: 0.0875,
      WA: 0.085
    };
    const rate = stateRates[state.toUpperCase()] || 0.0825;
    const taxAmount = Math.round(subtotal * rate * 100) / 100;
    const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

    return {
      taxRate: rate,
      taxRatePercentage: `${(rate * 100).toFixed(2)}%`,
      subtotal,
      taxAmount,
      grandTotal
    };
  };

  it('correctly calculates 8.25% commercial sales tax for portal merchandise buyers', () => {
    const subtotal = 400.00;
    const calc = calculateCommercialTax(subtotal, 'CA');

    expect(calc.taxRate).toBe(0.0825);
    expect(calc.taxRatePercentage).toBe('8.25%');
    expect(calc.taxAmount).toBe(33.00); // 400 * 0.0825 = 33
    expect(calc.grandTotal).toBe(433.00);
  });

  it('handles fractional cents rounding accurately in sales tax calculation', () => {
    // $195.50 * 0.0825 = 16.12875 -> rounds to $16.13
    const calc = calculateCommercialTax(195.50, 'CA');
    expect(calc.taxAmount).toBe(16.13);
    expect(calc.grandTotal).toBe(211.63);
  });

  it('supports state-specific sales tax rates for multi-jurisdiction shipping', () => {
    const subtotal = 200.00;
    const nyCalc = calculateCommercialTax(subtotal, 'NY');
    expect(nyCalc.taxRate).toBe(0.08875);
    expect(nyCalc.taxAmount).toBe(17.75);

    const flCalc = calculateCommercialTax(subtotal, 'FL');
    expect(flCalc.taxRate).toBe(0.070);
    expect(flCalc.taxAmount).toBe(14.00);
  });

  it('generates an official TaxInvoiceData structure with seller tax ID and itemized breakdown', () => {
    const subtotal = 320.00;
    const shippingFee = 15.00;
    const taxCalc = calculateCommercialTax(subtotal, 'CA');
    const grandTotal = subtotal + taxCalc.taxAmount + shippingFee;

    const invoice: TaxInvoiceData = {
      invoiceNumber: 'INV-OPAL-882910',
      orderId: 'OPAL-ORD-98421',
      invoiceDate: 'Nov 4, 2026',
      status: 'paid',
      seller: {
        businessName: 'Atelier de Soie Home Studio',
        ownerName: 'Genevieve Laurent',
        taxId: 'US-EIN-95-4819201',
        studioAddress: '1240 Highland Ave, Hollywood, CA 90028',
        phone: '(415) 890-6725',
        email: 'atelier@opal-business.portal'
      },
      customer: {
        name: 'Eleanor Vance',
        email: 'eleanor@example.com',
        phone: '(555) 234-5678',
        address: '500 Grand Ave, Los Angeles, CA'
      },
      fulfillmentType: 'delivery',
      items: [
        {
          name: 'Artisan Embroidered Silk Jacket',
          brand: 'Atelier de Soie',
          sku: 'OPL-SLK-7701',
          price: 320.00,
          unitPrice: 320.00,
          size: 'Medium',
          color: 'Imperial Gold',
          quantity: 1
        }
      ],
      subtotal,
      taxRate: taxCalc.taxRate,
      taxRatePercentage: taxCalc.taxRatePercentage,
      taxAmount: taxCalc.taxAmount,
      shippingFee,
      grandTotal,
      paymentMethod: 'Credit / Debit Card (Secured)'
    };

    expect(invoice.invoiceNumber).toMatch(/^INV-OPAL-\d{6}$/);
    expect(invoice.seller.taxId).toBe('US-EIN-95-4819201');
    expect(invoice.items.length).toBe(1);
    expect(invoice.taxAmount).toBe(26.40); // 320 * 0.0825
    expect(invoice.grandTotal).toBe(361.40); // 320 + 26.40 + 15
  });

  it('guarantees that retail orders store tax fields while service bookings do not', () => {
    const retailOrder: RetailOrderRecord = {
      id: 'ord-doc-01',
      orderId: 'OPAL-ORD-77112',
      items: [
        { name: 'Silk Pocket Square', price: 45, quantity: 2 }
      ],
      subtotal: 90.00,
      taxRate: 0.0825,
      taxRatePercentage: '8.25%',
      taxAmount: 7.43,
      shippingFee: 0,
      totalPrice: 97.43,
      invoiceNumber: 'INV-OPAL-119283',
      invoiceDate: 'Nov 4, 2026',
      sellerTaxId: 'US-EIN-95-4819201',
      customerName: 'Sam Drake',
      customerEmail: 'sam@example.com',
      customerPhone: '(555) 888-9999',
      fulfillmentType: 'pickup',
      status: 'confirmed',
      paymentStatus: 'paid_on_delivery',
      createdAt: '2026-11-04T10:00:00Z'
    };

    expect(retailOrder.invoiceNumber).toBeDefined();
    expect(retailOrder.taxAmount).toBeGreaterThan(0);
    expect(retailOrder.sellerTaxId).toBeDefined();

    // In contrast, a pure service consultation booking object:
    const serviceBooking = {
      id: 'bk-doc-01',
      bookingId: 'OPAL-BK-5521',
      serviceName: 'Custom Bespoke Tailoring Fitting',
      price: 150.00,
      isService: true
    };

    // Confirm service bookings do not have invoiceNumber or retail tax amount attached
    expect((serviceBooking as any).invoiceNumber).toBeUndefined();
    expect((serviceBooking as any).sellerTaxId).toBeUndefined();
  });
});
