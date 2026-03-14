"use client";

import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header
      style={{
        height: "64px",
        background: "rgba(15,23,42,0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Page title area */}
      <div>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#f1f5f9",
          }}
        >
          Thakur Shyamnarayan Engineering College
        </h2>
      </div>

      {/* User actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 700,
              color: "white",
            }}
          >
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>
              {session?.user?.name || "User"}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              {(session?.user as any)?.department || (session?.user as any)?.role}
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          id="logout-button"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
