# ErgonomicGPT - Testing Guide

## 🔒 Privacy & Security

**IMPORTANT**: Tests are designed to run in **isolated Docker containers** or **CI/CD pipelines** only.

- ✅ Tests run in fresh, isolated browser instances
- ✅ No access to your personal Chrome profile
- ✅ No access to your ChatGPT account
- ✅ No screenshots of your personal data
- ✅ All tests use a local HTML mock file

**DO NOT run tests locally outside Docker** - they may try to access system resources.

---

## 🐳 Running Tests (Recommended: Docker)

### Prerequisites
- Docker Desktop installed and running
- Git repository cloned

### Run Tests in Docker

```bash
cd tests

# Build the Docker image (first time only)
npm run docker:build

# Run all tests in isolated container
npm run docker:test
```

The Docker container provides:
- Fresh Chromium browser
- Isolated file system
- No access to your system browser or data
- Headless mode by default
- Same environment as CI/CD

### Interactive Shell (for debugging)

```bash
cd tests
npm run docker:shell
```

This opens a bash shell inside the container where you can:
```bash
npm test                    # Run all tests
npm run test:functional     # Run DOM tests only
npm run test:visual         # Run visual tests only
npm run test:interactive    # Run interaction tests only
```

---

## 🔄 GitHub Actions (CI/CD)

Tests run automatically on every push/PR using GitHub Actions.

The workflow (`.github/workflows/test.yml`) will:
1. Spin up Ubuntu container
2. Install Chrome
3. Run all tests in headless mode
4. Upload screenshots and coverage as artifacts

### Viewing Test Results

1. Go to Actions tab in GitHub
2. Click on the latest workflow run
3. Download artifacts (screenshots, coverage)

### Running Workflow Manually

1. Go to Actions → Test ErgonomicGPT Extension
2. Click "Run workflow"
3. Select branch and run

---

## 📁 Test Structure

```
tests/
├── functional/          # DOM and CSS tests
│   ├── dom.test.js     # Extension loading, CSS injection
│   └── settings.test.js # Settings management
├── interactive/         # User interaction tests
│   └── behavior.test.js # Scrolling, typing, toggling
├── visual/             # Screenshot comparison
│   ├── screenshots.test.js
│   └── baseline/       # Reference screenshots
├── utils/              # Test helpers
│   ├── browser.js      # Browser launching
│   ├── screenshot.js   # Screenshot utilities
│   └── dom.js          # DOM testing utilities
├── Dockerfile          # Docker test environment
├── docker-compose.yml  # Docker orchestration
└── jest.config.js      # Jest configuration
```

---

## 🧪 Writing Tests

### Example Test

```javascript
const { launchWithExtension, navigateToChatGPT, getAppliedSettings } = require('../utils/browser');

describe('My Feature', () => {
  let browser, page;

  beforeAll(async () => {
    ({ browser, page } = await launchWithExtension());
    await navigateToChatGPT(page);
  });

  afterAll(async () => {
    await browser?.close();
  });

  test('should work correctly', async () => {
    const settings = await getAppliedSettings(page);
    expect(settings.chatboxTop).toBe(true);
  });
});
```

### Test Utilities

- **`launchWithExtension()`** - Launches Chromium with extension loaded
- **`navigateToChatGPT(page)`** - Navigates to test HTML file
- **`getAppliedSettings(page)`** - Gets current CSS classes applied
- **`applySettings(page, settings)`** - Manually apply settings
- **`takeScreenshot(page, name)`** - Capture screenshot
- **`compareScreenshots(actual, expected)`** - Visual diff

---

## 🔍 Debugging Failed Tests

### 1. Check Test Output

```bash
npm run docker:test
```

Look for specific error messages and stack traces.

### 2. Visual Inspection

After tests run, check screenshots:
```
tests/screenshots/
tests/visual/baseline/
```

### 3. Interactive Debugging

```bash
# Enter container shell
npm run docker:shell

# Run tests with custom timeout
jest --testTimeout=60000 functional/dom.test.js

# Run single test
jest -t "should reverse composer-parent"
```

### 4. Non-Headless Mode (in Docker)

Edit `docker-compose.yml`:
```yaml
environment:
  - HEADLESS=false  # Show browser window
```

---

## 📊 Test Coverage

Generate coverage report:

```bash
npm run docker:test -- --coverage
```

View coverage:
```bash
open coverage/index.html
```

Coverage thresholds (jest.config.js):
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

---

## ⚙️ Configuration

### Environment Variables

- `HEADLESS` - Run in headless mode (default: true)
- `TEST_TIMEOUT` - Test timeout in ms (default: 30000)
- `SCREENSHOT_DIR` - Screenshot output directory
- `BASELINE_DIR` - Baseline screenshot directory

### Jest Configuration

Edit `jest.config.js` to modify:
- Test timeout
- Test patterns
- Coverage thresholds
- Setup files

---

## 🚫 Local Testing (Not Recommended)

If you **must** run tests locally (not recommended due to privacy):

### On macOS with Docker

```bash
cd tests
npm run docker:build
npm run docker:test
```

### On Linux

```bash
cd tests
npm install
HEADLESS=true npm test
```

### On Windows

```powershell
cd tests
npm install
$env:HEADLESS="true"
npm test
```

**WARNING**: Local testing may:
- Open your system browser
- Access browser cache/cookies
- Slow down your machine
- Have platform-specific issues

**Always prefer Docker or GitHub Actions!**

---

## 🐛 Common Issues

### Docker not running

```
Error: Cannot connect to Docker daemon
```

**Solution**: Start Docker Desktop

### Tests timing out

```
Error: Timeout - Async callback was not invoked
```

**Solution**: Increase timeout in jest.config.js or use `--testTimeout`

### Chrome fails to launch in Docker

```
Error: Failed to launch the browser process
```

**Solution**: Rebuild Docker image
```bash
npm run docker:build --no-cache
```

### Screenshots don't match

```
Error: Screenshots differ by X%
```

**Solution**: Update baseline
```bash
npm run baseline:update
```

---

## 📈 Test Metrics

Current test coverage:
- **Functional Tests**: 21 tests
- **Settings Tests**: 14 tests
- **Interactive Tests**: 15 tests
- **Visual Tests**: 11 tests

**Total**: 61 tests

Expected duration:
- Docker (first run): ~5-10 minutes
- Docker (subsequent): ~3-5 minutes
- GitHub Actions: ~3-4 minutes

---

## 🤝 Contributing

When adding new tests:

1. Write tests in appropriate directory
2. Use existing test utilities
3. Run tests in Docker before committing
4. Update this README if needed
5. Ensure all tests pass in CI

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Remember**: Always run tests in Docker for privacy and consistency! 🔒
