import {Multiselect} from "@wizardhealth/stimulus-multiselect";
import {escape} from "lodash";

// The library's templates, with two changes:
//
// - An item may carry `avatar`, HTML the server renders (MemberPickerItems),
//   shown in front of its text in the list and on its pill.
// - Text is escaped. The library interpolates it raw, so a user named
//   `<img onerror=...>` would run script in everyone's space settings.
//
// It keeps the `multiselect` identifier: the library's templates hardcode
// `data-multiselect-target` and `multiselect#...` actions.
export default class extends Multiselect {
  // toggleItem rebuilds a picked item from the checkbox's data attributes, so
  // the avatar is looked up by value when the pill is drawn.
  avatars = new Map();

  avatarFor(item) {
    if (item.avatar) this.avatars.set(String(item.value), item.avatar);
    return this.avatars.get(String(item.value)) ?? "";
  }

  itemTemplate(item, selected = "") {
    return `
      <li>
        <label>
          <input type="checkbox" ${selected} data-value="${escape(item.value)}" data-text="${escape(item.text)}"
          data-action="multiselect#checkBoxChange" data-multiselect-target="item" tabindex="-1">
          ${this.avatarFor(item)}<span>${escape(item.text)}</span>
        </label>
      </li>
    `;
  }

  pillTemplate(item) {
    const deleteButton = this.disabledValue ? "" : `
      <span class="multiselect__pill-delete" data-action="click->multiselect#removeItem">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="12px" height="12px">
          <path d="M25.707,6.293c-0.195-0.195-1.805-1.805-2-2c-0.391-0.391-1.024-0.391-1.414,0c-0.195,0.195-17.805,17.805-18,18c-0.391,0.391-0.391,1.024,0,1.414c0.279,0.279,1.721,1.721,2,2c0.391,0.391,1.024,0.391,1.414,0c0.195-0.195,17.805-17.805,18-18C26.098,7.317,26.098,6.683,25.707,6.293z"/>
          <path d="M23.707,25.707c0.195-0.195,1.805-1.805,2-2c0.391-0.391,0.391-1.024,0-1.414c-0.195-0.195-17.805-17.805-18-18c-0.391-0.391-1.024-0.391-1.414,0c-0.279,0.279-1.721,1.721-2,2c-0.391,0.391-0.391,1.024,0,1.414c0.195,0.195,17.805,17.805,18,18C22.683,26.098,23.317,26.098,23.707,25.707z"/>
        </svg>
      </span>`;

    return `<div class="multiselect__pill" data-value="${escape(item.value)}" title="${escape(item.text)}">
      ${this.avatarFor(item)}<span class="multiselect__pill-text">${escape(item.text)}</span>${deleteButton}
    </div>`;
  }
}
