if (!window.scrollPositions) {
  window.scrollPositions = {};
}

function preserveScroll () {
  document.querySelectorAll("[data-turbo-keep-scroll]").forEach((element) => {
    scrollPositions[element.id] = element.scrollTop;
  })
}

function restoreScroll (event) {
  document.querySelectorAll("[data-turbo-keep-scroll]").forEach((element) => {
    element.scrollTop = scrollPositions[element.id];
  })

  if (!event.detail.newBody) return
  // event.detail.newBody is the body element to be swapped in.
  // https://turbo.hotwired.dev/reference/events
  event.detail.newBody.querySelectorAll("[data-turbo-keep-scroll]").forEach((element) => {
    element.scrollTop = scrollPositions[element.id];
  })
}

window.addEventListener("turbo:before-render", preserveScroll)
window.addEventListener("turbo:render", restoreScroll)