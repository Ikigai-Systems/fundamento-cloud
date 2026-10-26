import {Controller} from "@hotwired/stimulus";
import "ninja-keys";
import {debounce, escape} from "lodash";
import DocumentsApi from "../../api/DocumentsApi.js";
import SearchesApi from "@/api/SearchesApi.js";
import TablesApi from "~/api/Tables/TablesApi.js";
import SpacesApi from "@/api/SpacesApi.js";
import {paletteIcon} from "./command_palette_icons.js";

// Connects to data-controller="command-palette"
// ninja-keys renders into its own shadow root, so icons are SVG markup from paletteIcon rather
// than the <i> the rest of the app renders. An emoji is plain text and works either way.

// Mirrors TitleSearch::MIN_QUERY_LENGTH -- the server answers [] below this, so
// there is no point spending a round trip on it.
const MIN_QUERY_LENGTH = 2;

const OBJECT_ICONS = {Document: "file-text", Table: "table", Space: "planet"};

function objectIcon(object) {
  if (object.icon) {
    // The icon value can only ever be an RGI emoji, but it is interpolated into
    // markup here, so escape it rather than rely on that.
    return `<span class="ninja-icon" part="ninja-icon">${escape(object.icon.value)}</span>`;
  }

  return paletteIcon(OBJECT_ICONS[object.type] ?? "table");
}

export default class CommandPaletteController extends Controller {
  static values = {
    commands: Array,
  }

  connect() {
    this.searchSequence = 0;
    this.onSearchChange = debounce(this.handleChange.bind(this), 300);
    this.element.addEventListener("change", this.onSearchChange);
    this.element.addEventListener("selected", this.handleSelected);

    // ninja-keys renders into its own shadow root, so the app's dark-mode CSS
    // never reaches it and the palette has to be told the scheme explicitly.
    this.darkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    this.darkScheme.addEventListener("change", this.syncColorScheme);
    this.syncColorScheme();

    const commands = this.commandsValue || [];

    this.element.data = defaultCommands.concat(commands.map(command => ({
      id: command.id,
      title: command.title,
      section: command.section,
      icon: paletteIcon(command.icon),
      hotkey: command.hotkey,
      handler: () => {
        // Indirect eval (runs in global scope) — avoids Vite/rolldown's direct-eval warning.
        // Handlers are server-generated DOM strings that only reference globals (e.g. document).
        (0, eval)(command.handler);
      }
    })));
  }

  async handleChange(e) {
    const query = e.detail.search.trim();

    if (query.length < MIN_QUERY_LENGTH) {
      // Bump the sequence so a response still in flight for a longer query cannot land
      // after the user has cleared the box.
      this.searchSequence += 1;
      this.abortController?.abort();
      this.renderResults([]);
      return;
    }

    const sequence = ++this.searchSequence;
    this.showLoadingRow();

    // Two guards, deliberately: aborting cancels the wasted round trip, and the sequence
    // check is what actually stops a slow response for "ch" overwriting a fast one for
    // "checklist" -- an aborted request that loses the race still resolves.
    this.abortController?.abort();
    this.abortController = new AbortController();

    let results;

    try {
      results = await SearchesApi.show({
        query: {q: query},
        fetchOptions: {signal: this.abortController.signal},
      });
    } catch {
      if (sequence === this.searchSequence) this.renderResults([]);
      return;
    }

    if (sequence !== this.searchSequence) return;

    this.renderResults(results);
  }

  showLoadingRow() {
    if (this.element.data.find(command => command.id === "documentSearch_loading")) return;

    this.element.data = this.element.data.concat([{
      id: "documentSearch_loading",
      title: "Searching...",
      section: "Documents",
      icon: paletteIcon("loader-2", {spin: true}),
      alwaysVisible: true,
    }]);
  }

  // Always strips the loading row as well as the previous results, so it can never get
  // stranded on screen.
  renderResults(results) {
    this.element.data = this.element.data.filter(command => {
      return !command.id.startsWith("documentSearch#") && command.id !== "documentSearch_loading";
    }).concat(results.map(({object, space}) => {
      const objectTitleWithPath = object.parentPath + object.title;
      const truncated = `${objectTitleWithPath.length > 60 ? "..." : ""}${objectTitleWithPath.slice(-60)}`;
      // A space is its own context, so prefixing it with its own name reads as "Sales — Sales".
      const displayTitle = space.name ? `${space.name} ⎯ ${truncated}` : truncated;

      return {
        id: `documentSearch#${object.id}`,
        value: object.title,
        title: displayTitle,
        section: "Documents and tables",
        icon: objectIcon(object),
        // The server has already filtered. Without this ninja-keys re-filters with
        // `new RegExp(search, "gi")` over `value`, which would drop rows the server
        // deliberately returned whenever the query contains a regex metacharacter.
        alwaysVisible: true,
        handler: () => {
          if (object.type === "Document") {
            Turbo.visit(DocumentsApi.show.path({id: object?.id}));
          } else if (object.type === "Table") {
            Turbo.visit(TablesApi.show.path({id: object?.id}));
          } else if (object.type === "Space") {
            Turbo.visit(SpacesApi.show.path({id: object?.id}));
          }
        }
      };
    }));
  }

  disconnect() {
    this.onSearchChange?.cancel();
    this.abortController?.abort();
    this.element.removeEventListener("change", this.onSearchChange);
    this.darkScheme?.removeEventListener("change", this.syncColorScheme);
  }

  // Assigns rather than toggles, on purpose. Turbo caches the page body with
  // this class already applied, so a restoration visit (browser Back) restores
  // an element that is already dark and a toggle would turn it light again.
  // Setting it is idempotent, so every path -- first load, Drive visit,
  // restoration, and the OS switching theme mid-session -- lands correctly.
  syncColorScheme = () => {
    this.element.classList.toggle("dark", this.darkScheme.matches);
  }

  handleSelected() {
  }

  // From the top bar's search button (command_palette_button_controller.js)
  open() {
    this.element.open();
  }
}

const defaultCommands = [
  {
    id: "home",
    section: 'Site navigation',
    title: "Go to dashboard",
    hotkey: "ctrl+h,cmd+h",
    icon: paletteIcon("home"),
    handler: () => {
      Turbo.visit("/");
    }
  },
  {
    id: "organizations",
    section: 'Site navigation',
    title: "View all organizations",
    // hotkey: "cmd+p",
    icon: paletteIcon("building"),
    handler: () => {
      Turbo.visit("/organizations");
    }
  },
  {
    id: "spaces",
    section: 'Site navigation',
    title: "View all spaces",
    // hotkey: "cmd+p",
    icon: paletteIcon("layout-grid"),
    handler: () => {
      Turbo.visit("/s");
    }
  },
  {
    id: "teams",
    section: 'Site navigation',
    title: "View all teams",
    // hotkey: "cmd+p",
    icon: paletteIcon("users"),
    handler: () => {
      Turbo.visit("/teams");
    }
  },
  {
    id: "Account",
    section: "Settings",
    title: "Go to account settings",
    icon: paletteIcon("user-circle"),
    handler: () => {
      Turbo.visit("/users/edit");
    }
  },
]
