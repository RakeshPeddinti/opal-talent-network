import React from 'react';
import { TaxInvoiceData } from '../types';
import { downloadPdfInvoice } from '../utils/pdfInvoiceGenerator';

interface TaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: TaxInvoiceData | null;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceData,
}) => {
  if (!isOpen || !invoiceData) return null;

  const handleDownloadPdf = () => {
    downloadPdfInvoice(invoiceData);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const lines = [
      '==============================================================',
      '               OPAL ATELIER - OFFICIAL TAX INVOICE            ',
      '      Home-Based Business Portal for Handcrafted & Designer Goods',
      '==============================================================',
      `Invoice Number:     ${invoiceData.invoiceNumber}`,
      `Order Reference:    ${invoiceData.orderId}`,
      `Invoice Date:       ${invoiceData.invoiceDate}`,
      `Payment Status:     ${invoiceData.status.toUpperCase()}`,
      `Payment Method:     ${invoiceData.paymentMethod}`,
      '--------------------------------------------------------------',
      'SELLER DETAILS (Home-Based Business Atelier):',
      `  Business Name:    ${invoiceData.seller.businessName}`,
      `  Owner / Artisan:  ${invoiceData.seller.ownerName || 'Opal Registered Home Artisan'}`,
      `  Tax / EIN Number: ${invoiceData.seller.taxId}`,
      `  Studio Address:   ${invoiceData.seller.studioAddress}`,
      `  Phone / Contact:  ${invoiceData.seller.phone} | ${invoiceData.seller.email}`,
      '--------------------------------------------------------------',
      'BUYER DETAILS:',
      `  Customer Name:    ${invoiceData.customer.name}`,
      `  Email Address:    ${invoiceData.customer.email}`,
      `  Phone Number:     ${invoiceData.customer.phone}`,
      `  Delivery Address: ${invoiceData.customer.address}`,
      `  Fulfillment:      ${invoiceData.fulfillmentType.toUpperCase()}`,
      '--------------------------------------------------------------',
      'ITEMIZED PURCHASED ARTICLES:',
      ...invoiceData.items.map((item, idx) => {
        const unit = item.price || item.unitPrice || 0;
        const lineTot = unit * (item.quantity || 1);
        const details = [
          item.size ? `Size: ${item.size}` : '',
          item.color ? `Color: ${item.color}` : '',
          item.sku ? `SKU: ${item.sku}` : '',
        ].filter(Boolean).join(' | ');
        return `  ${idx + 1}. ${item.name} x${item.quantity} @ $${unit.toFixed(2)} = $${lineTot.toFixed(2)}${details ? ` (${details})` : ''}`;
      }),
      '--------------------------------------------------------------',
      `Subtotal:           $${invoiceData.subtotal.toFixed(2)}`,
      `Sales Tax (${invoiceData.taxRatePercentage || `${(invoiceData.taxRate * 100).toFixed(2)}%`}): $${invoiceData.taxAmount.toFixed(2)}`,
      `Shipping / Delivery:$${invoiceData.shippingFee.toFixed(2)}`,
      `GRAND TOTAL:        $${invoiceData.grandTotal.toFixed(2)}`,
      '==============================================================',
      'COMMERCIAL TAX NOTE:',
      '  Sales tax and commercial invoicing apply exclusively to purchasers',
      '  completing item sales through this portal. Home and studio visits',
      '  are non-taxable complimentary consultations.',
      '==============================================================',
      'Thank you for supporting independent home-based business owners!',
    ];

    const element = document.createElement('a');
    const file = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${invoiceData.invoiceNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div
        className="relative w-full max-w-3xl bg-neutral-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none print:bg-white print:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Actions (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 print:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 font-serif font-bold text-sm border border-amber-500/20">
              Tx
            </span>
            <div>
              <h2 id="invoice-modal-title" className="text-sm font-semibold text-neutral-100">
                Official Commercial Tax Invoice
              </h2>
              <p className="text-xs text-neutral-400">
                Valid retail sales tax documentation for buyer order
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Download official PDF invoice file"
            >
              <span>📄</span> Download PDF
            </button>
            <button
              onClick={handleDownloadTxt}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 border border-neutral-700"
              title="Download text copy of invoice"
            >
              <span>📥</span> Download (.txt)
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 border border-neutral-700"
              title="Print or Browser PDF"
            >
              <span>🖨️</span> Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors ml-1"
              aria-label="Close invoice"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 md:p-8 space-y-6 text-neutral-200 print:text-black print:p-0">
          {/* Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 print:border-neutral-300 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-serif font-bold tracking-tight text-amber-400 print:text-neutral-900">
                  OPAL
                </span>
                <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium print:border-neutral-300 print:text-neutral-700">
                  Commercial Tax Invoice
                </span>
              </div>
              <p className="text-xs text-neutral-400 print:text-neutral-600 mt-1">
                Home-Based Business Artisan Portal & Real-Time Atelier
              </p>
            </div>

            <div className="text-left md:text-right">
              <div className="text-xs font-mono text-neutral-400 print:text-neutral-600">INVOICE NUMBER</div>
              <div className="text-base font-mono font-bold text-amber-300 print:text-neutral-900">
                {invoiceData.invoiceNumber}
              </div>
              <div className="text-xs text-neutral-400 print:text-neutral-600 mt-1">
                Date: {invoiceData.invoiceDate}
              </div>
              <div className="text-xs text-neutral-400 print:text-neutral-600">
                Order Ref: <span className="font-mono">{invoiceData.orderId}</span>
              </div>
            </div>
          </div>

          {/* Seller & Customer Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-neutral-950/50 border border-neutral-800/80 print:bg-neutral-50 print:border-neutral-200">
            {/* Seller Info */}
            <div className="space-y-1 text-xs">
              <div className="text-[11px] font-semibold tracking-wider uppercase text-amber-400 print:text-neutral-800">
                Seller (Home-Based Business Owner)
              </div>
              <div className="font-semibold text-neutral-100 print:text-neutral-900 text-sm">
                {invoiceData.seller.businessName}
              </div>
              {invoiceData.seller.ownerName && (
                <div className="text-neutral-300 print:text-neutral-700">
                  Proprietor: {invoiceData.seller.ownerName}
                </div>
              )}
              <div className="text-neutral-300 print:text-neutral-700 flex items-center gap-1">
                <span className="font-medium text-amber-300/90 print:text-neutral-800">Tax ID / EIN:</span>
                <span className="font-mono">{invoiceData.seller.taxId}</span>
              </div>
              <div className="text-neutral-400 print:text-neutral-600">
                Studio: {invoiceData.seller.studioAddress}
              </div>
              <div className="text-neutral-400 print:text-neutral-600">
                {invoiceData.seller.phone} • {invoiceData.seller.email}
              </div>
            </div>

            {/* Buyer Info */}
            <div className="space-y-1 text-xs">
              <div className="text-[11px] font-semibold tracking-wider uppercase text-amber-400 print:text-neutral-800">
                Billed To (Buyer)
              </div>
              <div className="font-semibold text-neutral-100 print:text-neutral-900 text-sm">
                {invoiceData.customer.name}
              </div>
              <div className="text-neutral-300 print:text-neutral-700">
                {invoiceData.customer.email}
              </div>
              <div className="text-neutral-300 print:text-neutral-700">
                {invoiceData.customer.phone}
              </div>
              <div className="text-neutral-400 print:text-neutral-600">
                Destination: {invoiceData.customer.address}
              </div>
              <div className="text-neutral-400 print:text-neutral-600">
                Fulfillment: <span className="capitalize font-medium text-neutral-200 print:text-neutral-800">{invoiceData.fulfillmentType}</span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 print:text-neutral-700 mb-2">
              Purchased Articles & Goods
            </div>
            <div className="overflow-x-auto rounded-xl border border-neutral-800 print:border-neutral-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-800/60 print:bg-neutral-200 text-neutral-300 print:text-neutral-800 font-semibold border-b border-neutral-700 print:border-neutral-300">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Attributes</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 print:divide-neutral-200">
                  {invoiceData.items.map((item, idx) => {
                    const unit = item.price || item.unitPrice || 0;
                    const lineTot = unit * (item.quantity || 1);
                    return (
                      <tr key={idx} className="hover:bg-neutral-800/30 print:hover:bg-transparent">
                        <td className="py-3 px-3">
                          <div className="font-medium text-neutral-100 print:text-neutral-900">
                            {item.name}
                          </div>
                          {item.brand && (
                            <div className="text-[11px] text-amber-400/80 print:text-neutral-600">
                              {item.brand}
                            </div>
                          )}
                          {item.sku && (
                            <div className="text-[10px] font-mono text-neutral-500 print:text-neutral-600">
                              SKU: {item.sku}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-neutral-400 print:text-neutral-700">
                          {item.size && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-800 print:bg-neutral-100 text-[10px] mr-1">
                              {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-800 print:bg-neutral-100 text-[10px]">
                              {item.color}
                            </span>
                          )}
                          {!item.size && !item.color && '—'}
                        </td>
                        <td className="py-3 px-3 text-center text-neutral-200 print:text-neutral-900 font-mono">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right text-neutral-300 print:text-neutral-800 font-mono">
                          ${unit.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-neutral-100 print:text-neutral-900 font-semibold font-mono">
                          ${lineTot.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Calculation & Tax Breakdown */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 pt-2">
            {/* Tax & Business Compliance Disclaimer */}
            <div className="max-w-md p-3 rounded-lg bg-neutral-950/40 border border-neutral-800/70 text-[11px] text-neutral-400 print:border-neutral-300 print:bg-neutral-50 print:text-neutral-600">
              <div className="font-semibold text-neutral-300 print:text-neutral-800 mb-1 flex items-center gap-1.5">
                <span>⚖️</span>
                <span>Commercial Tax Policy for Home Businesses</span>
              </div>
              <p>
                Sales tax is collected and remitted pursuant to applicable state & local retail merchandise statutes. 
                Complimentary home trials and boutique studio visits carry zero tax liability unless finalized as a retail purchase.
              </p>
              <div className="mt-2 text-[10px] text-neutral-500 print:text-neutral-600">
                Payment status: <span className="font-bold text-emerald-400 print:text-emerald-700 uppercase">{invoiceData.status}</span> ({invoiceData.paymentMethod})
              </div>
            </div>

            {/* Calculations Table */}
            <div className="w-full md:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400 print:text-neutral-600">
                <span>Merchandise Subtotal:</span>
                <span className="font-mono text-neutral-200 print:text-neutral-800">
                  ${invoiceData.subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-neutral-300 print:text-neutral-700">
                <span className="flex items-center gap-1">
                  <span>Sales Tax ({invoiceData.taxRatePercentage || `${(invoiceData.taxRate * 100).toFixed(2)}%`}):</span>
                </span>
                <span className="font-mono font-medium text-amber-400 print:text-neutral-900">
                  ${invoiceData.taxAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-neutral-400 print:text-neutral-600">
                <span>Shipping & Delivery:</span>
                <span className="font-mono text-neutral-200 print:text-neutral-800">
                  {invoiceData.shippingFee === 0 ? 'Complimentary' : `$${invoiceData.shippingFee.toFixed(2)}`}
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-700 print:border-neutral-400 flex justify-between text-sm font-bold text-neutral-100 print:text-neutral-900">
                <span>Grand Total Paid:</span>
                <span className="font-mono text-amber-400 print:text-neutral-900">
                  ${invoiceData.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signature & Seal */}
          <div className="pt-4 border-t border-neutral-800/80 print:border-neutral-300 flex flex-col md:flex-row justify-between items-center text-[11px] text-neutral-500 print:text-neutral-600 gap-2">
            <div>
              OPAL Home-Business Artisan Commerce Platform • System-Generated Authentic Tax Invoice
            </div>
            <div className="font-mono text-[10px]">
              Authentication Ref: {invoiceData.invoiceNumber}-STMP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
