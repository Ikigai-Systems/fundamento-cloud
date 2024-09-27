const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    defaultCommandTimeout: 10000,
    supportFile: "cypress/support/index.js",
  },
  trashAssetsBeforeRuns: true,
  downloadsFolder: "../../log/cypress/downloads",
  screenshotsFolder: "../../log/cypress/screenshots",
  videosFolder: "../../log/cypress/videos",
})
