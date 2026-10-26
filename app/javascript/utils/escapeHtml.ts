// For values interpolated into an HTML string: text content and quoted
// attribute values alike. null and undefined become "".
const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[character]!);

export default escapeHtml;
