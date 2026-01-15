module.exports = {
  root: false,
  env: {
    "cypress/globals": true
  },
  extends: [
    "plugin:cypress/recommended"
  ],
  plugins: [
    "cypress"
  ],
  rules: {
    // Cypress-specific rule overrides if needed
  }
};
