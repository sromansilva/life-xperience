import { createContext, useContext, useState, type ReactNode } from "react";
import type { OrionChatMessage } from "../OrionChat";

function useOrionState() {
  const [orionChat, setOrionChat] = useState<OrionChatMessage[]>([]);
  return { orionChat, setOrionChat };
}

const OrionContext = createContext<ReturnType<typeof useOrionState> | null>(null);

export function OrionProvider({ children }: { children: ReactNode }) {
  const value = useOrionState();
  return <OrionContext.Provider value={value}>{children}</OrionContext.Provider>;
}

export function useOrion() {
  const value = useContext(OrionContext);
  if (!value) throw new Error("useOrion debe usarse dentro de OrionProvider");
  return value;
}
