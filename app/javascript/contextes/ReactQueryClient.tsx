import {QueryClient} from "@tanstack/react-query";
import {httpStatus} from "../utils/referenceFailure.ts";

const MAX_RETRIES = 3;

// not a ReactContext per se, but behaving like one
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // A 4xx won't change on a retry: a deleted document stays deleted. Retrying it
      // only keeps a spinner up for seconds before the cell or mention can say so.
      retry: (failureCount, error) => {
        const status = httpStatus(error);
        if (status !== undefined && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < MAX_RETRIES;
      },
    }
  }
});

export default queryClient;
