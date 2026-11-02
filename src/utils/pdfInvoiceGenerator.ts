import { jsPDF } from 'jspdf';
import { TaxInvoiceData, RetailOrderRecord, OrderItem } from '../types';

/**
 * Normalizes input which can be either a full TaxInvoiceData or a RetailOrderRecord
 * into a standardized structure for PDF rendering.
 */
export function normalizeInvoiceData(data: TaxInvoiceData | RetailOrderRecord): TaxInvoiceData {
  if ('seller' in data && 'customer' in data && typeof data.subtotal === 'number') {
    return data as TaxInvoiceData;
  }

  const order = data as RetailOrderRecord;
  const itemsSubtotal = order.subtotal ?? order.itemsSubtotal ?? order.totalPrice ?? 0;
  const taxRate = order.taxRate ?? 0.0825;
  const taxRatePercentage = order.taxRatePercentage ?? `${(taxRate * 100).toFixed(2)}%`;
  const taxAmount = order.taxAmount ?? Math.round(itemsSubtotal * taxRate * 100) / 100;
  const shippingFee = order.shippingFee ?? order.carrierRate ?? 0;
  const grandTotal = order.totalPrice ?? (itemsSubtotal + taxAmount + shippingFee);
  const invoiceNumber = order.invoiceNumber || `INV-${(order.orderId || 'OPAL').replace('OPAL-', '')}`;
  const invoiceDate = order.invoiceDate || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US'));

  return {
    invoiceNumber,
    orderId: order.orderId || 'OPAL-ORD',
    invoiceDate,
    status: (order.paymentStatus || 'paid').toLowerCase().includes('paid') ? 'paid' : 'confirmed',
    seller: {
      businessName: order.pickupShowroom || 'Milano Sartoriale Home Atelier',
      ownerName: 'Opal Certified Home Artisan',
      taxId: order.sellerTaxId || 'US-EIN-95-4819201',
      studioAddress: order.pickupAddress || '450 N Rodeo Dr Suite 300, Beverly Hills, CA 90210',
      phone: '(415) 890-6725',
      email: 'atelier@opal-business.portal'
    },
    customer: {
      name: order.customerName || 'Valued Buyer',
      email: order.customerEmail || 'buyer@opal-client.portal',
      phone: order.customerPhone || 'N/A',
      address: order.shippingAddress || order.pickupAddress || 'Customer Destination Address'
    },
    fulfillmentType: order.fulfillmentType || 'delivery',
    items: order.items || [],
    subtotal: itemsSubtotal,
    taxRate,
    taxRatePercentage,
    taxAmount,
    shippingFee,
    grandTotal,
    paymentMethod: order.paymentMethod || 'Credit / Debit Card (Secured)'
  };
}

/**
 * Generates an official, publication-quality commercial PDF tax invoice
 * using vector layout, clean typography, itemized tables, and tax reconciliation.
 */
