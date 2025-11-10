/**
 * Screenshot Utilities
 * Functions for taking and comparing screenshots
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

/**
 * Take a screenshot of the page
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} filename - Filename for screenshot
 * @param {Object} options - Screenshot options
 * @returns {Promise<string>} Path to screenshot
 */
async function takeScreenshot(page, filename, options = {}) {
  const screenshotDir = options.dir || global.TEST_CONFIG.SCREENSHOT_DIR;
  const filePath = path.join(screenshotDir, filename);

  await page.screenshot({
    path: filePath,
    fullPage: options.fullPage !== false,
    ...options,
  });

  return filePath;
}

/**
 * Take a screenshot of a specific element
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} selector - CSS selector
 * @param {string} filename - Filename for screenshot
 * @param {Object} options - Screenshot options
 * @returns {Promise<string>} Path to screenshot
 */
async function takeElementScreenshot(page, selector, filename, options = {}) {
  const screenshotDir = options.dir || global.TEST_CONFIG.SCREENSHOT_DIR;
  const filePath = path.join(screenshotDir, filename);

  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  await element.screenshot({
    path: filePath,
    ...options,
  });

  return filePath;
}

/**
 * Compare two PNG images
 * @param {string} img1Path - Path to first image
 * @param {string} img2Path - Path to second image
 * @param {Object} options - Comparison options
 * @returns {Promise<{match: boolean, diff: number, diffPath: string|null}>}
 */
async function compareScreenshots(img1Path, img2Path, options = {}) {
  const threshold = options.threshold || 0.1;
  const diffDir = options.diffDir || path.join(global.TEST_CONFIG.SCREENSHOT_DIR, '__diff_output__');

  // Ensure diff directory exists
  if (!fs.existsSync(diffDir)) {
    fs.mkdirSync(diffDir, { recursive: true });
  }

  // Read images
  const img1 = PNG.sync.read(fs.readFileSync(img1Path));
  const img2 = PNG.sync.read(fs.readFileSync(img2Path));

  // Check dimensions match
  if (img1.width !== img2.width || img1.height !== img2.height) {
    throw new Error(
      `Image dimensions don't match: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`
    );
  }

  // Create diff image
  const { width, height } = img1;
  const diff = new PNG({ width, height });

  // Compare pixels
  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold }
  );

  const totalPixels = width * height;
  const diffPercentage = (numDiffPixels / totalPixels) * 100;

  // Save diff image if there are differences
  let diffPath = null;
  if (numDiffPixels > 0) {
    const diffFilename = `diff_${path.basename(img1Path)}`;
    diffPath = path.join(diffDir, diffFilename);
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
  }

  return {
    match: numDiffPixels === 0,
    diffPixels: numDiffPixels,
    diffPercentage: parseFloat(diffPercentage.toFixed(2)),
    diffPath,
  };
}

/**
 * Create baseline screenshot
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} name - Baseline name
 * @param {Object} options - Screenshot options
 * @returns {Promise<string>} Path to baseline
 */
async function createBaseline(page, name, options = {}) {
  const baselineDir = options.dir || global.TEST_CONFIG.BASELINE_DIR;
  const filename = `${name}.png`;
  const filePath = path.join(baselineDir, filename);

  await page.screenshot({
    path: filePath,
    fullPage: options.fullPage !== false,
    ...options,
  });

  console.log(`✅ Created baseline: ${filename}`);
  return filePath;
}

/**
 * Compare against baseline
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} name - Baseline name
 * @param {Object} options - Options
 * @returns {Promise<{match: boolean, diff: number, diffPath: string|null}>}
 */
async function compareAgainstBaseline(page, name, options = {}) {
  const baselineDir = options.dir || global.TEST_CONFIG.BASELINE_DIR;
  const baselinePath = path.join(baselineDir, `${name}.png`);

  // Check if baseline exists
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Baseline not found: ${name}.png - Run baseline:create first`);
  }

  // Take current screenshot
  const currentPath = await takeScreenshot(page, `current_${name}.png`, options);

  // Compare
  const result = await compareScreenshots(baselinePath, currentPath, options);

  return result;
}

/**
 * Take multiple screenshots at different viewport sizes
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} name - Screenshot name
 * @param {Array} viewports - Array of {width, height} objects
 * @returns {Promise<Array<string>>} Paths to screenshots
 */
async function takeResponsiveScreenshots(page, name, viewports) {
  const screenshots = [];

  for (const viewport of viewports) {
    await page.setViewport(viewport);
    await page.waitForTimeout(500); // Let layout settle

    const filename = `${name}_${viewport.width}x${viewport.height}.png`;
    const screenshotPath = await takeScreenshot(page, filename);
    screenshots.push(screenshotPath);
  }

  return screenshots;
}

module.exports = {
  takeScreenshot,
  takeElementScreenshot,
  compareScreenshots,
  createBaseline,
  compareAgainstBaseline,
  takeResponsiveScreenshots,
};
