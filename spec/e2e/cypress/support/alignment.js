// Layout rules for lists of object rows (documents, tables, spaces):
//
// 1. The icon, or the emoji from the title that replaces it, sits inside the row's
//    .object-icon slot and the slot ends before the label starts.
// 2. Labels line up: the text after the icon starts at the same x in every row, whether the
//    row shows an icon or an emoji.
//
// `rows` is an array of `{slot, icon, label}`. `icon` is the glyph element, or a Range over
// the slot's text when the slot holds an emoji: a text node has no box of its own.
//
//   assertAlignedRows(rows.map((li) => ({slot: ..., icon: objectIconContent(slot), label: ...})))

const TOLERANCE = 0.5

const describeRow = (row) => (row.label.textContent || "").trim().slice(0, 40)

export function objectIconContent(slot) {
  const glyph = slot.querySelector("i")
  if (glyph) return glyph

  const range = slot.ownerDocument.createRange()
  range.selectNodeContents(slot)
  return range
}

export function assertAlignedRows(rows) {
  expect(rows.length, "rows to compare").to.be.at.least(2)

  const lefts = rows.map((row) => row.label.getBoundingClientRect().left)
  const spread = Math.max(...lefts) - Math.min(...lefts)
  const positions = rows.map((row, i) => `"${describeRow(row)}" at ${lefts[i].toFixed(2)}`).join(", ")
  expect(spread, `label left edges spread (${positions})`).to.be.at.most(TOLERANCE)

  rows.forEach((row) => {
    const slot = row.slot.getBoundingClientRect()
    const icon = row.icon.getBoundingClientRect()
    const label = row.label.getBoundingClientRect()
    const name = describeRow(row)

    expect(icon.width, `"${name}" icon width`).to.be.above(0)
    expect(icon.left, `"${name}" icon left within slot`).to.be.at.least(slot.left - TOLERANCE)
    expect(icon.right, `"${name}" icon right within slot`).to.be.at.most(slot.right + TOLERANCE)
    expect(icon.top, `"${name}" icon top within slot`).to.be.at.least(slot.top - TOLERANCE)
    expect(icon.bottom, `"${name}" icon bottom within slot`).to.be.at.most(slot.bottom + TOLERANCE)
    expect(slot.right, `"${name}" slot ends before its label`).to.be.at.most(label.left + TOLERANCE)
  })
}
