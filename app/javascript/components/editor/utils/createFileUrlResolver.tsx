import AttachmentsApi from "../../../api/AttachmentsApi";
import {attachmentIdFromHref} from "./attachmentLinks";

export function createFileUrlResolver(showAttachmentPath = AttachmentsApi.show.path) {
  return async (fileUrl: string) => {
    const attachmentId = attachmentIdFromHref(fileUrl);

    if (attachmentId) {
      return showAttachmentPath({id: attachmentId});
    }

    const onboardingContent = fileUrl.match(/^onboardingContent:([a-zA-Z0-9%\-/.]+)$/)?.[1];

    if (onboardingContent) {
      return `/onboarding_contents/${onboardingContent}`
    }

    return fileUrl;
  }
}