const { expect, test } = require('@playwright/test');

const iconifyRequest = /^https:\/\/(?:api\.iconify\.design|api\.simplesvg\.com|api\.unisvg\.com)\/e2e\.json\?icons=/;

function captureUnexpectedBrowserErrors(page) {
  const errors = [];

  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') {
      errors.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', error => {
    errors.push(`pageerror: ${error.message}`);
  });

  return errors;
}

test('renders a remote icon and reuses the in-memory cache after remount', async ({
  page
}) => {
  const browserErrors = captureUnexpectedBrowserErrors(page);
  let requestCount = 0;

  await page.route(iconifyRequest, async route => {
    requestCount += 1;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        prefix: 'e2e',
        icons: {
          web: {
            body: '<path fill="currentColor" d="M0 0h20v10H0z" />',
            width: 20,
            height: 10
          }
        }
      })
    });
  });

  await page.goto('/?fixture=success');

  const icon = page.getByTestId('remote-icon');
  const svg = icon.locator('svg');
  await expect(svg).toBeVisible();
  await expect(svg).toHaveAttribute('viewBox', '0 0 20 10');
  await expect(svg).toHaveAttribute('width', '40');
  await expect(svg).toHaveAttribute('height', '40');
  await expect(svg.locator('path')).toHaveCSS('fill', 'rgb(18, 52, 86)');
  await expect(page.getByTestId('load-count')).toHaveText('1');
  await expect(page.getByTestId('error-message')).toHaveText('');
  expect(requestCount).toBe(1);

  await page.getByTestId('remount-icon').click();

  await expect(page.getByTestId('load-count')).toHaveText('2');
  await expect(page.getByTestId('remote-icon').locator('svg')).toBeVisible();
  expect(requestCount).toBe(1);
  expect(browserErrors).toEqual([]);
});

test('renders the fallback and reports an Iconify API error without crashing', async ({
  page
}) => {
  const browserErrors = captureUnexpectedBrowserErrors(page);

  await page.route(iconifyRequest, async route => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        prefix: 'e2e',
        icons: {}
      })
    });
  });

  await page.goto('/?fixture=error');

  await expect(page.getByTestId('icon-fallback')).toBeVisible();
  await expect(page.getByTestId('error-message')).toHaveText(
    'Icon "missing" not found in prefix "e2e"'
  );
  expect(browserErrors).toEqual([]);
});
