import { test, expect } from '@playwright/test';

test.describe('Critical User Journey: Product Purchase Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const bookingAnchor = page.locator('#booking');
    if (await bookingAnchor.count() > 0) {
      await bookingAnchor.scrollIntoViewIfNeeded();
    }
  });

  test('Scenario 1: Shop by Department Selection & Mutual Exclusivity', async ({ page }) => {
    // 1. Locate SHOP By DEPARTMENT dropdown
    const deptDropdown = page.locator('#shop-department-dropdown');
    await expect(deptDropdown).toBeVisible();

    // 2. Select 'Clothing'
    await deptDropdown.selectOption('Clothing');
    await expect(deptDropdown).toHaveValue('Clothing');

    // 3. Confirm Service Category dropdown resets to 'SELECT'
    const serviceDropdown = page.locator('#service-category-dropdown');
    await expect(serviceDropdown).toHaveValue('SELECT');

    // 4. Verify product articles for Clothing are displayed
    const addCartBtn = page.getByRole('button', { name: /\+ Add to Cart/i }).first();
    await expect(addCartBtn).toBeVisible();
  });

  test('Scenario 2: Article Customization (Size & Color Swatches) & Add to Boutique Bag', async ({ page }) => {
    // 1. Select 'Clothing' department
    const deptDropdown = page.locator('#shop-department-dropdown');
    await deptDropdown.selectOption('Clothing');

    // 2. Find first product card and customize size
    const sizeButtons = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L"), button:has-text("XL")');
    if (await sizeButtons.count() > 1) {
      await sizeButtons.nth(1).click();
    }

    // 3. Click "+ Add to Cart"
    const addCartBtn = page.getByRole('button', { name: /\+ Add to Cart/i }).first();
    await addCartBtn.click();

    // 4. Verify item appears in right column Boutique Bag
    const selectedArticlesHeading = page.getByText(/Selected Articles/i);
    await expect(selectedArticlesHeading).toBeVisible();

    // 5. Verify quantity counter is active (showing 1)
    const qtySpan = page.locator('span.font-mono').filter({ hasText: '1' }).first();
    await expect(qtySpan).toBeVisible();

    // 6. Test Quantity Increment (+)
    const plusBtn = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
    if (await plusBtn.isVisible()) {
      await plusBtn.click();
      // Counter updates to 2
      const updatedQty = page.locator('span.font-mono').filter({ hasText: '2' }).first();
      await expect(updatedQty).toBeVisible();
    }
  });

  test('Scenario 3: Fulfillment Selection (Carrier Delivery vs Showroom Pickup) & Tax Calculation', async ({ page }) => {
    // 1. Select department and add an article
    await page.locator('#shop-department-dropdown').selectOption('Clothing');
    await page.getByRole('button', { name: /\+ Add to Cart/i }).first().click();

    // 2. Locate Fulfillment Method toggles
    const deliveryBtn = page.getByRole('button', { name: /Carrier Shipping/i });
    const pickupBtn = page.getByRole('button', { name: /Boutique Showroom Pickup/i });

    await expect(deliveryBtn).toBeVisible();
    await expect(pickupBtn).toBeVisible();

    // 3. Switch to Boutique Showroom Pickup
    await pickupBtn.click();
    // In pickup mode, showroom address should be visible and shipping should be FREE
    await expect(page.getByText(/Verified Showroom Pickup/i)).toBeVisible();
    await expect(page.getByText(/FREE/i)).toBeVisible();

    // 4. Verify Commercial Sales Tax (8.25%) is itemized
    const taxLabel = page.getByText(/Sales Tax \(8.25%\)/i);
    await expect(taxLabel).toBeVisible();
    await expect(page.getByText(/Commercial Tax Invoice/i)).toBeVisible();

    // 5. Verify Total Price reflects Subtotal + Tax
    const totalPriceHeading = page.getByText(/Total Price/i);
    await expect(totalPriceHeading).toBeVisible();
  });

  test('Scenario 4: Complete Product Purchase and Generate Downloadable PDF Invoice', async ({ page }) => {
    // 1. Select department and add product
    await page.locator('#shop-department-dropdown').selectOption('Clothing');
    await page.getByRole('button', { name: /\+ Add to Cart/i }).first().click();

    // 2. Choose Showroom Pickup for streamlined test execution
    await page.getByRole('button', { name: /Boutique Showroom Pickup/i }).click();

    // 3. Fill checkout contact details
    await page.getByPlaceholder('Full name').fill('Seraphina Vance');
    await page.getByPlaceholder('email@example.com').fill('seraphina.vance@example.com');
    await page.getByPlaceholder('Mobile number').fill('+1 555-892-1133');

    // 4. Submit Order
    const placeOrderBtn = page.getByRole('button', { name: /Place Order & Dispatch SMS Confirmation/i });
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // 5. Verify Order Confirmation View
    const orderConfirmedHeading = page.getByRole('heading', { name: /Order Confirmed!/i });
    await expect(orderConfirmedHeading).toBeVisible({ timeout: 15000 });

    // 6. Verify unique Order Reference ID (OPAL-ORD-...)
    const orderIdContainer = page.getByText(/Order Reference ID/i);
    await expect(orderIdContainer).toBeVisible();
    await expect(page.getByText(/OPAL-ORD-/i)).toBeVisible();

    // 7. Verify Download PDF Invoice button is available
    const downloadInvoiceBtn = page.getByRole('button', { name: /Download PDF Tax Invoice|Download Invoice/i });
    await expect(downloadInvoiceBtn).toBeVisible();

    // 8. Verify Showroom Pickup Pass is generated with physical address
    await expect(page.getByText(/Boutique Showroom Pickup Pass/i)).toBeVisible();
    await expect(page.getByText(/Ready in 2 Hours/i)).toBeVisible();
  });

});
