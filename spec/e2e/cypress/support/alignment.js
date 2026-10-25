// Layout rules for lists of object rows (documents, tables, spaces):
//
// 1. The icon, or the emoji from the title that replaces it, sits inside the row's
//    .object-icon slot, centred on the label's line, and the slot ends before the label starts.
// 2. Labels line up: the text after the icon starts at the same x in every row, whether the
//    row shows an icon or an emoji.
// 3. An icon is drawn as large as an emoji in the same list, so neither looks out of place.
//
// A row is `{slot, icon, label}`. `icon` is the glyph element, or a Range over the slot's text
// when the slot holds an emoji: a text node has no box of its own. `label` is an element, or a
// Range where the label is bare text (the space switcher).
//
//   cy.get("li").then(($rows) => assertAlignedRows(rowsOf($rows, "span.truncate")))

const TOLERANCE = 0.5
// Centres are compared at a whole pixel: text and glyph boxes land on half pixels, and a
// one-pixel difference is invisible where a two-pixel one is not.
const CENTRE_TOLERANCE = 1

const nameOf = (row) => (row.label.textContent ?? row.label.toString()).trim().slice(0, 40)
const centreY = (rect) => rect.top + rect.height / 2
// Not `instanceof Element`: the rows come from the application's window, whose Element is not
// the spec's.
const isEmoji = (row) => row.icon.nodeType === undefined

export function objectIconContent(slot) {
  const glyph = slot.querySelector("i")
  if (glyph) return glyph

  const range = slot.ownerDocument.createRange()
  range.selectNodeContents(slot)
  return range
}

// Builds rows from list items that each hold one .object-icon slot and a label matching
// `labelSelector`.
export function rowsOf($rows, labelSelector) {
  return [...$rows].map((row) => {
    const slot = row.querySelector(".object-icon")
    return { slot, icon: objectIconContent(slot), label: row.querySelector(labelSelector) }
  })
}

// Rule 1 for a single row.
export function assertIconInSlot(row) {
  const slot = row.slot.getBoundingClientRect()
  const icon = row.icon.getBoundingClientRect()
  const label = row.label.getBoundingClientRect()
  const name = nameOf(row)

  expect(icon.width, `"${name}" icon width`).to.be.above(0)
  expect(icon.left, `"${name}" icon left within slot`).to.be.at.least(slot.left - TOLERANCE)
  expect(icon.right, `"${name}" icon right within slot`).to.be.at.most(slot.right + TOLERANCE)
  expect(icon.top, `"${name}" icon top within slot`).to.be.at.least(slot.top - TOLERANCE)
  expect(icon.bottom, `"${name}" icon bottom within slot`).to.be.at.most(slot.bottom + TOLERANCE)
  expect(slot.right, `"${name}" slot ends before its label`).to.be.at.most(label.left + TOLERANCE)

  const offset = Math.abs(centreY(icon) - centreY(label))
  expect(offset, `"${name}" icon centre ${centreY(icon).toFixed(2)} vs label centre ${centreY(label).toFixed(2)}`)
    .to.be.at.most(CENTRE_TOLERANCE)
}

export function assertAlignedRows(rows) {
  expect(rows.length, "rows to compare").to.be.at.least(2)

  const lefts = rows.map((row) => row.label.getBoundingClientRect().left)
  const spread = Math.max(...lefts) - Math.min(...lefts)
  const positions = rows.map((row, i) => `"${nameOf(row)}" at ${lefts[i].toFixed(2)}`).join(", ")
  expect(spread, `label left edges spread (${positions})`).to.be.at.most(TOLERANCE)

  rows.forEach(assertIconInSlot)

  // Rule 3. The emoji's box is its line box, not its ink, but both kinds fill their slot the
  // same way, so equal boxes mean the icon is drawn at the emoji's scale.
  const emoji = rows.filter(isEmoji)
  const icons = rows.filter((row) => !isEmoji(row))
  if (emoji.length && icons.length) {
    const emojiHeight = emoji[0].icon.getBoundingClientRect().height
    icons.forEach((row) => {
      const height = row.icon.getBoundingClientRect().height
      expect(Math.abs(height - emojiHeight), `"${nameOf(row)}" icon height ${height} vs emoji ${emojiHeight}`)
        .to.be.at.most(CENTRE_TOLERANCE)
    })
  }
}

export function assertEqualHeights($rows) {
  const heights = [...$rows].map((row) => row.getBoundingClientRect().height)
  expect(Math.max(...heights) - Math.min(...heights), `row heights ${heights.join(", ")}`).to.be.at.most(TOLERANCE)
}
