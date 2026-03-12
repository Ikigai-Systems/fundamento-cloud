import {useQuery} from "@tanstack/react-query";
import ObjectMentionsApi, {ObjectMentionData} from "../../../api/Documents/ObjectMentionsApi";
import queryClient from "../../../contextes/ReactQueryClient";

export function useObjectMentions(documentId: string | undefined) {
  return useQuery<ObjectMentionData[]>({
    queryKey: ["object_mentions", documentId],
    queryFn: async () => {
      if (!documentId) return [];
      return await ObjectMentionsApi.index({ documentId });
    },
    enabled: !!documentId,
  }, queryClient);
}

export function useObjectMention(documentId: string | undefined, mentionId: string): ObjectMentionData | undefined {
  const { data: mentions } = useObjectMentions(documentId);
  return mentions?.find(m => m.id === mentionId);
}

export function useCurrentDocumentId(): string | undefined {
  const match = window.location.pathname.match(/^\/d\/([^/]+)/);
  return match?.[1];
}
