import AttachmentsApi from "../../../api/AttachmentsApi";

export function createFileUrlResolver(showAttachmentPath = AttachmentsApi.show.path) {
  return async (fileUrl: string) => {
    const attachmentId = fileUrl.match(/^attachment:(\d+)$/)?.[1];

    if (attachmentId) {
      return showAttachmentPath({id: attachmentId});
    } else {
      return fileUrl;
    }
  }
}