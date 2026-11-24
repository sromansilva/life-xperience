import { createContext, useContext, useState, type ReactNode } from "react";

function usePrefsState() {
  const [prefs, setPrefs] = useState({ timer: false, instantText: false });
  const [audioOn, setAudioOn] = useState(false);
  return { prefs, setPrefs, audioOn, setAudioOn };
}

const PrefsContext = createContext<ReturnType<typeof usePrefsState> | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const value = usePrefsState();
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const value = useContext(PrefsContext);
  if (!value) throw new Error("usePrefs debe usarse dentro de PrefsProvider");
  return value;
}
