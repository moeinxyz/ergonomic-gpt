/**
 * Browser Utilities
 * Helper functions for launching browsers with extension loaded
 */

const puppeteer = require('puppeteer');
const { chromium } = require('playwright');
const path = require('path');

/**
 * Launch Puppeteer with extension loaded
 * @param {Object} options - Launch options
 * @returns {Promise<{browser: Browser, page: Page}>}
 */
async function launchWithExtension(options = {}) {
  const extensionPath = options.extensionPath || global.TEST_CONFIG.EXTENSION_PATH;
  const headless = options.headless !== undefined ? options.headless : global.TEST_CONFIG.HEADLESS;

  // Chrome arguments for extension loading
  const args = [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--disable-web-security', // Allow loading local files
  ];

  // Use bundled Chromium (never open user's actual browser!)
  // In Docker or CI, use Chrome from environment variable
  const executablePath = process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH;

  const browser = await puppeteer.launch({
    headless: headless ? 'new' : false,
    executablePath,
    args,
    defaultViewport: {
      width: 1280,
      height: 1024,
    },
  });

  // Get the extension page or create a new one
  const pages = await browser.pages();
  const page = pages[0] || await browser.newPage();

  // Persistent storage in Node.js context (survives page reloads)
  const persistentStorage = {
    sync: {},
    local: {}
  };

  // Expose storage functions to browser context
  await page.exposeFunction('__getStorage', async (area) => {
    return persistentStorage[area] || {};
  });

  await page.exposeFunction('__setStorage', async (area, items) => {
    persistentStorage[area] = persistentStorage[area] || {};
    Object.assign(persistentStorage[area], items);
    return true;
  });

  await page.exposeFunction('__clearStorage', async (area) => {
    persistentStorage[area] = {};
    return true;
  });

  await page.exposeFunction('__removeStorage', async (area, keys) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => {
      delete persistentStorage[area]?.[key];
    });
    return true;
  });

  // Helper function to inject chrome.storage mock
  const injectChromeStorageMock = () => {
    // Create storage mock
    const storage = {
      sync: {
        get: function(keys, callback) {
          window.__getStorage('sync').then(allData => {
            const result = {};
            if (typeof keys === 'string') {
              result[keys] = allData[keys];
            } else if (Array.isArray(keys)) {
              keys.forEach(key => {
                result[key] = allData[key];
              });
            } else if (keys === null || keys === undefined) {
              Object.assign(result, allData);
            } else if (typeof keys === 'object') {
              Object.keys(keys).forEach(key => {
                result[key] = allData[key] ?? keys[key];
              });
            }
            if (callback) callback(result);
          });
          return Promise.resolve();
        },
        set: function(items, callback) {
          window.__setStorage('sync', items).then(() => {
            if (callback) callback();

            // Trigger storage change listeners
            if (window.__storageListeners) {
              window.__storageListeners.forEach(listener => {
                listener({ ...items }, 'sync');
              });
            }
          });
          return Promise.resolve();
        },
        clear: function(callback) {
          window.__clearStorage('sync').then(() => {
            if (callback) callback();
          });
          return Promise.resolve();
        },
        remove: function(keys, callback) {
          window.__removeStorage('sync', keys).then(() => {
            if (callback) callback();
          });
          return Promise.resolve();
        }
      },
      local: {
        get: function(keys, callback) {
          window.__getStorage('local').then(allData => {
            const result = {};
            if (typeof keys === 'string') {
              result[keys] = allData[keys];
            } else if (Array.isArray(keys)) {
              keys.forEach(key => {
                result[key] = allData[key];
              });
            } else if (keys === null || keys === undefined) {
              Object.assign(result, allData);
            } else if (typeof keys === 'object') {
              Object.keys(keys).forEach(key => {
                result[key] = allData[key] ?? keys[key];
              });
            }
            if (callback) callback(result);
          });
          return Promise.resolve();
        },
        set: function(items, callback) {
          window.__setStorage('local', items).then(() => {
            if (callback) callback();
          });
          return Promise.resolve();
        },
        clear: function(callback) {
          window.__clearStorage('local').then(() => {
            if (callback) callback();
          });
          return Promise.resolve();
        },
        remove: function(keys, callback) {
          window.__removeStorage('local', keys).then(() => {
            if (callback) callback();
          });
          return Promise.resolve();
        }
      },
      onChanged: {
        addListener: function(callback) {
          window.__storageListeners = window.__storageListeners || [];
          window.__storageListeners.push(callback);
        },
        removeListener: function(callback) {
          window.__storageListeners = window.__storageListeners || [];
          const index = window.__storageListeners.indexOf(callback);
          if (index > -1) {
            window.__storageListeners.splice(index, 1);
          }
        }
      }
    };

    // Initialize chrome object if it doesn't exist
    if (!window.chrome) {
      window.chrome = {};
    }

    window.chrome.storage = storage;
    window.__storageListeners = window.__storageListeners || [];
  };

  // Content script simulation - applies settings when storage changes
  const injectContentScript = () => {
    const DEFAULT_SETTINGS = {
      chatboxTop: true,
      reverseMessages: true,
    };

    function applySettings(settings) {
      const html = document.documentElement;

      if (settings.chatboxTop) {
        html.classList.add('ergonomic-chatbox-top');
      } else {
        html.classList.remove('ergonomic-chatbox-top');
      }

      if (settings.reverseMessages) {
        html.classList.add('ergonomic-reverse-messages');
      } else {
        html.classList.remove('ergonomic-reverse-messages');
      }
    }

    // Wait for storage functions to be ready, then apply settings
    function waitForStorageAndApply() {
      if (window.chrome && window.chrome.storage && typeof window.__getStorage === 'function') {
        // Storage is ready, apply settings
        window.chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
          applySettings(items);
        });

        // Listen for storage changes
        window.chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName !== 'sync') return;
          window.chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
            applySettings(items);
          });
        });
      } else {
        // Storage not ready yet, retry after a short delay
        setTimeout(waitForStorageAndApply, 10);
      }
    }

    // Start waiting for storage
    waitForStorageAndApply();
  };

  // Read CSS content to inject on every page load
  const fs = require('fs');
  const cssPath = path.join(extensionPath, 'styles', 'chatgpt.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Mock chrome.storage API for testing - inject on new document
  await page.evaluateOnNewDocument(injectChromeStorageMock);

  // Inject content script simulation on every new document
  await page.evaluateOnNewDocument(injectContentScript);

  // Inject CSS on every document load - wait for DOM to be ready
  await page.evaluateOnNewDocument((css) => {
    function injectCSS() {
      // Check if already injected
      if (document.getElementById('ergonomic-gpt-test-styles')) return;

      // Wait for head to exist
      if (!document.head) {
        setTimeout(injectCSS, 10);
        return;
      }

      const style = document.createElement('style');
      style.id = 'ergonomic-gpt-test-styles';
      style.textContent = css;
      document.head.appendChild(style);
    }

    // Start injection immediately or wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectCSS);
    } else {
      injectCSS();
    }
  }, cssContent);

  // Also inject immediately for the current page
  await page.evaluate(injectChromeStorageMock);
  await page.evaluate(injectContentScript);

  return { browser, page };
}

