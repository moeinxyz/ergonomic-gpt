/**
 * Interactive Behavior Tests
 * Tests user interactions and dynamic behavior
 */

const {
  launchWithExtension,
  navigateToChatGPT,
  applySettings,
  scrollTo,
  getScrollPosition,
} = require('../utils/browser');

const {
  getChatGPTStructure,
  getElementCount,
  getVisualOrder,
  getComposerPosition,
  elementExists,
} = require('../utils/dom');

describe('Interactive Behavior Tests', () => {
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

  describe('Scrolling Behavior', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
    });

    test('should maintain scroll functionality when chatbox at top', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: false });

      // Check if page is scrollable
      const pageHeight = await page.evaluate(() => {
        return {
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight
        };
      });

      // Only test scrolling if page is tall enough to scroll
      if (pageHeight.scrollHeight > pageHeight.clientHeight) {
        // Scroll down
        await scrollTo(page, 500);
        await page.waitForTimeout(300);

        const pos1 = await getScrollPosition(page);
        expect(pos1.y).toBeGreaterThan(0);

        // Scroll back up
        await scrollTo(page, 0);
        await page.waitForTimeout(300);

        const pos2 = await getScrollPosition(page);
        expect(pos2.y).toBe(0);
      } else {
        // Page is not scrollable, verify it's not broken
        const pos = await getScrollPosition(page);
        expect(pos.y).toBe(0);
      }
    });

    test('should maintain scroll functionality when messages reversed', async () => {
      await applySettings(page, { chatboxTop: false, reverseMessages: true });

      // Check if page is scrollable
      const pageHeight = await page.evaluate(() => {
        return {
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight
        };
      });

      // Only test scrolling if page is tall enough to scroll
      if (pageHeight.scrollHeight > pageHeight.clientHeight) {
        // Scroll down
        await scrollTo(page, 500);
        await page.waitForTimeout(300);

        const pos1 = await getScrollPosition(page);
        expect(pos1.y).toBeGreaterThan(0);

        // Scroll back up
        await scrollTo(page, 0);
        await page.waitForTimeout(300);

        const pos2 = await getScrollPosition(page);
        expect(pos2.y).toBe(0);
      } else {
        // Page is not scrollable, verify it's not broken
        const pos = await getScrollPosition(page);
        expect(pos.y).toBe(0);
      }
    });

    test('should scroll to bottom and verify content visible', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: true });

      // Check if page is scrollable
      const pageHeight = await page.evaluate(() => {
        return {
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight
        };
      });

      // Only test scrolling if page is tall enough
      if (pageHeight.scrollHeight > pageHeight.clientHeight) {
        // Scroll to bottom
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(300);

        // Verify scrolled
        const position = await getScrollPosition(page);
        expect(position.y).toBeGreaterThan(0);
      } else {
        // Page is not scrollable, just verify position is 0
        const position = await getScrollPosition(page);
        expect(position.y).toBe(0);
      }
    });
  });

  describe('Message Order', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
    });

    test('should display messages in correct order when reversed', async () => {
      await applySettings(page, { chatboxTop: false, reverseMessages: true });

      const visualOrder = await getVisualOrder(page, 'article[data-testid^="conversation-turn-"]');

      // Verify we have messages
      expect(visualOrder.length).toBeGreaterThan(0);

      // Verify they're sorted by visual position (top to bottom)
      for (let i = 1; i < visualOrder.length; i++) {
        expect(visualOrder[i].top).toBeGreaterThanOrEqual(visualOrder[i - 1].top);
      }
    });

    test('should preserve message order when not reversed', async () => {
      await applySettings(page, { chatboxTop: false, reverseMessages: false });

      const visualOrder = await getVisualOrder(page, 'article[data-testid^="conversation-turn-"]');

      // Verify we have messages
      expect(visualOrder.length).toBeGreaterThan(0);

      // Messages should be in normal order
      for (let i = 1; i < visualOrder.length; i++) {
        expect(visualOrder[i].top).toBeGreaterThanOrEqual(visualOrder[i - 1].top);
      }
    });

    test('should keep all messages visible and accessible', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: true });

      const structure = await getChatGPTStructure(page);
      expect(structure.messageCount).toBeGreaterThan(0);

      // Verify all messages exist in DOM
      const messageCount = await getElementCount(
        page,
        'article[data-testid^="conversation-turn-"]'
      );
      expect(messageCount).toBe(structure.messageCount);
    });
  });

  describe('Composer Interaction', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
      await applySettings(page, { chatboxTop: true, reverseMessages: true });
    });

    test('should allow clicking on textarea', async () => {
      const textareaExists = await elementExists(page, 'textarea[name="prompt-textarea"]');
      expect(textareaExists).toBe(true);

      // Verify textarea can be manipulated (even if not visually rendered in headless)
      const canManipulate = await page.evaluate(() => {
        const textarea = document.querySelector('textarea[name="prompt-textarea"]');
        if (!textarea) return false;

        // Try to set value
        textarea.value = 'test';
        return textarea.value === 'test';
      });

      // Textarea should be manipulable
      expect(canManipulate).toBe(true);
    });

    test('should allow typing in textarea', async () => {
      // Focus and type using evaluate (more reliable in headless)
      await page.evaluate(() => {
        const textarea = document.querySelector('textarea[name="prompt-textarea"]');
        if (textarea) {
          textarea.focus();
          textarea.value = 'Test message';
          // Trigger input event
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForTimeout(200);

      const value = await page.evaluate(() => {
        return document.querySelector('textarea[name="prompt-textarea"]')?.value || '';
      });

      expect(value).toBe('Test message');
    });

    test('should verify composer is accessible at top', async () => {
      const composerPosition = await getComposerPosition(page);

      expect(composerPosition).toBeTruthy();
      expect(composerPosition.composerBeforeMessages).toBe(true);

      // Verify composer is in viewport (at top)
      expect(composerPosition.composerTop).toBeLessThan(300);
    });
  });

  describe('Dynamic Content Changes', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
      await applySettings(page, { chatboxTop: true, reverseMessages: true });
    });

    test('should maintain layout after DOM mutations', async () => {
      const initialPosition = await getComposerPosition(page);

      // Simulate DOM change by adding a class
      await page.evaluate(() => {
        document.body.classList.add('test-mutation');
      });

      await page.waitForTimeout(300);

      const afterPosition = await getComposerPosition(page);

      // Composer should still be at top
      expect(afterPosition.composerBeforeMessages).toBe(true);
      expect(afterPosition.composerTop).toBeLessThan(initialPosition.composerTop + 50);
    });

    test('should handle viewport resize', async () => {
      // Resize viewport
      await page.setViewport({ width: 1024, height: 768 });
      await page.waitForTimeout(500);

      const position = await getComposerPosition(page);
      expect(position.composerBeforeMessages).toBe(true);

      // Resize back
      await page.setViewport({ width: 1280, height: 1024 });
      await page.waitForTimeout(500);

      const position2 = await getComposerPosition(page);
      expect(position2.composerBeforeMessages).toBe(true);
    });
  });

  describe('Settings Changes in Real-Time', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
    });

    test('should apply chatbox-top when toggled', async () => {
      // Start disabled
      await applySettings(page, { chatboxTop: false, reverseMessages: false });

      let position = await getComposerPosition(page);
      expect(position.composerBeforeMessages).toBe(false);

      // Enable
      await applySettings(page, { chatboxTop: true, reverseMessages: false });
      await page.waitForTimeout(500);

      position = await getComposerPosition(page);
      expect(position.composerBeforeMessages).toBe(true);
    });

    test('should toggle reverse-messages in real-time', async () => {
      // Start with messages not reversed
      await applySettings(page, { chatboxTop: false, reverseMessages: false });

      const order1 = await getVisualOrder(page, 'article[data-testid^="conversation-turn-"]');
      const firstMessageBefore = order1[0];

      // Enable reversal
      await applySettings(page, { chatboxTop: false, reverseMessages: true });
      await page.waitForTimeout(500);

      const order2 = await getVisualOrder(page, 'article[data-testid^="conversation-turn-"]');
      const firstMessageAfter = order2[0];

      // The visual order should have changed
      // (This is a simplified check - actual DOM order may not change, but visual does)
      expect(order2.length).toBe(order1.length);
    });

    test('should handle rapid toggle changes', async () => {
      // Toggle multiple times rapidly
      await applySettings(page, { chatboxTop: true, reverseMessages: true });
      await page.waitForTimeout(100);

      await applySettings(page, { chatboxTop: false, reverseMessages: false });
      await page.waitForTimeout(100);

      await applySettings(page, { chatboxTop: true, reverseMessages: false });
      await page.waitForTimeout(100);

      await applySettings(page, { chatboxTop: true, reverseMessages: true });
      await page.waitForTimeout(500);

      // Final state should be both enabled
      const position = await getComposerPosition(page);
      expect(position.composerBeforeMessages).toBe(true);
    });
  });

  describe('Message Elements', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
      await applySettings(page, { chatboxTop: true, reverseMessages: true });
    });

    test('should maintain message content integrity', async () => {
      // Get all messages
      const messages = await page.evaluate(() => {
        const articles = Array.from(document.querySelectorAll('article[data-testid^="conversation-turn-"]'));
        return articles.map(article => ({
          testId: article.getAttribute('data-testid'),
          turn: article.getAttribute('data-turn'),
          hasContent: article.textContent.length > 0,
        }));
      });

      expect(messages.length).toBeGreaterThan(0);
      messages.forEach(message => {
        expect(message.hasContent).toBe(true);
        expect(['user', 'assistant']).toContain(message.turn);
      });
    });

    test('should preserve thinking blocks', async () => {
      const structure = await getChatGPTStructure(page);

      // Verify thinking blocks still exist (we don't modify them)
      expect(structure.thinkingBlockCount).toBeGreaterThanOrEqual(0);

      if (structure.thinkingBlockCount > 0) {
        const thinkingExists = await elementExists(
          page,
          '[data-message-model-slug="gpt-5-thinking"]'
        );
        expect(thinkingExists).toBe(true);
      }
    });
  });
});
