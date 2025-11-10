/**
 * Functional DOM Tests
 * Verifies DOM structure and CSS application
 */

const {
  launchWithExtension,
  navigateToChatGPT,
  getAppliedSettings,
  applySettings,
} = require('../utils/browser');

const {
  getChatGPTStructure,
  isChatboxAtTop,
  areMessagesReversed,
  getComposerPosition,
  verifyCSSApplication,
  getComputedStyle,
  getComputedStyles,
} = require('../utils/dom');

describe('Functional DOM Tests', () => {
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

  describe('Extension Loading', () => {
    test('should load ChatGPT page successfully', async () => {
      await navigateToChatGPT(page);

      // Verify page loaded
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    test('should have correct ChatGPT DOM structure', async () => {
      await navigateToChatGPT(page);

      const structure = await getChatGPTStructure(page);

      expect(structure.hasMain).toBe(true);
      expect(structure.hasThread).toBe(true);
      expect(structure.hasComposerParent).toBe(true);
      expect(structure.hasForm).toBe(true);
      expect(structure.hasTextarea).toBe(true);
      expect(structure.messageCount).toBeGreaterThan(0);
    });

    test('should inject extension CSS', async () => {
      await navigateToChatGPT(page);

      // Check if extension CSS is loaded by verifying style exists
      const hasStyle = await page.evaluate(() => {
        const styles = Array.from(document.styleSheets);
        return styles.some(sheet => {
          try {
            return sheet.cssRules &&
                   Array.from(sheet.cssRules).some(rule =>
                     rule.selectorText &&
                     rule.selectorText.includes('ergonomic')
                   );
          } catch (e) {
            return false;
          }
        });
      });

      expect(hasStyle).toBe(true);
    });
  });

  describe('Feature 1: Chatbox at Top', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
    });

    test('should apply ergonomic-chatbox-top class when enabled', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: false });

      const settings = await getAppliedSettings(page);
      expect(settings.chatboxTop).toBe(true);
    });

    test('should reverse composer-parent flex-direction', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: false });

      const flexDirection = await getComputedStyle(page, '.composer-parent', 'flex-direction');
      expect(flexDirection).toBe('column-reverse');
    });

    test('should make sticky header relative', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: false });

      const position = await getComputedStyle(page, 'header#page-header', 'position');
      expect(position).toBe('relative');
    });

    test('should verify chatbox is visually at top', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: false });

      const isAtTop = await isChatboxAtTop(page);
      expect(isAtTop).toBe(true);
    });

    test('should verify composer appears before messages', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: false });

      const position = await getComposerPosition(page);
      expect(position).toBeTruthy();
      expect(position.composerBeforeMessages).toBe(true);
      expect(position.composerTop).toBeLessThan(position.firstMessageTop);
    });

    test('should NOT apply when disabled', async () => {
      await applySettings(page, { chatboxTop: false, reverseMessages: false });

      const settings = await getAppliedSettings(page);
      expect(settings.chatboxTop).toBe(false);

      const isAtTop = await isChatboxAtTop(page);
      expect(isAtTop).toBe(false);
    });
  });

  describe('Feature 2: Reverse Messages', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
    });

    test('should apply ergonomic-reverse-messages class when enabled', async () => {
      await applySettings(page, { chatboxTop: false, reverseMessages: true });

      const settings = await getAppliedSettings(page);
      expect(settings.reverseMessages).toBe(true);
    });

    test('should reverse messages container flex-direction', async () => {
      await applySettings(page, { chatboxTop: false, reverseMessages: true });

      const flexDirection = await getComputedStyle(
        page,
        'div.flex.flex-col.text-sm',
        'flex-direction'
      );
      expect(flexDirection).toBe('column-reverse');
    });

    test('should verify messages are visually reversed', async () => {
      await applySettings(page, { chatboxTop: false, reverseMessages: true });

      const isReversed = await areMessagesReversed(page);
      expect(isReversed).toBe(true);
    });

    test('should swap padding from bottom to top', async () => {
      await applySettings(page, { chatboxTop: false, reverseMessages: true });

      const styles = await getComputedStyles(page, 'div.flex.flex-col.text-sm', [
        'padding-top',
        'padding-bottom',
      ]);

      // Should have top padding and no bottom padding
      const topPadding = parseFloat(styles['padding-top']);
      const bottomPadding = parseFloat(styles['padding-bottom']);

      expect(topPadding).toBeGreaterThan(0);
      expect(bottomPadding).toBeLessThan(topPadding);
    });

    test('should NOT apply when disabled', async () => {
      await applySettings(page, { chatboxTop: false, reverseMessages: false });

      const settings = await getAppliedSettings(page);
      expect(settings.reverseMessages).toBe(false);

      const isReversed = await areMessagesReversed(page);
      expect(isReversed).toBe(false);
    });
  });

  describe('Combined Features', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
    });

    test('should apply both features when both enabled', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: true });

      const settings = await getAppliedSettings(page);
      expect(settings.chatboxTop).toBe(true);
      expect(settings.reverseMessages).toBe(true);

      const isAtTop = await isChatboxAtTop(page);
      const isReversed = await areMessagesReversed(page);

      expect(isAtTop).toBe(true);
      expect(isReversed).toBe(true);
    });

    test('should verify CSS application for both features', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: true });

      const verification = await verifyCSSApplication(page, {
        chatboxTop: true,
        reverseMessages: true,
      });

      expect(verification.valid).toBe(true);
      expect(verification.issues).toHaveLength(0);
    });

    test('should work independently (chatbox only)', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: false });

      const isAtTop = await isChatboxAtTop(page);
      const isReversed = await areMessagesReversed(page);

      expect(isAtTop).toBe(true);
      expect(isReversed).toBe(false);
    });

    test('should work independently (messages only)', async () => {
      await applySettings(page, { chatboxTop: false, reverseMessages: true });

      const isAtTop = await isChatboxAtTop(page);
      const isReversed = await areMessagesReversed(page);

      expect(isAtTop).toBe(false);
      expect(isReversed).toBe(true);
    });
  });

  describe('Layout Stability', () => {
    beforeEach(async () => {
      await navigateToChatGPT(page);
    });

    test('should maintain proper overflow behavior', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: true });

      const mainOverflow = await getComputedStyle(page, 'main', 'overflow');
      expect(['auto', 'scroll', 'hidden']).toContain(mainOverflow);
    });

    test('should not break existing flex layout', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: true });

      const mainDisplay = await getComputedStyle(page, 'main', 'display');
      expect(mainDisplay).toBe('flex');

      const threadDisplay = await getComputedStyle(page, '#thread', 'display');
      expect(threadDisplay).toBe('flex');
    });

    test('should keep articles in normal flex-direction', async () => {
      await applySettings(page, { chatboxTop: true, reverseMessages: true });

      const articleFlexDirection = await getComputedStyle(
        page,
        'article[data-turn="assistant"]',
        'flex-direction'
      );

      expect(articleFlexDirection).toBe('column');
    });
  });
});
