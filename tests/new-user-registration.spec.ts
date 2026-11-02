import { test, expect } from '@playwright/test';
import { generateUniqueEmail, TEST_PERSONAS } from './fixtures/test-data';

test.describe('Critical User Journey: New User Registration', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each scenario
    await page.goto('/');
    await expect(page).toHaveTitle(/Opal Portal/i);
  });

  test('Scenario 1: Open Login/Registration Modal and toggle between Login & Register modes', async ({ page }) => {
    // 1. Locate and click Login in the top navigation bar
    const loginNavBtn = page.getByRole('button', { name: /login/i });
    await expect(loginNavBtn).toBeVisible();
    await loginNavBtn.click();

    // 2. Verify modal opens with Welcome Back header
    const modalHeader = page.getByRole('heading', { level: 3 });
    await expect(modalHeader).toHaveText(/Welcome Back/i);

    // 3. Switch to Register mode
    const switchToRegisterBtn = page.getByRole('button', { name: /Don't have an account\? Register/i });
    await expect(switchToRegisterBtn).toBeVisible();
    await switchToRegisterBtn.click();

    // 4. Modal header should now display Create Account
    await expect(modalHeader).toHaveText(/Create Account/i);
    await expect(page.getByRole('button', { name: /Register Now/i })).toBeVisible();
  });

  test('Scenario 2: Register as a New Service Seeker (Client)', async ({ page }) => {
    const uniqueEmail = generateUniqueEmail('seeker');
    
    // Open modal & toggle to register
    await page.getByRole('button', { name: /login/i }).click();
    await page.getByRole('button', { name: /Don't have an account\? Register/i }).click();

    // Ensure Seeker role tab is active
    const seekerRoleTab = page.getByRole('button', { name: 'Seeker', exact: true });
    await seekerRoleTab.click();

    // Fill client registration fields
    await page.getByPlaceholder('your@email.com').fill(uniqueEmail);
    await page.getByPlaceholder('John Doe').fill(TEST_PERSONAS.seeker.name);
    await page.getByPlaceholder('+1 234 567 890').fill(TEST_PERSONAS.seeker.phone);

    // Verify Provider / Seller specific inputs are not present
    await expect(page.getByPlaceholder('e.g. Apex Handyman Solutions, Luxury Glow Studio')).not.toBeVisible();
    await expect(page.getByPlaceholder('e.g. Milano Sartoriale, Apex Artisan Wear')).not.toBeVisible();

    // Submit registration
    const registerBtn = page.getByRole('button', { name: /Register Now/i });
    await expect(registerBtn).toBeEnabled();
    await registerBtn.click();

    // Verify modal closes and seeker view / badge is initialized
    await expect(page.getByRole('heading', { level: 3, name: /Create Account/i })).not.toBeVisible({ timeout: 10000 });
  });

  test('Scenario 3: Register as a New Service Provider with verified business identity', async ({ page }) => {
    const uniqueEmail = generateUniqueEmail('provider');

    // Open modal & toggle to register
    await page.getByRole('button', { name: /login/i }).click();
    await page.getByRole('button', { name: /Don't have an account\? Register/i }).click();

    // Select Provider role tab
    const providerRoleTab = page.getByRole('button', { name: 'Provider', exact: true });
    await providerRoleTab.click();

    // Fill common credentials
    await page.getByPlaceholder('your@email.com').fill(uniqueEmail);
    await page.getByPlaceholder('John Doe').fill(TEST_PERSONAS.provider.name);

    // Fill provider-specific fields
    const bizNameInput = page.getByPlaceholder('e.g. Apex Handyman Solutions, Luxury Glow Studio');
    await expect(bizNameInput).toBeVisible();
    await bizNameInput.fill(TEST_PERSONAS.provider.businessName!);

    // Fill contact number
    await page.getByPlaceholder('+1 234 567 890').fill(TEST_PERSONAS.provider.phone);

    // Submit registration
    const registerBtn = page.getByRole('button', { name: /Register Now/i });
    await registerBtn.click();

    // Verify modal closes
    await expect(page.getByRole('heading', { level: 3, name: /Create Account/i })).not.toBeVisible({ timeout: 10000 });
  });

  test('Scenario 4: Register as a Product Seller with company name and showroom address', async ({ page }) => {
    const uniqueEmail = generateUniqueEmail('seller');

    // Open modal & toggle to register
    await page.getByRole('button', { name: /login/i }).click();
    await page.getByRole('button', { name: /Don't have an account\? Register/i }).click();

    // Select Product Seller role tab
    const sellerRoleTab = page.getByRole('button', { name: 'Product Seller', exact: true });
    await sellerRoleTab.click();

    // Fill credentials
    await page.getByPlaceholder('your@email.com').fill(uniqueEmail);
    await page.getByPlaceholder('John Doe').fill(TEST_PERSONAS.seller.name);

    // Fill seller-specific brand name and showroom pickup address
    const companyNameInput = page.getByPlaceholder('e.g. Milano Sartoriale, Apex Artisan Wear');
    await expect(companyNameInput).toBeVisible();
    await companyNameInput.fill(TEST_PERSONAS.seller.companyName!);

    const addressInput = page.getByPlaceholder('e.g. 450 N Rodeo Dr, Beverly Hills, CA 90210');
    await expect(addressInput).toBeVisible();
    await addressInput.fill(TEST_PERSONAS.seller.showroomAddress!);

    // Fill phone number
    await page.getByPlaceholder('+1 234 567 890').fill(TEST_PERSONAS.seller.phone);

    // Submit registration
    const registerBtn = page.getByRole('button', { name: /Register Now/i });
    await registerBtn.click();

    // Verify modal closes
    await expect(page.getByRole('heading', { level: 3, name: /Create Account/i })).not.toBeVisible({ timeout: 10000 });
  });

});
