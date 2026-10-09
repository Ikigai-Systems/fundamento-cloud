import { isTouch } from "./device"

// `cy.checkPageHealth()` — generic problems that make a page broken on some device
// without any one spec asserting against them. Call it once the page has settled.
//
// Checks (each can be turned off with `{ <name>: false }`):
// - overflow:           the page scrolls sideways, or a visible element is cut by a
//                       viewport edge (the clipped flash banner on phones)
// - invisibleClickable: on touch, a tappable element with opacity 0 (hover-revealed
//                       buttons that a finger hits without seeing them)
// - tapTargets:         on touch, a control smaller than 24×24px (WCAG 2.5.8)
// - failedRequests:     any response of 400 or more in this document, via the Resource
//                       Timing API (a rejected form submission otherwise fails silently)
// - consoleErrors:      console.error calls since the page loaded
//
// `ignore` takes selectors whose subtrees are exempt, for known issues with a follow-up.
// `allowStatuses` lists response codes a spec expects (e.g. [404]).

// Stimulus wires taps onto plain elements too (the sidebar toggle strip is a <div>), so
// anything with a click action counts as a control.
const INTERACTIVE = "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=link], [role=menuitem], [data-action*='click->']"

// WCAG 2.5.8 minimum. Apple and Google recommend 44 and 48; 24 is the line below which
// a control is a defect rather than a polish item.
const MIN_TARGET = 24

Cypress.on("window:before:load", (win) => {
  win.__consoleErrors = []
  const original = win.console.error
  win.console.error = (...args) => {
    win.__consoleErrors.push(args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(" "))
    original.apply(win.console, args)
  }
})

const describeElement = (el) => {
  const id = el.id ? `#${el.id}` : ""
  const classes = [...el.classList].slice(0, 3).map((c) => `.${c}`).join("")
  const label = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)
  return `<${el.tagName.toLowerCase()}${id}${classes}>${label ? ` "${label}"` : ""}`
}

const isRendered = (win, el) => {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  const style = win.getComputedStyle(el)
  return style.visibility !== "hidden" && style.display !== "none"
}

const effectiveOpacity = (win, el) => {
  let opacity = 1
  for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
    opacity *= parseFloat(win.getComputedStyle(node).opacity)
  }
  return opacity
}

// An ancestor that clips horizontally means overflow beyond it is invisible and harmless
// (scrollable tables, truncated titles), so only elements with no such ancestor count.
const clippedByAncestor = (win, el) => {
  for (let node = el.parentElement; node && node !== win.document.body; node = node.parentElement) {
    const overflowX = win.getComputedStyle(node).overflowX
    if (overflowX !== "visible") return true
  }
  return false
}

const isIgnored = (el, ignore) => ignore.some((selector) => el.closest(selector))

const findOverflow = (win, ignore) => {
  const doc = win.document.documentElement
  const viewportWidth = doc.clientWidth
  const problems = []

  if (doc.scrollWidth > viewportWidth + 1) {
    problems.push(`page scrolls sideways: content is ${doc.scrollWidth}px wide in a ${viewportWidth}px viewport`)
  }

  // Elements fully off-screen are deliberately hidden (a closed drawer). Only an element
  // straddling an edge is cut in half — that is the defect.
  win.document.body.querySelectorAll("*").forEach((el) => {
    if (!isRendered(win, el) || isIgnored(el, ignore) || effectiveOpacity(win, el) === 0) return
    const rect = el.getBoundingClientRect()
    const cutLeft = rect.left < -1 && rect.right > 1
    const cutRight = rect.left < viewportWidth - 1 && rect.right > viewportWidth + 1
    if ((cutLeft || cutRight) && !clippedByAncestor(win, el)) {
      problems.push(`${describeElement(el)} is cut by the viewport edge (x ${Math.round(rect.left)}…${Math.round(rect.right)} of ${viewportWidth})`)
    }
  })

  // A cut container reports every descendant too; keep the outermost few.
  return problems.slice(0, 10)
}

