import {convertToBlocks, convertToYjs} from "../src/converters";

function cell(props: Record<string, unknown> = {}) {
  return {
    type: "tableCell",
    content: [{type: "text", text: "x", styles: {}}],
    props: {colspan: 1, rowspan: 1, backgroundColor: "default", textColor: "default", textAlignment: "left", ...props},
  };
}

function table(rows: unknown[], columnWidths: unknown[] = [null, 234, null, 172]) {
  return {
    id: "t1", type: "table", props: {textColor: "default"}, children: [],
    content: {type: "tableContent", columnWidths, headerRows: 1, rows},
  };
}

const ordinaryRow = () => ({cells: [cell(), cell(), cell(), cell()]});

describe("table cell spans that reach past the table", () => {
  // The shape of a real production document: nine ordinary rows, then a final row holding one
  // cell with colspan 4 / rowspan 5 -- five rows claimed starting from the tenth of ten.
  // blocksToYDoc threw "Cannot read properties of undefined (reading '0')" on it, taking the
  // whole document with it, which is what stalled the attachment id migration.
  const outOfBounds = () => table([
    ...Array.from({length: 9}, ordinaryRow),
    {cells: [cell({colspan: 4, rowspan: 5})]},
  ]);

  it("encodes instead of throwing", () => {
    expect(() => convertToYjs([outOfBounds()] as never)).not.toThrow();
  });

  it("clamps the span to what the table actually has", () => {
    const blocks = [outOfBounds()];
    convertToYjs(blocks as never);

    const props = (blocks[0].content.rows[9] as {cells: {props: Record<string, number>}[]}).cells[0].props;

    expect(props.rowspan).toBe(1); // only the last row remains
    expect(props.colspan).toBe(4); // all four columns, already in bounds
  });

  it("keeps the table and its content through a round trip", () => {
    const back = convertToBlocks(Buffer.from(convertToYjs([outOfBounds()] as never)));
    const restored = back.find((block: {type: string}) => block.type === "table");

    expect(restored).toBeDefined();
    expect(JSON.stringify(restored)).toContain("\"text\":\"x\"");
  });

  it("leaves a valid merged table exactly as it was", () => {
    // Four columns: a cell spanning two of them, then two single cells.
    const valid = table([
      {cells: [cell({colspan: 2}), cell(), cell()]},
      ordinaryRow(),
    ]);
    const before = JSON.stringify(valid);

    convertToYjs([valid] as never);

    expect(JSON.stringify(valid)).toBe(before);
  });

  // Clamping fixes spans that point outside the table, which is the case production had. A
  // table whose spans are inside the table but contradict each other -- two cells claiming one
  // position -- is a different problem, and @blocknote/core still rejects it rather than
  // guessing. Pinned so that the limit is known rather than discovered.
  it("still refuses a table whose spans overlap each other", () => {
    const overlapping = table([
      {cells: [cell({colspan: 2}), cell({rowspan: 2})]},
      {cells: [cell(), cell(), cell()]},
    ]);

    expect(() => convertToYjs([overlapping] as never)).toThrow(/occupancy grid/);
  });

  it("leaves an ordinary table alone", () => {
    const plain = table([ordinaryRow(), ordinaryRow()]);
    const before = JSON.stringify(plain);

    convertToYjs([plain] as never);

    expect(JSON.stringify(plain)).toBe(before);
  });

  // Cells saved before BlockNote 0.25 are the inline content array itself, carrying no props.
  it("tolerates the pre-0.25 cell shape", () => {
    const legacy = table([{cells: [[{type: "text", text: "x", styles: {}}]]}], [null]);

    expect(() => convertToYjs([legacy] as never)).not.toThrow();
  });
});
