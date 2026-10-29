// SPIKE (throwaway, see branch spike/cmdk-palette): the cmdk palette, selected by the
// `palette=cmdk` cookie. Mirrors the cases of command-palette.cy.js. No shadow-DOM piercing:
// every selector below is a plain light-DOM one.
import {isOrganizationCookie} from "../../support/organization-cookies";

const palette = () => cy.get("[cmdk-root]");
const input = () => cy.get("[cmdk-input]");
const items = () => cy.get("[cmdk-item]");
const openWithCtrlK = () => cy.get("body").type("{ctrl}k");

describe("Command Palette (cmdk)", () => {
  const email = "pawel@ikigai.systems";
  const password = "password";

  before(() => {
    cy.app("clean");
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations", "users", "organization_memberships", "spaces", "space_memberships",
        "documents", "tables/tables", "tables/columns", "tables/rows", "tables/cells",
        "teams", "team_memberships"
      ]
    });
  });

  beforeEach(() => {
    cy.loginWithSession(email, password);
    cy.setCookie("organization_id", isOrganizationCookie);
    cy.setCookie("palette", "cmdk");
  });

  describe("Opening and closing", () => {
    it("opens with Ctrl+K and toggles closed with it", () => {
      cy.visit("/");
      palette().should("not.exist");
      openWithCtrlK();
      palette().should("be.visible");
      input().type("{ctrl}k");
      palette().should("not.exist");
    });

    it("opens from the search button in the top bar (open event)", () => {
      cy.visit("/");
      cy.get("nav button[aria-label='Search']").click();
      palette().should("be.visible");
    });

    it("lists the default commands", () => {
      cy.visit("/");
      openWithCtrlK();
      ["Go to dashboard", "View all organizations", "View all spaces", "View all teams", "Go to account settings"]
        .forEach(title => items().contains(title).should("be.visible"));
    });

    it("closes with Escape", () => {
      cy.visit("/");
      openWithCtrlK();
      input().type("{esc}");
      palette().should("not.exist");
    });

    it("exposes combobox and listbox semantics", () => {
      cy.visit("/");
      openWithCtrlK();
      input().should("have.attr", "role", "combobox").and("have.attr", "aria-expanded", "true");
      cy.get("[cmdk-list]").should("have.attr", "role", "listbox");
      items().first().should("have.attr", "role", "option").and("have.attr", "aria-selected", "true");
    });
  });

  describe("Commands", () => {
    it("filters the static commands client-side", () => {
      cy.visit("/");
      openWithCtrlK();
      input().type("teams");
      items().should("have.length", 1).and("contain", "View all teams");
    });

    it("navigates to account settings", () => {
      cy.visit("/");
      openWithCtrlK();
      items().contains("Go to account settings").click();
      cy.url().should("include", "/users/edit");
      palette().should("not.exist");
    });

    it("navigates to spaces with arrow keys and Enter", () => {
      cy.visit("/");
      openWithCtrlK();
      input().type("{downarrow}{downarrow}{enter}");
      cy.url().should("match", /\/s$/);
    });
  });

  describe("Server-side search", () => {
    it("finds a document and navigates to it with Enter", () => {
      cy.visit("/");
      cy.intercept("GET", "/search*").as("search");
      openWithCtrlK();
      input().type("one");
      cy.wait("@search").its("request.query.q").should("eq", "one");
      items().first().should("contain", "One");
      input().type("{enter}");
      cy.url().should("include", "/d/one");
    });

    it("jumps to a space", () => {
      cy.visit("/");
      cy.intercept("GET", "/search*").as("search");
      openWithCtrlK();
      input().type("Default IS");
      cy.wait("@search");
      items().contains("Default IS").click();
      cy.url().should("include", "/s/is_default");
    });

    it("does not query the server below the minimum query length", () => {
      cy.visit("/");
      cy.intercept("GET", "/search*").as("shortSearch");
      openWithCtrlK();
      input().type("o");
      cy.wait(600);
      cy.get("@shortSearch.all").should("have.length", 0);
    });

    it("clears results when the query is erased", () => {
      cy.visit("/");
      cy.intercept("GET", "/search*").as("search");
      openWithCtrlK();
      input().type("one");
      cy.wait("@search");
      items().should("contain", "One");
      input().clear();
      cy.contains("[cmdk-group-heading]", "Documents and tables").should("not.exist");
    });

    it("shows a loading row, then results, and an empty state for no match", () => {
      cy.visit("/");
      cy.intercept("GET", "/search*", req => req.on("response", res => res.setDelay(800))).as("slow");
      openWithCtrlK();
      input().type("zzzzqq");
      cy.get("[data-testid=palette-loading]").should("be.visible");
      cy.wait("@slow");
      cy.get("[data-testid=palette-loading]").should("not.exist");
      cy.contains("No results.").should("be.visible");
    });

    // The race the sequence counter exists for: "on" answers slowly, "one" quickly.
    it("ignores a slow response for a superseded query", () => {
      cy.visit("/");
      cy.intercept("GET", "/search?q=on", req => req.on("response", res => res.setDelay(2500))).as("slowOn");
      cy.intercept("GET", "/search?q=one", req => req.continue()).as("fastOne");
      openWithCtrlK();
      input().type("on");
      cy.wait(500); // debounce fires, "on" is in flight
      input().type("e");
      cy.wait("@fastOne");
      items().contains("One").should("be.visible");
      cy.wait("@slowOn");
      // the stale "on" payload (which also matches e.g. Onboarding documents) must not replace "one"
      cy.get("[cmdk-item]").then($i => expect([...$i].map(i => i.textContent).join("|")).to.include("One"));
      input().should("have.value", "one");
    });

    it("filters results by type with the chips", () => {
      cy.visit("/");
      cy.intercept("GET", "/search*").as("search");
      openWithCtrlK();
      input().type("one");
      cy.wait("@search");
      cy.contains("button", "Tables").click();
      items().contains("One").should("not.exist");
      cy.contains("button", "Documents").click();
      items().contains("One").should("be.visible");
    });
  });

  describe("Object rendering", () => {
    it("shows the colour underline and the icon like the rest of the app", () => {
      cy.appEval(`
        Document.create!(id: "cmdkcolor", title: "Cmdk coloured", color: "indigo", organization_id: "is", space_id: "is_default")
        Document.create!(id: "cmdkplain", title: "Cmdk plain", organization_id: "is", space_id: "is_default")
        Document.create!(id: "cmdkemoji", title: "⭐ Cmdk emoji", organization_id: "is", space_id: "is_default")
      `);
      cy.visit("/");
      cy.intercept("GET", "/search*").as("search");
      openWithCtrlK();
      input().type("Cmdk");
      cy.wait("@search");
      items().contains("Cmdk coloured").find("span.color-label").should("have.attr", "data-color", "indigo");
      items().contains("Cmdk plain").parents("[cmdk-item]").find(".color-label").should("not.exist");
      items().contains("Cmdk plain").parents("[cmdk-item]").find(".object-icon i[class*='file-text']").should("exist");
      items().contains("Cmdk emoji").parents("[cmdk-item]").find(".object-icon").should("contain", "⭐");
    });
  });

  describe("Page commands and hotkeys", () => {
    it("offers the page's command and runs it", () => {
      cy.visit("/d/one");
      openWithCtrlK();
      items().contains("Edit document").click();
      cy.url().should("include", "/d/one/edit");
    });

    it("runs a hotkey command with its key while the palette is closed", () => {
      cy.visit("/d/one");
      cy.get("body").type("e");
      cy.url().should("include", "/d/one/edit");
    });

    it("does not run page hotkeys while the palette is open", () => {
      cy.visit("/d/one");
      openWithCtrlK();
      input().type("e");
      cy.url().should("not.include", "/edit");
      input().should("have.value", "e");
    });

    it("runs the default-command hotkey (ctrl+h)", () => {
      cy.visit("/s");
      cy.get("body").type("{ctrl}h");
      cy.url().should("include", "/#spaces");
    });
  });

  describe("Turbo navigation", () => {
    it("keeps one React instance and swaps page commands per page", () => {
      cy.visit("/d/one");
      cy.window().then(win => { win.__root = win.document.querySelector("#cmdk-palette-root"); });
      cy.window().its("__paletteMounts").should("eq", 1);

      openWithCtrlK();
      items().contains("Edit document").should("exist");
      input().type("{esc}");

      cy.window().then(win => win.Turbo.visit("/s"));
      cy.url().should("match", /\/s$/);
      openWithCtrlK();
      items().contains("View all spaces").should("exist");
      items().contains("Edit document").should("not.exist");
      input().type("{esc}");

      cy.window().then(win => {
        expect(win.document.querySelector("#cmdk-palette-root")).to.equal(win.__root);
        expect(win.__paletteMounts).to.equal(1);
      });

      cy.window().then(win => win.Turbo.visit("/d/one"));
      openWithCtrlK();
      items().contains("Edit document").should("exist");
    });

    it("closes an open palette when a Turbo visit happens", () => {
      cy.visit("/");
      openWithCtrlK();
      cy.window().then(win => win.Turbo.visit("/s"));
      cy.url().should("match", /\/s$/);
      palette().should("not.exist");
      openWithCtrlK();
      palette().should("be.visible");
    });
  });
});
