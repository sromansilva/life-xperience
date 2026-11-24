import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import { LayoutDashboard, Sparkles, ClipboardList } from "lucide-react";
import type { GenCase } from "../../types";
import { useProgress } from "../../providers/ProgressProvider";
import type { TeacherTab } from "../../navigation";

/**
 * Mensaje de orientación institucional que se reproduce con voz sintética en el Dashboard docente.
 */
export const ORIENTATION =
  "Al probar como estudiante verás las mismas pantallas, decisiones y pistas de Orion que usa tu grupo. Nada de lo que hagas en la práctica cambia el progreso de tus estudiantes. Después, vuelve al panel para asignar un caso.";

export interface TeacherNavItem {
  id: TeacherTab;
  icon: typeof LayoutDashboard;
  lbl: string;
}

export const T_NAV_ITEMS: TeacherNavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, lbl: "Panel general" },
  { id: "ai", icon: Sparkles, lbl: "Asistente IA" },
  { id: "plans", icon: ClipboardList, lbl: "Planes asignados" },
];

export interface TeacherContextValue {
  caseWorldId: string;
  setCaseWorldId: React.Dispatch<React.SetStateAction<string>>;
  caseDiff: "Básico" | "Intermedio" | "Avanzado";
  setCaseDiff: React.Dispatch<React.SetStateAction<"Básico" | "Intermedio" | "Avanzado">>;
  caseTarget: string;
  setCaseTarget: React.Dispatch<React.SetStateAction<string>>;
  caseContext: string;
  setCaseContext: React.Dispatch<React.SetStateAction<string>>;
  generatedCase: GenCase | null;
  setGeneratedCase: React.Dispatch<React.SetStateAction<GenCase | null>>;
  caseGenerating: boolean;
  setCaseGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  totalPlans: number;
}

const TeacherContext = createContext<TeacherContextValue | null>(null);

function TeacherStateProvider({ children }: { children: ReactNode }) {
  const { studentPlans } = useProgress();
  const [caseWorldId, setCaseWorldId] = useState("com");
  const [caseDiff, setCaseDiff] = useState<"Básico" | "Intermedio" | "Avanzado">("Intermedio");
  const [caseTarget, setCaseTarget] = useState("all");
  const [caseContext, setCaseContext] = useState("");
  const [generatedCase, setGeneratedCase] = useState<GenCase | null>(null);
  const [caseGenerating, setCaseGenerating] = useState(false);

  const totalPlans = useMemo(
    () => Object.values(studentPlans).reduce((s, p) => s + p.length, 0),
    [studentPlans]
  );

  const value: TeacherContextValue = {
    caseWorldId,
    setCaseWorldId,
    caseDiff,
    setCaseDiff,
    caseTarget,
    setCaseTarget,
    caseContext,
    setCaseContext,
    generatedCase,
    setGeneratedCase,
    caseGenerating,
    setCaseGenerating,
    totalPlans,
  };

  return <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>;
}

/**
 * Proveedor de estado compartido del panel docente.
 * Si ya se encuentra dentro de un TeacherContext activo (por ejemplo, en TeacherLayout),
 * simplemente entrega a sus hijos para evitar duplicación o reseteo de estado al navegar entre pestañas.
 */
export function TeacherProvider({ children }: { children: ReactNode }) {
  const existing = useContext(TeacherContext);
  if (existing) {
    return <>{children}</>;
  }
  return <TeacherStateProvider>{children}</TeacherStateProvider>;
}

/**
 * Hook para acceder al estado compartido del panel docente (generador de casos IA, selecciones y conteo de planes).
 */
export function useTeacher(): TeacherContextValue {
  const ctx = useContext(TeacherContext);
  if (!ctx) {
    throw new Error("useTeacher debe usarse dentro de un TeacherProvider o TeacherLayout");
  }
  return ctx;
}
