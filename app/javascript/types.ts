export type Document = {
  id: string,
  title: string,
}

// Make sure you keep it in sync with Space#to_react_props
export type Space = {
  id: string,
  name: string,
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
  id: string,
  name: string,
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