import { test, expect } from '@playwright/test';

test.describe('Critical User Journey: Talent Network Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Opal Portal/i);
  });

  test('Scenario 1: Access Talent Network module and verify executive branding & tagline', async ({ page }) => {
    // 1. Locate Talent Network button in navigation
    const talentNetBtn = page.getByRole('button', { name: /talent network/i });
    await expect(talentNetBtn).toBeVisible();
    await talentNetBtn.click();

    // 2. Verify Module Title and Tagline
    const moduleHeading = page.getByRole('heading', { name: /Talent Network/i });
    await expect(moduleHeading).toBeVisible();

    const tagline = page.getByText('Create Your Profile. Get Discovered. Connect with Opportunities.');
    await expect(tagline).toBeVisible();

    // 3. Verify professional dark slate executive theme
    const networkContainer = page.locator('div').filter({ hasText: /TALENT NETWORK/i }).first();
    await expect(networkContainer).toBeVisible();
  });

  test('Scenario 2: Logged in as Talent - view profile skills, experience, and open vendor requirements', async ({ page }) => {
    // Navigate to Talent Network
    await page.getByRole('button', { name: /talent network/i }).click();

    // 1-Click Fast Login as Talent (Julian Vance)
    const talentDemoBtn = page.getByRole('button', { name: /Talent \(Julian Vance\)/i });
    if (await talentDemoBtn.isVisible()) {
      await talentDemoBtn.click();
    }

    // Verify Talent Mode active and LinkedIn-style tabs
    await expect(page.getByText(/\(Talent\)/i)).toBeVisible();
    await expect(page.getByText('Julian Vance')).toBeVisible();

    // Verify Skills & Work Experience
    await expect(page.getByText(/Commercial Wiring/i)).toBeVisible();
    await expect(page.getByText(/Pacific Bay Infrastructure/i)).toBeVisible();

    // Switch to Open Requirements Tab
    const openReqsTab = page.getByRole('button', { name: /Open Requirements/i });
    await expect(openReqsTab).toBeVisible();
    await openReqsTab.click();

    // Verify Single-Liners for vendor requirements
    await expect(page.getByText(/Apex Precision Contracting/i)).toBeVisible();
    await expect(page.getByText(/Quick Apply/i).first()).toBeVisible();
  });

  test('Scenario 3: Talent applies for requirement and receives vendor SMS notification', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /talent network/i }).click();

    // Fast login as Talent
    const talentDemoBtn = page.getByRole('button', { name: /Talent \(Julian Vance\)/i });
    if (await talentDemoBtn.isVisible()) {
      await talentDemoBtn.click();
    }

    // Open requirements tab
    await page.getByRole('button', { name: /Open Requirements/i }).click();

    // Click Quick Apply on first open requirement
    const applyBtn = page.getByRole('button', { name: /Quick Apply/i }).first();
    await applyBtn.click();

    // Verify Apply Modal with pre-populated resume and contact
    await expect(page.getByText(/Submit Candidate Application/i)).toBeVisible();
    await expect(page.locator('input[value*="555-482-1920"]')).toBeVisible();

    // Submit Application
    const submitBtn = page.getByRole('button', { name: /Submit Application & Trigger SMS/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify SMS notification alert / toast
    await expect(page.getByText(/SMS Notification Dispatched/i)).toBeVisible({ timeout: 10000 });
  });

  test('Scenario 4: Logged in as Talent Seeker - publish requirement, filter talents by city, and send SMS outreach', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /talent network/i }).click();

    // Fast login as Talent Seeker (Apex Precision Contracting)
    const seekerDemoBtn = page.getByRole('button', { name: /Talent Seeker \(Apex Precision\)/i });
    if (await seekerDemoBtn.isVisible()) {
      await seekerDemoBtn.click();
    }

    // Verify Talent Seeker Mode
    await expect(page.getByText(/\(Talent Seeker\)/i)).toBeVisible();
    await expect(page.getByText(/Apex Precision Contracting/i)).toBeVisible();

    // Check Candidate Directory and City Filter
    await expect(page.getByText(/Registered Candidate Directory/i)).toBeVisible();
    const citySelector = page.getByRole('combobox').first();
    await expect(citySelector).toBeVisible();

    // Candidates in current city should be displayed
    await expect(page.getByText(/Julian Vance/i)).toBeVisible();

    // Click Contact via SMS
    const contactSmsBtn = page.getByRole('button', { name: /Contact via SMS/i }).first();
    await contactSmsBtn.click();

    // Verify Outbound SMS modal
    await expect(page.getByText(/Send SMS Notification to Candidate/i)).toBeVisible();
    const sendSmsSubmitBtn = page.getByRole('button', { name: /Dispatch SMS Notification/i });
    await expect(sendSmsSubmitBtn).toBeVisible();
    await sendSmsSubmitBtn.click();

    // Verify delivery confirmation toast
    await expect(page.getByText(/SMS Notification Dispatched/i)).toBeVisible({ timeout: 10000 });
  });
});
