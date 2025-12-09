# Use the official Playwright image as base
# This image includes all necessary browser dependencies for testing
FROM mcr.microsoft.com/playwright:v1.56.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for testing)
RUN npm ci

# Install Playwright browsers
RUN npx playwright install --with-deps

# Accept environment build argument
ARG ENVIRONMENT=dev

# Copy source code
COPY . .

# Create directories for test results and reports
RUN mkdir -p test-results playwright-report

# Set environment variables
ENV CI=true
ENV NODE_ENV=test
ENV ENVIRONMENT=${ENVIRONMENT}

# API configuration environment variables (can be overridden at runtime)
# These can be set via docker-compose or at runtime
ENV TEST_ENV=accp

# Expose port (if needed for reports)
EXPOSE 3000

# Default command - run full test suite
CMD ["npm", "run", "fullTest"]
