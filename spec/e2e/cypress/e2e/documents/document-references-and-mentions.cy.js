import {isOrganizationCookie} from "../../support/organization-cookies.js";

const editPageUrl = /\/d\/[_\-a-zA-Z0-9]+\/edit$/;

describe("Document References and Mentions", function () {
  beforeEach(() => {
    cy.app("clean");

    // Load fixtures
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces",
        "documents",
        "versions",
        "tables/tables"
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");

    cy.setCookie("organization_id", isOrganizationCookie);
  });

  describe("Connections Tab - Outgoing References", function () {
    it("displays outgoing document references in connections tab", function () {
      // Create two documents
      cy.appScenario("create_two_documents", {
        space_id: "is_default",
        organization_id: "is"
      });

      cy.appEval("Document.find_by(title: 'Source Document').id").then((sourceDocId) => {
        cy.appEval("Document.find_by(title: 'Target Document').id").then((targetDocId) => {
          // Edit source document to add a mention of target document
          cy.visit(`/d/${sourceDocId}/edit`);

          cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");

          // Type @ to trigger mention
          cy.get("[data-document-editor] [role=\"textbox\"]").first().type("Check out @");

          // Wait for mentions menu to appear
          cy.get('.bn-suggestion-menu', { timeout: 5000 }).should('be.visible');

          // Select the target document from mentions
          cy.get('.bn-suggestion-menu-item').contains('Target Document').click();

          // Save the document
          cy.get('[aria-label="Save document"]').click();

          cy.get("#flashes").within(() => {
            cy.contains("Document has been updated").should("be.visible");
            cy.get('[aria-label="Close"]').click();
          });

          // Open connections tab
          cy.get('#content-sidebar').within(() => {
            cy.get('[aria-label="Connections"]').click();
          });

          // Verify outgoing reference appears in connections tab
          cy.get('#connections_sidebar_tab').within(() => {
            cy.contains("References:").should("be.visible");
            cy.contains("Target Document").should("be.visible");

            // Click on the reference link
            cy.contains("Target Document").click();
          });

          // Verify we're navigated to the target document
          cy.url().should("include", `/d/${targetDocId}`);
        });
      });
    });

    it("displays outgoing table references in connections tab", function () {
      // Get existing document and table
      cy.appEval("Document.first.id").then((docId) => {
        cy.appEval("Table.first.id").then((tableId) => {
          cy.appEval("Table.first.name").then((tableName) => {
            // Edit document to add table reference
            cy.visit(`/d/${docId}/edit`);

            cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");

            // Type @ to trigger mention
            cy.get("[data-document-editor] [role=\"textbox\"]").first().type("See table @");

            // Wait for mentions menu
            cy.get('.bn-suggestion-menu', { timeout: 5000 }).should('be.visible');

            // Select the table from mentions
            cy.get('.bn-suggestion-menu-item').contains(tableName).click();

            // Save the document
            cy.get('[aria-label="Save document"]').click();

            cy.get("#flashes").within(() => {
              cy.contains("Document has been updated").should("be.visible");
              cy.get('[aria-label="Close"]').click();
            });

            // Open connections tab
            cy.get('#content-sidebar').within(() => {
              cy.get('[aria-label="Connections"]').click();
            });

            // Verify outgoing table reference appears
            cy.get('#connections_sidebar_tab').within(() => {
              cy.contains("References:").should("be.visible");
              cy.contains(tableName).should("be.visible");

              // Click on the reference link
              cy.contains(tableName).click();
            });

            // Verify we're navigated to the table
            cy.url().should("include", `/t/${tableId}`);
          });
        });
      });
    });

    it("displays multiple outgoing references in connections tab", function () {
      // Create three documents
      cy.appScenario("create_three_documents", {
        space_id: "is_default",
        organization_id: "is"
      });

      cy.appEval("Document.find_by(title: 'Main Document').id").then((mainDocId) => {
        // Edit main document to add mentions of both ref documents
        cy.visit(`/d/${mainDocId}/edit`);

        cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");

        // Add first reference
        cy.get("[data-document-editor] [role=\"textbox\"]").first().type("See @");
        cy.get('.bn-suggestion-menu', { timeout: 5000 }).should('be.visible');
        cy.get('.bn-suggestion-menu-item').contains('Ref Document 1').click();

        // Add second reference
        cy.focused().type(" and @");
        cy.get('.bn-suggestion-menu', { timeout: 5000 }).should('be.visible');
        cy.get('.bn-suggestion-menu-item').contains('Ref Document 2').click();

        // Save the document
        cy.get('[aria-label="Save document"]').click();

        cy.get("#flashes").within(() => {
          cy.contains("Document has been updated").should("be.visible");
          cy.get('[aria-label="Close"]').click();
        });

        // Open connections tab
        cy.get('#content-sidebar').within(() => {
          cy.get('[aria-label="Connections"]').click();
        });

        // Verify both outgoing references appear
        cy.get('#connections_sidebar_tab').within(() => {
          cy.contains("References:").should("be.visible");
          cy.contains("Ref Document 1").should("be.visible");
          cy.contains("Ref Document 2").should("be.visible");
        });
      });
    });
  });

  describe("Connections Tab - Incoming References", function () {
    it("displays incoming document references in connections tab", function () {
      // Create two documents
      cy.appScenario("create_two_documents", {
        space_id: "is_default",
        organization_id: "is"
      });

      cy.appEval("Document.find_by(title: 'Source Document').id").then((sourceDocId) => {
        cy.appEval("Document.find_by(title: 'Target Document').id").then((targetDocId) => {
          // Edit source document to reference target
          cy.visit(`/d/${sourceDocId}/edit`);

          cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");

          cy.get("[data-document-editor] [role=\"textbox\"]").first().type("Check out @");
          cy.get('.bn-suggestion-menu', { timeout: 5000 }).should('be.visible');
          cy.get('.bn-suggestion-menu-item').contains('Target Document').click();

          cy.get('[aria-label="Save document"]').click();
          cy.contains("Document has been updated").should("be.visible");

          // Navigate to target document
          cy.visit(`/d/${targetDocId}`);

          cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");

          // Open connections tab
          cy.get('#content-sidebar').within(() => {
            cy.get('[aria-label="Connections"]').click();
          });

          // Verify incoming reference appears
          cy.get('#connections_sidebar_tab').within(() => {
            cy.contains("Referenced in:").should("be.visible");
            cy.contains("Source Document").should("be.visible");

            // Click on the incoming reference
            cy.contains("Source Document").click();
          });

          // Verify we're navigated to source document
          cy.url().should("include", `/d/${sourceDocId}`);
        });
      });
    });

    it("displays multiple incoming references in connections tab", function () {
      // Create three documents: Target, Source1, Source2
      cy.appScenario("create_three_documents_for_incoming", {
        space_id: "is_default",
        organization_id: "is"
      });

      cy.appEval("Document.find_by(title: 'Target Doc').id").then((targetDocId) => {
        cy.appEval("Document.find_by(title: 'Source Doc 1').id").then((source1Id) => {
          cy.appEval("Document.find_by(title: 'Source Doc 2').id").then((source2Id) => {
            // Edit Source Doc 1 to reference Target
            cy.visit(`/d/${source1Id}/edit`);
            cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");
            cy.get("[data-document-editor] [role=\"textbox\"]").first().type("See @");
            cy.get('.bn-suggestion-menu', { timeout: 5000 }).should('be.visible');
            cy.get('.bn-suggestion-menu-item').contains('Target Doc').click();
            cy.get('[aria-label="Save document"]').click();
            cy.contains("Document has been updated").should("be.visible");

            // Edit Source Doc 2 to reference Target
            cy.visit(`/d/${source2Id}/edit`);
            cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");
            cy.get("[data-document-editor] [role=\"textbox\"]").first().type("Check @");
            cy.get('.bn-suggestion-menu', { timeout: 5000 }).should('be.visible');
            cy.get('.bn-suggestion-menu-item').contains('Target Doc').click();
            cy.get('[aria-label="Save document"]').click();
            cy.contains("Document has been updated").should("be.visible");

            // Navigate to target document
            cy.visit(`/d/${targetDocId}`);
            cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");

            // Open connections tab
            cy.get('#content-sidebar').within(() => {
              cy.get('[aria-label="Connections"]').click();
            });

            // Verify both incoming references appear
            cy.get('#connections_sidebar_tab').within(() => {
              cy.contains("Referenced in:").should("be.visible");
              cy.contains("Source Doc 1").should("be.visible");
              cy.contains("Source Doc 2").should("be.visible");
            });
          });
        });
      });
    });

    it("shows no references message when there are none", function () {
      // Create a new document with no references
      cy.visit("/s/is_default");
      cy.get('[aria-label="Create new document"]').click();

      cy.url().should("match", editPageUrl);
      cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");

      // Save empty document
      cy.get('[aria-label="Save document"]').click();

      cy.get("#flashes").within(() => {
        cy.contains("Document has been updated").should("be.visible");
        cy.get('[aria-label="Close"]').click();
      });

      // Open connections tab
      cy.get('#content-sidebar').within(() => {
        cy.get('[aria-label="Connections"]').click();
      });

      // Verify "no references" message
      cy.get('#connections_sidebar_tab').within(() => {
        cy.contains("No references were found.").should("be.visible");
      });
    });
  });

  describe("Connections Tab - De-duplication", function () {
    it("de-duplicates multiple mentions of same document", function () {
      // Create two documents
      cy.appScenario("create_two_documents", {
        space_id: "is_default",
        organization_id: "is"
      });

      cy.appEval("Document.find_by(title: 'Source Document').id").then((sourceDocId) => {
        cy.appEval("Document.find_by(title: 'Target Document').id").then((targetDocId) => {
          // Edit source document to add multiple mentions of target
          cy.visit(`/d/${sourceDocId}/edit`);

          cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");

          // Add first mention
          cy.get("[data-document-editor] [role=\"textbox\"]").first().type("First mention @");
          cy.get('.bn-suggestion-menu', { timeout: 5000 }).should('be.visible');
          cy.get('.bn-suggestion-menu-item').contains('Target Document').click();

          // Add second mention
          cy.focused().type("{enter}Second mention @");
          cy.get('.bn-suggestion-menu', { timeout: 5000 }).should('be.visible');
          cy.get('.bn-suggestion-menu-item').contains('Target Document').click();

          // Save the document
          cy.get('[aria-label="Save document"]').click();

          cy.get("#flashes").within(() => {
            cy.contains("Document has been updated").should("be.visible");
            cy.get('[aria-label="Close"]').click();
          });

          // Open connections tab
          cy.get('#content-sidebar').within(() => {
            cy.get('[aria-label="Connections"]').click();
          });

          // Verify Target Document appears only once in outgoing references
          cy.get('#connections_sidebar_tab').within(() => {
            cy.contains("References:").should("be.visible");
            // Count occurrences - should only appear once
            cy.contains("Target Document").parents('.flex.flex-row.gap-3').should('have.length', 1);
          });

          // Navigate to target document
          cy.visit(`/d/${targetDocId}`);
          cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");

          // Open connections tab
          cy.get('#content-sidebar').within(() => {
            cy.get('[aria-label="Connections"]').click();
          });

          // Verify Source Document appears only once in incoming references
          cy.get('#connections_sidebar_tab').within(() => {
            cy.contains("Referenced in:").should("be.visible");
            cy.contains("Source Document").parents('.flex.flex-row.gap-3').should('have.length', 1);
          });
        });
      });
    });
  });

  describe("User Mentions Tab on Root Page", function () {
    it("displays user mentions in mentions tab", function () {
      // Create a document with user mention
      cy.appScenario("create_document_with_user_mention", {
        space_id: "is_default",
        organization_id: "is",
        user_email: "pawel@ikigai.systems"
      });

      // Navigate to root page
      cy.visit("/");

      // Click on mentions tab
      cy.get('button#mentions').click();

      // Verify mention appears in mentions tab
      cy.get('#mentions_container').within(() => {
        cy.get('#mentions_list').should("be.visible");
        cy.contains("Document with Mention").should("be.visible");
      });
    });

    it("shows mentions count badge when there are unread mentions", function () {
      // Create a document with user mention
      cy.appScenario("create_document_with_user_mention", {
        space_id: "is_default",
        organization_id: "is",
        user_email: "pawel@ikigai.systems"
      });

      // Navigate to root page
      cy.visit("/");

      cy.get('[data-testid="notification-badge"]')
        .should("have.attr", "data-count", "1");
      cy.get('[data-testid="notification-badge"]').should("contain", "1");
    });

    it("navigates to document when clicking on mention", function () {
      // Create a document with user mention
      cy.appScenario("create_document_with_user_mention", {
        space_id: "is_default",
        organization_id: "is",
        user_email: "pawel@ikigai.systems"
      });

      cy.appEval("Document.find_by(title: 'Document with Mention').id").then((docId) => {
        // Navigate to root page
        cy.visit("/");

        // Click on mentions tab
        cy.get('button#mentions').click();

        // Click on the mention
        cy.get('#mentions_container').within(() => {
          cy.contains("Document with Mention").click();
        });

        // Verify we're navigated to the document with anchor
        cy.url().should("include", `/d/${docId}`);
        cy.url().should("include", "mention-");
      });
    });

    it("shows 'new' separator for unseen mentions", function () {
      // Create a document with user mention and mark it as seen
      cy.appScenario("create_document_with_old_mention", {
        space_id: "is_default",
        organization_id: "is",
        user_email: "pawel@ikigai.systems"
      });

      // Visit mentions to mark as seen
      cy.visit("/?anchor=mentions");
      cy.get('button#mentions').click();
      cy.wait(1500); // Wait for auto-mark as read

      // Create another document with new mention
      cy.appScenario("create_document_with_new_mention", {
        space_id: "is_default",
        organization_id: "is",
        user_email: "pawel@ikigai.systems"
      });

      // Visit mentions again
      cy.visit("/");
      cy.get('button#mentions').click();

      // Verify 'new' separator appears
      cy.get('#mentions_container').within(() => {
        cy.get('.bg-red-600').contains("new").should("be.visible");
      });
    });

    it("shows empty state when user has no mentions", function () {
      // Navigate to root page
      cy.visit("/");

      // Click on mentions tab
      cy.get('button#mentions').click();

      // Verify empty state message
      cy.get('#mentions_container').within(() => {
        cy.contains("No mentions").should("be.visible");
        cy.contains("You are not mentioned in any document yet.").should("be.visible");
      });
    });

    it("displays mentions from multiple documents", function () {
      // Create two documents with user mentions
      cy.appScenario("create_two_documents_with_mentions", {
        space_id: "is_default",
        organization_id: "is",
        user_email: "pawel@ikigai.systems"
      });

      // Navigate to root page
      cy.visit("/");

      // Click on mentions tab
      cy.get('button#mentions').click();

      // Verify both mentions appear
      cy.get('#mentions_container').within(() => {
        cy.contains("First Mention Doc").should("be.visible");
        cy.contains("Second Mention Doc").should("be.visible");
      });
    });
  });

  describe("Notification Badge", function () {
    it("shows unread mentions count in toolbar notification badge", function () {
      // Create documents with user mentions
      cy.appScenario("create_two_documents_with_mentions", {
        space_id: "is_default",
        organization_id: "is",
        user_email: "pawel@ikigai.systems"
      });

      // Navigate to any document
      cy.appEval("Document.first.id").then((docId) => {
        cy.visit(`/d/${docId}`);

        // Verify notification button has accessible label
        cy.get('[data-testid="notifications-button"]')
          .should("have.attr", "aria-label")
          .and("include", "2 unread");

        // Verify notification badge shows count
        cy.get('[data-testid="notification-badge"]').should("be.visible");
        cy.get('[data-testid="notification-badge"]')
          .should("have.attr", "data-count", "2");
        cy.get('[data-testid="notification-badge"]').should("contain", "2");

        // Verify badge has proper ARIA role and label
        cy.get('[data-testid="notification-badge"]')
          .should("have.attr", "role", "status");
        cy.get('[data-testid="notification-badge"]')
          .should("have.attr", "aria-label", "2 unread mentions");
      });
    });

    it("clicking notification badge navigates to mentions tab", function () {
      // Create a document with user mention
      cy.appScenario("create_document_with_user_mention", {
        space_id: "is_default",
        organization_id: "is",
        user_email: "pawel@ikigai.systems"
      });

      // Navigate to any document
      cy.appEval("Document.first.id").then((docId) => {
        cy.visit(`/d/${docId}`);

        // Click notification button
        cy.get('[data-testid="notifications-button"]').click();

        // Verify we're on root page with mentions tab
        cy.url().should("include", "/#mentions");
        cy.get('button#mentions').should("have.class", "active-tab");
      });
    });

    it("does not show badge when there are no unread mentions", function () {
      // Navigate to any document
      cy.appEval("Document.first.id").then((docId) => {
        cy.visit(`/d/${docId}`);

        // Verify no notification badge visible
        cy.get('[data-testid="notification-badge"]').should("not.exist");

        // Verify accessible label indicates no unread
        cy.get('[data-testid="notifications-button"]')
          .should("have.attr", "aria-label", "Notifications, no unread");
      });
    });

    it("has proper accessibility attributes", function () {
      // Create a document with user mention
      cy.appScenario("create_document_with_user_mention", {
        space_id: "is_default",
        organization_id: "is",
        user_email: "pawel@ikigai.systems"
      });

      cy.appEval("Document.first.id").then((docId) => {
        cy.visit(`/d/${docId}`);

        // Verify button has proper role
        cy.get('[data-testid="notifications-button"]')
          .should("have.attr", "role", "button");

        // Verify icon is hidden from screen readers
        cy.get('[data-testid="notifications-button"] .icon-\\[heroicons--bell\\]')
          .should("have.attr", "aria-hidden", "true");

        // Verify badge count is programmatically accessible
        cy.get('[data-testid="notification-badge"]')
          .should("have.attr", "data-count")
          .and("match", /^\d+$/);
      });
    });
  });
});
