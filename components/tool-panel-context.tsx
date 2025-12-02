"use client";

import { createContext, ReactNode, useContext } from "react";

type ToolPanelContextValue = {
  setToolPanel: (panel: ReactNode | null) => void;
};

const ToolPanelContext = createContext<ToolPanelContextValue | null>(null);

export function ToolPanelProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ToolPanelContextValue;
}) {
  return (
    <ToolPanelContext.Provider value={value}>
      {children}
    </ToolPanelContext.Provider>
  );
}

export function useToolPanel() {
  const context = useContext(ToolPanelContext);
  if (!context) {
    throw new Error("useToolPanel must be used within ToolPanelProvider");
  }
  return context.setToolPanel;
}
