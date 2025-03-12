import { Application } from "@hotwired/stimulus"

const application = Application.start()

// Import and register all TailwindCSS Components or just the ones you need
import { Alert, Autosave, ColorPreview, Dropdown, Modal, Tabs, Toggle, Slideover } from "tailwindcss-stimulus-components"
application.register('alert', Alert)
application.register('autosave', Autosave)
application.register('color-preview', ColorPreview)
application.register('dropdown', Dropdown)
application.register('modal', Modal)
application.register('slideover', Slideover)
application.register('tabs', Tabs)
application.register('toggle', Toggle)

import CookieControlledToggle from "./cookie_controlled_toogle.js";
application.register("cookie-controlled-toggle", CookieControlledToggle);

import Popover from "@stimulus-components/popover";

class FixedPopover extends Popover {
  show(event) {
    super.hide();
    return super.show(event);
  }
}

application.register('popover', FixedPopover);

import { Multiselect } from '@wizardhealth/stimulus-multiselect'
application.register('multiselect', Multiselect);

import ReactLoader from "./react_loader_controller"
application.register("react-loader", ReactLoader)

import VisibilityController from "./visibility_controller";
application.register("visibility", VisibilityController);

import ToggleButtonController from "./toggle_button_controller";
application.register("toggle-button", ToggleButtonController);

import CollapsibleController from "./collapsible_controller";
application.register("collapsible", CollapsibleController);

import DraggableController from "./draggable_controller";
application.register("draggable", DraggableController);

import UserSelectorController from "./controllers/user_selector_controller.js";
application.register("user-selector", UserSelectorController);

import PreventDoubleSubmitController from "./prevent_double_submit_controller.ts";
application.register("prevent-double-submit", PreventDoubleSubmitController);

import ScrollIntoViewController from "./scroll_into_view_controller.ts";
application.register("scroll-into-view", ScrollIntoViewController);

import ShowIfInputValueEquals from "./show_if_input_value_equals.ts";
application.register("show-if-input-value-equals", ShowIfInputValueEquals);

import HotkeyController from "./hotkey_controller.ts";
application.register("hotkey", HotkeyController);

import EmojiPickerController from "@/stimulus/controllers/emoji_picker_controller.js";
application.register("emoji-picker", EmojiPickerController);

import SerializeBlockNote from "@/stimulus/controllers/serialize_blocknote_controller.js";
application.register("serialize-blocknote", SerializeBlockNote);

import CommandPaletteController from "./controllers/command_palette_controller.js";
application.register("command-palette", CommandPaletteController);

// Configure Stimulus development experience
application.debug = true
window.Stimulus   = application

export { application }
