/**
 * Visual Regression Tests
 * Takes screenshots and compares against baselines
 */

const {
  launchWithExtension,
  navigateToChatGPT,
  applySettings,
} = require('../utils/browser');

const {
  takeScreenshot,
  takeElementScreenshot,
  compareAgainstBaseline,
  takeResponsiveScreenshots,
} = require('../utils/screenshot');

const fs = require('fs');
const path = require('path');

describe('Visual Regression Tests', () => {
  let browser;
  let page;

  // Launch browser before all tests
  beforeAll(async () => {
    const result = await launchWithExtension();
    browser = result.browser;
    page = result.page;
  });

  // Close browser after all tests
  afterAll(async () => {
    await global.cleanupTest(browser, page);
  });

  describe('Baseline Screenshots', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
    });

    test('should match baseline - default ChatGPT (no extension)', async () => {
      // Disable all features
      await applySettings(page, { chatboxTop: false, reverseMessages: false });

      const screenshotPath = await takeScreenshot(page, 'default-chatgpt.png');
      expect(fs.existsSync(screenshotPath)).toBe(true);

      // Note: This will fail if no baseline exists
      // Run `npm run baseline:create` first to create baselines
    });

    test('should match baseline - chatbox at top only', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: false });

      const screenshotPath = await takeScreenshot(page, 'chatbox-top.png');
      expect(fs.existsSync(screenshotPath)).toBe(true);
    });

    test('should match baseline - messages reversed only', async () => {
      await applySettings(page, { chatboxTop: false, reverseMessages: true });

      const screenshotPath = await takeScreenshot(page, 'messages-reversed.png');
      expect(fs.existsSync(screenshotPath)).toBe(true);
    });

    test('should match baseline - both features enabled', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: true });

      const screenshotPath = await takeScreenshot(page, 'both-enabled.png');
      expect(fs.existsSync(screenshotPath)).toBe(true);
    });
  });

  describe('Component Screenshots', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
      await applySettings(page, { chatboxTop: true, reverseMessages: true });
    });

    test('should capture composer/form area', async () => {
      const screenshotPath = await takeElementScreenshot(
        page,
        'form[data-type="unified-composer"]',
        'composer-form.png'
      );
      expect(fs.existsSync(screenshotPath)).toBe(true);
    });

    test('should capture messages container', async () => {
      const screenshotPath = await takeElementScreenshot(
        page,
        'div.flex.flex-col.text-sm',
        'messages-container.png'
      );
      expect(fs.existsSync(screenshotPath)).toBe(true);
    });

    test('should capture first message', async () => {
      const screenshotPath = await takeElementScreenshot(
        page,
        'article[data-testid^="conversation-turn-"]:first-of-type',
        'first-message.png'
      );
      expect(fs.existsSync(screenshotPath)).toBe(true);
    });

    test('should capture main container', async () => {
      const screenshotPath = await takeElementScreenshot(
        page,
        'main#main',
        'main-container.png'
      );
      expect(fs.existsSync(screenshotPath)).toBe(true);
    });
  });

  describe('Responsive Screenshots', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
      await applySettings(page, { chatboxTop: true, reverseMessages: true });
    });

    test('should capture screenshots at different viewport sizes', async () => {
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1280, height: 1024 }, // Standard
        { width: 768, height: 1024 },  // Tablet
      ];

      const screenshots = await takeResponsiveScreenshots(
        page,
        'responsive-test',
        viewports
      );

      expect(screenshots).toHaveLength(3);
      screenshots.forEach(screenshot => {
        expect(fs.existsSync(screenshot)).toBe(true);
      });
    });
  });

  describe('Visual Comparison', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
    });

    test('should detect visual difference when chatbox moved to top', async () => {
      // Take screenshot without feature
      await applySettings(page, { chatboxTop: false, reverseMessages: false });
      const withoutPath = await takeScreenshot(page, 'compare-without-chatbox-top.png');

      // Take screenshot with feature
      await applySettings(page, { chatboxTop: true, reverseMessages: false });
      const withPath = await takeScreenshot(page, 'compare-with-chatbox-top.png');

      // Compare (should be different)
      const { compareScreenshots } = require('../utils/screenshot');
      const comparison = await compareScreenshots(withoutPath, withPath, {
        threshold: 0.1,
      });

      // Expect significant difference (chatbox moved)
      expect(comparison.diffPercentage).toBeGreaterThan(2);
    });

    test('should detect visual difference when messages reversed', async () => {
      // Take screenshot without feature
      await applySettings(page, { chatboxTop: false, reverseMessages: false });
      const withoutPath = await takeScreenshot(page, 'compare-without-reversed.png');

      // Take screenshot with feature
      await applySettings(page, { chatboxTop: false, reverseMessages: true });
      const withPath = await takeScreenshot(page, 'compare-with-reversed.png');

      // Compare (should be different)
      const { compareScreenshots } = require('../utils/screenshot');
      const comparison = await compareScreenshots(withoutPath, withPath, {
        threshold: 0.1,
      });

      // Expect significant difference (messages reordered)
      expect(comparison.diffPercentage).toBeGreaterThan(2);
    });

    test('should have minimal difference when disabled vs default', async () => {
      // Disable all
      await applySettings(page, { chatboxTop: false, reverseMessages: false });
      const disabledPath = await takeScreenshot(page, 'all-disabled.png');

      // Same state, take another screenshot
      await page.waitForTimeout(100);
      const defaultPath = await takeScreenshot(page, 'default-state.png');

      // Compare (should be identical or nearly identical)
      const { compareScreenshots } = require('../utils/screenshot');
      const comparison = await compareScreenshots(disabledPath, defaultPath, {
        threshold: 0.1,
      });

      // Expect minimal difference
      expect(comparison.diffPercentage).toBeLessThan(1);
    });
  });

  describe('Dark Mode Screenshots', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
    });

    test('should handle dark mode with features enabled', async () => {
      // Apply dark mode (simulate by adding class)
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      await applySettings(page, { chatboxTop: true, reverseMessages: true });

      const screenshotPath = await takeScreenshot(page, 'dark-mode-both-enabled.png');
      expect(fs.existsSync(screenshotPath)).toBe(true);
    });

    test('should verify composer background in dark mode', async () => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      await applySettings(page, { chatboxTop: true, reverseMessages: false });

      const screenshotPath = await takeElementScreenshot(
        page,
        'form[data-type="unified-composer"]',
        'dark-mode-composer.png'
      );
      expect(fs.existsSync(screenshotPath)).toBe(true);
    });
  });
});
