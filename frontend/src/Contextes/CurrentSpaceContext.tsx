import {createContext, ElementType, useState} from 'react';

export interface CurrentSpaceContextType {
  spaceId: number | undefined,
  setSpaceId: (value: number | undefined) => void,
}

export const CurrentSpaceContext = createContext<CurrentSpaceContextType>({
  spaceId: undefined,
  setSpaceId: () => {},
});

export const withCurrentSpaceContext = (BaseComponent: ElementType) => (props: any) => {
  const [spaceId, setSpaceIdInternal] = useState<number | undefined>(parseInt(location.pathname.match(/\/spaces\/(.*)/)?.[1] || "0"));

  const setSpaceId = (value: number | undefined) => {
    setSpaceIdInternal(value);
    window.history.replaceState(null, "", `/spaces/${value}${window.location.search}`);
  }

  return (
    <CurrentSpaceContext.Provider
      value={{
        spaceId,
        setSpaceId
      }}>
      <BaseComponent {...props}/>
    </CurrentSpaceContext.Provider>
  );
};
