# Testing Rules

Pyramid
- Unit > Integration >> E2E. Keep E2E small and critical-path only.

Jest
- Single config at `tests/jest.config.js`. Run in-band on CI: `--runInBand`.
- Use `tests/setup.js` for global setup/teardown.

E2E (Optional)
- Prefer Playwright MCP or Browserbase MCP for UI flows when browsers are present.
- Keep flows deterministic; avoid network flakiness and sleep-based waits.

Coverage
- Track only core `src/` and server entrypoints. Exclude generated code and test helpers.