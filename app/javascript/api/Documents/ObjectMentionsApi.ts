export interface ObjectMentionData {
  id: string;
  target_type: string;
  target_id: string | null;
  title: string;
}

const ObjectMentionsApi = {
  index: async ({ documentId }: { documentId: string }): Promise<ObjectMentionData[]> => {
    const response = await fetch(`/d/${documentId}/object_mentions`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch object mentions: ${response.status}`);
    }

    const data = await response.json();
    return data.object_mentions as ObjectMentionData[];
  }
};

export default ObjectMentionsApi;
