export type {ObjectIcon} from "./sidebar/types";
import type {ObjectIcon} from "./sidebar/types";

export type Document = {
  id: string,
  title: string,
  icon?: ObjectIcon | null,
  // Title with the icon put back on the front, for editing. See HasIcon.
  titleForEditing?: string,
}

// Make sure you keep it in sync with Space#to_react_props
export type Space = {
  id: string,
  name: string,
  icon?: ObjectIcon | null,
  hierarchy: number[],
}

export type User = {
  createdAt: string, //date
  email: string,
  firstName: string,
  id: number,
  lastName: string,
  organizationRole: number
  updatedAt: string, //date
}

export type Table = {
  archived: boolean,
  createdAt: string, //date
  icon?: ObjectIcon | null,
  id: string,
  name: string,
  // Name with the icon put back on the front, for editing. See HasIcon.
  titleForEditing?: string,
  organizationId: number,
  parentId: number,
  parentType: string,
  spaceId: number,
  updatedAt: string, //date
}

export type Version = {
  sequentialId: number,
  contentBlocks: unknown,
  contentHtml: string,
  documentId: number,
  createdAt: string, //date
  updatedAt: string, //date
  operations: string, //JSON
}