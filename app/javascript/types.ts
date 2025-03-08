export type Document = {
  id: number,
  npi: string,
  title: string,
}

// Make sure you keep it in sync with Space#to_react_props
export type Space = {
  npi: string,
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
  id: number,
  npi: string,
  name: string,
  organizationId: number,
  parentId: number,
  parentType: string,
  spaceId: number,
  updatedAt: string, //date
}

export type Version = {
  sequentialId: number,
  content: unknown,
  documentId: number,
  createdAt: string, //date
  updatedAt: string, //date
}