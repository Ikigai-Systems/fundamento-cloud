import { isOrganizationCookie } from "../../support/organization-cookies.js"

// Paths are resolved from the Cypress project root (spec/e2e/)
const DOCX = "../fixtures/files/pandoc/Volume-2-Terms-of-Reference.docx"
const ODT  = "../fixtures/files/pandoc/Volume-2-Terms-of-Reference.odt"

describe("Import Sessions", function () {
  beforeEach(() => {
    cy.app("clean")
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces"
      ]
    })
    cy.loginWithSession("pawel@ikigai.systems", "password")
    cy.setCookie("organization_id", isOrganizationCookie)
  })

  // ── Configure step ──────────────────────────────────────────────────

  it("advances from the configure step to the file selection step", function () {
    cy.visit("/import_sessions/new")

    cy.get("[data-import-upload-target='stepConfigure']").should("be.visible")
    cy.get("[data-import-upload-target='stepFiles']").should("not.be.visible")

    cy.contains("Continue").click()

    cy.get("[data-import-upload-target='stepConfigure']").should("not.be.visible")
    cy.get("[data-import-upload-target='stepFiles']").should("be.visible")
  })

  // ── File selection step ─────────────────────────────────────────────

  it("shows file count and size after selecting files via file input", function () {
    cy.visit("/import_sessions/new")
    cy.contains("Continue").click()

    // Target the "Select Files" input (not the folder input)
    cy.get("input[type='file']:not([webkitdirectory])").selectFile(
      [DOCX, ODT],
      { force: true }
    )

    cy.get("[data-import-upload-target='fileSummary']").should("be.visible")
    cy.get("[data-import-upload-target='fileCount']").should("have.text", "2")
    cy.get("[data-import-upload-target='totalSize']").should("not.be.empty")
    cy.get("[data-import-upload-target='limitError']").should("not.be.visible")
    cy.contains("Import files").should("be.visible")
  })

  it("shows an error when more than 500 files are selected", function () {
    const tooManyFiles = Array.from({ length: 501 }, (_, i) => ({
      contents: "# Test",
      fileName: `note-${i}.md`,
      mimeType: "text/markdown",
      lastModified: Date.now()
    }))

    cy.visit("/import_sessions/new")
    cy.contains("Continue").click()

    cy.get("input[type='file']:not([webkitdirectory])").selectFile(
      tooManyFiles,
      { force: true }
    )

    cy.get("[data-import-upload-target='limitError']")
      .should("be.visible")
      .and("contain", "Too many files")
    cy.contains("Import files").should("not.exist")
  })

  // ── Full import flows ───────────────────────────────────────────────

  it("completes an import via file selector and shows results on the session page", function () {
    cy.visit("/import_sessions/new")

    cy.get("[data-import-upload-target='spaceSelect']").select("Default IS")
    cy.get("[data-import-upload-target='formatSelect']").select("Generic (Markdown / Word)")
    cy.contains("Continue").click()

    cy.get("input[type='file']:not([webkitdirectory])").selectFile(
      [DOCX, ODT],
      { force: true }
    )
    cy.contains("Import files").click()

    // Stimulus redirects to the show page after triggering processing
    cy.url().should("match", /\/import_sessions\/[a-zA-Z0-9_-]+$/)

    // Turbo Stream broadcasts a page refresh when ImportSessionCompletionJob finishes
    cy.contains("✓ Completed", { timeout: 90000 }).should("be.visible")

    // Counters
    cy.contains("2").should("be.visible") // total_files
    cy.get(".text-green-700").should("contain", "2") // processed_files

    // File log — both files appear with success checkmark
    cy.contains("Volume-2-Terms-of-Reference.docx").should("exist")
    cy.contains("Volume-2-Terms-of-Reference.odt").should("exist")
    cy.get(".text-green-600").should("have.length.at.least", 2)

    // Each imported file should have a document link
    cy.get("td a[href^='/d/']").should("have.length.at.least", 2)
  })

  it("completes an import via drag and drop", function () {
    cy.visit("/import_sessions/new")

    cy.get("[data-import-upload-target='spaceSelect']").select("Default IS")
    cy.contains("Continue").click()

    cy.get("[data-import-upload-target='dropZone']").selectFile(
      [DOCX],
      { action: "drag-drop" }
    )

    cy.get("[data-import-upload-target='fileCount']").should("have.text", "1")
    cy.contains("Import files").click()

    cy.url().should("match", /\/import_sessions\/[a-zA-Z0-9_-]+$/)
    cy.contains("✓ Completed", { timeout: 90000 }).should("be.visible")

    cy.contains("Volume-2-Terms-of-Reference.docx").should("exist")
    cy.get(".text-green-600").should("have.length.at.least", 1)
    cy.get("td a[href^='/d/']").should("have.length.at.least", 1)
  })

  // ── Index page ──────────────────────────────────────────────────────

  it("lists completed sessions on the index page", function () {
    // Run an import first
    cy.visit("/import_sessions/new")
    cy.get("[data-import-upload-target='spaceSelect']").select("Default IS")
    cy.contains("Continue").click()
    cy.get("input[type='file']:not([webkitdirectory])").selectFile([DOCX], { force: true })
    cy.contains("Import files").click()
    cy.url().should("match", /\/import_sessions\/[a-zA-Z0-9_-]+$/)
    cy.contains("✓ Completed", { timeout: 90000 }).should("be.visible")

    cy.visit("/import_sessions")

    cy.contains("Default IS").should("exist")
    cy.contains("completed").should("exist")
  })
})
