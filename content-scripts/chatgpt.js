/**
 * ErgonomicGPT - ChatGPT Content Script
 *
 * Loads user settings and applies CSS classes to enable features:
 * - ergonomic-chatbox-top: Moves chat input to top
 * - ergonomic-reverse-messages: Reverses message order (newest first)
 *
 * Settings are stored in chrome.storage.sync and persist across sessions
 */

(function() {
  'use strict';

  const LOG_PREFIX = '[ErgonomicGPT]';
  const CLASSES = {
    chatboxTop: 'ergonomic-chatbox-top',
    reverseMessages: 'ergonomic-reverse-messages',
  };

  // Default settings (both features enabled)
  const DEFAULT_SETTINGS = {
    chatboxTop: true,
    reverseMessages: true,
  };

  /**
   * Apply CSS classes based on settings
   * @param {Object} settings - User settings object
   */
  function applySettings(settings) {
    const html = document.documentElement;

    // Apply or remove chatbox-top class
    if (settings.chatboxTop) {
      html.classList.add(CLASSES.chatboxTop);
      console.log(LOG_PREFIX, 'Chatbox moved to top ✅');
    } else {
      html.classList.remove(CLASSES.chatboxTop);
      console.log(LOG_PREFIX, 'Chatbox at bottom (default)');
    }

    // Apply or remove reverse-messages class
    if (settings.reverseMessages) {
      html.classList.add(CLASSES.reverseMessages);
      console.log(LOG_PREFIX, 'Messages reversed (newest first) ✅');
    } else {
      html.classList.remove(CLASSES.reverseMessages);
      console.log(LOG_PREFIX, 'Messages in normal order (oldest first)');
    }
  }

  /**
   * Load settings from storage and apply them
   */
  function loadAndApplySettings() {
    // Check if chrome.storage is available
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn(LOG_PREFIX, 'chrome.storage not available, using defaults');
      applySettings(DEFAULT_SETTINGS);
      return;
    }

    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      if (chrome.runtime.lastError) {
        console.error(LOG_PREFIX, 'Error loading settings:', chrome.runtime.lastError);
        applySettings(DEFAULT_SETTINGS);
        return;
      }

      console.log(LOG_PREFIX, 'Settings loaded:', items);
      applySettings(items);
    });
  }

  /**
   * Listen for settings changes and reapply
   */
  function setupStorageListener() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;

      console.log(LOG_PREFIX, 'Settings changed:', changes);

      // Get current full settings
      chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
        applySettings(items);
      });
    });
  }

  /**
   * Wait for DOM to be ready
   */
  function init() {
    console.log(LOG_PREFIX, 'Content script loaded');

    // Apply settings immediately if DOM is ready
    if (document.documentElement) {
      loadAndApplySettings();
      setupStorageListener();
    } else {
      // Wait for DOM
      document.addEventListener('DOMContentLoaded', () => {
        loadAndApplySettings();
        setupStorageListener();
      });
    }
  }

  // Start the extension
  init();
})();
