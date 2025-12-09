## Automation Testing Guidelines - Task Center

This document captures the key patterns and best practices from the existing automation in this repository so we can apply them consistently when building tests, APIs, and page objects for this and future projects.

---

### 1. Project structure and naming

- **Top-level layout**
  - `api/` – API client, API manager, and one class per endpoint under `api/endpoints`.
  - `PageObjects/` – One Page Object (PO) class per UI page, plus `POManager`.
  - `tests/api/` – Endpoint-level API tests, one file per endpoint: `XxxApiTests.spec.ts`.
  - `tests/ui/` – Page-level UI tests: `XxxPageTests.spec.ts`.
  - `tests/functional/` – End-to-end flows that span multiple pages/APIs.
  - `utils/` – Shared helpers, configuration, factories, presets.

- **Naming conventions**
  - **API layer**
    - Base client: `ApiClient.ts`
    - Manager: `ApiManager.ts`
    - Endpoint classes: `endpoints/ChatStreamApi.ts`, `endpoints/SomeFeatureApi.ts`
    - Tests: `tests/api/ChatStreamApiTests.spec.ts`
  - **UI layer**
    - Page objects: `ChatPagePO.ts`, `SomeOtherPagePO.ts`
    - Tests: `tests/ui/ChatPageTests.spec.ts`
  - **Managers**
    - Page objects: `POManager.ts`
    - APIs: `ApiManager.ts`

When adding new features, follow this structure so tests and code stay discoverable.

---

### 2. Page Object (PO) design

Each page object should encapsulate a single logical page or feature, with a consistent internal structure.

- **Constructor responsibilities**
  - Accept a `Page` instance.
  - Declare all `Locator` fields up front, grouped by section:
    - Layout / containers
    - Header / navigation
    - Main content
    - Forms / filters / tables
    - Footer / misc
  - **Locator priority (enforced best practice):**
    1. `page.getByRole(...)` with accessible names where possible.
    2. `page.getByTestId(...)` when a stable `data-testid` exists.
    3. `page.getByText(...)` / `locator('text=...')` only when roles/ids are not available.
    4. `page.locator('css-selector')` as a last resort.
    5. **Do not use XPath** for new code; prefer Playwright’s `getBy*` APIs for stability and readability.

- **Class organization**
  - **Locators** – declared as `readonly` fields at the top.
  - **Assertions** – methods named `expect...` that wrap Playwright `expect` calls, e.g.:
    - `expectOnPage()` – verifies the page is loaded.
    - `expectGreetingForUser(name: string)`.
    - `expectLoggedInUser(name: string)`.
  - **Actions** – methods that perform user flows without hard assertions:
    - `sendMessage(message: string)`
    - `clickNewChat()`
    - `setPropertyAddressFilter(address: string)`
  - **Getters / utilities** – methods that read data or encapsulate waiting logic:
    - `getLoggedInUserName()`
    - `getRecentChatTitles()`
    - `waitForPageLoad()`

- **Guidelines**
  - Tests should **never** reach directly into `page.locator` – always go through a PO.
  - Keep side-effect-free operations (`get...`, `expect...`) separate from actions (`click...`, `set...`).
  - When reading from dynamic content (tables, lists), always:
    - Wait for the container and `tbody` to be visible.
    - Wait for at least one row/cell to be attached before reading text.

---

### 3. `POManager` usage

`POManager` centralizes PO construction so tests can access pages consistently.

- **Pattern**
  - Fields:
    - `private transactionDashboardPage: TransactionDashboardPagePO;`
    - `private transactionDetailsPage: TransactionDetailsPagePO;`
    - `private chatPage: ChatPagePO;`
    - `private authPage?: AuthPagePO;`
  - Constructor:
    - Initialize all page objects with the shared `Page` instance.
  - Methods:
    - `getTransactionDashboardPage(): TransactionDashboardPagePO`
    - `getTransactionDetailsPage(): TransactionDetailsPagePO`
    - `getChatPage(): ChatPagePO`
    - `getAuthPage(authUrl: string): AuthPagePO`

- **Guidelines**
  - When adding a new page PO, add:
    1. A new private field to `POManager`.
    2. Initialization in the constructor.
    3. A `getXxxPage()` method that returns the PO.
  - Tests should construct `POManager` once per fixture (`const pOManager = new POManager(page);`) and use its getters.

---

### 4. Test organization and tagging

- **Test file layout**
  - Each file starts with a high-level `test.describe('<Feature> Tests', () => { ... })`.
  - Within that, group related tests into nested `describe` blocks:
    - e.g., `describe('Page Load and Basic Elements')`, `describe('Error Handling')`, etc.
  - Use `beforeEach` (or `beforeAll` when appropriate) to perform common setup:
    - Authentication (Okta / token)
    - Navigation to the page under test
    - `expectOnPage()` assertion

- **Tagging**
  - Use tags to classify tests:
    - `@ui` – UI/page tests
    - `@api` – API/endpoint tests
    - `@functional` – cross-feature or end-to-end flows
    - Additional tags (`@smoke`, `@regression`, `@bug`) can be added as needed.
  - Example:
    - `test('should load chat page', { tag: ['@ui'] }, async ({ page }) => { ... });`

