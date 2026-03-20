import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Document Comments", function () {
  beforeEach(() => {
    cy.app("clean");

    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces",
        "documents",
        "versions"
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  const documentId = "two";
  const waitForEditor = () => {
    cy.get("[data-document-editor] [role='textbox']", {timeout: 10000}).should("exist");
  };

  // Helper to create a comment via backend
  const createComment = (membershipId, text) => {
    return cy.appEval(`
      document = Document.find('${documentId}')
      membership = OrganizationMembership.find('${membershipId}')
      content = [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "${text}"}]}]
      comment = document.comments.create!(
        organization: document.organization,
        organization_membership: membership,
        content: content
      )
      comment.id
    `);
  };

  describe("adding comments", function () {
    it("shows and hides the comment form with Cancel", function () {
      cy.visit(`/d/${documentId}`);
      waitForEditor();

      // Comment button should be visible
      cy.contains("Comment").should("be.visible");

      // Click Comment to open form
      cy.contains("Comment").click();

      // Form should appear, Comment button should hide
      cy.get("turbo-frame#new_object_comment").should("not.be.empty");
      cy.get("turbo-frame#add_object_comment").should("not.be.visible");

      // Click Cancel
      cy.contains("button", "Cancel").click();

      // Form should clear, Comment button should reappear
      cy.get("turbo-frame#new_object_comment").should("be.empty");
      cy.contains("Comment").should("be.visible");
    });

    it("adds a comment and displays it", function () {
      cy.visit(`/d/${documentId}`);
      waitForEditor();

      cy.contains("Comment").click();

      // Type in the BlockNote editor inside the new comment form
      cy.get("turbo-frame#new_object_comment [data-comment-editor] [role='textbox']", {timeout: 5000})
        .click()
        .type("This is a test comment");

      cy.intercept("POST", "/comments*").as("createComment");
      cy.intercept("GET", "/comments*").as("getComments");

      cy.contains("button", "Add").click();

      cy.wait("@createComment");
      cy.wait("@getComments");

      // Comment should appear in the list
      cy.get("turbo-frame#object_comments").should("contain", "This is a test comment");

      // Comment button should reappear (form cleared)
      cy.contains("Comment").should("be.visible");
    });
  });

  describe("real-time updates from another user", function () {
    it("shows a new comment from another user in real-time", function () {
      cy.visit(`/d/${documentId}`);
      waitForEditor();

      // Intercept the broadcast-triggered frame reload
      cy.intercept("GET", "/comments*").as("getComments");

      // Another user (stefan) adds a comment via backend
      createComment("om_is_stefan", "Hello from Stefan!");

      cy.wait("@getComments");

      // The comment should appear without page refresh
      cy.get("turbo-frame#object_comments").should("contain", "Hello from Stefan!");
    });

    it("shows updated comment content from another user in real-time", function () {
      // Create a comment by stefan first
      createComment("om_is_stefan", "Original text").then((commentId) => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        // Verify original comment is displayed
        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Original text");

        // Intercept the broadcast-triggered frame reload
        cy.intercept("GET", "/comments*").as("getComments");

        // Stefan updates the comment via backend
        cy.appEval(`
          comment = ObjectComment.find('${commentId}')
          comment.update!(content: [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "Updated by Stefan"}]}])
        `);

        cy.wait("@getComments");

        // Updated content should appear
        cy.get("turbo-frame#object_comments").should("contain", "Updated by Stefan");
        cy.get("turbo-frame#object_comments").should("not.contain", "Original text");
      });
    });

    it("shows tombstone when another user deletes their comment in real-time", function () {
      // Create a comment by stefan
      createComment("om_is_stefan", "Will be deleted").then((commentId) => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        // Verify comment is displayed
        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Will be deleted");

        // Intercept the broadcast-triggered frame reload
        cy.intercept("GET", "/comments*").as("getComments");

        // Stefan soft-deletes via backend
        cy.appEval(`
          comment = ObjectComment.find('${commentId}')
          comment.update!(removed_at: Time.current)
        `);

        cy.wait("@getComments");

        // Tombstone should appear, original text should be gone
        cy.get("turbo-frame#object_comments").should("contain", "was removed");
        cy.get("turbo-frame#object_comments").should("not.contain", "Will be deleted");

        // Pawel (not the author) should NOT see a Restore button
        cy.get("turbo-frame#object_comments").should("not.contain", "Restore");
      });
    });
  });

  describe("edit and delete by author", function () {
    it("author can edit their comment inline", function () {
      // Create a comment by pawel
      createComment("om_is_pawel", "My original comment").then(() => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "My original comment");

        // Edit button should be visible (author)
        cy.get("[title='Edit']").should("exist");

        // Click Edit
        cy.get("[title='Edit']").first().click();

        // Save/Cancel buttons should appear
        cy.contains("button", "Save").should("be.visible");
        cy.contains("button", "Cancel").should("be.visible");

        // Edit the content in the BlockNote editor
        cy.get("turbo-frame#object_comments [data-comment-editor] [role='textbox']")
          .clear()
          .type("My updated comment");

        cy.intercept("PATCH", "/comments/*").as("updateComment");
        cy.intercept("GET", "/comments*").as("getComments");

        cy.contains("button", "Save").click();

        cy.wait("@updateComment");
        cy.wait("@getComments");

        // Updated content should appear
        cy.get("turbo-frame#object_comments").should("contain", "My updated comment");
      });
    });

    it("author can cancel editing without losing original content", function () {
      createComment("om_is_pawel", "Do not change me").then(() => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Do not change me");

        // Click Edit
        cy.get("[title='Edit']").first().click();

        // Modify content
        cy.get("turbo-frame#object_comments [data-comment-editor] [role='textbox']")
          .clear()
          .type("Changed text");

        // Click Cancel
        cy.contains("button", "Cancel").click();

        // Original content should be restored
        cy.get("turbo-frame#object_comments").should("contain", "Do not change me");
      });
    });

    it("author can delete their comment and see tombstone with Restore", function () {
      createComment("om_is_pawel", "Will delete this").then(() => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Will delete this");

        cy.intercept("DELETE", "/comments/*").as("deleteComment");
        cy.intercept("GET", "/comments*").as("getComments");

        // Click Delete
        cy.get("[title='Delete']").first().click();

        cy.wait("@deleteComment");
        cy.wait("@getComments");

        // Tombstone should appear
        cy.get("turbo-frame#object_comments").should("contain", "was removed");
        cy.get("turbo-frame#object_comments").should("not.contain", "Will delete this");

        // Author should see Restore button
        cy.contains("Restore").should("be.visible");
      });
    });

    it("author can restore a deleted comment", function () {
      createComment("om_is_pawel", "Restore me").then((commentId) => {
        // Soft-delete the comment
        cy.appEval(`ObjectComment.find('${commentId}').update!(removed_at: Time.current)`);

        cy.visit(`/d/${documentId}`);
        waitForEditor();

        // Tombstone should be visible with Restore button
        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "was removed");
        cy.contains("Restore").should("be.visible");

        cy.intercept("POST", "/comments/*/restore").as("restoreComment");
        cy.intercept("GET", "/comments*").as("getComments");

        cy.contains("Restore").click();

        cy.wait("@restoreComment");
        cy.wait("@getComments");

        // Comment should reappear
        cy.get("turbo-frame#object_comments").should("contain", "Restore me");
        cy.get("turbo-frame#object_comments").should("not.contain", "was removed");
      });
    });
  });

  describe("authorization", function () {
    it("does not show edit/delete buttons for comments by other users", function () {
      // Create a comment by stefan
      createComment("om_is_stefan", "Stefan's comment").then(() => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Stefan's comment");

        // No edit/delete buttons should be visible for pawel viewing stefan's comment
        cy.get("[title='Edit']").should("not.exist");
        cy.get("[title='Delete']").should("not.exist");
      });
    });

    it("shows edit/delete only for own comments when multiple comments exist", function () {
      // Create comments by both users
      createComment("om_is_stefan", "Stefan's comment");
      createComment("om_is_pawel", "Pawel's comment");

      cy.visit(`/d/${documentId}`);
      waitForEditor();

      cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Stefan's comment");
      cy.get("turbo-frame#object_comments").should("contain", "Pawel's comment");

      // Only one set of edit/delete buttons (for pawel's comment)
      cy.get("[title='Edit']").should("have.length", 1);
      cy.get("[title='Delete']").should("have.length", 1);
    });
  });
});
