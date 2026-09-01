// Mirrors Icon#as_json in app/models/icon.rb. Only "emoji" exists today; the
// discriminator is there so a glyph set or an image can be added server-side
// without this file needing to know how either is detected.
export interface ObjectIcon {
  type: string;
  value: string;
}

export interface TreeNode {
  id: string;
  title: string;
  icon?: ObjectIcon | null;
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
