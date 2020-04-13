import { useContext, createContext } from "react";

export const OpenTokSessionContext = createContext(null);
export const OpenTokPublisherContext = createContext(null);

export function useOpenTokSessionContext() {
  return useContext(OpenTokSessionContext);
}

export function useOpenTokPublisherContext() {
  return useContext(OpenTokPublisherContext);
}
