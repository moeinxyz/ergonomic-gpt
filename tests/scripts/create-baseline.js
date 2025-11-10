/**
 * Create Baseline Screenshots
 * Run this script to create baseline images for visual regression testing
 */

const {
  launchWithExtension,
  navigateToChatGPT,
  applySettings,
} = require('../utils/browser');

const { createBaseline } = require('../utils/screenshot');

async function main() {
  console.log('🎯 Creating baseline screenshots...\n');

  const { browser, page } = await launchWithExtension({ headless: true });

  try {
    await navigateToChatGPT(page);

    // 1. Default ChatGPT (no features)
    console.log('📸 Creating baseline: default-chatgpt');
    await applySettings(page, { chatboxTop: false, reverseMessages: false });
    await createBaseline(page, 'default-chatgpt');

    // 2. Chatbox at top only
    console.log('📸 Creating baseline: chatbox-top');
    await applySettings(page, { chatboxTop: true, reverseMessages: false });
    await createBaseline(page, 'chatbox-top');

    // 3. Messages reversed only
    console.log('📸 Creating baseline: messages-reversed');
    await applySettings(page, { chatboxTop: false, reverseMessages: true });
    await createBaseline(page, 'messages-reversed');

    // 4. Both features enabled
    console.log('📸 Creating baseline: both-enabled');
    await applySettings(page, { chatboxTop: true, reverseMessages: true });
    await createBaseline(page, 'both-enabled');

    console.log('\n✅ Baseline screenshots created successfully!');
    console.log('📂 Location: tests/visual/baseline/\n');
  } catch (error) {
    console.error('❌ Error creating baselines:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
