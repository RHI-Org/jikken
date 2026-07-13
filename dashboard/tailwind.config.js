/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../shared/src/**/*.ts',
  ],
  // Belt-and-suspenders: COLORS.*.bg/.border/.text in @jikken/shared are the
  // canonical status classes. The content glob above should already catch
  // them (they're string literals in shared/src/constants.ts), but the
  // safelist guarantees they survive purge even if that file moves.
  safelist: [
    'bg-green-200', 'border-green-500', 'text-green-700',
    'bg-red-200', 'border-red-500', 'text-red-700',
    'bg-yellow-200', 'border-yellow-500', 'text-yellow-700',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
