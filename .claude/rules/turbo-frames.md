# Turbo frames

A link **inside** a turbo-frame with `data-turbo-frame="other_frame"` navigates that other frame
natively, however deeply it is nested. No Stimulus controller is needed; one was shipped on the
opposite belief and later deleted.

Why it looks unsupported: `clickEventIsSignificant` checks
`element.closest("turbo-frame, html") == this.element`, so the session-level `FrameRedirector`
(whose element is `html`) ignores links inside frames. But the link's own frame has a
`FrameController` for which the click *is* significant; `#shouldInterceptNavigation` looks the
target up with `document.getElementById` (global) and routes the visit there. `target` on the frame
element goes through the same expression.

Before writing a workaround for Turbo frame behaviour, read
`node_modules/@hotwired/turbo/dist/turbo.es2017-esm.js` (`FrameController`, `FrameRedirector`,
`LinkInterceptor`) and test the plain-HTML version first. `frame-navigation.cy.js` covers sidebar
links targeting `content`.