/**
 * Launch Playwright browser with extension (Chromium only)
 * @param {Object} options - Launch options
 * @returns {Promise<{browser: Browser, context: BrowserContext, page: Page}>}
 */
async function launchPlaywrightWithExtension(options = {}) {
  const extensionPath = options.extensionPath || global.TEST_CONFIG.EXTENSION_PATH;
  const headless = options.headless !== undefined ? options.headless : global.TEST_CONFIG.HEADLESS;

  const context = await chromium.launchPersistentContext('', {
    headless: headless,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
    ],
    viewport: {
      width: 1280,
      height: 1024,
    },
  });

  const page = context.pages()[0] || await context.newPage();

  return {
    browser: context.browser(),
    context,
    page
  };
}

/**
 * Navigate to ChatGPT and wait for it to load
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} url - URL to navigate to (defaults to local test file)
 * @returns {Promise<void>}
 */
async function navigateToChatGPT(page, url) {
  // Use local HTML file for testing
  const targetUrl = url || `file://${global.TEST_CONFIG.CHATGPT_EXAMPLE_PATH}`;

  await page.goto(targetUrl, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // Wait for main element to be visible
  await page.waitForSelector('main', { timeout: 15000 });

  // Small wait for styles and scripts to apply
  // Note: CSS, chrome.storage mock, and content script are auto-injected via evaluateOnNewDocument
  await page.waitForTimeout(1000);
}

/**
 * Check if extension is loaded and active
 * @param {Page} page - Puppeteer/Playwright page
 * @returns {Promise<boolean>}
 */
async function isExtensionActive(page) {
  return await page.evaluate(() => {
    return document.documentElement.classList.contains('ergonomic-chatbox-top') ||
           document.documentElement.classList.contains('ergonomic-reverse-messages');
  });
}

/**
 * Get extension settings applied on page
 * @param {Page} page - Puppeteer/Playwright page
 * @returns {Promise<{chatboxTop: boolean, reverseMessages: boolean}>}
 */
async function getAppliedSettings(page) {
  return await page.evaluate(() => {
    return {
      chatboxTop: document.documentElement.classList.contains('ergonomic-chatbox-top'),
      reverseMessages: document.documentElement.classList.contains('ergonomic-reverse-messages'),
    };
  });
}

/**
 * Manually apply settings (for testing without storage)
 * @param {Page} page - Puppeteer/Playwright page
 * @param {Object} settings - Settings to apply
 * @returns {Promise<void>}
 */
async function applySettings(page, settings) {
  await page.evaluate((settings) => {
    const html = document.documentElement;

    if (settings.chatboxTop) {
      html.classList.add('ergonomic-chatbox-top');
    } else {
      html.classList.remove('ergonomic-chatbox-top');
    }

    if (settings.reverseMessages) {
      html.classList.add('ergonomic-reverse-messages');
    } else {
      html.classList.remove('ergonomic-reverse-messages');
    }
  }, settings);

  // Wait for styles to apply
  await page.waitForTimeout(500);
}

/**
 * Scroll page to specific position
 * @param {Page} page - Puppeteer/Playwright page
 * @param {number} y - Y position to scroll to
 * @returns {Promise<void>}
 */
async function scrollTo(page, y) {
  await page.evaluate((y) => {
    window.scrollTo(0, y);
  }, y);
  await page.waitForTimeout(300);
}

/**
 * Get scroll position
 * @param {Page} page - Puppeteer/Playwright page
 * @returns {Promise<{x: number, y: number}>}
 */
async function getScrollPosition(page) {
  return await page.evaluate(() => {
    return {
      x: window.scrollX,
      y: window.scrollY,
    };
  });
}

module.exports = {
  launchWithExtension,
  launchPlaywrightWithExtension,
  navigateToChatGPT,
  isExtensionActive,
  getAppliedSettings,
  applySettings,
  scrollTo,
  getScrollPosition,
};
