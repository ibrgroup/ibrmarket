import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      maxWidth: {
        'max-containers': '1200px',
      },
    },
  },
  plugins: [],
};

export default config; // вместо module.exports