# Docker Setup for Playwright Automation Tests

This document explains how to run the Playwright tests using Docker in a **test environment**.

## Test Environment Configuration

This Docker setup is specifically configured for testing purposes:
- `NODE_ENV=test` - Optimized for test execution
- Includes all dev dependencies needed for testing
- Configured for CI/CD test pipelines
- Generates comprehensive test reports and screenshots

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, for easier management)

## Quick Start

### Using Docker directly:

1. **Build the Docker image:**
   ```bash
   docker build -t automation-playwright .
   ```

2. **Run smoke tests:**
   ```bash
   docker run --rm -v $(pwd)/test-results:/app/test-results -v $(pwd)/playwright-report:/app/playwright-report automation-playwright
   ```

3. **Run full test suite:**
   ```bash
   docker run --rm -v $(pwd)/test-results:/app/test-results -v $(pwd)/playwright-report:/app/playwright-report automation-playwright npm run fullTest
   ```

4. **Run regression tests:**
   ```bash
   docker run --rm -v $(pwd)/test-results:/app/test-results -v $(pwd)/playwright-report:/app/playwright-report automation-playwright npm run regression
   ```

### Using Docker Compose:

1. **Run full test suite (default):**
   ```bash
   docker-compose up playwright-tests
   ```

2. **Run full test suite (explicit):**
   ```bash
   docker-compose up playwright-full-tests
   ```

3. **Run regression tests:**
   ```bash
   docker-compose up playwright-regression-tests
   ```

## Test Results

After running the tests, you can find:
- **Test results**: `./test-results/` directory
- **HTML reports**: `./playwright-report/index.html`

## Environment Variables

The Docker container sets the following environment variables:
- `CI=true` - Enables CI mode for Playwright
- `NODE_ENV=test` - Sets Node environment for testing
- `API_BASE_URL` - Base URL for API endpoints (default: https://snqajousgi.execute-api.us-east-1.amazonaws.com/prod)
- `API_KEY` - API key for authentication (must be provided at runtime)
- `TEST_PRIMARY_AGENT_UUID` - Primary agent UUID for transaction tests
- `TEST_CO_AGENT_1_UUID` - Co-agent 1 UUID for transaction tests
- `TEST_CO_AGENT_2_UUID` - Co-agent 2 UUID for transaction tests

### Running with custom environment variables:
```bash
docker run --rm -v $(pwd)/test-results:/app/test-results -v $(pwd)/playwright-report:/app/playwright-report -e API_KEY=your-api-key-here -e API_BASE_URL=https://your-api-url.com -e TEST_PRIMARY_AGENT_UUID=your-agent-uuid automation-playwright npm run fullTest
```

## Customization

### Running specific tests:
```bash
docker run --rm -v $(pwd)/test-results:/app/test-results -v $(pwd)/playwright-report:/app/playwright-report automation-playwright npx playwright test tests/specific-test.spec.ts
```

### Running with different browsers:
```bash
docker run --rm -v $(pwd)/test-results:/app/test-results -v $(pwd)/playwright-report:/app/playwright-report automation-playwright npx playwright test --project=firefox
```

### Interactive debugging:
```bash
docker run -it --rm -v $(pwd)/test-results:/app/test-results -v $(pwd)/playwright-report:/app/playwright-report automation-playwright /bin/bash
```

## Troubleshooting

1. **Permission issues on Linux/Mac:**
   ```bash
   sudo chown -R $USER:$USER test-results playwright-report
   ```

2. **Clear Docker cache:**
   ```bash
   docker system prune -a
   ```

3. **View container logs:**
   ```bash
docker logs automation-playwright-tests
   ```

## CI/CD Integration

This Docker setup is designed to work seamlessly with CI/CD pipelines. The container will:
- Install all dependencies
- Install Playwright browsers
- Run tests in headless mode
- Generate reports and screenshots
- Exit with appropriate status codes
