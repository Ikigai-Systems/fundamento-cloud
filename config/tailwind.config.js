// // // // const defaultTheme = require('tailwindcss/defaultTheme')
// const {addDynamicIconSelectors} = require('@iconify/tailwind');

module.exports = {
  content: [
    './public/*.html',
    './app/helpers/**/*.rb',
    './app/javascript/**/*.{js,ts,jsx,tsx}',
    './app/views/**/*.{erb,haml,html,slim}',
    './app/components/**/*.{erb,haml,html,slim}',
  ],
  theme: {
    extend: {
      fontFamily: {
// // // //         sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'primary-blue': {
          '50': '#eff8ff',
          '100': '#def0ff',
          '200': '#b6e3ff',
          '300': '#75cfff',
          '400': '#2cb7ff',
          '500': '#00a2ff',
          '600': '#007dd4',
          '700': '#0063ab',
          '800': '#00538d',
          '900': '#064674',
          '950': '#042c4d',
        },
        'secondary-blue': {
          '50': '#f0f7ff',
          '100': '#e0effe',
          '200': '#b9defe',
          '300': '#7cc5fd',
          '400': '#36a8fa',
          '500': '#0c8deb',
          '600': '#0066ba',
          '700': '#0157a3',
          '800': '#064b86',
          '900': '#0b3f6f',
          '950': '#07284a',
        },
        'primary-orange': {
          '50': '#fff9ec',
          '100': '#fff1d2',
          '200': '#ffdea4',
          '300': '#ffc66b',
          '400': '#ffa22f',
          '500': '#ff8407',
          '600': '#f96700',
          '700': '#d95100',
          '800': '#a33d09',
          '900': '#83340b',
          '950': '#471803',
        },
        'secondary-orange': {
          '50': '#fffeea',
          '100': '#fffac5',
          '200': '#fff685',
          '300': '#ffea46',
          '400': '#ffdb1b',
          '500': '#ffbb00',
          '600': '#e29000',
          '700': '#bb6502',
          '800': '#984e08',
          '900': '#7c400b',
          '950': '#482100',
        },
      },
      keyframes: {
        'fade-out': {
          '0%': { opacity: 1 },
          '66%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
      },
      animation: {
        fadeout: 'fade-out 1.5s ease-out',
        }
    },
    // leaving commented out, might become useful in future iterations
    // data: {
    //   checked: 'ui~=checked'
    // },
  },
  plugins: [
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
    // require('@tailwindcss/container-queries'),
    // addDynamicIconSelectors(),
  ]
}
