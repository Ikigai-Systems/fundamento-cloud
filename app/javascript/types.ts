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
  displayName: string,
  color: string,
}
