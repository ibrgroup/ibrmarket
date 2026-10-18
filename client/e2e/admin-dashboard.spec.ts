import { test, expect } from '@playwright/test';

/**
 * Smoke: admin document route responds without 5xx.
 * With auth + ADMIN role, table loads; without — redirect or shell still 200.
 */
test.describe('Admin dashboard', () => {
  test('orders list route returns OK document', async ({ page }) => {
    const response = await page.goto('/dashboard/orders');
    expect(response?.status()).toBeDefined();
    expect(response!.status()).toBeLessThan(500);
  });

  test('dashboard overview returns OK document', async ({ page }) => {
    const response = await page.goto('/dashboard');
    expect(response?.status()).toBeDefined();
    expect(response!.status()).toBeLessThan(500);
  });

  test('catalog route returns OK document', async ({ page }) => {
    const response = await page.goto('/dashboard/catalog');
    expect(response?.status()).toBeDefined();
    expect(response!.status()).toBeLessThan(500);
  });

  test('audit log route returns OK document', async ({ page }) => {
    const response = await page.goto('/dashboard/audit');
    expect(response?.status()).toBeDefined();
    expect(response!.status()).toBeLessThan(500);
  });
});
