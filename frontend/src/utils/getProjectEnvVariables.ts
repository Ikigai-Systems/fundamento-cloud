import {projectEnvVariables, ProjectEnvVariablesType} from "../shared/projectEnvVariables.ts";

export const getProjectEnvVariables = (): {
  envVariables: ProjectEnvVariablesType
} => {
  return {
    envVariables: {
      VITE_VERSION: !projectEnvVariables.VITE_VERSION.includes('VITE_') ? projectEnvVariables.VITE_VERSION : import.meta.env.VITE_VERSION,
      APP_API_BASE_URL: !projectEnvVariables.APP_API_BASE_URL.includes('${APP_API_BASE_URL}') ? projectEnvVariables.APP_API_BASE_URL : import.meta.env.APP_API_BASE_URL,
    }
  }
}
