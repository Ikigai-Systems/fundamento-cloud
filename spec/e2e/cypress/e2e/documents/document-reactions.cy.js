import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Document Reactions", function () {
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
        "versions"
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");

    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("displays existing reactions", function () {
    const documentId = "two";

    // Add a reaction via backend
    cy.appEval(`
      document = Document.find('${documentId}')
      membership = OrganizationMembership.find('om_is_pawel')
      document.reactions.create!(
        organization: document.organization,
        organization_membership: membership,
        emoji: '👍'
      )
    `);

    cy.visit(`/d/${documentId}`);

    cy.get("[data-document-editor] [role='textbox']", {timeout: 10000}).should("exist");

    // Wait for reactions frame to load
    cy.get(".object-reactions-container", {timeout: 10000}).should("be.visible");

    // Verify existing reaction is displayed
    cy.get(".destroy-reaction-button").should("contain", "👍");
    cy.get(".reaction-count").should("contain", "1");
  });

  it("adds a new reaction", function () {
    const documentId = "two";

    cy.visit(`/d/${documentId}`);

    cy.get("[data-document-editor] [role='textbox']", {timeout: 10000}).should("exist");

    // Wait for reactions frame to load
    cy.get(".object-reactions-container", {timeout: 10000}).should("be.visible");

    // Get initial reaction count
    cy.appEval(`Document.find('${documentId}').reactions.count`).then((initialCount) => {
      // Click the add reaction button to open emoji picker
      cy.get(".create-reaction-button").click();

      // Wait for emoji picker to appear
      cy.get("[data-emoji-picker-target='pickerContainer']").should("be.visible");

      cy.intercept("POST", "/reactions*").as("addReaction");
      cy.intercept("GET", "/reactions*").as("getReactions");

      cy.get("[data-emoji-picker-target='pickerContainer']").within(() => {
        cy.get("em-emoji-picker").shadow().find("input[type=search]").type("🎉{enter}");
      });

      cy.wait("@addReaction");
      cy.wait("@getReactions");

      // Verify reaction appears in UI
      cy.get(".destroy-reaction-button").should("contain", "🎉");
      cy.get(".reaction-count").should("contain", "1");

      cy.appEval(`Document.find('${documentId}').reactions.pluck(:emoji)`).then((emojis) => {
        expect(emojis.length).to.equal(initialCount + 1);
        expect(emojis).to.include("🎉");
      });
    });
  });

  it("removes a reaction", function () {
    const documentId = "two";

    // Add a reaction via backend
    cy.appEval(`
      document = Document.find('${documentId}')
      membership = OrganizationMembership.find('om_is_pawel')
      document.reactions.create!(
        organization: document.organization,
        organization_membership: membership,
        emoji: '❤️'
      )
    `);

    cy.visit(`/d/${documentId}`);

    cy.get("[data-document-editor] [role='textbox']", {timeout: 10000}).should("exist");

    // Wait for reactions frame to load
    cy.get(".object-reactions-container", {timeout: 10000}).should("be.visible");

    // Verify reaction is displayed
    cy.get(".destroy-reaction-button").should("contain", "❤️");

    // Get initial reaction count
    cy.appEval(`Document.find('${documentId}').reactions.count`).then((initialCount) => {
      cy.intercept("POST", "/reactions/*").as("deleteReaction");
      cy.intercept("GET", "/reactions*").as("getReactions");

      // Click the reaction to remove it
      cy.get(".destroy-reaction-button").contains("❤️").click();

      cy.wait("@deleteReaction");
      cy.wait("@getReactions");

      // Verify reaction is removed from UI
      cy.get(".destroy-reaction-button").should("not.exist");

      // Verify reaction is removed from database
      cy.appEval(`Document.find('${documentId}').reactions.count`).then((finalCount) => {
        expect(finalCount).to.equal(initialCount - 1);
      });
    });
  });

  it("allows multiple users to react with the same emoji", function () {
    const documentId = "two";

    // Add a reaction from pawel via backend
    cy.appEval(`
      document = Document.find('${documentId}')
      membership1 = OrganizationMembership.find('om_is_pawel')
      document.reactions.create!(
        organization: document.organization,
        organization_membership: membership1,
        emoji: '🚀'
      )
    `);

    // Add a reaction from stefan via backend with the same emoji
    cy.appEval(`
      document = Document.find('${documentId}')
      membership2 = OrganizationMembership.find('om_is_stefan')
      document.reactions.create!(
        organization: document.organization,
        organization_membership: membership2,
        emoji: '🚀'
      )
    `);

    cy.visit(`/d/${documentId}`);

    cy.get("[data-document-editor] [role='textbox']", {timeout: 10000}).should("exist");

    // Wait for reactions frame to load
    cy.get(".object-reactions-container", {timeout: 10000}).should("be.visible");

    // Verify the reaction shows count of 2
    cy.get(".destroy-reaction-button").should("contain", "🚀");
    cy.get(".reaction-count").should("contain", "2");
  });

  it("allows multiple different reactions from the same user (plus loads them real-time)", function () {
    const documentId = "two";

    cy.visit(`/d/${documentId}`);

    cy.get("[data-document-editor] [role='textbox']", {timeout: 10000}).should("exist");

    // Wait for reactions frame to load
    cy.get(".object-reactions-container", {timeout: 10000}).should("be.visible");

    const emojis = ["👍", "❤️", "🎉"];

    // Create all reactions in a single appEval to avoid interleaved broadcasts
    cy.appEval(`
      document = Document.find('${documentId}')
      membership = OrganizationMembership.find('om_is_pawel')
      ${JSON.stringify(emojis)}.each do |emoji|
        document.reactions.find_or_create_by!(
          organization: document.organization,
          organization_membership: membership,
          emoji: emoji
        )
      end
    `);

    // Wait for the last broadcast's frame reload to complete showing all reactions
    cy.get(".destroy-reaction-button", {timeout: 10000}).should("have.length", emojis.length);

    // Verify all reactions are visible and count is correct
    cy.appEval(`Document.find('${documentId}').reactions.pluck(:emoji)`).then((reactionsEmojis) => {
      expect(reactionsEmojis.length).to.equal(emojis.length);

      emojis.forEach((emoji) => {
        expect(reactionsEmojis).to.include(emoji);

        cy.get(".destroy-reaction-button").should("contain", emoji);
      });
    });
  });

  it("shows who reacted in a popover", function () {
    const documentId = "two";

    // Add a reaction via backend
    cy.appEval(`
      document = Document.find('${documentId}')
      membership = OrganizationMembership.find('om_is_pawel')
      document.reactions.create!(
        organization: document.organization,
        organization_membership: membership,
        emoji: '👋'
      )
    `);

    cy.visit(`/d/${documentId}`);

    cy.get("[data-document-editor] [role='textbox']", {timeout: 10000}).should("exist");

    // Wait for reactions frame to load
    cy.get(".object-reactions-container", {timeout: 10000}).should("be.visible");

    // Hover over the reaction to show popover
    cy.get(".destroy-reaction-button").contains("👋").trigger("mouseenter");

    // Wait for popover to appear
    cy.get(".popover-reaction-card", {timeout: 5000}).should("be.visible");

    // Verify the user's name appears in the popover
    cy.get(".popover-reaction-card").should("contain", "Pawel Wiadomski");
  });

  it("shows real-time updates when another user removes their reaction", function () {
    const documentId = "two";

    // Add a reaction from stefan via backend
    cy.appEval(`
      document = Document.find('${documentId}')
      membership = OrganizationMembership.find('om_is_stefan')
      reaction = document.reactions.create!(
        organization: document.organization,
        organization_membership: membership,
        emoji: '🔥'
      )
      reaction.id
    `).then((reactionId) => {
      cy.visit(`/d/${documentId}`);

      cy.get("[data-document-editor] [role='textbox']", {timeout: 10000}).should("exist");

      // Wait for reactions frame to load
      cy.get(".object-reactions-container", {timeout: 10000}).should("be.visible");

      // Verify the reaction is visible
      cy.get(".destroy-reaction-button").should("contain", "🔥");

      // Intercept the Turbo Stream frame reload triggered by reaction destruction
      cy.intercept("GET", "/reactions*").as("getReactions");

      cy.appEval(`
        ObjectReaction.find('${reactionId}').destroy!
      `);

      // Wait for the Turbo Stream frame reload to complete
      cy.wait("@getReactions");

      cy.get(".destroy-reaction-button").should("not.exist");
    });
  });

  it("prevents users from adding the same emoji reaction twice", function () {
    const documentId = "two";

    cy.visit(`/d/${documentId}`);

    cy.get("[data-document-editor] [role='textbox']", {timeout: 10000}).should("exist");

    // Wait for reactions frame to load
    cy.get(".object-reactions-container", {timeout: 10000}).should("be.visible");

    // Intercept the Turbo Stream frame reload triggered by reaction creation
    cy.intercept("GET", "/reactions*").as("getReactions");

    // Add a reaction
    cy.appEval(`
      document = Document.find('${documentId}')
      membership = OrganizationMembership.find('om_is_pawel')
      document.reactions.find_or_create_by!(
        organization: document.organization,
        organization_membership: membership,
        emoji: '✨'
      )
    `);

    // Wait for the Turbo Stream frame reload to complete
    cy.wait("@getReactions");

    // Wait for ActionCable/Turbo Stream to update the UI
    cy.get(".destroy-reaction-button", {timeout: 10000}).should("contain", "✨");
    cy.get(".reaction-count").should("contain", "1");

    // Try to add the same reaction again and verify it fails
    cy.appEval(`
      document = Document.find('${documentId}')
      membership = OrganizationMembership.find('om_is_pawel')
      begin
        document.reactions.create!(
          organization: document.organization,
          organization_membership: membership,
          emoji: '✨'
        )
        { status: 'created', count: document.reactions.where(emoji: '✨').count }
      rescue ActiveRecord::RecordInvalid
        { status: 'duplicate', count: document.reactions.where(emoji: '✨').count }
      end
    `).then((result) => {
      expect(result.status).to.eq("duplicate");
      expect(result.count).to.equal(1);
    });
  });
});
