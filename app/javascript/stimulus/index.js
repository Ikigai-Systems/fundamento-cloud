import {Application} from "@hotwired/stimulus"
// Import and register all TailwindCSS Components or just the ones you need
import {Alert, Autosave, ColorPreview, Dropdown, Modal, Slideover, Tabs, Toggle} from "tailwindcss-stimulus-components"
import CookieControlledToggle from "./cookie_controlled_toogle.js";
import Popover from "@stimulus-components/popover";
import ReactLoader from "./react_loader_controller"
import VisibilityController from "./visibility_controller";
import ToggleButtonController from "./toggle_button_controller";
import CollapsibleController from "./collapsible_controller";
import DraggableController from "./draggable_controller";
import UserSelectorController from "./controllers/user_selector_controller.js";
import PreventDoubleSubmitController from "./prevent_double_submit_controller.ts";
import ScrollIntoViewController from "./scroll_into_view_controller.ts";
import ShowIfInputValueEquals from "./show_if_input_value_equals.ts";
import HotkeyController from "./hotkey_controller.ts";
import EmojiPickerController from "@/stimulus/controllers/emoji_picker_controller.js";
import SerializeBlockNote from "@/stimulus/controllers/serialize_blocknote_controller.js";
import CommandPaletteController from "./controllers/command_palette_controller.js";
import Clipboard from '@stimulus-components/clipboard';
import AutoSubmit from '@stimulus-components/auto-submit';
import {Multiselect} from "@wizardhealth/stimulus-multiselect";
import MultiselectNoopAddableController from "./controllers/multiselect-noop-addable-controller.js";
import FlashManagerController from "./controllers/flash_manager_controller";
import ContentTitleSyncController from "./content_title_sync_controller.ts";

const application = Application.start()

application.register('alert', Alert)
application.register('autosave', Autosave)
application.register('color-preview', ColorPreview)
application.register('dropdown', Dropdown)
application.register('modal', Modal)
application.register('slideover', Slideover)
application.register('tabs', Tabs)
application.register('toggle', Toggle)

application.register("cookie-controlled-toggle", CookieControlledToggle);

class FixedPopover extends Popover {
  show(event) {
    super.hide();
    return super.show(event);
  }
}

application.register('popover', FixedPopover);

application.register('auto-submit', AutoSubmit);

application.register('multiselect', Multiselect);
application.register('multiselect-noop-addable', MultiselectNoopAddableController);

application.register("react-loader", ReactLoader)

application.register("visibility", VisibilityController);

application.register("toggle-button", ToggleButtonController);

application.register("collapsible", CollapsibleController);

application.register("draggable", DraggableController);

application.register("user-selector", UserSelectorController);

application.register("prevent-double-submit", PreventDoubleSubmitController);

application.register("scroll-into-view", ScrollIntoViewController);

application.register("show-if-input-value-equals", ShowIfInputValueEquals);

application.register("hotkey", HotkeyController);

application.register("emoji-picker", EmojiPickerController);

application.register("serialize-blocknote", SerializeBlockNote);

application.register("command-palette", CommandPaletteController);

application.register('clipboard', Clipboard);

application.register("flash-manager", FlashManagerController);

application.register("content-title-sync", ContentTitleSyncController);

// Configure Stimulus development experience
application.debug = true
window.Stimulus   = application

export { application }
