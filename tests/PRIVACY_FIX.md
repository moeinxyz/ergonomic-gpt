# Privacy Fix - Test Environment

## 🔴 Problem

The tests were opening **your actual Chrome browser** and accessing **your personal ChatGPT account**, which is a serious privacy violation.

## ✅ Solution

All tests now run in **isolated Docker containers** with fresh browser instances.

---

## Changes Made

### 1. Fixed Browser Launch (`utils/browser.js`)

**Before** (❌ Privacy Violation):
```javascript
const executablePath = process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'  // YOUR BROWSER!
  : undefined;
```

**After** (✅ Privacy Preserved):
```javascript
// Use bundled Chromium (never open user's actual browser!)
// In Docker or CI, use Chrome from environment variable
const executablePath = process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH;
```

### 2. Added GitHub Actions Workflow (`.github/workflows/test.yml`)

Tests now run automatically in CI/CD:
- Fresh Ubuntu container
- Isolated Chrome installation
- No access to your personal data
- Runs on every push/PR

### 3. Updated Package Scripts (`package.json`)

Added postinstall hook to download Puppeteer's bundled Chromium:
```json
"postinstall": "npx puppeteer browsers install chrome"
```

### 4. Created Testing Documentation

- `TESTING.md` - Comprehensive guide for running tests safely
- Privacy warnings throughout
- Docker-first approach

---

## How Tests Work Now

### Architecture

```
┌─────────────────────────────────────┐
│  GitHub Actions / Docker Container  │
│  ┌───────────────────────────────┐  │
│  │   Fresh Chrome Instance       │  │
│  │   ├── No personal data        │  │
│  │   ├── No cookies/cache        │  │
│  │   └── Isolated file system    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Test Extension              │  │
│  │   └── Local HTML mock file    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Data Flow

1. **Docker container starts** - Fresh environment
2. **Chrome launches** - Isolated instance (not your browser)
3. **Extension loads** - Test version from repo
4. **Navigate to mock file** - `file:///app/Examples/ChatGPTExample.html`
5. **Run tests** - DOM manipulation, screenshots, etc.
6. **Container destroyed** - No traces left

### What Tests Access

✅ **Allowed**:
- Extension code from repo
- Local HTML mock file
- Fresh browser instance
- Test screenshots (saved to repo)

❌ **Never Accessed**:
- Your personal Chrome browser
- Your ChatGPT account
- Your browser cookies/cache
- Your personal files
- Your browsing history

---

## Running Tests Safely

### Method 1: GitHub Actions (Recommended)

1. Push code to GitHub
2. GitHub Actions runs automatically
3. View results in Actions tab
4. Download screenshots/coverage from artifacts

**Zero risk to your privacy!**

### Method 2: Docker (Recommended for Local)

```bash
cd tests

# Start Docker Desktop first!

# Build container (one time)
npm run docker:build

# Run tests in container
npm run docker:test
```

**Your browser never opens!**

### Method 3: Local (⚠️ Use with Caution)

Only if Docker is not available:

```bash
cd tests
npm install  # Downloads bundled Chromium
HEADLESS=true npm test
```

**Note**: May have compatibility issues on macOS with Apple Silicon.

---

## Verification

To verify tests are NOT using your browser:

### 1. Check Process

When tests run in Docker:
```bash
docker ps
# You'll see: ergonomic-gpt-tests container running
```

### 2. Check Browser

Your actual Chrome should:
- NOT open automatically
- NOT have any extension activity
- NOT access ChatGPT

### 3. Check Logs

Tests log:
```
Extension Path: /app (inside container, not your machine)
Headless Mode: true
```

---

## Before vs After

### Before (Privacy Violation)

```
User runs: npm test
  ↓
Opens YOUR Chrome at:
  /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
  ↓
Navigates to: https://chatgpt.com
  ↓
Uses YOUR cookies/session
  ↓
Takes screenshots of YOUR conversations
❌ MAJOR PRIVACY ISSUE!
```

### After (Privacy Preserved)

```
User runs: npm run docker:test
  ↓
Docker starts fresh container
  ↓
Launches isolated Chrome in container
  ↓
Navigates to: file:///app/Examples/ChatGPTExample.html
  ↓
Tests mock HTML (no real ChatGPT)
  ↓
Takes screenshots of test data only
✅ PRIVACY PRESERVED!
```

---

## Security Checklist

- [x] Tests run in Docker by default
- [x] No access to system browser
- [x] No network requests to ChatGPT
- [x] Uses local HTML mock file
- [x] Fresh browser instance each run
- [x] Container destroyed after tests
- [x] GitHub Actions workflow configured
- [x] Privacy warnings in documentation
- [x] Environment variables for isolation

---

## Next Steps for User

1. **Install Docker Desktop** - https://www.docker.com/products/docker-desktop/

2. **Start Docker Desktop**

3. **Run tests in Docker**:
   ```bash
   cd tests
   npm run docker:build
   npm run docker:test
   ```

4. **Set up GitHub Actions** (optional):
   - Push code to GitHub
   - Tests run automatically
   - View results in Actions tab

5. **Never run `npm test` directly** - Always use Docker!

---

## Apology

I sincerely apologize for the privacy violation. Tests should **never** have accessed your personal browser or ChatGPT account. All tests are now properly isolated in Docker containers.

---

**Your privacy is paramount. Always use Docker for testing!** 🔒
