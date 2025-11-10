# ErgonomicGPT - Automated Test Suite

Comprehensive automated testing for the ErgonomicGPT Chrome extension.

## Overview

This test suite provides:
- **Functional DOM Tests** - Verify CSS application and DOM structure
- **Visual Regression Tests** - Screenshot comparison
- **Interactive Behavior Tests** - User interactions and scrolling
- **Settings Persistence Tests** - Storage and settings management

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker (for containerized testing)
- Chrome/Chromium browser

### Setup

```bash
# Navigate to tests directory
cd tests

# Install dependencies
npm install

# Create baseline screenshots (required for visual tests)
npm run baseline:create
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:functional
npm run test:visual
npm run test:interactive

# Run tests in watch mode (development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Docker Testing

```bash
# Build test environment
npm run docker:build

# Run tests in Docker
npm run docker:test

# Interactive shell for debugging
npm run docker:shell
```

## Test Structure

```
tests/
├── functional/        # DOM and CSS verification tests
│   ├── dom.test.js    # Core DOM structure tests
│   └── settings.test.js # Settings persistence tests
├── visual/            # Screenshot comparison tests
│   ├── screenshots.test.js
│   └── baseline/      # Baseline images
├── interactive/       # User interaction tests
│   └── behavior.test.js
├── utils/             # Test utilities
│   ├── browser.js     # Browser launch and control
│   ├── screenshot.js  # Screenshot utilities
│   └── dom.js         # DOM query utilities
├── fixtures/          # Test fixtures and mock data
└── scripts/           # Helper scripts
    └── create-baseline.js
```

## Writing Tests

### Example: Functional Test

```javascript
const { launchWithExtension, navigateToChatGPT, applySettings } = require('../utils/browser');
const { isChatboxAtTop } = require('../utils/dom');

describe('My Feature Tests', () => {
  let browser, page;

  beforeAll(async () => {
    const result = await launchWithExtension();
    browser = result.browser;
    page = result.page;
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should move chatbox to top', async () => {
    await navigateToChatGPT(page);
    await applySettings(page, { chatboxTop: true, reverseMessages: false });

    const isAtTop = await isChatboxAtTop(page);
    expect(isAtTop).toBe(true);
  });
});
```

### Example: Visual Test

```javascript
const { takeScreenshot, compareAgainstBaseline } = require('../utils/screenshot');

test('should match visual baseline', async () => {
  await navigateToChatGPT(page);
  await applySettings(page, { chatboxTop: true, reverseMessages: true });

  const comparison = await compareAgainstBaseline(page, 'both-enabled');
  expect(comparison.diffPercentage).toBeLessThan(5);
});
```

## Test Utilities

### Browser Utilities (`utils/browser.js`)

- `launchWithExtension(options)` - Launch Chrome with extension loaded
- `navigateToChatGPT(page, url)` - Navigate to ChatGPT
- `applySettings(page, settings)` - Apply extension settings
- `getAppliedSettings(page)` - Get current settings
- `scrollTo(page, y)` - Scroll to position

### DOM Utilities (`utils/dom.js`)

- `getChatGPTStructure(page)` - Get DOM structure info
- `isChatboxAtTop(page)` - Check if chatbox is at top
- `areMessagesReversed(page)` - Check if messages are reversed
- `getComposerPosition(page)` - Get composer position
- `verifyCSSApplication(page, settings)` - Verify CSS is applied correctly

### Screenshot Utilities (`utils/screenshot.js`)

- `takeScreenshot(page, filename)` - Take full page screenshot
- `takeElementScreenshot(page, selector, filename)` - Screenshot specific element
- `compareScreenshots(img1, img2)` - Compare two screenshots
- `createBaseline(page, name)` - Create baseline screenshot
- `compareAgainstBaseline(page, name)` - Compare against baseline

## Baseline Management

### Creating Baselines

Create baseline screenshots for visual regression testing:

```bash
npm run baseline:create
```

This creates screenshots in `tests/visual/baseline/` for:
- Default ChatGPT (no features)
- Chatbox at top only
- Messages reversed only
- Both features enabled

### Updating Baselines

If the UI intentionally changes, update baselines:

```bash
npm run baseline:update
```

⚠️ **Warning**: Only update baselines when you've verified the visual changes are correct!

## Debugging Tests

### Interactive Mode

Run tests with visible browser (non-headless):

```bash
HEADLESS=false npm test
```

### Slow-Mo Mode

Slow down browser actions for debugging:

```javascript
const browser = await puppeteer.launch({
  headless: false,
  slowMo: 250, // 250ms delay between actions
});
```

### Screenshots on Failure

Tests automatically capture screenshots on failure in `tests/screenshots/`.

### Console Output

View extension console logs:

```javascript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd tests && npm install
      - run: cd tests && npm test
```

### Docker in CI

```yaml
- run: cd tests && npm run docker:test
```

## Troubleshooting

### Extension Not Loading

```bash
# Verify extension path is correct
ls -la ../{manifest.json,content-scripts,styles,popup}

# Check Chrome logs
HEADLESS=false npm test
# Open Chrome DevTools → Console
```

### Visual Tests Failing

```bash
# Recreate baselines
npm run baseline:create

# Check diff images
ls -la tests/visual/__diff_output__/
```

### Timeout Errors

Increase test timeout:

```javascript
// In test file
jest.setTimeout(60000); // 60 seconds

// Or in jest.config.js
testTimeout: 60000
```

### Docker Issues

```bash
# Rebuild container
docker-compose build --no-cache

# Check logs
docker-compose logs
```

## Performance

### Test Execution Time

- Functional tests: ~30-60 seconds
- Visual tests: ~60-90 seconds
- Interactive tests: ~45-75 seconds
- Full suite: ~3-5 minutes

### Optimization Tips

1. Use `--maxWorkers=2` to limit parallel tests
2. Run specific test suites instead of full suite
3. Use Docker for consistent environment
4. Cache npm dependencies in CI

## Coverage Reports

Generate and view coverage:

```bash
npm run test:coverage
open coverage/index.html
```

Coverage goals:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Best Practices

1. **Always run tests before committing**
   ```bash
   npm test
   ```

2. **Create baselines after CSS changes**
   ```bash
   npm run baseline:create
   ```

3. **Keep tests independent** - Each test should work in isolation

4. **Use descriptive test names** - Clearly state what is being tested

5. **Clean up resources** - Always close browsers in `afterAll`

6. **Avoid hardcoded waits** - Use `waitForSelector` instead of `waitForTimeout`

7. **Test real user scenarios** - Focus on how users actually interact with the extension

## Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Extension Testing Guide](https://developer.chrome.com/docs/extensions/mv3/testing/)

## Support

If tests are failing or you need help:

1. Check the troubleshooting section above
2. Review test logs in `tests/screenshots/`
3. Run tests in non-headless mode for debugging
4. Open an issue with test logs and screenshots
