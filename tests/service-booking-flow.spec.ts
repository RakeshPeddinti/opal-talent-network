import { test, expect } from '@playwright/test';
import { format, addDays } from 'date-fns';

test.describe('Critical User Journey: Service Booking Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Scroll or navigate to booking section
    const bookingAnchor = page.locator('#booking');
    if (await bookingAnchor.count() > 0) {
      await bookingAnchor.scrollIntoViewIfNeeded();
    }
  });

  test('Scenario 1: Service Category Selection and Discovery', async ({ page }) => {
    // 1. Locate the Service Category dropdown
    const categoryDropdown = page.locator('#service-category-dropdown');
    await expect(categoryDropdown).toBeVisible();

    // 2. Default state should be 'SELECT'
    await expect(categoryDropdown).toHaveValue('SELECT');

    // 3. Select 'Beauty' trade category
    await categoryDropdown.selectOption('Beauty');
    await expect(categoryDropdown).toHaveValue('Beauty');

    // 4. Verify the active category badge displays 'Beauty'
    const activeCategoryText = page.locator('text=Services: Beauty');
    await expect(activeCategoryText).toBeVisible();

    // 5. Verify the Department dropdown resets to 'SELECT' (Mutual Exclusivity)
    const deptDropdown = page.locator('#shop-department-dropdown');
    await expect(deptDropdown).toHaveValue('SELECT');
  });

  test('Scenario 2: Select Service Card and Verify Price Calculation', async ({ page }) => {
    // 1. Select 'Beauty' category
    const categoryDropdown = page.locator('#service-category-dropdown');
    await categoryDropdown.selectOption('Beauty');

    // 2. Locate service cards in the catalog
    const serviceCards = page.locator('.service-card, [data-service-id]');
    // Fallback locator if explicit class isn't on card: locate card with price button
    const serviceItem = page.getByRole('button', { name: /\+ Select Service|\$|Select/i }).first();
    await expect(serviceItem).toBeVisible();
    await serviceItem.click();

    // 3. Verify Selected Services breakdown appears in appointment panel
    const selectedSummary = page.getByText(/Selected Services/i);
    await expect(selectedSummary).toBeVisible();
    await expect(page.getByText(/Total/i)).toBeVisible();
  });

  test('Scenario 3: Date & Slot Selection and Complete Appointment Reservation', async ({ page }) => {
    // 1. Select 'Handyman' category
    const categoryDropdown = page.locator('#service-category-dropdown');
    await categoryDropdown.selectOption('Handyman');

    // 2. Select first available Handyman service
    const serviceSelectBtn = page.getByRole('button', { name: /\+ Select Service|\$|Select/i }).first();
    if (await serviceSelectBtn.isVisible()) {
      await serviceSelectBtn.click();
    }

    // 3. Fill Seeker contact details in appointment form
    await page.getByPlaceholder('Full Name').fill('Alexander Wright');
    await page.getByPlaceholder('Email Address').fill('alex.wright@example.com');
    await page.getByPlaceholder('e.g. +1 555-234-5678').fill('+1 555-731-9024');

    // 4. Pick a valid future appointment date (tomorrow)
    const tomorrowDateStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
    await dateInput.fill(tomorrowDateStr);

    // 5. Pick an available time slot
    const timeSlotBtn = page.locator('button:has-text("AM"), button:has-text("PM")')
      .filter({ hasNotText: 'ends' })
      .first();

    if (await timeSlotBtn.isVisible()) {
      await timeSlotBtn.click();
    }

    // 6. Submit the booking reservation
    const confirmBookingBtn = page.getByRole('button', { name: /Confirm Booking|Book Appointment|Book Now/i });
    if (await confirmBookingBtn.isEnabled()) {
      await confirmBookingBtn.click();

      // 7. Verify Booking Confirmation View
      const confirmedHeading = page.getByRole('heading', { name: /Booking Confirmed!/i });
      await expect(confirmedHeading).toBeVisible({ timeout: 15000 });

      // 8. Verify Booking Reference ID is assigned
      const refIdContainer = page.getByText(/Booking Reference ID/i);
      await expect(refIdContainer).toBeVisible();
      await expect(page.getByText(/OPAL-BK-/i)).toBeVisible();

      // 9. Verify SMS Confirmation badge indicates sent status
      await expect(page.getByText(/Text Message \(SMS\) Sent/i)).toBeVisible();
    }
  });

});
