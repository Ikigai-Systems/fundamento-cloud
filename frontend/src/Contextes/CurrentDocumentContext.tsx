import {createContext, ElementType, useState} from 'react';

export interface CurrentDocumentContextType {
  documentId: number | undefined,
  setDocumentId: (value: number | undefined) => void,
}

export const CurrentDocumentContext = createContext<CurrentDocumentContextType>({
  documentId: undefined,
  setDocumentId: () => {},
});

export const withCurrentDocumentContext = (BaseComponent: ElementType) => (props: any) => {
  const [documentId, setDocumentIdInternal] = useState<number | undefined>(parseInt(location.pathname.match(/\/documents\/(.*)/)?.[1] || "0"));

  const setDocumentId = (value: number | undefined) => {
    setDocumentIdInternal(value);
    window.history.replaceState(null, "", `/documents/${value}${window.location.search}`);
  }

  return (
    <CurrentDocumentContext.Provider
      value={{
        documentId,
        setDocumentId
      }}>
      <BaseComponent {...props}/>
    </CurrentDocumentContext.Provider>
  );
};
