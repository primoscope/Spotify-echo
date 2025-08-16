# Frontend Rules (React + Vite)

Architecture
- Use functional components and hooks. Keep components pure; side effects in `useEffect` with correct deps.
- Co-locate styles and tests with components. Prefer CSS-in-JS via MUI emotion already in dependencies.
- Routing via `react-router-dom`. Lazy-load heavy routes.

State Management
- Prefer local state and context. Avoid global stores unless necessary.
- Derive state, don’t duplicate. Memoize expensive selectors with `useMemo`.

Data Fetching
- Use `fetch` or `axios` with abort signals. Handle loading/error states explicitly.
- Cache frequently used data in memory; respect server rate limits.

Performance
- Split chunks via Vite defaults. Use `React.Suspense` for code-splitting UX.
- Avoid unnecessary re-renders: stable deps, `useCallback`, keying lists.

Accessibility
- Provide alt text, labels, and keyboard navigation for interactive elements.
- Use semantic HTML and ARIA attributes as needed.

Testing
- Unit/UI tests with Jest + Testing Library patterns. Keep DOM queries role-first.
- Snapshot tests only for stable, low-entropy UI.

CI Quality Gates
- Run `npm run lint` and `npm run test:unit -- -i` before merge.