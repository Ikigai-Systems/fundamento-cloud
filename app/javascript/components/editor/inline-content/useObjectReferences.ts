import {useQuery} from "@tanstack/react-query";
import ObjectReferencesApi from "../../../api/Documents/ObjectReferencesApi";
import queryClient from "../../../contextes/ReactQueryClient";

export interface ObjectReferenceData {
  nodeId: string;
  targetType: string;
  targetId: string | null;
  title: string;
}

export function useObjectReferences(documentId: string | undefined) {
  return useQuery<ObjectReferenceData[]>({
    queryKey: ["object_references", documentId],
    queryFn: async () => {
      if (!documentId) return [];
      const data = await ObjectReferencesApi.index({documentId});
      return data.objectReferences;
    },
    enabled: !!documentId,
  }, queryClient);
}

export function useObjectReference(documentId: string | undefined, mentionId: string): ObjectReferenceData | undefined {
  const { data: references } = useObjectReferences(documentId);
  if (!Array.isArray(references)) return undefined;
  return references.find(m => m.nodeId === mentionId);
}

export function useCurrentDocumentId(): string | undefined {
  const match = window.location.pathname.match(/^\/d\/([^/]+)/);
  return match?.[1];
}
