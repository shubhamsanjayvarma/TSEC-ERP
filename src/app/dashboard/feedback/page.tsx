"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";

type FilterTab = "ALL" | "LECTURE" | "PRACTICAL" | "EXPERT_GUEST";

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  LECTURE: { label: "Lecture", color: "#2563eb", bg: "rgba(37,99,235,0.08)", icon: "school" },
  PRACTICAL: { label: "Practical", color: "#7c3aed", bg: "rgba(124,58,237,0.08)", icon: "science" },
  EXPERT_GUEST: { label: "Expert / Guest", color: "#059669", bg: "rgba(5,150,105,0.08)", icon: "person_pin" },
};

export default function FeedbackDashboard() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const { addToast } = useToast();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [newCount, setNewCount] = useState(0);
  const prevCountRef = useRef(0);

  async function fetchFeedbacks() {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        // Detect new feedbacks
        if (prevCountRef.current > 0 && data.length > prevCountRef.current) {
          const diff = data.length - prevCountRef.current;
          setNewCount((prev) => prev + diff);
          addToast(`${diff} new feedback received! 🔔`);
        }
        prevCountRef.current = data.length;
        setFeedbacks(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  // Initial fetch + auto-polling every 5 seconds
  useEffect(() => {
    fetchFeedbacks();
    const interval = setInterval(fetchFeedbacks, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === "ALL" ? feedbacks : feedbacks.filter((f) => f.type === filter);

  // Stats
  const totalCount = feedbacks.length;
  const avgRating = totalCount > 0 ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCount).toFixed(1) : "—";
  const lectureCount = feedbacks.filter((f) => f.type === "LECTURE").length;
  const practicalCount = feedbacks.filter((f) => f.type === "PRACTICAL").length;
  const expertCount = feedbacks.filter((f) => f.type === "EXPERT_GUEST").length;

  const statCards = [
    { label: "Total Feedback", value: totalCount, icon: "reviews", color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
    { label: "Average Rating", value: `${avgRating} ★`, icon: "star", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    { label: "Lecture", value: lectureCount, icon: "school", color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
    { label: "Practical", value: practicalCount, icon: "science", color: "#059669", bg: "rgba(5,150,105,0.08)" },
  ];

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "LECTURE", label: "Lecture" },
    { key: "PRACTICAL", label: "Practical" },
    { key: "EXPERT_GUEST", label: "Expert / Guest" },
  ];

  // Admin-only page
  if (role !== "ADMIN" && role !== "FACULTY") {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔒</div>
        <p style={{ color: "#64748b", fontSize: "16px" }}>Access restricted to Admin & Faculty</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            Student Feedback
            {newCount > 0 && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  background: "#ef4444",
                  color: "#fff",
                  padding: "2px 10px",
                  borderRadius: "9999px",
                  animation: "pulse 2s infinite",
                }}
              >
                {newCount} new
              </span>
            )}
          </h1>
          <p style={{ fontSize: "15px", color: "#64748b", marginTop: "4px" }}>
            Real-time feedback from students — auto-refreshes every 5 seconds
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-primary" onClick={() => { setNewCount(0); fetchFeedbacks(); }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "28px" }}>
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="animate-fade-in"
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              animationDelay: `${i * 0.1}s`,
              opacity: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: card.color }}>{card.icon}</span>
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: card.color, marginBottom: "2px" }}>
              {loading ? "—" : card.value}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "8px 20px",
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: 600,
              border: filter === tab.key ? "none" : "1px solid #e2e8f0",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: filter === tab.key ? "#2563eb" : "#ffffff",
              color: filter === tab.key ? "#ffffff" : "#334155",
              boxShadow: filter === tab.key ? "0 4px 14px rgba(37,99,235,0.2)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feedback Cards */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", opacity: 0.5 }}>
              <div style={{ width: "100px", height: "20px", background: "#f1f5f9", borderRadius: "9999px", marginBottom: "16px" }} />
              <div style={{ width: "80%", height: "18px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "10px" }} />
              <div style={{ width: "60%", height: "14px", background: "#f1f5f9", borderRadius: "6px" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "60px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
          <p style={{ color: "#64748b", fontSize: "16px" }}>
            {filter === "ALL" ? "No feedback received yet" : `No ${filter.toLowerCase().replace("_", " ")} feedback yet`}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {filtered.map((fb, i) => {
            const cfg = typeConfig[fb.type] || typeConfig.LECTURE;
            return (
              <div
                key={fb.id}
                className="animate-fade-in"
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #f1f5f9",
                  borderTop: `4px solid ${cfg.color}`,
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 0.3s ease",
                  animationDelay: `${i * 0.06}s`,
                  opacity: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 40px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
              >
                {/* Badge + Date */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <span style={{
                    padding: "4px 12px",
                    background: cfg.bg,
                    color: cfg.color,
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{cfg.icon}</span>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                    {new Date(fb.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {" "}
                    {new Date(fb.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Star Rating */}
                <div style={{ display: "flex", gap: "2px", marginBottom: "12px" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ fontSize: "18px", color: s <= fb.rating ? "#f59e0b" : "#e2e8f0" }}>★</span>
                  ))}
                  <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600, marginLeft: "8px" }}>{fb.rating}/5</span>
                </div>

                {/* Subject & Faculty */}
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                  {fb.subjectName}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person</span>
                  {fb.facultyName}
                </div>

                {/* Comment */}
                <p style={{
                  color: "#475569",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  marginBottom: "16px",
                  padding: "12px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  borderLeft: `3px solid ${cfg.color}`,
                }}>
                  &ldquo;{fb.comment}&rdquo;
                </p>

                {/* Student + Dept */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "12px",
                  borderTop: "1px solid #f1f5f9",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: fb.anonymous ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#fff",
                    }}>
                      {fb.anonymous ? "?" : fb.studentName?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                        {fb.studentName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{fb.department}</div>
                    </div>
                  </div>
                  {fb.anonymous && (
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "#94a3b8",
                      background: "#f1f5f9",
                      padding: "3px 8px",
                      borderRadius: "9999px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      Anonymous
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
