// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Google Analytics gtag function
declare function gtag(...args: any[]): void;

export {};