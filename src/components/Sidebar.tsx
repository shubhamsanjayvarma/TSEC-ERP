"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const adminLinks = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { href: "/dashboard/students", label: "Students", icon: "school" },
  { href: "/dashboard/faculty", label: "Faculty", icon: "groups" },
  { href: "/dashboard/departments", label: "Departments", icon: "apartment" },
  { href: "/dashboard/subjects", label: "Subjects", icon: "book" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "fact_check" },
  { href: "/dashboard/exams", label: "Exams", icon: "quiz" },
  { href: "/dashboard/notices", label: "Notices", icon: "campaign" },
];

const facultyLinks = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { href: "/dashboard/attendance", label: "Mark Attendance", icon: "fact_check" },
  { href: "/dashboard/exams", label: "Upload Marks", icon: "quiz" },
  { href: "/dashboard/subjects", label: "My Subjects", icon: "book" },
  { href: "/dashboard/notices", label: "Notices", icon: "campaign" },
];

const studentLinks = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "fact_check" },
  { href: "/dashboard/results", label: "Results", icon: "leaderboard" },
  { href: "/dashboard/notices", label: "Notices", icon: "campaign" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const links =
    role === "ADMIN"
      ? adminLinks
      : role === "FACULTY"
      ? facultyLinks
      : studentLinks;

  return (
    <aside
      style={{
        width: "260px",
        minHeight: "100vh",
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        padding: "16px 16px",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "4px 8px",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <img
            src="/img/TSEC-logo.webp"
            alt="TSEC"
            style={{
              width: "28px",
              height: "28px",
              objectFit: "contain",
              filter: "brightness(1.2)",
            }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            TSEC ERP
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: 500,
            }}
          >
            College Management
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "0 12px",
            marginBottom: "8px",
          }}
        >
          Main Menu
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#0f1729" : "#64748b",
                  background: isActive
                    ? "rgba(37,99,235,0.06)"
                    : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "22px",
                    color: isActive ? "#2563eb" : "#94a3b8",
                  }}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User card at bottom */}
      <div
        style={{
          padding: "14px",
          borderRadius: "14px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              flexShrink: 0,
            }}
          >
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {session?.user?.name || "User"}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
              {role || "—"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
