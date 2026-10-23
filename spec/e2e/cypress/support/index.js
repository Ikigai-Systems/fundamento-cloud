// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import actions.js using ES2015 syntax:
// import 'cypress-on-rails/support/index'
import './commands'
import './on-rails'
import './device'
import './page-health'
import './sidebars'
import 'cypress-real-events'

Cypress.on('uncaught:exception', (err, runnable, promise) => {
  // when the exception originated from an unhandled promise
  // rejection, the promise is provided as a third argument
  // you can turn off failing the test in this case
  if (promise) {
    // debugger;

    return false
  }
  // The browser reports this when a ResizeObserver callback changes layout and the next
  // notifications slip to the following frame. It is harmless; BlockNote's suggestion menu
  // (0.56+) measures itself this way and triggers it whenever the menu opens.
  if (err.message.includes("ResizeObserver loop")) {
    return false
  }
  // we still want to ensure there are no other unexpected
  // errors, so we let them fail the test
})

// Alternatively you can use CommonJS syntax:
// require('./commands')
