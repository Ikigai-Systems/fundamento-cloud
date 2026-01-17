describe("Space Onboarding NPI Uniqueness", function() {
  before(() => {
    cy.app("clean");
    cy.appFlipper({flags: ["standalone"]});
  });

  beforeEach(() => {
    // Handle uncaught exceptions from standalone mode
    cy.on("uncaught:exception", (err, runnable) => {
      // Ignore "Cannot read properties of null (reading 'content')" error
      if (err.message.includes("Cannot read properties of null")) {
        return false;
      }
      // Let other errors fail the test
      return true;
    });
  });

  it("creates unique table NPIs across organizations (BUG FIXED)", function() {
    // Create two organizations via Ruby eval
    // Each organization automatically creates a default space with onboarding
    cy.appEval(`
      org1 = Organization.create!(name: "E2E Test Org 1 #{Time.now.to_i}")
      org2 = Organization.create!(name: "E2E Test Org 2 #{Time.now.to_i}")

      space1 = org1.spaces.first
      space2 = org2.spaces.first

      {
        org1_id: org1.id,
        org2_id: org2.id,
        space1_id: space1.id,
        space2_id: space2.id,
        space1_table_ids: space1.tables.pluck(:id).sort,
        space2_table_ids: space2.tables.pluck(:id).sort
      }
    `).then((data) => {
      // Check that organizations are different
      expect(data.org1_id).to.not.equal(data.org2_id);

      // Check that space NPIs are different
      expect(data.space1_id).to.not.equal(data.space2_id);

      // Check that table NPIs are different (BUG FIXED - should now pass)
      const duplicates = data.space1_table_ids.filter(id =>
        data.space2_table_ids.includes(id)
      );

      expect(duplicates).to.have.length(0,
        `Expected unique table NPIs but found duplicates: ${duplicates.join(", ")}`
      );
    });
  });

  it("renders tables correctly with dynamic NPIs", function() {
    // Create organization and populate with onboarding
    cy.appEval(`
      org = Organization.create!(name: "E2E Test Render #{Time.now.to_i}")
      space = org.spaces.first
      user = User.create!(
        first_name: "Test",
        last_name: "User",
        email: "test-#{Time.now.to_i}@example.com",
        password: "password",
        confirmed_at: Time.now
      )
      org.organization_memberships.create!(user: user, role: :manager)

      # Find the advanced table by name (not by hardcoded NPI)
      advanced_table = space.tables.find_by(name: "Advanced Table: Customer their first full month of sales")

      {
        user_email: user.email,
        org_name: org.name,
        space_id: space.id,
        advanced_table_id: advanced_table.id
      }
    `).then((data) => {
      cy.login(data.user_email, "password");

      // User has only one organization, so it's automatically selected
      // No need to select organization manually

      // Visit the advanced table with dynamically generated NPI
      cy.visit(`/t/${data.advanced_table_id}`);

      // Verify table renders
      cy.contains("Advanced Table: Customer their first full month of sales").should("exist");
      cy.get(".ikigai-rowstack-overrides").should("exist");

      // Verify table has data
      cy.get('[role="gridcell"]').should("have.length.at.least", 1);

      // Visit edit mode
      cy.get(".edit-table-button").click();
      cy.url().should("include", "/edit");
      cy.contains("Each change is saved automatically").should("be.visible");
    });
  });

  it("verifies all onboarding tables are created with unique NPIs", function() {
    cy.appEval(`
      org = Organization.create!(name: "E2E Test Tables #{Time.now.to_i}")
      space = org.spaces.first

      space.tables.pluck(:id, :name).map { |id, name|
        { id: id, name: name }
      }
    `).then((tables) => {
      // Verify all 3 expected tables exist
      expect(tables).to.have.length(3);

      // Verify all NPIs are unique (not hardcoded)
      const tableNpis = tables.map(t => t.id);
      expect(tableNpis).to.have.length(3);
      expect(new Set(tableNpis).size).to.equal(3); // All NPIs should be unique

      // Verify none of the NPIs are the old hardcoded values
      expect(tableNpis).to.not.include("7enpoTncq9");
      expect(tableNpis).to.not.include("7hDhcL1cyv");
      expect(tableNpis).to.not.include("u34fOBpaFp");

      // Verify the advanced table exists by name
      const tableNames = tables.map(t => t.name);
      expect(tableNames).to.include("Advanced Table: Customer their first full month of sales");
    });
  });

  it("verifies document-to-table references work", function() {
    // Create organization with onboarding
    cy.appEval(`
      org = Organization.create!(name: "E2E Test References #{Time.now.to_i}")
      space = org.spaces.first
      user = User.create!(
        first_name: "Test",
        last_name: "User",
        email: "test-#{Time.now.to_i}@example.com",
        password: "password",
        confirmed_at: Time.now
      )
      org.organization_memberships.create!(user: user, role: :manager)

      # Find document with advancedTable block referencing 7hDhcL1cyv
      formula_doc = space.documents.joins(:versions)
        .where("versions.content_blocks::text LIKE ?", "%3a58b503-a14b-4b40-b840-76afabba62d2%")
        .first

      {
        user_email: user.email,
        org_name: org.name,
        doc_id: formula_doc&.id,
        doc_title: formula_doc&.title,
        has_formula_doc: formula_doc.present?
      }
    `).then((data) => {
      // Verify a document with table reference exists
      expect(data.has_formula_doc).to.be.true;

      cy.login(data.user_email, "password");

      // User has only one organization, so it's automatically selected
      // No need to select organization manually

      // Visit the document containing the advancedTable block
      cy.visit(`/d/${data.doc_id}`);

      // Wait for document to load
      cy.contains(data.doc_title).should("be.visible");

      // Verify the advancedTable block is rendered
      // The block should render the table with NPI 7hDhcL1cyv
      cy.get('[data-content-type="advancedTable"]').should("exist");
    });
  });
});
