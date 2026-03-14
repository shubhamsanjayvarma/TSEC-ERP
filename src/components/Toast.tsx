"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface ToastContextType {
  addToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let idCounter = 0;

  const addToast = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = Date.now() + idCounter++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const colors = {
    success: { bg: "rgba(16,185,129,0.15)", border: "#10b981", text: "#34d399", icon: "✅" },
    error: { bg: "rgba(239,68,68,0.15)", border: "#ef4444", text: "#f87171", icon: "❌" },
    info: { bg: "rgba(59,130,246,0.15)", border: "#3b82f6", text: "#60a5fa", icon: "ℹ️" },
    warning: { bg: "rgba(245,158,11,0.15)", border: "#f59e0b", text: "#fbbf24", icon: "⚠️" },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => {
          const c = colors[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: "12px",
                padding: "14px 20px",
                color: c.text,
                fontSize: "14px",
                fontWeight: 500,
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                minWidth: "280px",
                maxWidth: "420px",
                animation: "fadeInUp 0.3s ease",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "16px" }}>{c.icon}</span>
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
