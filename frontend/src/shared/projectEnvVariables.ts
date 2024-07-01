export type ProjectEnvVariablesType = Pick<ImportMetaEnv, 'VITE_VERSION'|'APP_API_BASE_URL'>

// Environment Variable Template to Be Replaced at Runtime
export const projectEnvVariables: ProjectEnvVariablesType = {
  VITE_VERSION: '${VITE_VERSION}',
  APP_API_BASE_URL: '${APP_API_BASE_URL}'
}
