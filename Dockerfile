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
ENV API_BASE_URL="https://snqajousgi.execute-api.us-east-1.amazonaws.com/prod"
ENV API_KEY=""
ENV TEST_PRIMARY_AGENT_UUID="55b60ec1-a457-11f0-9ad7-9d91fbcd6328"
ENV TEST_CO_AGENT_1_UUID="PLACEHOLDER_CO_AGENT_1_UUID"
ENV TEST_CO_AGENT_2_UUID="PLACEHOLDER_CO_AGENT_2_UUID"

# Expose port (if needed for reports)
EXPOSE 3000

# Default command - run full test suite
CMD ["npm", "run", "fullTest"]
