"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/students", label: "Students", icon: "🎓" },
  { href: "/dashboard/faculty", label: "Faculty", icon: "👨‍🏫" },
  { href: "/dashboard/departments", label: "Departments", icon: "🏛️" },
  { href: "/dashboard/subjects", label: "Subjects", icon: "📚" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "📋" },
  { href: "/dashboard/exams", label: "Exams", icon: "📝" },
  { href: "/dashboard/notices", label: "Notices", icon: "📢" },
];

const facultyLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/attendance", label: "Mark Attendance", icon: "📋" },
  { href: "/dashboard/exams", label: "Upload Marks", icon: "📝" },
  { href: "/dashboard/subjects", label: "My Subjects", icon: "📚" },
  { href: "/dashboard/notices", label: "Notices", icon: "📢" },
];

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "📋" },
  { href: "/dashboard/results", label: "Results", icon: "📝" },
  { href: "/dashboard/notices", label: "Notices", icon: "📢" },
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
        background: "#0f172a",
        borderRight: "1px solid #1e293b",
        padding: "20px 12px",
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
          gap: "12px",
          padding: "8px 12px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: 800,
            color: "white",
          }}
        >
          T
        </div>
        <div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#f1f5f9",
            }}
          >
            TSEC ERP
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#64748b",
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
            fontSize: "11px",
            fontWeight: 600,
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "0 12px",
            marginBottom: "12px",
          }}
        >
          Main Menu
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#f1f5f9" : "#94a3b8",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))"
                    : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  borderLeft: isActive
                    ? "3px solid #3b82f6"
                    : "3px solid transparent",
                }}
              >
                <span style={{ fontSize: "18px" }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Role badge */}
      <div
        style={{
          padding: "12px",
          borderRadius: "12px",
          background: "rgba(30,41,59,0.5)",
          border: "1px solid #1e293b",
        }}
      >
        <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
          Logged in as
        </div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>
          {session?.user?.name || "User"}
        </div>
        <div
          className="badge badge-info"
          style={{ marginTop: "6px", fontSize: "11px" }}
        >
          {role || "—"}
        </div>
      </div>
    </aside>
  );
}
