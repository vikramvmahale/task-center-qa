// Global type declaration to allow string indexing on Object types
// This suppresses false positive errors when accessing properties on objects
// returned from JavaScript modules without TypeScript types

declare global {
    interface Object {
        [key: string]: any;
    }
}

export {};

