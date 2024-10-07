export type Document = {
  id: number,
  title: string,
}

export type Space = {
  npi: string,
  hierarchy: number[],
  homeDocumentId?: number,
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
  content: unknown,
  documentId: number,
  createdAt: string, //date
  updatedAt: string, //date
}