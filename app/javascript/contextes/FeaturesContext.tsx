import {createContext, useContext} from 'react';

export type Features = Array <string>;

export const FeaturesContext = createContext<Features>([]);

export const useFeaturesContext = () => useContext(FeaturesContext);