---

### 5. API client and endpoint patterns

The API layer is split into three levels: `ApiClient`, `ApiManager`, and per-endpoint classes.

- **`ApiClient`**
  - Single responsibility: HTTP transport and authentication.
  - Typical usage pattern:
    - Configure a base URL for the application API (for example, `https://test-agent-platform-model-api.example.com`).
    - Use Bearer token auth via `Authorization: Bearer <token>` when appropriate.
    - Provide `get`, `post`, `put`, `delete` methods that return a shared `ApiResponse` type.
    - Log request/response metadata for debugging.
    - Support both JSON responses and raw text responses (e.g., for streaming/chat endpoints).

- **`TokenManager`**
  - Handles fetching and caching Bearer tokens from an auth provider (e.g. Cognito `/oauth2/token`).
  - Caches token + expiry with a safety buffer; reused by all API calls in a worker.

- **`ApiManager`**
  - Owns a shared `TokenManager` (static per Playwright worker).
  - Constructs all endpoint classes (e.g. `ChatStreamApi`).
  - Exposes `getXxxApi()` methods and an `ensureAuthenticated()` helper to set the Bearer token on `ApiClient` before use.

- **Endpoint classes (`*Api.ts`)**
  - One class per endpoint or grouped resource:
    - e.g. `ChatStreamApi` with `chatStream()` and request helpers.
  - Keep endpoint-specific logic here:
    - Request body builders (e.g. `createChatStreamRequest`, `createDefaultChatStreamRequest`).
    - Response validators (e.g. `validateChatStreamResponse`).
    - Data extractors (e.g. `extractResponseText`).

- **Guidelines for adding endpoints**
  1. Implement a new `XxxApi` class under `api/endpoints/`:
     - Provide methods for each REST operation.
     - Add helpers for common request shapes and response validation.
  2. Register it in `ApiManager` and add `getXxxApi()`.
  3. Write tests under `tests/api/XxxApiTests.spec.ts` that:
     - Use `ApiManager` + `ensureAuthenticated()`.
     - Cover at least one success path and one or two error/edge cases.

---

### 6. Configuration, test data, and environments

- **Environment configuration**
  - Use `utils/config/environment-config.ts` (or an equivalent helper) to select environment-specific values (URLs, credentials, etc.) based on `TEST_ENV` / `NODE_ENV`.
  - Keep secrets and URLs in environment variables when possible. A common pattern is to use a project-specific prefix, for example:
    - `APP_AUTH_URL` – application auth entry (e.g., Okta) URL.
    - `APP_UI_BASE_URL` or `APP_CHAT_PATH` – base UI URL or specific page path (such as `/chat`).
    - `APP_UI_USER` / `APP_UI_PASSWORD` – UI login credentials.
    - `APP_USER_NAME` – expected display name (for greeting/user header assertions).
    - `APP_API_BASE_URL`, `APP_API_KEY`, etc. – for API layer configuration.
  - **Note:** In this repository, Task Center uses environment variables prefixed with `TASK_CENTER_` or `APP_` following this pattern. Keep the same configuration approach for consistency.

- **Test data helpers**
  - For complex request bodies or domain objects, prefer factories or helper methods rather than inline literals:
    - API example: `ChatStreamApi.createDefaultChatStreamRequest(question, uuid, username)`.
    - In future, a `ChatTestDataFactory` (similar to `TransactionTestDataFactory`) can encapsulate common chat scenarios.

---

### 7. Error handling and diagnostics

Good diagnostics make it easier to debug failing tests:

- **API layer**
  - Log request URL and masked auth headers before calls.
  - Log status and minimal response info after calls.
  - For parsing issues, catch and log parse errors but still return a structured `ApiResponse` when possible.

- **Page objects**
  - On complex operations (e.g. reading table rows), log counts and cell contents when something fails.
  - Use `expect` within POs for `expect...` methods only; actions should generally not assert.

- **Tests**
  - Include at least one explicit “error handling” or “edge case” section per endpoint/page:
    - Example patterns:
      - Invalid row index / card type handling in UI.
      - Invalid request body / invalid identifiers in API tests.

---

### 8. How to extend this for new features and projects

When building new functionality—either in this repository or in a new project—follow this checklist:

1. **New endpoint (API):**
   - Add `XxxApi.ts` in `api/endpoints/`.
   - Register it in `ApiManager` and add `getXxxApi()`.
   - Add tests in `tests/api/XxxApiTests.spec.ts` with `@api` tag.

2. **New page (UI):**
   - Add `XxxPagePO.ts` in `PageObjects/`.
   - Wire it into `POManager` via a new field + `getXxxPage()`.
   - Add tests in `tests/ui/XxxPageTests.spec.ts` with `@ui` tag.
   - Keep test setup in `beforeEach` (auth + navigation + `expectOnPage()`).

3. **Auth changes:**
   - Update `AuthPagePO` (or the relevant auth helper) if the login or auth flow changes, rather than updating each test directly.

4. **Shared behavior:**
   - Add new helpers or factories under `utils/` rather than duplicating logic across tests.

By preserving these patterns, you can safely evolve or replace applications while keeping a consistent, maintainable automation architecture.


