const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const { loadIcon } = require('../../lib/api/loader.js');

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('loads bi:globe when the Iconify response omits dimensions', async () => {
  const body = '<path d="M0 0h16v16H0z" />';

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        prefix: 'bi',
        icons: {
          globe: { body }
        }
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }
    );

  const icon = await loadIcon('bi:globe');

  assert.deepEqual(icon, {
    name: 'bi:globe',
    body,
    width: 16,
    height: 16
  });
});
