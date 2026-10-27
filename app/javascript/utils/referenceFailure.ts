// What a failed lookup of a referenced object means. The show endpoints answer 404
// for something deleted (or a user no longer in the organization) and 403 for
// something that exists in a space the viewer can't open.
export type ReferenceFailure = "missing" | "restricted" | "failed";

// The status of a failed request made through the js_from_routes axios client.
export const httpStatus = (error: unknown): number | undefined =>
  (error as {response?: {status?: number}} | null)?.response?.status;

export const referenceFailure = (error: unknown): ReferenceFailure => {
  switch (httpStatus(error)) {
    case 404:
      return "missing";
    case 403:
      return "restricted";
    default:
      return "failed";
  }
};
