// Global type declaration to allow string indexing on Object types
// This suppresses false positive errors when accessing properties on objects
// returned from JavaScript modules without TypeScript types

declare global {
    interface Object {
        [key: string]: any;
    }
    const process: { env: Record<string, string | undefined> };
    const __dirname: string;
}

// Minimal Node.js module declarations (when @types/node is not resolved)
declare module 'path' {
    function resolve(...paths: string[]): string;
    const sep: string;
    const __esModule: boolean;
    export { resolve, sep };
}

// Playwright test - use 'any' so test/expect are usable (avoids "unknown" type errors)
declare module '@playwright/test' {
    export const test: any;
    export const expect: any;
    export type Page = any;
    export type BrowserContext = any;
    export type Locator = any;
    export type APIRequestContext = any;
    export function defineConfig(config: any): any;
    export const devices: Record<string, any>;
}

export {};

