export interface TreeNode {
  id: string;
  title: string;
  emoji?: string | null;
  archived?: boolean;
  draft?: boolean;
  children?: TreeNode[];
}

export interface TreePayload {
  spaceId: string;
  canUpdateSpace: boolean;
  nodes: TreeNode[];
}

export interface RenderContext {
  spaceId: string;
  canUpdateSpace: boolean;
  selectedId: string | null;
}
