import { createContext, useContext, type ReactNode } from "react";
import type { LayoutVariant } from "../types/theme";

const LayoutVariantContext = createContext<LayoutVariant>("classic");

export function LayoutVariantProvider({
  variant,
  children,
}: {
  variant: LayoutVariant;
  children: ReactNode;
}) {
  return (
    <LayoutVariantContext.Provider value={variant}>{children}</LayoutVariantContext.Provider>
  );
}

export function useLayoutVariant(): LayoutVariant {
  return useContext(LayoutVariantContext);
}
