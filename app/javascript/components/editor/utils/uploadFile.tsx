import {request} from "@js-from-routes/axios";
import AttachmentsApi from "../../../api/AttachmentsApi";

export function uploadFile(documentId: number) {
  return async (file: string | Blob) => {
    const body = new FormData();

    body.set("attachment[parent_id]", documentId.toString());
    body.set("attachment[parent_type]", "Document");

    body.append("file", file);

    const attachment = await request("post", AttachmentsApi.create.path(), {
      data: body,
      responseAs: "json",
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return `attachment:${attachment.id}`;
  };
}