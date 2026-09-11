import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kurio: {
          night: '#140D0A',
          surface: '#241612',
          raised: '#2E1B14',
          line: '#3A251C',
          accent: '#E09550',
          flame: '#D28A4C',
          cream: '#F5F1EB',
          tan: '#CFB28C',
          mint: '#E4EBDD',
        },
      },
      fontFamily: {
        display: [
          '"Roboto Mono"',
          'ui-monospace',
          '"Cascadia Mono"',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
