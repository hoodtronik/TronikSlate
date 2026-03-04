const test = require('node:test');
const assert = require('node:assert');
const pinokio = require('./pinokio.js');

test('pinokio menu logic', async (t) => {
  const kernel = {};

  await t.test('should show Installing when install.js is running', async () => {
    const info = {
      exists: () => false,
      running: (file) => file === 'install.js',
      local: () => null
    };
    const result = await pinokio.menu(kernel, info);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].text, 'Installing');
    assert.strictEqual(result[0].href, 'install.js');
  });

  await t.test('should show Install when not installed and nothing running', async () => {
    const info = {
      exists: () => false,
      running: () => false,
      local: () => null
    };
    const result = await pinokio.menu(kernel, info);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].text, 'Install');
    assert.strictEqual(result[0].href, 'install.js');
  });

  await t.test('should show Start, Install, Reset when installed and idle', async () => {
    const info = {
      exists: (path) => path === 'app/node_modules',
      running: () => false,
      local: () => null
    };
    const result = await pinokio.menu(kernel, info);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].text, 'Start');
    assert.strictEqual(result[1].text, 'Install');
    assert.ok(result[2].text.includes('Reset'));
  });

  await t.test('should show Open Web UI and Terminal when start.js is running with local url', async () => {
    const info = {
      exists: (path) => path === 'app/node_modules',
      running: (file) => file === 'start.js',
      local: (file) => file === 'start.js' ? { url: 'http://localhost:3000' } : null
    };
    const result = await pinokio.menu(kernel, info);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].text, 'Open Web UI');
    assert.strictEqual(result[0].href, 'http://localhost:3000');
    assert.strictEqual(result[1].text, 'Terminal');
    assert.strictEqual(result[1].href, 'start.js');
  });

  await t.test('should show Terminal only when start.js is running without local url', async () => {
    const info = {
      exists: (path) => path === 'app/node_modules',
      running: (file) => file === 'start.js',
      local: () => null
    };
    const result = await pinokio.menu(kernel, info);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].text, 'Terminal');
    assert.strictEqual(result[0].href, 'start.js');
  });

  await t.test('should show Updating when update.js is running', async () => {
    const info = {
      exists: (path) => path === 'app/node_modules',
      running: (file) => file === 'update.js',
      local: () => null
    };
    const result = await pinokio.menu(kernel, info);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].text, 'Updating');
    assert.strictEqual(result[0].href, 'update.js');
  });

  await t.test('should show Resetting when reset.js is running', async () => {
    const info = {
      exists: (path) => path === 'app/node_modules',
      running: (file) => file === 'reset.js',
      local: () => null
    };
    const result = await pinokio.menu(kernel, info);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].text, 'Resetting');
    assert.strictEqual(result[0].href, 'reset.js');
  });
});
