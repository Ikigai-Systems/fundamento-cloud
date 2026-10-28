// A response without a matching <turbo-frame> (the static 404 page, an error page, a redirect
// to a full-page screen) would leave the frame showing only "Content missing". Show it as a
// regular full-page visit instead.
document.addEventListener("turbo:frame-missing", (event) => {
  event.preventDefault()
  event.detail.visit(event.detail.response)
})
