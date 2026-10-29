// A colored object's title carries `.color-label[data-color]`, drawn as a background strip.
export function expectColorLabel($label, color) {
  expect($label.length, "color labels").to.equal(1);
  expect($label.attr("data-color")).to.equal(color);
  expect(getComputedStyle($label[0]).backgroundImage, "underline").not.to.equal("none");
}

// Checks one surface: with no color the title has no label; once colored it has one, and the
// surface's `box` is exactly as tall as before (the label's padding must not push anything).
//   record: Ruby expression finding the Document/Table; visit: opens the surface;
//   title: the element whose text is the title; box: the element whose height is compared.
export function expectColorLabelKeepsLayout({record, color = "teal", visit, title, box = title}) {
  cy.appEval(`${record}.update!(color: nil)`);
  visit();
  cy.get(title).should("be.visible").find(".color-label").should("not.exist");
  cy.get(box).then(($box) => {
    cy.wrap($box[0].getBoundingClientRect().height).as("uncoloredHeight");
  });

  cy.appEval(`${record}.update!(color: "${color}")`);
  visit();
  cy.get(`${title} .color-label`).should(($label) => expectColorLabel($label, color));
  cy.get(box).then(($box) => {
    cy.get("@uncoloredHeight").then((height) => {
      expect($box[0].getBoundingClientRect().height, "height of the colored surface").to.equal(height);
    });
  });
}
