import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Document Tags", function () {
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
        "tags",
        "object_tags"
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");

    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("displays existing tags in the sidebar", function () {
    const documentId = "one";

    cy.visit(`/d/${documentId}`);

    cy.contains("Loading content").should("not.be.visible");

    // Open the sidebar Details tab
    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Details"]').click();
    });

    // Verify tags section is visible
    cy.get("#content-sidebar").within(() => {
      cy.contains("Tags").should("be.visible");
    });

    // Verify existing tags are displayed (if any exist in fixtures)
    cy.appEval(`Document.find('${documentId}').tags.pluck(:name)`).then((tagNames) => {
      expect(tagNames.length).to.be.at.least(1);

      if (tagNames.length > 0) {
        tagNames.forEach((tagName) => {
          cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
            cy.contains(`#${tagName}`).should("be.visible");
          });
        });
      }
    });
  });

  it("adds a new tag to a document", function () {
    const documentId = "one";
    const newTag = "test-tag";

    cy.visit(`/d/${documentId}`);

    cy.contains("Loading content").should("not.be.visible");

    // Open the sidebar Details tab
    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Details"]').click();
    });

    // Get initial tag count
    cy.appEval(`Document.find('${documentId}').tags.count`).then((initialCount) => {
      // Click on the multiselect component
      cy.get("#details_sidebar_tab").within(() => {
        cy.get(".multiselect__search").type(newTag);
        cy.get(".multiselect__no-result").click();
      });

      // Verify tag appears in the UI
      cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
        cy.contains(`#${newTag}`).should("be.visible");
      });

      // Verify tag name is correct
      cy.appEval(`Document.find('${documentId}').tags.pluck(:name)`).then((tagNames) => {
        expect(tagNames.length).to.equal(initialCount + 1);
        expect(tagNames).to.include(newTag);
      });
    });
  });

  it("removes a tag from a document", function () {
    const documentId = "one";

    // First, add a tag to ensure there's one to remove
    cy.appEval(`
      document = Document.find('${documentId}')
      TagsService.new(object: document, organization: document.organization).add_tags(['removable-tag'])
      document.tags.pluck(:name)
    `).then((tagNames) => {
      expect(tagNames).to.include("removable-tag");

      cy.visit(`/d/${documentId}`);

      cy.contains("Loading content").should("not.be.visible");

      // Open the sidebar Details tab
      cy.get("#content-sidebar").within(() => {
        cy.get('[aria-label="Details"]').click();
      });

      // Get initial tag count
      cy.appEval(`Document.find('${documentId}').tags.count`).then((initialCount) => {
        cy.intercept('POST', `/d/${documentId}/tags`).as('updateTags');

        // Remove the tag by clicking the delete button on the pill
        cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
          cy.contains(`#removable-tag`).parent(".multiselect__pill").within(() => {
            cy.get(".multiselect__pill-delete").click();
          });
        });

        cy.wait('@updateTags');

        // Verify tag is removed from UI
        cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
          cy.contains(`#removable-tag`).should("not.exist");
        });

        // Verify tag name is not in the list
        cy.appEval(`Document.find('${documentId}').tags.pluck(:name)`).then((newTagNames) => {
          expect(newTagNames.length).to.equal(initialCount - 1);
          expect(newTagNames).to.not.include("removable-tag");
        });
      });
    });
  });

  it("adds multiple tags to a document", function () {
    const documentId = "one";
    const tags = ["tag1", "tag2", "tag3"];

    cy.visit(`/d/${documentId}`);

    cy.contains("Loading content").should("not.be.visible");

    // Open the sidebar Details tab
    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Details"]').click();
    });

    // Get initial tag count
    cy.appEval(`Document.find('${documentId}').tags.count`).then((initialCount) => {
      // Add each tag
      tags.forEach((tag) => {
        cy.get("#details_sidebar_tab").within(() => {
          cy.get(".multiselect__search").type(tag);
          cy.get(".multiselect__no-result").click();

          cy.get(".multiselect__preview").within(() => {
            cy.contains(`#${tag}`).should("be.visible");
          });
        });
      });

      // Verify all tags appear in the UI
      tags.forEach((tag) => {
        cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
          cy.contains(`#${tag}`).should("be.visible");
        });
      });

      // Verify all tag names are in the list
      cy.appEval(`Document.find('${documentId}').tags.pluck(:name)`).then((tagNames) => {
        expect(tagNames.length).to.equal(initialCount + tags.length);

        tags.forEach((tag) => {
          expect(tagNames).to.include(tag);
        });
      });
    });
  });

  it("persists tags after page reload", function () {
    const documentId = "one";
    const persistentTag = "persistent-tag";

    cy.visit(`/d/${documentId}`);

    cy.contains("Loading content").should("not.be.visible");

    // Open the sidebar Details tab
    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Details"]').click();
    });

    // Add a tag
    cy.get("#details_sidebar_tab").within(() => {
      cy.get(".multiselect__search").type(persistentTag);
      cy.get(".multiselect__no-result").click();
    });

    // Verify tag appears
    cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
      cy.contains(`#${persistentTag}`).should("be.visible");
    });

    // Reload the page
    cy.reload();

    cy.contains("Loading content").should("not.be.visible");

    // Open the sidebar Details tab again
    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Details"]').click();
    });

    // Verify tag still appears
    cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
      cy.contains(`#${persistentTag}`).should("be.visible");
    });

    // Verify tag is still in database
    cy.appEval(`Document.find('${documentId}').tags.pluck(:name)`).then((tagNames) => {
      expect(tagNames).to.include(persistentTag);
    });
  });

  it("autocompletes existing tags in the space", function () {
    const documentId = "one";

    // Create some existing tags in the space
    cy.appEval(`
      space = Document.find('${documentId}').space
      space.tags.create!(name: "autocomplete-test", organization: space.organization)
      space.tags.create!(name: "autocomplete-match", organization: space.organization)
      space.tags.create!(name: "other-tag", organization: space.organization)
    `);

    cy.visit(`/d/${documentId}`);

    cy.contains("Loading content").should("not.be.visible");

    // Open the sidebar Details tab
    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Details"]').click();
    });

    // Intercept the tags update request
    cy.intercept('POST', `/d/${documentId}/tags`).as('updateTags');

    // Type partial tag name to trigger autocomplete
    cy.get("#details_sidebar_tab").within(() => {
      cy.get(".multiselect__search").type("autocomplete");
    });

    // Wait for autocomplete dropdown to appear
    cy.get(".multiselect__dropdown").should("be.visible");

    // Verify matching tags appear in dropdown
    cy.get(".multiselect__dropdown").within(() => {
      cy.contains("#autocomplete-test").should("be.visible");
      cy.contains("#autocomplete-match").should("be.visible");
      cy.contains("#other-tag").should("not.exist");
    });

    // Select a tag from autocomplete
    cy.get(".multiselect__dropdown").within(() => {
      cy.contains("#autocomplete-test").click();
    });

    // Wait for the AJAX request to complete
    cy.wait('@updateTags');

    // Verify tag was added
    cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
      cy.contains("#autocomplete-test").should("be.visible");
    });

    // Verify tag is in database (now safe to check after request completes)
    cy.appEval(`Document.find('${documentId}').tags.pluck(:name)`).then((tagNames) => {
      expect(tagNames).to.include("autocomplete-test");
    });
  });

  it("supports hierarchical tags with slashes", function () {
    const documentId = "one";
    const hierarchicalTag = "category/subcategory/item";

    cy.visit(`/d/${documentId}`);

    cy.contains("Loading content").should("not.be.visible");

    // Open the sidebar Details tab
    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Details"]').click();
    });

    // Add a hierarchical tag
    cy.get("#details_sidebar_tab").within(() => {
      cy.get(".multiselect__search").type(hierarchicalTag);
      cy.get(".multiselect__no-result").click();
    });

    // Verify tag appears in the UI
    cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
      cy.contains(`#${hierarchicalTag}`).should("be.visible");
    });

    // Verify tag was added to database with correct name
    cy.appEval(`Document.find('${documentId}').tags.pluck(:name)`).then((tagNames) => {
      expect(tagNames).to.include(hierarchicalTag);
    });

    // Verify tag structure is correct
    cy.appEval(`
      tag = Document.find('${documentId}').tags.find_by(name: '${hierarchicalTag}')
      {
        name: tag.name,
        depth: tag.depth,
        root_name: tag.root_name,
        leaf_name: tag.leaf_name
      }
    `).then((tagData) => {
      expect(tagData.name).to.equal(hierarchicalTag);
      expect(tagData.depth).to.equal(2);
      expect(tagData.root_name).to.equal("category");
      expect(tagData.leaf_name).to.equal("item");
    });
  });

  it("handles tag validation errors gracefully", function () {
    const documentId = "one";
    const invalidTag = "Invalid Tag With Spaces!";

    cy.visit(`/d/${documentId}`);

    cy.contains("Loading content").should("not.be.visible");

    // Open the sidebar Details tab
    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Details"]').click();
    });

    // Try to add an invalid tag
    cy.get("#details_sidebar_tab").within(() => {
      cy.get(".multiselect__search").type(invalidTag);
      // The no-result button should not appear for invalid tags
      cy.get(".multiselect__no-result").should("not.exist");
    });

    // Verify invalid tag was not added
    cy.appEval(`Document.find('${documentId}').tags.pluck(:name)`).then((tagNames) => {
      expect(tagNames).to.not.include(invalidTag);
      expect(tagNames).to.not.include(invalidTag.toLowerCase());
    });
  });

  it("displays tags when switching between view and edit modes", function () {
    const documentId = "one";

    // Visit document edit page
    cy.visit(`/d/${documentId}/edit`);

    // Wait for content to load
    cy.contains("Loading content").should("not.be.visible");

    // Open sidebar Details tab
    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Details"]').click();
    });

    // Capture the list of tags on the edit page using alias
    cy.get("#details_sidebar_tab .multiselect__preview .multiselect__pill")
      .then($pills => {
        return Cypress._.map($pills, pill => {
          const tagText = pill.textContent.trim();
          // Remove the × symbol and extract just the tag name
          return tagText.replace(/×$/, '').trim();
        });
      })
      .as('editPageTags');

    // Ensure we have at least some tags from fixtures
    cy.get('@editPageTags').should('have.length.at.least', 1);

    // Save and navigate to show page
    cy.get('[aria-label="Save document"]').click();
    cy.url().should("include", `/d/${documentId}`);
    cy.url().should("not.include", "/edit");

    cy.get("#flashes").within(() => {
      cy.contains("Document has been updated").should("be.visible");
      cy.get('[aria-label="Close"]').click();
    });

    // Wait for content to load on show page
    cy.contains("Loading content").should("not.be.visible");

    // Open sidebar Details tab on show page
    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Details"]').click();
    });

    // Capture the list of tags on the show page using alias
    cy.get("#details_sidebar_tab .multiselect__preview .multiselect__pill")
      .then($pills => {
        return Cypress._.map($pills, pill => {
          const tagText = pill.textContent.trim();
          return tagText.replace(/×$/, '').trim();
        });
      })
      .as('showPageTags');

    // Compare the two lists - they should match exactly
    cy.get('@editPageTags').then(editPageTags => {
      cy.get('@showPageTags').then(showPageTags => {
        expect(showPageTags).to.have.length(editPageTags.length);
        expect(showPageTags).to.have.members(editPageTags);

        // Verify each tag from edit page appears on show page
        editPageTags.forEach((tag) => {
          cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
            cy.contains(tag).should("be.visible");
          });
        });
      });
    });
  });
});
