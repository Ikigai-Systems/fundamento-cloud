import {isOrganizationCookie} from "../../support/organization-cookies.js";

// The "Move" item in the document menu hands a whole subtree to another space:
// DocumentsController#move lifts the document's hierarchy node *with its children* out of
// the source space, appends it to the destination's, and reassigns space_id on every
// document in it. The only other move coverage is a same-space drag of a childless leaf
// (spaces/sidebar-tree.cy.js), so nothing exercised descendants changing space.
describe("Moving a document with children between spaces", function () {
  const ids = {};

  beforeEach(() => {
    cy.app("clean");
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces", "documents"],
    });

    // Three levels deep, so a move that carried only direct children would still be caught,
    // plus a sibling at the source root that must stay behind.
    cy.appEval(`
      org = Organization.find("is")
      source = Space.find("is_default")
      destination = Space.create!(organization: org, name: "Destination Space", access_mode: :public)

      parent = source.documents.create!(title: "Parent Doc", organization: org)
      child = source.documents.create!(title: "Child Doc", organization: org)
      grandchild = source.documents.create!(title: "Grandchild Doc", organization: org)
      sibling = source.documents.create!(title: "Sibling Doc", organization: org)

      source.update!(hierarchy: [
        {
          "id" => parent.id,
          "children" => [
            { "id" => child.id, "children" => [{ "id" => grandchild.id, "children" => [] }] }
          ]
        },
        { "id" => sibling.id, "children" => [] }
      ])

      [destination.id, parent.id, child.id, grandchild.id, sibling.id].join("|")
    `).then((result) => {
      const [destinationId, parentId, childId, grandchildId, siblingId] = result.split("|");
      Object.assign(ids, {destinationId, parentId, childId, grandchildId, siblingId});
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  // The menu item and the modal's submit button are both labelled "Move", hence the
  // element-scoped selectors. The form answers with a `redirect_to` turbo stream, which
  // assigns window.location — a full page load, so the sidebar afterwards is the
  // destination space's.
  function moveParentToDestination() {
    // The menu items are in the DOM before the dropdown opens, so clicking straight
    // through would race the Stimulus controller connecting.
    cy.get("#content_menu_button").click();
    cy.get("[data-dropdown-target='menu']").should("be.visible");
    cy.contains("[role='menuitem']", "Move").click();

    cy.get("select[name='document[space_id]']").should("be.visible").select("Destination Space");

    cy.intercept("POST", `/d/${ids.parentId}/move`).as("move");
    cy.get(".modal-submit-button").click();
    cy.wait("@move");

    // The POST returning is not the end of it — the stream action still has to assign
    // window.location. Wait for that load to land before reading the sidebar or
    // navigating away, or the next command races the in-flight navigation. The space
    // name only reads "Destination Space" on the new page, so this is a real sync point.
    cy.get("#space-sidebar #spaces-dropdown").should("contain", "Destination Space");
  }

  it("carries the document and every descendant into the destination space", function () {
    cy.visit(`/d/${ids.parentId}`);
    cy.get(`#space-sidebar li[data-node-id='${ids.parentId}']`).should("exist");

    moveParentToDestination();

    cy.url().should("include", `/d/${ids.parentId}`);

    cy.appEval(`
      ["${ids.parentId}", "${ids.childId}", "${ids.grandchildId}"]
        .map { |id| Document.find(id).space_id }.uniq
    `).then((spaceIds) => {
      expect(spaceIds).to.deep.equal([ids.destinationId]);
    });
  });

  it("keeps the subtree nested once it lands in the destination space", function () {
    cy.visit(`/d/${ids.parentId}`);

    moveParentToDestination();

    // The tree renders root nodes only until expanded, so walk down a level at a time —
    // that is also what proves the nesting survived rather than the nodes being flattened
    // onto the destination root.
    cy.get(`#space-sidebar li[data-node-id='${ids.parentId}']`).should("exist");
    cy.get(`#space-sidebar li[data-node-id='${ids.parentId}'] .collapsible-trigger`).click();
    cy.get(`#space-sidebar li[data-node-id='${ids.childId}']`).should("exist");
    cy.get(`#space-sidebar li[data-node-id='${ids.childId}'] .collapsible-trigger`).click();
    cy.get(`#space-sidebar li[data-node-id='${ids.grandchildId}']`).should("exist");

    cy.appEval(`Space.find("${ids.destinationId}").hierarchy`).then((hierarchy) => {
      expect(hierarchy).to.deep.equal([
        {
          id: ids.parentId,
          children: [{id: ids.childId, children: [{id: ids.grandchildId, children: []}]}],
        },
      ]);
    });
  });

  it("leaves documents outside the subtree behind in the source space", function () {
    cy.visit(`/d/${ids.parentId}`);

    // The sibling shares the source root with the parent before the move...
    cy.get(`#space-sidebar li[data-node-id='${ids.siblingId}']`).should("exist");

    moveParentToDestination();

    // ...and must not follow it across. Asserting on the destination's tree rather than
    // visiting the sibling keeps this to a single page load. Visiting it did work most of
    // the time, but flaked once with the visit redirected to /users/sign_in, and the
    // destination tree answers the same question without a second navigation.
    cy.get(`#space-sidebar li[data-node-id='${ids.parentId}']`).should("exist");
    cy.get(`#space-sidebar li[data-node-id='${ids.siblingId}']`).should("not.exist");

    cy.appEval(`Document.find("${ids.siblingId}").space_id`).then((spaceId) => {
      expect(spaceId).to.equal("is_default");
    });

    cy.appEval(`Space.find("is_default").hierarchy`).then((hierarchy) => {
      expect(hierarchy).to.deep.equal([{id: ids.siblingId, children: []}]);
    });
  });
});
