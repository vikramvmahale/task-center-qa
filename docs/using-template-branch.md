## Using the `template-automation-tests` Branch to Create a New Project

This document explains how to create a **new automation project** from the dedicated `template-automation-tests` branch in this repository.

These steps assume:

-- The `template-automation-tests` branch already exists and contains the latest template code.
- You have read access to the original repository and (optionally) write access to a new repository where the project will live.

---

## 1. Create a new project from the `template-automation-tests` branch

To start a new automation project based on the template:

### 1.1 Clone and check out the template branch

```bash
# Clone the original repo into a new directory
git clone <original-repo-url> my-new-project
cd my-new-project

# Switch to the template branch
git checkout template-automation-tests
```

At this point you have a working copy of the template code (from `template-automation-tests`).

### 1.2 Detach or re-point to a new remote (recommended)

If the new project should live in a **different repository**:

```bash
# Remove the original remote
git remote remove origin

# Initialize a new remote repository (e.g. on GitHub/Bitbucket) and add it
git remote add origin <new-project-repo-url>

# Create a main branch for the new project
git checkout -b main
git push -u origin main
```

Now the new project is independent from the original template’s remote, but it still contains all the template code and history.

If you prefer a completely fresh history, you can instead:

```bash
rm -rf .git
git init
git add .
git commit -m "Initial commit from automation test template"
git remote add origin <new-project-repo-url>
git push -u origin main
```

---

## 2. Customize the new project

Once you have your new project repo, work through these common customization steps:

1. **Rename the project**
   - Update `package.json`:
     - `"name"` → a project-specific name.
     - `"description"`, `"author"`, and any metadata.

2. **Set environment variables and config**
   - Update or replace any `TASK_CENTER_*` / `APP_*` env vars to match the new application:
     - Auth URL (e.g. `APP_AUTH_URL` for Okta or other IdP).
     - Application base URLs (UI and API).
     - Test credentials and display names.
   - Adjust `utils/config/environment-config.ts` if you add new environments.

3. **Rename or replace app-specific code**
   - Update page objects (`ChatPagePO`, `AuthPagePO`, etc.) to match the new application's DOM.
   - Update API endpoints (`CheckFileApi`, `ApiManager`) to point at the new service and implement new endpoints.
   - Adjust tests under `tests/api` and `tests/ui` to target the new application behavior.

4. **Review CI/CD and Docker**
   - Update `docker-compose.yml`, `DOCKER.md`, and `Jenkinsfile` to use new image names, project identifiers, and registries appropriate for the new project.

5. **Re-run tests**
   - After each customization step, run:

     ```bash
     npm install        # if needed
     npx playwright test --config=playwright.config.ts
     ```

   - Fix any failing tests by updating locators, URLs, or configuration for the new app.

---

Once these steps are complete, you can treat the new repository like any other project: create feature branches, add new tests/APIs/page objects, and evolve the automation independently of the original template.


