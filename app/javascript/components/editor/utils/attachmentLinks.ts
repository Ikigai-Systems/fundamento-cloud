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
 * 2. A ProseMirror mark view resolves `attachment:` to a real path for display only.
 *    `renderHTML` would be the wrong place: DOMSerializer.fromSchema drives both the
 *    external HTML exporter and the clipboard, so rewriting there would put the endpoint
 *    into exported markdown, and re-importing that would store it back into the blocks.
 *
 * The default predicate is copied rather than imported: @blocknote/core 0.54.0 does not
 * export `isAllowedUri` at runtime, despite its own JSDoc telling you to import it. Keep
 * in step with ALLOWED_URI_REGEX in
 * @blocknote/core/src/extensions/tiptap-extensions/Link/link.ts.
 */
const BLOCKNOTE_ALLOWED_URI =
  // eslint-disable-next-line no-useless-escape
  /^(?:(?:http|https|ftp|ftps|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z0-9+.\-]+(?:[^a-z+.\-:]|$))/i;

const ATTACHMENT_HREF = /^attachment:(\d+)(\.[a-z0-9]+)?$/i;

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
    links: {isValidLink},
    _tiptapOptions: {
      editorProps: {
        markViews: {
          link: (mark: {attrs: Record<string, unknown>}) => {
            const dom = document.createElement("a");
            const href = String(mark.attrs.href ?? "");

            dom.href = resolveLinkHref(href, showAttachmentPath);
            if (mark.attrs.title) {
              dom.title = String(mark.attrs.title);
            }

            return {dom, contentDOM: dom};
          },
        },
      },
    },
  };
}
