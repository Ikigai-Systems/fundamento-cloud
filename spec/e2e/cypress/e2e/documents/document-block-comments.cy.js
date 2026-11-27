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

  // A block with no comment yet gets its first one from the button that shows beside it.
  function commentOnTheFirstParagraph() {
    cy.appEval(`Document.find("${documentId}").to_blocks.find { |b| b["content"].to_s.include?("First paragraph") }["id"]`).then((firstBlockId) => {
      cy.contains(".bn-block-content", "First paragraph").realHover();
      cy.get("[data-block-comment-button]").should("be.visible").click();

      // A synthetic click leaves the focus in the document, so the typing would land there.
      cy.get(`turbo-frame#new_object_comment_block_${firstBlockId} [data-comment-editor] [role='textbox']`, {timeout: 10000})
        .realClick();
      cy.realType("About the first one");
      cy.get(`turbo-frame#new_object_comment_block_${firstBlockId}`).contains("input[type=submit]", "Add").click();

      cy.get(`[data-id="${firstBlockId}"] turbo-frame#object_comments_block_${firstBlockId}`, {timeout: 10000})
        .should("contain", "About the first one");
      cy.get(`turbo-frame#new_object_comment_block_${firstBlockId}`).should("be.empty");

      cy.appEval(`Document.find("${documentId}").comments.on_block("${firstBlockId}").count`).should("eq", 1);
    });
  }

  it("starts a comment on a block when reading", function () {
    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();

    commentOnTheFirstParagraph();
  });

  it("starts a comment on a block when editing", function () {
    cy.visit(`/d/${documentId}/edit`);
    cy.waitForEditor();

    commentOnTheFirstParagraph();
  });

  // Selecting words offers a comment on them: the quote goes with the comment and is marked in the block.
  function commentOnSelectedWords({collapseOnPress = false} = {}) {
    cy.appEval(`Document.find("${documentId}").to_blocks.find { |b| b["content"].to_s.include?("First paragraph") }["id"]`).then((firstBlockId) => {
      cy.contains(".bn-block-content", "First paragraph").then(($content) => {
        const text = $content.find("[data-content-type] > *, p, span").addBack().contents().filter((_, node) => node.nodeType === Node.TEXT_NODE && node.textContent.includes("First")).get(0);
        const range = text.ownerDocument.createRange();
        range.setStart(text, 0);
        range.setEnd(text, "First".length);
        const selection = text.ownerDocument.defaultView.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      });

      if (collapseOnPress) {
        // With prosemirror-view 1.43 the selection collapsed right after the press in the editor, which
        // hid the button before the click arrived. Reproduce that order on every run, not by timing:
        // press, collapse, let the editor see the change, then click.
        cy.get("[data-quote-comment-button]").should("be.visible").trigger("mousedown", {force: true});
        cy.document().then((doc) => new Promise((resolve) => {
          doc.addEventListener("selectionchange", resolve, {once: true});
          doc.defaultView.getSelection().removeAllRanges();
        }));
        cy.get("[data-quote-comment-button]").should("be.visible").click();
      } else {
        cy.get("[data-quote-comment-button]").should("be.visible").realClick();
      }

      cy.get(`turbo-frame#new_object_comment_block_${firstBlockId} [data-comment-quote]`, {timeout: 10000}).should("contain", "First");
      cy.get(`turbo-frame#new_object_comment_block_${firstBlockId} [data-comment-editor] [role='textbox']`).realClick();
      cy.realType("About the word");
      cy.get(`turbo-frame#new_object_comment_block_${firstBlockId}`).contains("input[type=submit]", "Add").click();

      cy.get(`[data-id="${firstBlockId}"] turbo-frame#object_comments_block_${firstBlockId}`, {timeout: 10000})
        .should("contain", "About the word")
        .find("[data-comment-quote]").should("contain", "First");
      cy.get(`[data-id="${firstBlockId}"] .bn-block-content .border-yellow-500`).should("contain", "First");

      cy.appEval(`Document.find("${documentId}").comments.on_block("${firstBlockId}").first.anchor_quote`).should("eq", "First");
    });
  }

  it("marks what an earlier comment quotes", function () {
    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();

    cy.get(`[data-id="${blockId}"] .bn-block-content .border-yellow-500`, {timeout: 10000}).should("have.text", "Second");
  });

  it("starts a comment on selected words when reading", function () {
    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();

    commentOnSelectedWords();
  });

  it("starts a comment on selected words when editing", function () {
    cy.visit(`/d/${documentId}/edit`);
    cy.waitForEditor();

    commentOnSelectedWords();
  });

  it("starts a comment on selected words when pressing the button collapses the selection", function () {
    cy.visit(`/d/${documentId}/edit`);
    cy.waitForEditor();

    commentOnSelectedWords({collapseOnPress: true});
  });
});
