/**
 * DOM Utilities
 * Helper functions for querying and verifying DOM structure
 */

/**
 * Get computed style of an element
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} selector - CSS selector
 * @param {string} property - CSS property name
 * @returns {Promise<string>} Property value
 */
async function getComputedStyle(page, selector, property) {
  return await page.evaluate((selector, property) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    return window.getComputedStyle(element).getPropertyValue(property);
  }, selector, property);
}

/**
 * Get multiple computed styles
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} selector - CSS selector
 * @param {Array<string>} properties - Array of CSS property names
 * @returns {Promise<Object>} Object with property: value pairs
 */
async function getComputedStyles(page, selector, properties) {
  return await page.evaluate((selector, properties) => {
    const element = document.querySelector(selector);
    if (!element) return null;

    const styles = {};
    const computedStyle = window.getComputedStyle(element);

    properties.forEach(prop => {
      styles[prop] = computedStyle.getPropertyValue(prop);
    });

    return styles;
  }, selector, properties);
}

/**
 * Get bounding box of an element
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} selector - CSS selector
 * @returns {Promise<{x: number, y: number, width: number, height: number, top: number, bottom: number}>}
 */
async function getBoundingBox(page, selector) {
  return await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
    };
  }, selector);
}

/**
 * Check if element exists
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} selector - CSS selector
 * @returns {Promise<boolean>}
 */
async function elementExists(page, selector) {
  const element = await page.$(selector);
  return element !== null;
}

/**
 * Get element count
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} selector - CSS selector
 * @returns {Promise<number>}
 */
async function getElementCount(page, selector) {
  return await page.evaluate((selector) => {
    return document.querySelectorAll(selector).length;
  }, selector);
}

/**
 * Get ChatGPT-specific DOM information
 * @param {Page} page - Puppeteer/Playwright page
 * @returns {Promise<Object>} DOM structure info
 */
async function getChatGPTStructure(page) {
  return await page.evaluate(() => {
    return {
      hasMain: !!document.querySelector('main'),
      hasThread: !!document.querySelector('#thread'),
      hasComposerParent: !!document.querySelector('.composer-parent'),
      hasForm: !!document.querySelector('form'),
      hasTextarea: !!document.querySelector('textarea[name="prompt-textarea"]'),
      messageCount: document.querySelectorAll('article[data-testid^="conversation-turn-"]').length,
      userMessageCount: document.querySelectorAll('article[data-turn="user"]').length,
      assistantMessageCount: document.querySelectorAll('article[data-turn="assistant"]').length,
      thinkingBlockCount: document.querySelectorAll('[data-message-model-slug="gpt-5-thinking"]').length,
    };
  });
}

/**
 * Verify chatbox is at top (composer appears before messages visually)
 * @param {Page} page - Puppeteer/Playwright page
 * @returns {Promise<boolean>}
 */
async function isChatboxAtTop(page) {
  return await page.evaluate(() => {
    const composerParent = document.querySelector('.composer-parent');
    if (!composerParent) return false;

    const flexDirection = window.getComputedStyle(composerParent).flexDirection;
    return flexDirection === 'column-reverse';
  });
}

/**
 * Verify messages are reversed (newest first)
 * @param {Page} page - Puppeteer/Playwright page
 * @returns {Promise<boolean>}
 */
async function areMessagesReversed(page) {
  return await page.evaluate(() => {
    const messagesContainer = document.querySelector('div.flex.flex-col.text-sm');
    if (!messagesContainer) return false;

    const flexDirection = window.getComputedStyle(messagesContainer).flexDirection;
    return flexDirection === 'column-reverse';
  });
}

/**
 * Get visual order of elements (top to bottom)
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} selector - CSS selector for elements
 * @returns {Promise<Array>} Array of element info sorted by visual position
 */
async function getVisualOrder(page, selector) {
  return await page.evaluate((selector) => {
    const elements = Array.from(document.querySelectorAll(selector));

    return elements.map(el => {
      const rect = el.getBoundingClientRect();
      return {
        selector: el.tagName.toLowerCase() + (el.className ? `.${el.classList[0]}` : ''),
        testId: el.getAttribute('data-testid'),
        turn: el.getAttribute('data-turn'),
        top: rect.top,
        bottom: rect.bottom,
      };
    }).sort((a, b) => a.top - b.top);
  }, selector);
}

/**
 * Get composer position relative to messages
 * @param {Page} page - Puppeteer/Playwright page
 * @returns {Promise<{composerTop: number, firstMessageTop: number, composerBeforeMessages: boolean}>}
 */
async function getComposerPosition(page) {
  return await page.evaluate(() => {
    const form = document.querySelector('form');
    const firstMessage = document.querySelector('article[data-testid^="conversation-turn-"]');

    if (!form || !firstMessage) return null;

    const formRect = form.getBoundingClientRect();
    const messageRect = firstMessage.getBoundingClientRect();

    return {
      composerTop: formRect.top,
      firstMessageTop: messageRect.top,
      composerBeforeMessages: formRect.top < messageRect.top,
    };
  });
}

/**
 * Verify all expected CSS is applied
 * @param {Page} page - Puppeteer/Playwright page
 * @param {Object} settings - Expected settings
 * @returns {Promise<{valid: boolean, issues: Array<string>}>}
 */
async function verifyCSSApplication(page, settings) {
  return await page.evaluate((settings) => {
    const issues = [];

    // Check classes on HTML element
    const html = document.documentElement;

    if (settings.chatboxTop && !html.classList.contains('ergonomic-chatbox-top')) {
      issues.push('Missing class: ergonomic-chatbox-top');
    }

    if (settings.reverseMessages && !html.classList.contains('ergonomic-reverse-messages')) {
      issues.push('Missing class: ergonomic-reverse-messages');
    }

    // Check composer-parent flex-direction
    if (settings.chatboxTop) {
      const composerParent = document.querySelector('.composer-parent');
      if (composerParent) {
        const flexDir = window.getComputedStyle(composerParent).flexDirection;
        if (flexDir !== 'column-reverse') {
          issues.push(`Composer parent flex-direction is ${flexDir}, expected column-reverse`);
        }
      } else {
        issues.push('Composer parent not found');
      }
    }

    // Check messages container flex-direction
    if (settings.reverseMessages) {
      const messagesContainer = document.querySelector('div.flex.flex-col.text-sm');
      if (messagesContainer) {
        const flexDir = window.getComputedStyle(messagesContainer).flexDirection;
        if (flexDir !== 'column-reverse') {
          issues.push(`Messages container flex-direction is ${flexDir}, expected column-reverse`);
        }
      } else {
        issues.push('Messages container not found');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }, settings);
}

module.exports = {
  getComputedStyle,
  getComputedStyles,
  getBoundingBox,
  elementExists,
  getElementCount,
  getChatGPTStructure,
  isChatboxAtTop,
  areMessagesReversed,
  getVisualOrder,
  getComposerPosition,
  verifyCSSApplication,
};
