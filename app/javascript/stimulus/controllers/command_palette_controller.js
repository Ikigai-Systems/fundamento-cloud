import {Controller} from "@hotwired/stimulus";
import "ninja-keys";
import {debounce} from "lodash";
import DocumentsApi from "../../api/DocumentsApi.js";
import SearchesApi from "@/api/SearchesApi.js";

// Connects to data-controller="command-palette"
export default class CommandPaletteController extends Controller {
  static values = {
    commands: Array,
  }

  connect() {
    this.element.addEventListener("change", debounce(this.handleChange.bind(this), 300));
    this.element.addEventListener("selected", this.handleSelected);

    const commands = this.commandsValue || [];

    this.element.data = defaultCommands.concat(commands.map(command => ({
      id: command.id,
      title: command.title,
      section: command.section,
      icon: command.icon,
      hotkey: command.hotkey,
      handler: () => {
        eval(command.handler);
      }
    })));
  }

  async handleChange(e) {
    // console.log(e.detail.search);

    // todo: while we don't narrow down query for specific documents and instead we retrieve all, let's cache results:
    if (this._cachedResults) {
      return;
    }

    if (e.detail.search.length > 0) {
      if (this.element.data.find(command => command.id === "documentSearch_loading") === undefined) {
        this.element.data = this.element.data.concat([{
          id: "documentSearch_loading",
          title: "Searching...",
          section: "Documents",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity="0.25"/><path fill="currentColor" d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path></svg>`,
          alwaysVisible: true,
        }]);
      }
    } else {
      this.element.data = this.element.data.filter(command => command.id !== "documentSearch_loading");
    }

    const documents = await SearchesApi.show(); //todo: use e.detail.search as query parameter to narrow down documents in response

    this.element.data = this.element.data.filter(command => {
      return !command.id.startsWith("documentSearch#") && command.id !== "documentSearch_loading";
    }).concat(documents.map(document => ({
      id: `documentSearch#${document.npi}`,
      title: document.title,
      section: "Documents",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9"/></svg>',
      handler: () => {
        Turbo.visit(DocumentsApi.show.path({npi: document?.npi}));
      }
    })));
    this._cachedResults = true;
  }

  handleSelected(e) {
  }
}

const defaultCommands = [
  {
    id: "home",
    section: 'Site navigation',
    title: "Go to dashboard",
    hotkey: "ctrl+h,cmd+h",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m2.25 12l8.955-8.955a1.124 1.124 0 0 1 1.59 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>`,
    handler: () => {
      Turbo.visit("/");
    }
  },
  {
    id: "organizations",
    section: 'Site navigation',
    title: "View all organizations",
    // hotkey: "cmd+p",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3 3 0 0 0 3.75-.615A3 3 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a3 3 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015q.062.07.128.136a3 3 0 0 0 3.622.478m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75"/></svg>`,
    handler: () => {
      Turbo.visit("/organizations");
    }
  },
  {
    id: "spaces",
    section: 'Site navigation',
    title: "View all spaces",
    // hotkey: "cmd+p",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44"/></svg>`,
    handler: () => {
      Turbo.visit("/s");
    }
  },
  {
    id: "teams",
    section: 'Site navigation',
    title: "View all teams",
    // hotkey: "cmd+p",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 18.72a9.1 9.1 0 0 0 3.741-.479q.01-.12.01-.241a3 3 0 0 0-4.692-2.478m.94 3.197l.001.031q0 .337-.037.666A11.94 11.94 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6 6 0 0 1 6 18.719m12 0a5.97 5.97 0 0 0-.941-3.197m0 0A6 6 0 0 0 12 12.75a6 6 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72a9 9 0 0 0 3.74.477m.94-3.197a5.97 5.97 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0a3 3 0 0 1 6 0m6 3a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0m-13.5 0a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0"/></svg>`,
    handler: () => {
      Turbo.visit("/teams");
    }
  },
  {
    id: "Account",
    section: "Settings",
    title: "Go to account settings",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.982 18.725A7.49 7.49 0 0 0 12 15.75a7.49 7.49 0 0 0-5.982 2.975m11.964 0a9 9 0 1 0-11.963 0m11.962 0A8.97 8.97 0 0 1 12 21a8.97 8.97 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0a3 3 0 0 1 6 0"/></svg>`,
    handler: () => {
      Turbo.visit("/users/edit");
    }
  },
  {
    id: "Theme",
    section: "Settings",
    title: "Change theme...",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"/></svg>`,
    children: [
      {
        id: "Light Theme",
        section: "Settings",
        title: "Change theme to Light (not implemented yet)",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0a3.75 3.75 0 0 1 7.5 0"/></svg>`,
        handler: () => {
          console.log("theme light");
        }
      },
      {
        id: "Dark Theme",
        section: "Settings",
        title: "Change theme to Dark (not implemented yet)",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.752 15.002A9.7 9.7 0 0 1 18 15.75A9.75 9.75 0 0 1 8.25 6c0-1.33.266-2.597.748-3.752A9.75 9.75 0 0 0 3 11.25A9.75 9.75 0 0 0 12.75 21a9.75 9.75 0 0 0 9.002-5.998"/></svg>`,
        keywords: "lol",
        handler: () => {
          console.log("theme dark");
        }
      }
    ]
  }
]
