import type {ObjectIcon} from "./sidebar/types";

// One announcement for "something about this document or table just changed".
//
// The content frame and the sidebar frame never reload each other, and the sidebar tree is
// rendered from JSON frozen at its own frame load, so a change made in the content frame
// leaves the sidebar row stale unless it is announced here.
//
// To carry a new attribute, add a field: a publisher sends only the fields it changed, and
// each consumer applies only the fields it understands.
export const CONTENT_UPDATED = "content-updated";

// A field left out (undefined) means "unchanged" — not "cleared". `icon: null` is how an
// icon is actually cleared, which is what a rename that drops the leading emoji must send.
export interface ContentUpdate {
  id: string;
  title?: string;
  icon?: ObjectIcon | null;
  draft?: boolean;
}

export function publishContentUpdate(update: ContentUpdate): void {
  window.dispatchEvent(new CustomEvent<ContentUpdate>(CONTENT_UPDATED, {detail: update}));
}

// Consumers get the payload through this rather than casting the event themselves, so the
// id guard (and the cast) live in one place.
export function contentUpdateFrom(event: Event): ContentUpdate | null {
  const detail = (event as CustomEvent<ContentUpdate>).detail;
  return detail?.id ? detail : null;
}
