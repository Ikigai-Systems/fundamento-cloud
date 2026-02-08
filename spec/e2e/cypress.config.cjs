const { defineConfig } = require('cypress')

module.exports = defineConfig({
  viewportWidth: 1280,
  viewportHeight: 720,
  allowCypressEnv: false,
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:4000",
    defaultCommandTimeout: 10000,
    supportFile: "cypress/support/index.js",
    excludeSpecPattern: "**/rails_examples/**/*",
  },
  // JUnit reporter configuration for GitHub Actions integration
  reporter: "junit",
  reporterOptions: {
    mochaFile: "../../tmp/cypress-results-[hash].xml",
    toConsole: false,
    outputs: true,
    testCaseSwitchClassnameAndName: true,
    suiteTitleSeparatedBy: " > ",
    useFullSuiteTitle: true,
    jenkinsMode: false,
  },
  trashAssetsBeforeRuns: true,
  downloadsFolder: "../../log/cypress/downloads",
  screenshotsFolder: "../../log/cypress/screenshots",
  videosFolder: "../../log/cypress/videos",
})
