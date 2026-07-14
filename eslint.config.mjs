// Flat ESLint config for the Jikken monorepo.
//
// typescript-eslint (recommended, non-type-checked for speed) across every
// workspace, plus the two stable React Hooks rules for .tsx. We intentionally
// do NOT spread eslint-plugin-react-hooks' v7 `recommended` set: it now bundles
// React Compiler static-analysis diagnostics (set-state-in-effect, refs,
// preserve-manual-memoization, …) that flag deliberate patterns here — syncing
// the latest callback into a ref, and the scripted tutorial state machine — and
// this project doesn't use the React Compiler. rules-of-hooks + exhaustive-deps
// are the bug-catching pair; enable those and keep the signal clean.
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.d.ts', '**/*.tsbuildinfo'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
);
