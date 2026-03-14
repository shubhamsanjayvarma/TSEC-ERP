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
      icon: "🎓",
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
    },
    {
      label: "Total Faculty",
      value: stats?.totalFaculty ?? 0,
      icon: "👨‍🏫",
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
    },
    {
      label: "Departments",
      value: stats?.totalDepartments ?? 0,
      icon: "🏛️",
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
    },
    {
      label: "Subjects",
      value: stats?.totalSubjects ?? 0,
      icon: "📚",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
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
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: "4px",
          }}
        >
          Welcome back, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>
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
            className="glass-card animate-fade-in"
            style={{
              padding: "24px",
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
                  fontSize: "24px",
                }}
              >
                {card.icon}
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
            <div style={{ fontSize: "13px", color: "#94a3b8" }}>
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
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#f1f5f9",
              marginBottom: "16px",
            }}
          >
            📋 Attendance Overview
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
                background: `conic-gradient(#10b981 ${(stats?.averageAttendance ?? 0) * 3.6}deg, #1e293b 0deg)`,
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
                  background: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#10b981",
                }}
              >
                {loading ? "—" : `${stats?.averageAttendance ?? 0}%`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "8px" }}>
                Average Attendance
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Minimum required: 75%
              </div>
            </div>
          </div>
        </div>

        {/* Recent Notices */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#f1f5f9",
              marginBottom: "16px",
            }}
          >
            📢 Recent Notices
          </h3>
          {stats?.recentNotices?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {stats.recentNotices.map((notice) => (
                <div
                  key={notice.id}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    background: "rgba(15,23,42,0.5)",
                    borderLeft: `3px solid ${
                      notice.priority === "high" ? "#ef4444" : "#3b82f6"
                    }`,
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#e2e8f0" }}>
                    {notice.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "#64748b" }}>No recent notices</div>
          )}
        </div>
      </div>
    </div>
  );
}
