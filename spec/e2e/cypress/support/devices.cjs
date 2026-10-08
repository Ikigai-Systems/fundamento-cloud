// Device profiles for `cypress run --env device=<name>`. Shared by cypress.config.cjs
// (viewport, user agent) and support/device.js (touch emulation), hence CommonJS.
//
// The engine is always Chromium, so the phone and tablet claim to be Android Chrome.
// An iPhone user agent would make libraries that sniff for iOS (ProseMirror does) take
// Safari code paths inside Chrome — a combination no real user has. Safari-specific
// behaviour needs a real WebKit: see the touch-and-small-screen plan.
const ANDROID_PHONE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36"
const ANDROID_TABLET_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"

const DEVICES = {
  desktop: { viewport: { width: 1280, height: 720 }, touch: false },
  phone: { viewport: { width: 390, height: 844 }, touch: true, userAgent: ANDROID_PHONE_UA },
  tablet: { viewport: { width: 820, height: 1180 }, touch: true, userAgent: ANDROID_TABLET_UA },
}

module.exports = { DEVICES }
