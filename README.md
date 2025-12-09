# Task Center QA Automation

This repository contains the automation test suite for **Task Center**, built with Playwright and TypeScript.

### What is this repository for? ###

* Automated UI and API testing for Task Center
* End-to-end functional test coverage
* Continuous integration test execution

### How do I get set up? ###

* Install dependencies: `npm install`
* Configure environment variables (see environment config files)
* Run tests: `npm run test:all` or use specific test scripts
* See `package.json` for available test scripts

### Test Structure ###

* `tests/ui/` - UI page tests
* `tests/api/` - API endpoint tests
* `tests/functional/` - End-to-end functional tests

### Contribution guidelines ###

* Follow the patterns in `docs/automation-testing-guidelines.md`
* Use Page Object Model (POM) for UI tests
* Tag tests appropriately (`@ui`, `@api`, `@functional`)

### Who do I talk to? ###

* Repo owner or admin
* eXp Realty QA Team