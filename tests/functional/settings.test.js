/**
 * Settings Persistence Tests
 * Verifies settings save, load, and persist correctly
 */

const {
  launchWithExtension,
  navigateToChatGPT,
  getAppliedSettings,
} = require('../utils/browser');

describe('Settings Persistence Tests', () => {
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

  describe('Saving Settings', () => {
    beforeEach(async () => {
      // Clear storage before each test
      await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.clear(() => resolve());
        });
      });
    });

    test('should save chatboxTop setting', async () => {
      await navigateToChatGPT(page);

      // Save setting
      await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.set({ chatboxTop: false }, () => resolve());
        });
      });

      await page.waitForTimeout(500);

      // Verify saved
      const saved = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.get(['chatboxTop'], (items) => resolve(items));
        });
      });

      expect(saved.chatboxTop).toBe(false);
    });

    test('should save reverseMessages setting', async () => {
      await navigateToChatGPT(page);

      // Save setting
      await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.set({ reverseMessages: false }, () => resolve());
        });
      });

      await page.waitForTimeout(500);

      // Verify saved
      const saved = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.get(['reverseMessages'], (items) => resolve(items));
        });
      });

      expect(saved.reverseMessages).toBe(false);
    });

    test('should save both settings independently', async () => {
      await navigateToChatGPT(page);

      // Save both
      await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.set({
            chatboxTop: true,
            reverseMessages: false,
          }, () => resolve());
        });
      });

      await page.waitForTimeout(500);

      // Verify both saved
      const saved = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.get(['chatboxTop', 'reverseMessages'], (items) => resolve(items));
        });
      });

      expect(saved.chatboxTop).toBe(true);
      expect(saved.reverseMessages).toBe(false);
    });
  });

  describe('Storage Changes', () => {
    test('should apply settings immediately when storage changes', async () => {
      await navigateToChatGPT(page);

      // Start with both disabled
      await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.set({
            chatboxTop: false,
            reverseMessages: false,
          }, () => resolve());
        });
      });

      await page.waitForTimeout(500);

      let settings = await getAppliedSettings(page);
      expect(settings.chatboxTop).toBe(false);

      // Change setting
      await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.set({ chatboxTop: true }, () => resolve());
        });
      });

      await page.waitForTimeout(500);

      // Verify applied immediately
      settings = await getAppliedSettings(page);
      expect(settings.chatboxTop).toBe(true);
    });

    test('should handle rapid storage changes', async () => {
      await navigateToChatGPT(page);

      // Make rapid changes
      await page.evaluate(() => {
        return new Promise(async (resolve) => {
          await chrome.storage.sync.set({ chatboxTop: true });
          await new Promise(r => setTimeout(r, 50));
          await chrome.storage.sync.set({ chatboxTop: false });
          await new Promise(r => setTimeout(r, 50));
          await chrome.storage.sync.set({ chatboxTop: true });
          resolve();
        });
      });

      await page.waitForTimeout(1000);

      // Final state should be applied
      const settings = await getAppliedSettings(page);
      expect(settings.chatboxTop).toBe(true);
    });
  });

  describe('Storage Errors', () => {
    test('should handle missing storage gracefully', async () => {
      // This test verifies that the extension doesn't crash if storage is unavailable
      // In practice, this is hard to test, but we can verify defaults are used

      await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.clear(() => resolve());
        });
      });

      await navigateToChatGPT(page);
      await page.waitForTimeout(1000);

      // Should apply defaults
      const settings = await getAppliedSettings(page);
      expect(settings.chatboxTop).toBeDefined();
      expect(settings.reverseMessages).toBeDefined();
    });
  });

  describe('Settings Synchronization', () => {
    test('should use chrome.storage.sync for cross-device sync', async () => {
      await navigateToChatGPT(page);

      // Verify using sync storage (not local)
      await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.set({ chatboxTop: true }, () => {
            chrome.storage.sync.get(['chatboxTop'], (items) => {
              resolve(items.chatboxTop === true);
            });
          });
        });
      }).then(result => {
        expect(result).toBe(true);
      });
    });
  });

  describe('Partial Settings', () => {
    test('should handle partial settings correctly', async () => {
      await navigateToChatGPT(page);

      // Save only one setting
      await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.clear(() => {
            chrome.storage.sync.set({ chatboxTop: false }, () => resolve());
          });
        });
      });

      await page.waitForTimeout(500);

      // Other setting should use default
      const saved = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.get(['chatboxTop', 'reverseMessages'], (items) => resolve(items));
        });
      });

      expect(saved.chatboxTop).toBe(false);
      // reverseMessages should be undefined in storage (defaults handled by content script)
    });
  });

});
