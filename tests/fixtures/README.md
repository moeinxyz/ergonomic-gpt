# Test Fixtures

This directory contains test fixtures used for automated testing.

## Files

- `chatgpt-snapshot.html` - Static HTML snapshot of ChatGPT for offline testing
- Other mock data and test files as needed

## Usage

Fixtures are used to:
1. Test without requiring live ChatGPT access
2. Ensure consistent test conditions
3. Speed up test execution
4. Enable offline development

## Updating Fixtures

To update the ChatGPT snapshot:
1. Visit ChatGPT in your browser
2. Save the page as HTML (complete page)
3. Replace `chatgpt-snapshot.html`
4. Update tests if DOM structure has changed
