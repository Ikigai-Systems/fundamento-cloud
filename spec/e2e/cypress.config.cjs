const { defineConfig } = require('cypress')
const os = require('os')
const { DEVICES } = require('./cypress/support/devices.cjs')

module.exports = defineConfig({
  viewportWidth: 1280,
  viewportHeight: 720,
  // Cypress 16 dropped the default keystrokeDelay from 10ms to 0. BlockNote's
  // suggestion menus (`/` for slash commands, `@` for mentions) open from a
  // ProseMirror plugin via a React state update, so a burst of keystrokes with
  // no delay -- `cy.type("/table")` -- lands the whole query before the menu
  // exists and `.bn-suggestion-menu` never appears. Restore the Cypress 15
  // cadence rather than sprinkling `{ delay: 10 }` across the specs.
  keystrokeDelay: 10,
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:4000",
    defaultCommandTimeout: 10000,
    supportFile: "cypress/support/index.js",
    excludeSpecPattern: "**/rails_examples/**/*",
    setupNodeEvents(on, config) {
      // `--expose device=phone` runs the suite as a touch device. The viewport and user agent
      // have to be set here, before the browser launches; touch itself is switched on per
      // test in support/device.js.
      config.expose = config.expose || {}
      const deviceName = config.expose.device || "desktop"
      const device = DEVICES[deviceName]
      if (!device) {
        throw new Error(`Unknown device "${deviceName}". Known: ${Object.keys(DEVICES).join(", ")}`)
      }
      config.viewportWidth = device.viewport.width
      config.viewportHeight = device.viewport.height
      if (device.userAgent) config.userAgent = device.userAgent
      config.expose.device = deviceName
      config.expose.touch = device.touch
      config.screenshotsFolder = `${config.screenshotsFolder}/${deviceName}`
      // CI publishes each device as its own check, matched by file name, so a phone run must
      // not write into the desktop report's `cypress-results-*.xml` pattern.
      if (deviceName !== "desktop") {
        config.reporterOptions = {
          ...config.reporterOptions,
          mochaFile: `../../tmp/cypress-${deviceName}-results-[hash].xml`,
        }
      }

      // Linux/Wayland: force XWayland mode to avoid rendering artifacts
      if (os.platform() === "linux") {
        on("before:browser:launch", (browser, launchOptions) => {
          if (browser.family === "chromium" && browser.name !== "electron") {
            launchOptions.args.push("--ozone-platform=x11")
          }
          return launchOptions
        })
      }

      return config
    },
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
