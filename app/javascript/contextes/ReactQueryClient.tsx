import {QueryClient} from "@tanstack/react-query";

// not a ReactContext per se, but behaving like one
const queryClient = new QueryClient();

export default queryClient;
