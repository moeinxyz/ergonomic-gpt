/**
 * ErgonomicGPT Popup Script
 *
 * Manages extension settings UI
 * - Loads current settings from storage
 * - Saves settings when toggles change
 * - Shows confirmation message on save
 */

(function() {
  'use strict';

  // Default settings (same as content script)
  const DEFAULT_SETTINGS = {
    chatboxTop: true,
    reverseMessages: true,
  };

  // DOM elements
  let chatboxTopCheckbox;
  let reverseMessagesCheckbox;

  /**
   * Load settings from storage and update UI
   */
  function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      if (chrome.runtime.lastError) {
        console.error('[ErgonomicGPT] Error loading settings:', chrome.runtime.lastError);
        return;
      }

      console.log('[ErgonomicGPT] Settings loaded:', items);

      // Update checkboxes to match saved settings
      chatboxTopCheckbox.checked = items.chatboxTop;
      reverseMessagesCheckbox.checked = items.reverseMessages;
    });
  }

  /**
   * Save settings to storage
   * @param {Object} settings - Settings object to save
   */
  function saveSettings(settings) {
    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) {
        console.error('[ErgonomicGPT] Error saving settings:', chrome.runtime.lastError);
        return;
      }

      console.log('[ErgonomicGPT] Settings saved:', settings);
    });
  }

  /**
   * Handle checkbox changes
   * @param {Event} event - Change event
   */
  function handleCheckboxChange(event) {
    const checkbox = event.target;
    const settingName = checkbox.id;
    const value = checkbox.checked;

    console.log(`[ErgonomicGPT] Setting ${settingName} changed to:`, value);

    // Get all current settings
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      // Update only the changed setting
      items[settingName] = value;

      // Save back to storage
      saveSettings(items);
    });
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    chatboxTopCheckbox.addEventListener('change', handleCheckboxChange);
    reverseMessagesCheckbox.addEventListener('change', handleCheckboxChange);
  }

  /**
   * Initialize popup
   */
  function init() {
    // Get DOM elements
    chatboxTopCheckbox = document.getElementById('chatboxTop');
    reverseMessagesCheckbox = document.getElementById('reverseMessages');

    if (!chatboxTopCheckbox || !reverseMessagesCheckbox) {
      console.error('[ErgonomicGPT] Required DOM elements not found');
      return;
    }

    // Load current settings
    loadSettings();

    // Setup event listeners
    setupEventListeners();

    console.log('[ErgonomicGPT] Popup initialized');
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', init);
})();
