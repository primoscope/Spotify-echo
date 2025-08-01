# Workflow Prompt for EchoTune AI Remediation

## 1. Goal

Your primary goal is to refactor and stabilize the EchoTune AI application by addressing critical security flaws, completing core features, and improving code quality, moving it from its current "Partial Production Ready" state to a secure and fully functional application.

## 2. Context

The EchoTune AI project is a sophisticated music recommendation system. A comprehensive analysis has been performed and is available in `ANALYSIS_REPORT.md`. This report identifies several critical issues, including a major security vulnerability (hardcoded API keys), incomplete core features (UI, LLM integration), and code quality problems (duplicated logic).

You are to follow the prioritized workflow below to address these issues. Refer to `ANALYSIS_REPORT.md`, `PRIORITIZED_TODO.md`, and `CODING_AGENT_GUIDE.md` for additional context.

## 3. Prioritized Workflow

### Task 1: Security Hardening - Remove Hardcoded API Keys (Critical)

1.  **Delete the secrets file:** Delete the file `api keys.txt` from the repository.
2.  **Verify deletion:** After deleting the file, run `ls` to confirm that `api keys.txt` is no longer present.
3.  **Update documentation:** Add a note to the top of the "Security & Privacy" section in `README.md` warning users never to commit secrets to the repository and to use a local `.env` file for API keys.

### Task 2: Stabilize Development Environment - Implement Database Fallback

1.  **Goal:** Implement the SQLite database fallback as described in `PRIORITIZED_TODO.md`.
2.  **Action:** Modify the `src/database/database-manager.js` to use `better-sqlite3` as a fallback if no `MONGODB_URI` or `SUPABASE_URL` is provided in the environment variables.
3.  **Action:** Ensure the application can start without errors in this fallback mode. The server startup log should indicate that it is "Running in fallback mode (SQLite)".
4.  **Verification:** Run the application with no database variables set in a `.env` file and confirm that it starts up and the `/health` endpoint returns a `healthy` status for the database component.

### Task 3: Fix Core Functionality - LLM Provider Integration

1.  **Goal:** Make the conversational AI feature fully functional by properly integrating the LLM providers.
2.  **Action:** Remove the placeholder chat logic from `src/server.js` (the `app.post('/api/chat', ...)` block).
3.  **Action:** Ensure the `/api/chat` route defined in `src/api/routes/chat.js` correctly uses the `LlmProviderManager` to handle chat requests.
4.  **Action:** Implement robust error handling in `src/chat/llm-provider-manager.js`. If an API call to a provider fails (e.g., due to an invalid key), it should automatically try the next provider in the list. If all real providers fail, it must fall back to the `mock-provider`.
5.  **Verification:** Test the chat functionality by setting `DEFAULT_LLM_PROVIDER` to `gemini` in the `.env` file (with a dummy key) and confirming that it gracefully fails over to the mock provider.

### Task 4: Refactor Backend for Maintainability

1.  **Goal:** Improve code quality by removing duplicated logic from `src/server.js`.
2.  **Action:** Move the Spotify authentication logic (`/auth/spotify` and `/auth/callback`) from `src/server.js` into the `src/api/routes/spotify.js` file.
3.  **Action:** Move the Spotify API proxy endpoints (`/api/spotify/recommendations` and `/api/spotify/playlist`) from `src/server.js` into `src/api/routes/spotify.js`.
4.  **Result:** `src/server.js` should be significantly smaller, containing only middleware setup, static file serving, route registration, and server initialization.
5.  **Verification:** After refactoring, run the application and test the Spotify authentication flow and an API call to ensure they still work correctly.

### Task 5: Final Validation - Run All Tests

1.  **Goal:** Ensure that all changes are correct and have not introduced any regressions.
2.  **Action:** Run the entire test suite using the `npm run test` command.
3.  **Action:** If any tests fail, debug and fix the issues until all tests pass.
4.  **Verification:** The output of `npm run test` should show all tests passing.

## 4. Success Criteria

You will be considered successful when:

- [ ] The `api keys.txt` file has been deleted.
- [ ] The application starts and runs without errors using an SQLite fallback when no database credentials are provided.
- [ ] The chat API correctly uses the LLM provider manager and gracefully fails over to the mock provider.
- [ ] The `src/server.js` file has been refactored, and the Spotify authentication and API calls still work.
- [ ] All tests in the test suite (`npm run test`) pass successfully.
- [ ] The `README.md` has been updated with the security warning.
