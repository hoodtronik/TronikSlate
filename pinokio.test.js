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
    assert.deepStrictEqual(result, [{
      default: true,
      icon: "fa-solid fa-plug",
      text: "Installing",
      href: "install.js",
    }]);
  });

  await t.test('should show Install when not installed and nothing running', async () => {
    const info = {
      exists: () => false,
      running: () => false,
      local: () => null
    };
    const result = await pinokio.menu(kernel, info);
    assert.deepStrictEqual(result, [{
      default: true,
      icon: "fa-solid fa-plug",
      text: "Install",
      href: "install.js",
    }]);
  });

  await t.test('should show Start, Install, Reset when installed and idle', async () => {
    const info = {
      exists: (path) => path === 'app/node_modules',
      running: () => false,
      local: () => null
    };
    const result = await pinokio.menu(kernel, info);
    assert.deepStrictEqual(result, [{
      default: true,
      icon: "fa-solid fa-power-off",
      text: "Start",
      href: "start.js",
    }, {
      icon: "fa-solid fa-plug",
      text: "Install",
      href: "install.js",
    }, {
      icon: "fa-regular fa-circle-xmark",
      text: "<div><strong>Reset</strong><div>Revert to pre-install state</div></div>",
      href: "reset.js",
      confirm: "Are you sure you wish to reset the app?"
    }]);
  });

  await t.test('should show Open Web UI and Terminal when start.js is running with local url', async () => {
    const info = {
      exists: (path) => path === 'app/node_modules',
      running: (file) => file === 'start.js',
      local: (file) => file === 'start.js' ? { url: 'http://localhost:3000' } : null
    };
    const result = await pinokio.menu(kernel, info);
    assert.deepStrictEqual(result, [{
      default: true,
      icon: "fa-solid fa-rocket",
      text: "Open Web UI",
      href: 'http://localhost:3000',
    }, {
      icon: 'fa-solid fa-terminal',
      text: "Terminal",
      href: "start.js",
    }]);
  });

  await t.test('should show Terminal only when start.js is running without local url', async () => {
    const info = {
      exists: (path) => path === 'app/node_modules',
      running: (file) => file === 'start.js',
      local: () => null
    };
    const result = await pinokio.menu(kernel, info);
    assert.deepStrictEqual(result, [{
      default: true,
      icon: 'fa-solid fa-terminal',
      text: "Terminal",
      href: "start.js",
    }]);
  });

  await t.test('should show Updating when update.js is running', async () => {
    const info = {
      exists: (path) => path === 'app/node_modules',
      running: (file) => file === 'update.js',
      local: () => null
    };
    const result = await pinokio.menu(kernel, info);
    assert.deepStrictEqual(result, [{
      default: true,
      icon: 'fa-solid fa-terminal',
      text: "Updating",
      href: "update.js",
    }]);
  });

  await t.test('should show Resetting when reset.js is running', async () => {
    const info = {
      exists: (path) => path === 'app/node_modules',
      running: (file) => file === 'reset.js',
      local: () => null
    };
    const result = await pinokio.menu(kernel, info);
    assert.deepStrictEqual(result, [{
      default: true,
      icon: 'fa-solid fa-terminal',
      text: "Resetting",
      href: "reset.js",
    }]);
  });
});
