import {Controller} from "@hotwired/stimulus"
import "ninja-keys"

// Connects to data-controller="command-palette"
export default class CommandPaletteController extends Controller<HTMLElement> {
  static values = {
    commands: Array,
  }

  declare commandsValue: object[];

  connect() {
    this.element.addEventListener("change", this.handleChange);
    this.element.addEventListener("selected", this.handleSelected);

    this.element.data = defaultCommands;
  }

  handleChange(ev: Event) {
    //  { detail: { search: string } }
    // console.log(ev.detail.search);
  }

  handleSelected(cmd: Event) {
    // console.log(cmd);
  }
}

const defaultCommands = [
  {
    id: "Home",
    title: "Open Home",
    hotkey: "cmd+h",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m2.25 12l8.955-8.955a1.124 1.124 0 0 1 1.59 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>`,
    handler: () => {
      console.log("navigation to home");
    }
  },
  {
    id: "Open Projects",
    title: "Open Projects",
    hotkey: "cmd+p",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44"/></svg>`,
    handler: () => {
      console.log("navigation to projects");
    }
  },
  {
    id: "Theme",
    title: "Change theme...",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"/></svg>`,
    children: [
      {
        id: "Light Theme",
        title: "Change theme to Light",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0a3.75 3.75 0 0 1 7.5 0"/></svg>`,
        handler: () => {
          console.log("theme light");
        }
      },
      {
        id: "Dark Theme",
        title: "Change theme to Dark",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="ninja-icon" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.752 15.002A9.7 9.7 0 0 1 18 15.75A9.75 9.75 0 0 1 8.25 6c0-1.33.266-2.597.748-3.752A9.75 9.75 0 0 0 3 11.25A9.75 9.75 0 0 0 12.75 21a9.75 9.75 0 0 0 9.002-5.998"/></svg>`,
        keywords: "lol",
        handler: () => {
          console.log("theme dark");
        }
      }
    ]
  }
]
