const defaultTheme = require('tailwindcss/defaultTheme')
const {addDynamicIconSelectors} = require('@iconify/tailwind');

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
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
    },
    // leaving commented out, might become useful in future iterations
    // data: {
    //   checked: 'ui~=checked'
    // },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
    addDynamicIconSelectors(),
  ]
}
