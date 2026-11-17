import {isOrganizationCookie} from "../../support/organization-cookies.js";

// A comment on a block is shown under the block, whether the document is open to read or to edit.
describe("Comments on a block of a document", function () {
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
      document = DocumentService.new(pundit_user: PolicyUserContext.new(user, organization))
        .create!(space_id: space.id, title: "Block comments", markdown: "First paragraph\\n\\nSecond paragraph\\n\\nThird paragraph\\n")

      block = document.to_blocks.find { |b| b["content"].to_s.include?("Second paragraph") }
      document.comments.create!(
        organization: organization,
        organization_membership: user.organization_memberships.find_by!(organization: organization),
        content: [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "About the second one"}]}],
        anchor_block_id: block["id"],
        anchor_quote: "Second"
      )
      [document.id, block["id"]]
    `).then(([id, block]) => {
      documentId = id;
      blockId = block;
    });
  });

  // The comment follows the text of the block it is about, and nothing else.
  function expectCommentUnderTheSecondParagraph() {
    cy.get(`[data-id="${blockId}"] turbo-frame#object_comments_block_${blockId}`, {timeout: 10000})
      .should("contain", "About the second one");
    cy.get("turbo-frame#object_comments_block_" + blockId).should("have.length", 1);
    cy.get(`[data-id="${blockId}"]`).should("contain", "Second paragraph");
  }

  it("shows the comment under its block when reading", function () {
    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();

    expectCommentUnderTheSecondParagraph();
  });

  it("shows the comment under its block when editing", function () {
    cy.visit(`/d/${documentId}/edit`);
    cy.waitForEditor();

    expectCommentUnderTheSecondParagraph();
  });

  it("keeps the comment out of the document's own comments", function () {
    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();
    cy.waitForFrames();

    cy.get("turbo-frame#object_comments").should("not.contain", "About the second one");
  });

  it("does not change what the document holds", function () {
    cy.visit(`/d/${documentId}/edit`);
    cy.waitForEditor();
    expectCommentUnderTheSecondParagraph();

    cy.appEval(`Document.find("${documentId}").to_blocks.to_json`).then((json) => {
      expect(json).not.to.include("About the second one");
    });
  });
});
