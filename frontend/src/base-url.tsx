import {getProjectEnvVariables} from "./utils/getProjectEnvVariables.ts";

const {envVariables} = getProjectEnvVariables();

export default envVariables.APP_API_BASE_URL || (import.meta.env.PROD ? window.location.origin : window.location.protocol + "//" + window.location.hostname + ":3000");
