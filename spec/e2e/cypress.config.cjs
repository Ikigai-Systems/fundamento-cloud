const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:4000",
    defaultCommandTimeout: 10000,
    supportFile: "cypress/support/index.js",
    excludeSpecPattern: "**/rails_examples/**/*",
  },
  trashAssetsBeforeRuns: true,
  downloadsFolder: "../../log/cypress/downloads",
  screenshotsFolder: "../../log/cypress/screenshots",
  videosFolder: "../../log/cypress/videos",
})
