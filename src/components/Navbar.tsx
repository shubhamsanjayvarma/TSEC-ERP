"use client";

import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header
      style={{
        height: "64px",
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left side - college name */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img
          src="/img/TSEC-header.png"
          alt="TSEC"
          style={{
            height: "40px",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "0 12px",
            background: "#f8fafc",
            height: "40px",
            minWidth: "200px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#94a3b8" }}>search</span>
          <input
            type="text"
            placeholder="Search..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              padding: "0 8px",
              fontSize: "14px",
              color: "#334155",
              width: "100%",
            }}
          />
        </div>

        {/* Notification bell */}
        <button
          style={{
            position: "relative",
            padding: "8px",
            borderRadius: "9999px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          <span className="material-symbols-outlined">notifications</span>
          <span
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "8px",
              height: "8px",
              background: "#ef4444",
              borderRadius: "9999px",
              border: "2px solid white",
            }}
          />
        </button>

        {/* User avatar */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 700,
            color: "white",
            border: "2px solid #e2e8f0",
          }}
        >
          {session?.user?.name?.[0]?.toUpperCase() || "U"}
        </div>

        {/* User name */}
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f1729" }}>
            {session?.user?.name || "User"}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
            {(session?.user as any)?.role || "—"}
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            color: "#64748b",
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
