import {createContext} from 'react';
import {Space} from "../types.ts";

export interface CurrentSpaceContextType {
  space: Space | undefined,
}

export const CurrentSpaceContext = createContext<CurrentSpaceContextType>({
  space: undefined,
});

export default CurrentSpaceContext;
