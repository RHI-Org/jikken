/**
 * Minimal ambient declarations for the Node built-ins this CLI touches.
 *
 * The repo has no @types/node installed (root package-lock only lists it as
 * an *optional* peer of other tooling), and installing it is out of scope
 * for this surface. `tsx` doesn't typecheck at runtime, but `tsc --noEmit`
 * does, so these shims exist purely to satisfy strict compilation without
 * pulling in a dependency. Keep this file's surface area to exactly what
 * src/index.ts and src/formatter.ts use.
 */

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function existsSync(path: string): boolean;
}

declare module 'node:path' {
  export function resolve(...parts: string[]): string;
  export function dirname(path: string): string;
  export function join(...parts: string[]): string;
}

declare module 'node:url' {
  export function fileURLToPath(url: string): string;
}

declare const process: {
  argv: string[];
  exit(code?: number): never;
  env: Record<string, string | undefined>;
};

declare const console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
};

declare const __filename: string;