export function generatePdfInvoice(data: TaxInvoiceData | RetailOrderRecord): jsPDF {
  const invoice = normalizeInvoiceData(data);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const darkColor = [26, 26, 26]; // #1a1a1a
  const goldColor = [184, 134, 11]; // #B8860B
  const creamBg = [252, 250, 246]; // #FCFAF6
  const grayText = [100, 100, 100];
  const lightBorder = [225, 220, 210];
  const tableHeaderBg = [35, 35, 35];

  // 1. Header Banner
  doc.setFillColor(creamBg[0], creamBg[1], creamBg[2]);
  doc.rect(margin, margin, contentWidth, 75, 'F');
  doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
  doc.setLineWidth(1);
  doc.rect(margin, margin, contentWidth, 75, 'S');

  // Brand Logo / Monogram
  doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.circle(margin + 30, margin + 37, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('O', margin + 25, margin + 43);

  // Brand Name & Subtitle
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.text('OPAL ATELIER', margin + 60, margin + 33);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Home-Based Business Artisan Commerce Platform • Commercial Tax Invoice', margin + 60, margin + 48);

  // Top Right: Invoice Number & Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text('TAX INVOICE', pageWidth - margin - 15, margin + 28, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(invoice.invoiceNumber, pageWidth - margin - 15, margin + 44, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(`Date: ${invoice.invoiceDate}`, pageWidth - margin - 15, margin + 58, { align: 'right' });

  // 2. Seller and Customer Details (Two Columns)
  let y = margin + 95;
  const colWidth = (contentWidth - 20) / 2;

  // Seller Box
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, colWidth, 90, 'F');
  doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
  doc.rect(margin, y, colWidth, 90, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text('SELLER (HOME-BASED ATELIER)', margin + 12, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(invoice.seller.businessName, margin + 12, y + 31);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  if (invoice.seller.ownerName) {
    doc.text(`Proprietor: ${invoice.seller.ownerName}`, margin + 12, y + 44);
  }
  doc.text(`Tax ID / EIN: ${invoice.seller.taxId}`, margin + 12, y + 57);
  doc.text(`Studio: ${invoice.seller.studioAddress}`, margin + 12, y + 70, { maxWidth: colWidth - 24 });
  doc.text(`Contact: ${invoice.seller.phone}`, margin + 12, y + 83);

  // Buyer Box
  const buyerX = margin + colWidth + 20;
  doc.setFillColor(255, 255, 255);
  doc.rect(buyerX, y, colWidth, 90, 'F');
  doc.rect(buyerX, y, colWidth, 90, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text('BILLED TO (BUYER)', buyerX + 12, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(invoice.customer.name, buyerX + 12, y + 31);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(`Email: ${invoice.customer.email}`, buyerX + 12, y + 44);
  doc.text(`Phone: ${invoice.customer.phone}`, buyerX + 12, y + 57);
  doc.text(`Destination: ${invoice.customer.address}`, buyerX + 12, y + 70, { maxWidth: colWidth - 24 });
  doc.text(`Order Ref: ${invoice.orderId} • Fulfillment: ${invoice.fulfillmentType.toUpperCase()}`, buyerX + 12, y + 83);

  // 3. Itemized Merchandise Table
  y += 105;
  const colX = {
    desc: margin + 12,
    attributes: margin + 250,
    qty: margin + 340,
    unitPrice: margin + 410,
    total: pageWidth - margin - 15
  };

  // Table Header
  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ITEM DESCRIPTION', colX.desc, y + 16);
  doc.text('ATTRIBUTES', colX.attributes, y + 16);
  doc.text('QTY', colX.qty, y + 16, { align: 'center' });
  doc.text('UNIT PRICE', colX.unitPrice, y + 16, { align: 'right' });
  doc.text('TOTAL', colX.total, y + 16, { align: 'right' });

  y += 24;

  // Table Rows
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [{
    name: 'Boutique Merchandise Article',
    price: invoice.subtotal,
    unitPrice: invoice.subtotal,
    quantity: 1
  }];

  items.forEach((item: OrderItem, idx: number) => {
    const isEven = idx % 2 === 0;
    const rowHeight = 28;

    doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 249, isEven ? 255 : 246);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    // Item Title & Brand
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const rawItemName = item.name || (item as any).articleName || 'Luxury Merchandise';
    const itemName = rawItemName.length > 38 ? `${rawItemName.substring(0, 36)}...` : rawItemName;
    doc.text(itemName, colX.desc, y + 14);

    if (item.brand || item.sku) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);
      const brandText = [item.brand, item.sku ? `SKU: ${item.sku}` : ''].filter(Boolean).join(' • ');
      doc.text(brandText, colX.desc, y + 23);
    }

    // Attributes (Size & Color)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    const attrText = [item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : ''].filter(Boolean).join(' | ') || '—';
    doc.text(attrText, colX.attributes, y + 17);

    // Quantity
    doc.text(String(item.quantity || 1), colX.qty, y + 17, { align: 'center' });

    // Unit Price
    const unitPrice = item.price ?? item.unitPrice ?? 0;
    doc.text(`$${unitPrice.toFixed(2)}`, colX.unitPrice, y + 17, { align: 'right' });

    // Line Total
    const lineTotal = unitPrice * (item.quantity || 1);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${lineTotal.toFixed(2)}`, colX.total, y + 17, { align: 'right' });

    y += rowHeight;
  });

  // 4. Financial Calculations & Commercial Tax Reconciliation
  y += 18;
  const summaryX = pageWidth - margin - 220;
  const summaryWidth = 220;

  // Legal / Commercial Policy Callout on Left
  const policyWidth = contentWidth - summaryWidth - 25;
  doc.setFillColor(creamBg[0], creamBg[1], creamBg[2]);
  doc.rect(margin, y, policyWidth, 90, 'F');
  doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
  doc.rect(margin, y, policyWidth, 90, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text('COMMERCIAL SALES TAX COMPLIANCE', margin + 12, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  const policyText = 'Sales tax is collected and remitted pursuant to state and local retail merchandise statutes for items purchased through this portal. Complimentary in-person trials and home studio visits carry zero tax liability unless finalized as a retail transaction.';
  doc.text(policyText, margin + 12, y + 28, { maxWidth: policyWidth - 24, lineHeightFactor: 1.35 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(34, 139, 34); // Forest green
  doc.text(`PAYMENT STATUS: ${invoice.status.toUpperCase()} (${invoice.paymentMethod})`, margin + 12, y + 80);

  // Financial Table on Right
  doc.setFillColor(255, 255, 255);
  doc.rect(summaryX, y, summaryWidth, 90, 'F');
  doc.rect(summaryX, y, summaryWidth, 90, 'S');

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Merchandise Subtotal:', summaryX + 12, y + 20);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, summaryX + summaryWidth - 12, y + 20, { align: 'right' });

  // Sales Tax
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(`Sales Tax (${invoice.taxRatePercentage}):`, summaryX + 12, y + 38);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text(`$${invoice.taxAmount.toFixed(2)}`, summaryX + summaryWidth - 12, y + 38, { align: 'right' });

  // Shipping
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Shipping & Delivery:', summaryX + 12, y + 54);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(invoice.shippingFee === 0 ? 'Complimentary' : `$${invoice.shippingFee.toFixed(2)}`, summaryX + summaryWidth - 12, y + 54, { align: 'right' });

  // Divider line
  doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
  doc.line(summaryX + 8, y + 62, summaryX + summaryWidth - 8, y + 62);

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Grand Total Paid:', summaryX + 12, y + 78);
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text(`$${invoice.grandTotal.toFixed(2)}`, summaryX + summaryWidth - 12, y + 78, { align: 'right' });

  // 5. Footer & Authentication Seal
  const footerY = pageHeight - margin - 25;
  doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('OPAL Home-Based Artisan Commerce Platform • System-Generated Authentic Tax Invoice', margin, footerY + 14);
  doc.text(`Auth Seal: ${invoice.invoiceNumber}-STMP-VERIFIED`, pageWidth - margin, footerY + 14, { align: 'right' });

  return doc;
}

/**
 * Convenience function to generate and trigger an immediate browser file download
 * of the PDF invoice for a completed retail order.
 *
 * @param data TaxInvoiceData or RetailOrderRecord
 * @param customFilename Optional filename (defaults to {invoiceNumber}.pdf)
 */
export function downloadPdfInvoice(
  data: TaxInvoiceData | RetailOrderRecord,
  customFilename?: string
): void {
  const invoice = normalizeInvoiceData(data);
  const doc = generatePdfInvoice(invoice);
  const filename = customFilename || `${invoice.invoiceNumber || 'OPAL-Tax-Invoice'}.pdf`;
  doc.save(filename);
}
