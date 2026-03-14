"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
  totalSubjects: number;
  averageAttendance: number;
  recentNotices: Array<{ id: string; title: string; createdAt: string; priority: string }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Students",
      value: stats?.totalStudents ?? 0,
      icon: "school",
      color: "#2563eb",
      bg: "rgba(37,99,235,0.08)",
    },
    {
      label: "Total Faculty",
      value: stats?.totalFaculty ?? 0,
      icon: "groups",
      color: "#7c3aed",
      bg: "rgba(124,58,237,0.08)",
    },
    {
      label: "Departments",
      value: stats?.totalDepartments ?? 0,
      icon: "apartment",
      color: "#059669",
      bg: "rgba(5,150,105,0.08)",
    },
    {
      label: "Subjects",
      value: stats?.totalSubjects ?? 0,
      icon: "book",
      color: "#d97706",
      bg: "rgba(217,119,6,0.08)",
    },
  ];

  const filteredCards =
    role === "STUDENT"
      ? [statCards[2], statCards[3]]
      : role === "FACULTY"
      ? [statCards[0], statCards[2], statCards[3]]
      : statCards;

  return (
    <div>
      {/* Welcome header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: "4px",
            letterSpacing: "-0.02em",
          }}
        >
          Welcome back, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ fontSize: "15px", color: "#64748b" }}>
          Here&apos;s what&apos;s happening at TSEC today
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${filteredCards.length}, 1fr)`,
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {filteredCards.map((card, i) => (
          <div
            key={card.label}
            className="animate-fade-in"
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.3s ease",
              animationDelay: `${i * 0.1}s`,
              opacity: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "24px", color: card.color }}>{card.icon}</span>
              </div>
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: card.color,
                marginBottom: "4px",
              }}
            >
              {loading ? "—" : card.value}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Attendance summary card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        {/* Average Attendance */}
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#64748b" }}>fact_check</span>
            Attendance Overview
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: `conic-gradient(#059669 ${(stats?.averageAttendance ?? 0) * 3.6}deg, #e2e8f0 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#059669",
                }}
              >
                {loading ? "—" : `${stats?.averageAttendance ?? 0}%`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "14px", color: "#475569", marginBottom: "8px", fontWeight: 500 }}>
                Average Attendance
              </div>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                Minimum required: 75%
              </div>
            </div>
          </div>
        </div>

        {/* Recent Notices */}
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#64748b" }}>campaign</span>
            Recent Notices
          </h3>
          {stats?.recentNotices?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {stats.recentNotices.map((notice) => (
                <div
                  key={notice.id}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    borderLeft: `3px solid ${
                      notice.priority === "high" ? "#ef4444" : "#2563eb"
                    }`,
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                    {notice.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "#94a3b8" }}>No recent notices</div>
          )}
        </div>
      </div>
    </div>
  );
}
