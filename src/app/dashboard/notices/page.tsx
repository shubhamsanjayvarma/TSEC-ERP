"use client";

import { useEffect, useState } from "react";

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  async function fetchNotices() {
    try {
      const res = await fetch("/api/notices");
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (error) {
      console.error("Failed to fetch notices:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>
          📢 Notices
        </h1>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>
          College announcements and updates
        </p>
      </div>

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading notices...</p>
      ) : notices.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "#64748b" }}>No notices posted yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="glass-card"
              style={{
                padding: "24px",
                borderLeft: `4px solid ${
                  notice.priority === "high"
                    ? "#ef4444"
                    : notice.priority === "medium"
                    ? "#f59e0b"
                    : "#3b82f6"
                }`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#f1f5f9",
                  }}
                >
                  {notice.title}
                </h3>
                <span
                  className={`badge ${
                    notice.priority === "high"
                      ? "badge-danger"
                      : notice.priority === "medium"
                      ? "badge-warning"
                      : "badge-info"
                  }`}
                >
                  {notice.priority}
                </span>
              </div>
              <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.6" }}>
                {notice.content}
              </p>
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "12px" }}>
                {new Date(notice.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
