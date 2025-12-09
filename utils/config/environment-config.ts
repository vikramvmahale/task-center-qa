/**
 * Environment Configuration Loader
 * 
 * This file manages environment-specific configuration.
 * It loads the appropriate environment configuration based on the current environment.
 * 
 * Usage:
 *   import { getEnvironmentConfig } from '../../utils/config/environment-config';
 *   const env = getEnvironmentConfig();
 *   const testUrl = env.testUrl;
 */

import { testEnvironment, TestEnvironment } from './environments/test';
import { accpEnvironment, AccpEnvironment } from './environments/accp';

// Union type for all environment configurations
type EnvironmentConfig = TestEnvironment | AccpEnvironment;

// Map of available environments
const environments: Record<string, EnvironmentConfig> = {
    test: testEnvironment,
    accp: accpEnvironment
    // Future environments can be added here:
    // dev: devEnvironment,
    // staging: stagingEnvironment,
    // prod: prodEnvironment
};

/**
 * Gets the current environment name from process.env or defaults to 'test'
 */
function getCurrentEnvironmentName(): string {
    return process.env.TEST_ENV || process.env.NODE_ENV || 'test';
}

/**
 * Gets the configuration for the current environment
 * @returns {EnvironmentConfig} Environment configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
    const envName = getCurrentEnvironmentName();
    const envConfig = environments[envName];
    
    if (!envConfig) {
        throw new Error(
            `Environment "${envName}" not found. ` +
            `Available environments: ${Object.keys(environments).join(', ')}`
        );
    }
    
    return envConfig;
}

/**
 * Gets the current environment name
 * @returns {string} Current environment name
 */
export function getCurrentEnvironment(): string {
    return getCurrentEnvironmentName();
}

// Export all environment configurations for advanced usage
export { environments };

