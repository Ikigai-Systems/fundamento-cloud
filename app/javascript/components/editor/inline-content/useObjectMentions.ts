import {useQuery} from "@tanstack/react-query";
import ObjectMentionsApi from "../../../api/Documents/ObjectMentionsApi";
import queryClient from "../../../contextes/ReactQueryClient";

export interface ObjectMentionData {
  id: string;
  targetType: string;
  targetId: string | null;
  title: string;
}

export function useObjectMentions(documentId: string | undefined) {
  return useQuery<ObjectMentionData[]>({
    queryKey: ["object_mentions", documentId],
    queryFn: async () => {
      if (!documentId) return [];
      const data = await ObjectMentionsApi.index({documentId});
      return data.objectMentions;
    },
    enabled: !!documentId,
  }, queryClient);
}

export function useObjectMention(documentId: string | undefined, mentionId: string): ObjectMentionData | undefined {
  const { data: mentions } = useObjectMentions(documentId);
  if (!Array.isArray(mentions)) return undefined;
  return mentions.find(m => m.id === mentionId);
}

export function useCurrentDocumentId(): string | undefined {
  const match = window.location.pathname.match(/^\/d\/([^/]+)/);
  return match?.[1];
}
