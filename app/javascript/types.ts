export type Document = {
  id: number,
  content: string,
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

type Row = {
  id: string,
  [key: string]:string,
}

export type Table = {
  name: string,
  data: Array<Row>,
}

export type Version = {
  sequentialId: number,
  content: unknown,
  documentId: number,
  createdAt: string, //date
  updatedAt: string, //date
}