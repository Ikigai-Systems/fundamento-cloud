import AttachmentsApi from "../../../api/AttachmentsApi";

/**
 * Attachments are addressed internally as `attachment:<id>`, so a document can be served
 * through the authenticated route or the public one without its stored content naming
 * either. Blocks already do this for file/image/video URLs via `resolveFileUrl`; links
 * need the same treatment, in two parts.
 *
 * 1. BlockNote drops any href outside its scheme allowlist
 *    (http|https|ftp|ftps|mailto|tel|callto|sms|cid|xmpp) -- silently, leaving plain text
 *    where the link was. `isValidLink` widens it by exactly one scheme.
 *
 * 2. `onClick` resolves `attachment:` to a real path when the link is followed.
 *
 * Resolution deliberately does not happen while rendering. `renderHTML` feeds
 * DOMSerializer.fromSchema, which drives both the external HTML exporter and the
 * clipboard, so rewriting there would put the endpoint into exported markdown and
 * re-importing that would store it straight back into the blocks. A ProseMirror mark view
 * would have been view-only and ideal, but tiptap overwrites `editorProps.markViews` with
 * its own extension-derived map (Editor.ts, createView), and a mark view can only be
 * contributed by the mark itself via `addMarkView` -- and @blocknote/core exports neither
 * the `Link` mark nor `isAllowedUri` at runtime, in 0.52 or 0.54.
 *
 * The trade-off is that the rendered href stays `attachment:<id>`, so hovering or copying
 * the link shows the internal form. Following it works.
 *
 * The default predicate is copied rather than imported: @blocknote/core 0.54.0 does not
 * export `isAllowedUri` at runtime, despite its own JSDoc telling you to import it. Keep
 * in step with ALLOWED_URI_REGEX in
 * @blocknote/core/src/extensions/tiptap-extensions/Link/link.ts.
 */
const BLOCKNOTE_ALLOWED_URI =
  // eslint-disable-next-line no-useless-escape
  /^(?:(?:http|https|ftp|ftps|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z0-9+.\-]+(?:[^a-z+.\-:]|$))/i;

// The id is a nanoid, so it spans nanoid's whole URL-safe alphabet -- letters, digits,
// underscore and hyphen -- not just digits. It used to be `\d+`, because attachments once had
// an integer primary key; after the stable-identity migration that pattern matched nothing and
// every attachment link silently stopped resolving.
//
// The optional suffix stays unambiguous because a nanoid cannot contain a dot.
const ATTACHMENT_HREF = /^attachment:([A-Za-z0-9_-]+)(\.[a-z0-9]+)?$/i;

/**
 * The attachment id inside an `attachment:` href, or null for any other href.
 *
 * Exported so there is one definition of the shape. There used to be a second copy in
 * createFileUrlResolver, and when the id format changed only one of them was updated.
 */
export function attachmentIdFromHref(href: string): string | null {
  return href.match(ATTACHMENT_HREF)?.[1] ?? null;
}

export function isValidLink(href: string): boolean {
  return BLOCKNOTE_ALLOWED_URI.test(href) || ATTACHMENT_HREF.test(href);
}

type PathHelper = (params: {id: string}) => string;

export function resolveLinkHref(
  href: string,
  showAttachmentPath: PathHelper = AttachmentsApi.show.path as PathHelper,
): string {
  const attachmentId = href.match(ATTACHMENT_HREF)?.[1];

  return attachmentId ? showAttachmentPath({id: attachmentId}) : href;
}

/**
 * Editor options that let `attachment:` links round-trip and render as real links.
 * Spread into the BlockNoteEditor options alongside `resolveFileUrl`, passing the same
 * path helper so the authenticated and public viewers differ only in that argument.
 */
export function attachmentLinkOptions(
  showAttachmentPath: PathHelper = AttachmentsApi.show.path as PathHelper,
) {
  return {
    links: {
      isValidLink,
      onClick: (event: MouseEvent) => {
        const anchor = (event.target as HTMLElement | null)?.closest?.("a");
        const href = anchor?.getAttribute("href") ?? "";
        const resolved = resolveLinkHref(href, showAttachmentPath);

        if (resolved === href) {
          return false;
        }

        event.preventDefault();
        window.open(resolved, "_blank", "noopener");

        return true;
      },
    },
  };
}

/**
 * Resolve `attachment:` link hrefs to real paths throughout a block tree.
 *
 * Only for read-only viewers. They never write back, so pre-resolving cannot leak an
 * endpoint into stored content -- and they need it, because BlockNote's link click
 * handler bails on a non-editable view (`clickHandler.ts`: `if (!view.editable) return
 * false`), leaving `onClick` unable to resolve anything there.
 *
 * The editable editor must NOT use this: its blocks are posted back verbatim on save.
 */
export function resolveAttachmentLinksInBlocks<T>(
  blocks: T,
  showAttachmentPath: PathHelper = AttachmentsApi.show.path as PathHelper,
): T {
  if (Array.isArray(blocks)) {
    return blocks.map((entry) => resolveAttachmentLinksInBlocks(entry, showAttachmentPath)) as T;
  }

  if (blocks && typeof blocks === "object") {
    return Object.fromEntries(
      Object.entries(blocks as Record<string, unknown>).map(([key, value]) => [
        key,
        key === "href" && typeof value === "string"
          ? resolveLinkHref(value, showAttachmentPath)
          : resolveAttachmentLinksInBlocks(value, showAttachmentPath),
      ]),
    ) as T;
  }

  return blocks;
}
