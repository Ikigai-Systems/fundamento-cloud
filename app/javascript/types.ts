export type Document = {
  id: number,
  content: string,
  title: string,
}

export type Space = {
  id: number,
  hierarchy: number[],
}

export type User = {
  createdAt: string //date,
  email: string,
  firstName: string,
  id: number,
  lastName: string,
  organizationRole: number
  updatedAt: string //date,
}