/**
 * Jest Setup File
 * Configures test environment and global utilities
 */

const { toMatchImageSnapshot } = require('jest-image-snapshot');
const fs = require('fs');
const path = require('path');

// Add custom matchers
expect.extend({ toMatchImageSnapshot });

// Create necessary directories
const dirs = [
  path.join(__dirname, 'screenshots'),
  path.join(__dirname, 'visual/baseline'),
  path.join(__dirname, 'visual/__diff_output__'),
  path.join(__dirname, 'coverage'),
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Global test configuration
global.TEST_CONFIG = {
  HEADLESS: process.env.HEADLESS !== 'false',
  TIMEOUT: parseInt(process.env.TEST_TIMEOUT || '30000'),
  SCREENSHOT_DIR: path.join(__dirname, 'screenshots'),
  BASELINE_DIR: path.join(__dirname, 'visual/baseline'),
  EXTENSION_PATH: path.resolve(__dirname, '..'),
  CHATGPT_EXAMPLE_PATH: path.resolve(__dirname, '../Examples/ChatGPTExample.html'),
};

// Custom error messages
global.testLog = (message) => {
  console.log(`[TEST] ${message}`);
};

// Cleanup function for tests
global.cleanupTest = async (browser, page) => {
  try {
    if (page && !page.isClosed()) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  } catch (error) {
    console.error('[CLEANUP ERROR]', error);
  }
};

// Global beforeAll - runs once before all tests
beforeAll(() => {
  console.log('🚀 Starting ErgonomicGPT Test Suite');
  console.log('Extension Path:', global.TEST_CONFIG.EXTENSION_PATH);
  console.log('Headless Mode:', global.TEST_CONFIG.HEADLESS);
});

// Global afterAll - runs once after all tests
afterAll(() => {
  console.log('✅ Test Suite Complete');
});
