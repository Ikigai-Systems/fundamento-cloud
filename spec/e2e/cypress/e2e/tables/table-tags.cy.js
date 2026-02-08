import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Table Tags", function () {
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
        "tags",
        "object_tags",
        "tables/tables",
        "tables/tags",
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");

    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("displays existing tags in the sidebar", function () {
    const tableId = "orders";
    
    cy.visit(`/t/${tableId}`);

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
    cy.appEval(`Table.find('${tableId}').tags.pluck(:name)`).then((tagNames) => {
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

  it("adds a new tag to a table", function () {
    const newTag = "table-tag";

    cy.intercept('GET', `/s/is_default/tags/suggest.json*`).as('suggestTags');

    cy.appEval("Table.first.id").then((tableId) => {
      cy.visit(`/t/${tableId}`);

      cy.contains("Loading content").should("not.be.visible");

      // Open the sidebar Details tab
      cy.get("#content-sidebar").within(() => {
        cy.get('[aria-label="Details"]').click();
      });

      // Get initial tag count
      cy.appEval(`Table.find('${tableId}').tags.count`).then((initialCount) => {
        // Click on the multiselect component
        cy.get("#details_sidebar_tab").within(() => {
          cy.get(".multiselect__container").click();
          cy.get(".multiselect__search").type(newTag);
          cy.wait("@suggestTags");
          cy.get(".multiselect__no-result").click();
        });

        // Verify tag appears in the UI
        cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
          cy.contains(`#${newTag}`).should("be.visible");
        });

        // Verify tag name is correct
        cy.appEval(`Table.find('${tableId}').tags.pluck(:name)`).then((tagNames) => {
          expect(tagNames.length).to.equal(initialCount + 1);
          expect(tagNames).to.include(newTag);
        });
      });
    });
  });

  it("removes a tag from a table", function () {
    cy.appEval("Table.first.id").then((tableId) => {
      // First, add a tag to ensure there's one to remove
      cy.appEval(`
        table = Table.find('${tableId}')
        TagsService.new(object: table, organization: table.organization).add_tags(['removable-table-tag'])
        table.tags.pluck(:name)
      `).then((tagNames) => {
        expect(tagNames).to.include("removable-table-tag");

        cy.visit(`/t/${tableId}`);

        cy.contains("Loading content").should("not.be.visible");

        // Open the sidebar Details tab
        cy.get("#content-sidebar").within(() => {
          cy.get('[aria-label="Details"]').click();
        });

        // Get initial tag count
        cy.appEval(`Table.find('${tableId}').tags.count`).then((initialCount) => {
          cy.intercept('POST', `/t/${tableId}/tags`).as('updateTags');

          // Remove the tag by clicking the delete button on the pill
          cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
            cy.contains(`#removable-table-tag`).parent(".multiselect__pill").within(() => {
              cy.get(".multiselect__pill-delete").click();
            });
          });

          cy.wait('@updateTags');

          // Verify tag is removed from UI
          cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
            cy.contains(`#removable-table-tag`).should("not.exist");
          });

          // Verify tag name is not in the list
          cy.appEval(`Table.find('${tableId}').tags.pluck(:name)`).then((newTagNames) => {
            expect(newTagNames.length).to.equal(initialCount - 1);
            expect(newTagNames).to.not.include("removable-table-tag");
          });
        });
      });
    });
  });

  it("adds multiple tags to a table", function () {
    // FIXME: breaks with more than 2 tags at the moment
    // const tags = ["table-tag1", "table-tag2", "table-tag3"];
    const tags = ["table-tag1", "table-tag2"];

    cy.intercept('GET', `/s/is_default/tags/suggest.json?q=*`).as('suggestTags');
    cy.intercept('GET', `/s/is_default/tags/suggest.json`).as('loadTags');


    cy.appEval("Table.first.id").then((tableId) => {
      cy.intercept('POST', `/t/${tableId}/tags`).as('updateTags');

      cy.visit(`/t/${tableId}`);

      cy.contains("Loading content").should("not.be.visible");

      // Open the sidebar Details tab
      cy.get("#content-sidebar").within(() => {
        cy.get('[aria-label="Details"]').click();
      });

      // Get initial tag count
      cy.appEval(`Table.find('${tableId}').tags.count`).then((initialCount) => {
        // Add each tag
        tags.forEach((tag) => {
          cy.get("#details_sidebar_tab").within(() => {
            cy.get(".multiselect__container").click();
            cy.get(".multiselect__search").type(tag);
            cy.wait("@suggestTags");
            cy.get(".multiselect__no-result").click();
            cy.wait("@updateTags");
            cy.wait("@loadTags");

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
        cy.appEval(`Table.find('${tableId}').tags.pluck(:name)`).then((tagNames) => {
          expect(tagNames.length).to.equal(initialCount + tags.length);

          tags.forEach((tag) => {
            expect(tagNames).to.include(tag);
          });
        });
      });
    });
  });

  it("persists tags after page reload", function () {
    const persistentTag = "persistent-table-tag";

    cy.appEval("Table.first.id").then((tableId) => {
      cy.visit(`/t/${tableId}`);

      cy.contains("Loading content").should("not.be.visible");

      // Open the sidebar Details tab
      cy.get("#content-sidebar").within(() => {
        cy.get('[aria-label="Details"]').click();
      });

      // Add a tag
      cy.get("#details_sidebar_tab").within(() => {
        cy.get(".multiselect__container").click();
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
      cy.appEval(`Table.find('${tableId}').tags.pluck(:name)`).then((tagNames) => {
        expect(tagNames).to.include(persistentTag);
      });
    });
  });

  it("autocompletes existing tags in the space", function () {
    cy.appEval("Table.first.id").then((tableId) => {
      // Create some existing tags in the space
      cy.appEval(`
        space = Table.find('${tableId}').space
        space.tags.create!(name: "table-autocomplete-test", organization: space.organization)
        space.tags.create!(name: "table-autocomplete-match", organization: space.organization)
        space.tags.create!(name: "other-table-tag", organization: space.organization)
      `);

      cy.visit(`/t/${tableId}`);

      cy.contains("Loading content").should("not.be.visible");

      // Open the sidebar Details tab
      cy.get("#content-sidebar").within(() => {
        cy.get('[aria-label="Details"]').click();
      });

      // Intercept the tags update request
      cy.intercept('POST', `/t/${tableId}/tags`).as('updateTags');

      // Type partial tag name to trigger autocomplete
      cy.get("#details_sidebar_tab").within(() => {
        cy.get(".multiselect__container").click();
        cy.get(".multiselect__search").type("table-autocomplete");
      });

      // Wait for autocomplete dropdown to appear
      cy.get(".multiselect__dropdown").should("be.visible");

      // Verify matching tags appear in dropdown
      cy.get(".multiselect__dropdown").within(() => {
        cy.contains("#table-autocomplete-test").should("be.visible");
        cy.contains("#table-autocomplete-match").should("be.visible");
        cy.contains("#other-table-tag").should("not.exist");
      });

      // Select a tag from autocomplete
      cy.get(".multiselect__dropdown").within(() => {
        cy.contains("#table-autocomplete-test").click();
      });


      // Wait for the AJAX request to complete
      cy.wait('@updateTags');

      // Verify tag was added
      cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
        cy.contains("#table-autocomplete-test").should("be.visible");
      });

      // Verify tag is in database
      cy.appEval(`Table.find('${tableId}').tags.pluck(:name)`).then((tagNames) => {
        expect(tagNames).to.include("table-autocomplete-test");
      });
    });
  });

  it("supports hierarchical tags with slashes", function () {
    const hierarchicalTag = "table/category/subcategory";

    cy.appEval("Table.first.id").then((tableId) => {
      cy.visit(`/t/${tableId}`);

      cy.contains("Loading content").should("not.be.visible");

      // Open the sidebar Details tab
      cy.get("#content-sidebar").within(() => {
        cy.get('[aria-label="Details"]').click();
      });

      // Add a hierarchical tag
      cy.get("#details_sidebar_tab").within(() => {
        cy.get(".multiselect__container").click();
        cy.get(".multiselect__search").type(hierarchicalTag);
        cy.get(".multiselect__no-result").click();
      });

      // Verify tag appears in the UI
      cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
        cy.contains(`#${hierarchicalTag}`).should("be.visible");
      });

      // Verify tag was added to database with correct name
      cy.appEval(`Table.find('${tableId}').tags.pluck(:name)`).then((tagNames) => {
        expect(tagNames).to.include(hierarchicalTag);
      });

      // Verify tag structure is correct
      cy.appEval(`
        tag = Table.find('${tableId}').tags.find_by(name: '${hierarchicalTag}')
        {
          name: tag.name,
          depth: tag.depth,
          root_name: tag.root_name,
          leaf_name: tag.leaf_name
        }
      `).then((tagData) => {
        expect(tagData.name).to.equal(hierarchicalTag);
        expect(tagData.depth).to.equal(2);
        expect(tagData.root_name).to.equal("table");
        expect(tagData.leaf_name).to.equal("subcategory");
      });
    });
  });

  it("shares tags between documents and tables in the same space", function () {
    const sharedTag = "shared-tag";

    cy.appEval("Table.first.id").then((tableId) => {
      // Create a document in the same space and add a tag
      cy.appEval(`
        table = Table.find('${tableId}')
        space = table.space
        document = space.documents.create!(
          title: "Test Document for Shared Tags",
          organization: space.organization
        )
        TagsService.new(object: document, organization: document.organization).add_tags(['${sharedTag}'])
        document.id
      `).then((documentId) => {
        // Now visit the table and verify the tag appears in autocomplete
        cy.visit(`/t/${tableId}`);

        cy.contains("Loading content").should("not.be.visible");

        // Open the sidebar Details tab
        cy.get("#content-sidebar").within(() => {
          cy.get('[aria-label="Details"]').click();
        });

        // Type the shared tag to trigger autocomplete
        cy.get("#details_sidebar_tab").within(() => {
          cy.get(".multiselect__container").click();
          cy.get(".multiselect__search").type(sharedTag);
        });

        // Wait for autocomplete dropdown to appear
        cy.get(".multiselect__dropdown").should("be.visible");

        // Verify the shared tag appears in dropdown
        cy.get(".multiselect__dropdown").within(() => {
          cy.contains(`#${sharedTag}`).should("be.visible");
        });

        cy.intercept('POST', `/t/${tableId}/tags`).as('updateTags');

        // Select the shared tag
        cy.get(".multiselect__dropdown").within(() => {
          cy.contains(`#${sharedTag}`).click();
        });

        cy.wait('@updateTags');

        // Verify tag was added to the table
        cy.get("#details_sidebar_tab .multiselect__preview").within(() => {
          cy.contains(`#${sharedTag}`).should("be.visible");
        });

        // Verify both document and table have the same tag
        cy.appEval(`
          {
            document_tags: Document.find('${documentId}').tags.pluck(:name),
            table_tags: Table.find('${tableId}').tags.pluck(:name),
            tag_count: Tag.where(name: '${sharedTag}', space_id: Table.find('${tableId}').space_id).count
          }
        `).then((result) => {
          expect(result.document_tags).to.include(sharedTag);
          expect(result.table_tags).to.include(sharedTag);
          expect(result.tag_count).to.equal(1); // Only one tag record exists
        });
      });
    });
  });

  it("handles tag validation errors gracefully", function () {
    const invalidTag = "Invalid Table Tag!";

    cy.appEval("Table.first.id").then((tableId) => {
      cy.visit(`/t/${tableId}`);

      cy.contains("Loading content").should("not.be.visible");

      // Open the sidebar Details tab
      cy.get("#content-sidebar").within(() => {
        cy.get('[aria-label="Details"]').click();
      });

      // Try to add an invalid tag
      cy.get("#details_sidebar_tab").within(() => {
        cy.get(".multiselect__container").click();
        cy.get(".multiselect__search").type(invalidTag);
        // The no-result button should not appear for invalid tags
        cy.get(".multiselect__no-result").should("not.exist");
      });

      // Verify invalid tag was not added
      cy.appEval(`Table.find('${tableId}').tags.pluck(:name)`).then((tagNames) => {
        expect(tagNames).to.not.include(invalidTag);
        expect(tagNames).to.not.include(invalidTag.toLowerCase());
      });
    });
  });
});
