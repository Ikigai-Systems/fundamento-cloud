import {createContext} from 'react';
import {Space} from "../types.ts";

export interface CurrentSpaceContextType {
  space: Space | undefined,
}

// This context is imported by multiple components; keep it here rather than moving it to satisfy fast refresh.
// eslint-disable-next-line react-refresh/only-export-components
export const CurrentSpaceContext = createContext<CurrentSpaceContextType>({
  space: undefined,
});

export default CurrentSpaceContext;