const interactiveInViewport = (win, ignore) => {
  const { clientWidth, clientHeight } = win.document.documentElement
  return [...win.document.querySelectorAll(INTERACTIVE)].filter((el) => {
    if (!isRendered(win, el) || isIgnored(el, ignore) || el.disabled) return false
    if (win.getComputedStyle(el).pointerEvents === "none") return false
    const rect = el.getBoundingClientRect()
    return rect.right > 0 && rect.bottom > 0 && rect.left < clientWidth && rect.top < clientHeight
  })
}

const isTransparent = (color) => color === "transparent" || /rgba\(.*,\s*0\)$/.test(color)

// True when an element draws nothing of its own and every child is invisible: a hit area
// with no visual, like the sidebar toggle strip whose only child is an opacity-0 chevron.
const paintsNothing = (win, el) => {
  const style = win.getComputedStyle(el)
  if (parseFloat(style.opacity) === 0) return true
  if (!isTransparent(style.backgroundColor) || style.backgroundImage !== "none" || style.boxShadow !== "none") return false
  if (["Top", "Right", "Bottom", "Left"].some((side) => parseFloat(style[`border${side}Width`]) > 0 && !isTransparent(style[`border${side}Color`]))) return false
  if ([...el.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim())) return false
  // Font Awesome and similar icon fonts draw through a pseudo-element
  if (["::before", "::after"].some((pseudo) => !["none", "normal"].includes(win.getComputedStyle(el, pseudo).content))) return false
  if (["IMG", "SVG", "INPUT", "SELECT", "TEXTAREA", "CANVAS", "VIDEO"].includes(el.tagName.toUpperCase())) return false
  return [...el.children].every((child) => !isRendered(win, child) || paintsNothing(win, child))
}

const findInvisibleClickable = (win, ignore) =>
  interactiveInViewport(win, ignore)
    .filter((el) => el !== win.document.body)
    .filter((el) => effectiveOpacity(win, el) === 0 || paintsNothing(win, el))
    .map((el) => `${describeElement(el)} is tappable but invisible (nothing shows until hovered)`)

const findSmallTargets = (win, ignore) =>
  interactiveInViewport(win, ignore)
    // WCAG exempts links inside a sentence; their size is set by the text around them.
    .filter((el) => win.getComputedStyle(el).display !== "inline")
    .filter((el) => effectiveOpacity(win, el) > 0)
    .filter((el) => {
      const rect = el.getBoundingClientRect()
      return rect.width < MIN_TARGET || rect.height < MIN_TARGET
    })
    .map((el) => {
      const rect = el.getBoundingClientRect()
      return `${describeElement(el)} is ${Math.round(rect.width)}×${Math.round(rect.height)}px, below the ${MIN_TARGET}px minimum`
    })

const findFailedRequests = (win, allowStatuses) =>
  [...win.performance.getEntriesByType("navigation"), ...win.performance.getEntriesByType("resource")]
    .filter((entry) => entry.responseStatus >= 400 && !allowStatuses.includes(entry.responseStatus))
    .map((entry) => `${entry.responseStatus} from ${entry.name.replace(win.location.origin, "")}`)

Cypress.Commands.add("checkPageHealth", (options = {}) => {
  const {
    overflow = true,
    invisibleClickable = true,
    tapTargets = true,
    failedRequests = true,
    consoleErrors = true,
    ignore = [],
    allowStatuses = [],
  } = options
  const touch = isTouch()

  cy.window({ log: false }).then((win) => {
    const sections = {
      overflow: overflow ? findOverflow(win, ignore) : [],
      "invisible tappable controls": touch && invisibleClickable ? findInvisibleClickable(win, ignore) : [],
      "tap targets too small": touch && tapTargets ? findSmallTargets(win, ignore) : [],
      "failed requests": failedRequests ? findFailedRequests(win, allowStatuses) : [],
      "console errors": consoleErrors ? win.__consoleErrors || [] : [],
    }

    const report = Object.entries(sections)
      .filter(([, problems]) => problems.length > 0)
      .map(([name, problems]) => `${name}:\n${problems.map((p) => `  - ${p}`).join("\n")}`)
      .join("\n")

    Cypress.log({ name: "pageHealth", message: report ? "problems found" : "ok" })
    if (report) {
      throw new Error(`Page health check failed on ${win.location.pathname}\n${report}`)
    }
  })
})
