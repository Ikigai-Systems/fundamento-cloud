import {isOrganizationCookie} from "../../support/organization-cookies.js";

// A comment whose block has been removed is not lost: it waits, out of the way, with what the block
// said and a link to the version that still had it.
describe("Comments on a block that has been removed", function () {
  let documentId;
  let blockId;

  beforeEach(() => {
    cy.app("clean");

    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces"],
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);

    cy.appEval(`
      user = User.find_by!(email: "pawel@ikigai.systems")
      organization = Organization.find_by!(name: "Ikigai Systems")
      space = organization.spaces.first
      service = DocumentService.new(pundit_user: PolicyUserContext.new(user, organization))
      document = service.create!(space_id: space.id, title: "Removed block", markdown: "First paragraph\\n\\nSecond paragraph\\n\\nThird paragraph\\n")

      block = document.to_blocks.find { |b| b["content"].to_s.include?("Second paragraph") }
      document.comments.create!(
        organization: organization,
        organization_membership: user.organization_memberships.find_by!(organization: organization),
        content: [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "About the second one"}]}],
        anchor_block_id: block["id"],
        anchor_text: "Second paragraph"
      )

      service.update!(document_id: document.id, markdown: "First paragraph\\n\\nThird paragraph\\n")
      [document.id, block["id"]]
    `).then(([id, block]) => {
      documentId = id;
      blockId = block;
    });
  });

  it("keeps them in a section of their own, closed until opened", function () {
    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();
    cy.waitForFrames();

    cy.get("[data-orphaned-comments] summary").should("contain", "Comments on removed blocks (1)");
    cy.get("[data-orphaned-comments]").should("not.have.attr", "open");
    cy.get("turbo-frame#object_comments").should("not.contain", "About the second one");

    cy.get("[data-orphaned-comments] summary").click();
    cy.get("turbo-frame#object_comments_orphaned", {timeout: 10000}).within(() => {
      cy.contains("This was a comment on a block that has since been removed");
      cy.contains("Second paragraph");
      cy.contains("About the second one");
    });
  });

  it("links to the version that still had the block, where the comment is under it", function () {
    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();
    cy.get("[data-orphaned-comments] summary").click();

    cy.contains("turbo-frame#object_comments_orphaned a", "See the block in version 1", {timeout: 10000}).click();

    cy.location("pathname").should("eq", `/d/${documentId}/versions/1`);
    cy.get(`[data-id="${blockId}"] turbo-frame#object_comments_block_${blockId}`, {timeout: 10000})
      .should("contain", "About the second one");
    // A version takes no new comments.
    cy.get(`turbo-frame#object_comments_block_${blockId}`).contains("a", "Comment").should("not.exist");
  });

  it("can be kept as a comment on the document", function () {
    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();
    cy.get("[data-orphaned-comments] summary").click();

    cy.contains("turbo-frame#object_comments_orphaned button", "Keep as a document comment", {timeout: 10000}).click();

    cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "About the second one");
    cy.appEval(`Document.find("${documentId}").comments.unanchored.map { |c| c.content.to_json }.join`)
      .should("include", "About the second one");
  });
});
