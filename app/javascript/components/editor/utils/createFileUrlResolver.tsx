import AttachmentsApi from "../../../api/AttachmentsApi";

export function createFileUrlResolver(showAttachmentPath = AttachmentsApi.show.path) {
  return async (fileUrl: string) => {
    const attachmentId = fileUrl.match(/^attachment:(\d+)(\.[a-z0-9]+)?$/i)?.[1];

    if (attachmentId) {
      return showAttachmentPath({id: attachmentId});
    }

    const onboardingContent = fileUrl.match(/^onboardingContent:([a-zA-Z0-9%\-\/.]+)$/)?.[1];

    if (onboardingContent) {
      return `/onboarding_contents/${onboardingContent}`
    }

    return fileUrl;
  }
}