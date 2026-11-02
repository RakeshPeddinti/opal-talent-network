import { describe, it, expect, vi } from 'vitest';
import { jsPDF } from 'jspdf';
import { generatePdfInvoice, normalizeInvoiceData, downloadPdfInvoice } from '../utils/pdfInvoiceGenerator';
import { TaxInvoiceData, RetailOrderRecord } from '../types';

describe('PDF Invoice Generator for Completed Retail Orders', () => {
  const mockTaxInvoice: TaxInvoiceData = {
    invoiceNumber: 'INV-OPAL-994120',
    orderId: 'OPAL-ORD-88124',
    invoiceDate: 'Nov 4, 2026',
    status: 'paid',
    seller: {
      businessName: 'Milano Sartoriale Home Atelier',
      ownerName: 'Alessandro Conti',
      taxId: 'US-EIN-95-4819201',
      studioAddress: '450 N Rodeo Dr, Beverly Hills, CA 90210',
      phone: '(415) 890-6725',
      email: 'atelier@opal-business.portal'
    },
    customer: {
      name: 'Victoria Hastings',
      email: 'victoria@example.com',
      phone: '(555) 781-9923',
      address: '1000 Wilshire Blvd, Los Angeles, CA 90017'
    },
    fulfillmentType: 'delivery',
    items: [
      {
        name: 'Handcrafted Cashmere Wool Overcoat',
        brand: 'Milano Sartoriale',
        sku: 'OPL-OVC-101',
        price: 850.00,
        unitPrice: 850.00,
        size: '40R',
        color: 'Camel Tan',
        quantity: 1
      },
      {
        name: 'Artisan Silk Twill Scarf',
        brand: 'Milano Sartoriale',
        sku: 'OPL-SCF-202',
        price: 150.00,
        unitPrice: 150.00,
        size: 'One Size',
        color: 'Burgundy Wine',
        quantity: 2
      }
    ],
    subtotal: 1150.00, // 850 + (150 * 2) = 1150
    taxRate: 0.0825,
    taxRatePercentage: '8.25%',
    taxAmount: 94.88, // 1150 * 0.0825 = 94.875 -> 94.88
    shippingFee: 19.95,
    grandTotal: 1264.83, // 1150 + 94.88 + 19.95 = 1264.83
    paymentMethod: 'Credit / Debit Card (Secured)'
  };

  const mockRetailOrder: RetailOrderRecord = {
    id: 'ord-firestore-doc-77',
    orderId: 'OPAL-ORD-44910',
    items: [
      {
        name: 'Italian Leather Driving Loafers',
        brand: 'Milano Sartoriale',
        sku: 'OPL-SHO-303',
        price: 295.00,
        unitPrice: 295.00,
        size: 'US 10',
        color: 'Espresso Brown',
        quantity: 1
      }
    ],
    subtotal: 295.00,
    taxRate: 0.0825,
    taxRatePercentage: '8.25%',
    taxAmount: 24.34, // 295 * 0.0825 = 24.3375 -> 24.34
    shippingFee: 0,
    totalPrice: 319.34,
    invoiceNumber: 'INV-OPAL-44910',
    invoiceDate: 'Nov 4, 2026',
    sellerTaxId: 'US-EIN-95-4819201',
    customerName: 'Robert Vance',
    customerEmail: 'robert@example.com',
    customerPhone: '(555) 345-6789',
    shippingAddress: '450 N Rodeo Dr Showroom Pickup',
    fulfillmentType: 'pickup',
    status: 'delivered',
    paymentStatus: 'paid_on_delivery',
    createdAt: '2026-11-04T12:00:00Z'
  };

  it('correctly normalizes a TaxInvoiceData record', () => {
    const normalized = normalizeInvoiceData(mockTaxInvoice);
    expect(normalized.invoiceNumber).toBe('INV-OPAL-994120');
    expect(normalized.subtotal).toBe(1150.00);
    expect(normalized.taxAmount).toBe(94.88);
    expect(normalized.grandTotal).toBe(1264.83);
    expect(normalized.items.length).toBe(2);
  });

  it('correctly normalizes a raw RetailOrderRecord into full invoice format', () => {
    const normalized = normalizeInvoiceData(mockRetailOrder);
    expect(normalized.invoiceNumber).toBe('INV-OPAL-44910');
    expect(normalized.orderId).toBe('OPAL-ORD-44910');
    expect(normalized.subtotal).toBe(295.00);
    expect(normalized.taxRate).toBe(0.0825);
    expect(normalized.taxAmount).toBe(24.34);
    expect(normalized.grandTotal).toBe(319.34);
    expect(normalized.seller.taxId).toBe('US-EIN-95-4819201');
    expect(normalized.customer.name).toBe('Robert Vance');
  });

  it('generates a valid jsPDF document containing line items, subtotal, tax, and total', () => {
    const doc = generatePdfInvoice(mockTaxInvoice);

    expect(doc).toBeDefined();
    // Verify document page format
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    expect(width).toBeGreaterThan(500); // Standard A4 points ~595.28
    expect(height).toBeGreaterThan(800); // Standard A4 points ~841.89

    // Verify PDF binary output generation without throwing
    const arrayBuffer = doc.output('arraybuffer');
    expect(arrayBuffer.byteLength).toBeGreaterThan(1000);
  });

  it('generates a valid jsPDF document directly from RetailOrderRecord', () => {
    const doc = generatePdfInvoice(mockRetailOrder);
    expect(doc).toBeDefined();

    const outputDataUri = doc.output('datauristring');
    expect(outputDataUri).toContain('data:application/pdf');
  });

  it('triggers doc.save with expected filename in downloadPdfInvoice', () => {
    const doc = generatePdfInvoice(mockTaxInvoice);
    expect(typeof doc.save).toBe('function');

    const origSave = (jsPDF as any).API?.save;
    const saveSpy = vi.fn();
    (jsPDF as any).API.save = saveSpy;

    downloadPdfInvoice(mockTaxInvoice, 'test-invoice.pdf');
    expect(saveSpy).toHaveBeenCalledWith('test-invoice.pdf');

    if (origSave) {
      (jsPDF as any).API.save = origSave;
    }
  });
});
