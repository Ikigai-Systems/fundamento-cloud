// ninja-keys is a Lit element that injects each command's icon with unsafeHTML into its own
// shadow root, where the app's Tailwind icon classes do not reach. So the palette draws Tabler's
// SVG markup itself, bundled at build time rather than fetched.
import fileText from "@tabler/icons/outline/file-text.svg?raw";
import table from "@tabler/icons/outline/table.svg?raw";
import planet from "@tabler/icons/outline/planet.svg?raw";
import loader2 from "@tabler/icons/outline/loader-2.svg?raw";
import home from "@tabler/icons/outline/home.svg?raw";
import building from "@tabler/icons/outline/building.svg?raw";
import layoutGrid from "@tabler/icons/outline/layout-grid.svg?raw";
import users from "@tabler/icons/outline/users.svg?raw";
import userCircle from "@tabler/icons/outline/user-circle.svg?raw";
import deviceFloppy from "@tabler/icons/outline/device-floppy.svg?raw";
import pencil from "@tabler/icons/outline/pencil.svg?raw";

const ICONS = {
  "file-text": fileText,
  "table": table,
  "planet": planet,
  "loader-2": loader2,
  "home": home,
  "building": building,
  "layout-grid": layoutGrid,
  "users": users,
  "user-circle": userCircle,
  "device-floppy": deviceFloppy,
  "pencil": pencil,
};

// The shadow root has no animate-spin, so a spinning icon carries its own rotation.
const SPIN = '<animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="0.75s" repeatCount="indefinite"/>';

// `part` lets the app stylesheet size every icon through ninja-keys::part(ninja-icon).
export function paletteIcon(name, {spin = false} = {}) {
  const svg = ICONS[name];

  if (!svg) {
    console.warn(`paletteIcon: no Tabler icon named "${name}"`);
    return "";
  }

  let markup = svg.replace(/\sclass="[^"]*"/, "").replace("<svg", '<svg class="ninja-icon" part="ninja-icon"');
  if (spin) markup = markup.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/, `$1<g>$2${SPIN}</g>$3`);

  return markup;
}
