"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";

type FilterTab = "all" | "high" | "normal";

export default function NoticesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const { addToast } = useToast();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newNotice, setNewNotice] = useState({ title: "", content: "", priority: "normal" });

  useEffect(() => { fetchNotices(); }, []);

  async function fetchNotices() {
    try {
      const res = await fetch("/api/notices");
      if (res.ok) setNotices(await res.json());
    } catch { addToast("Failed to fetch notices", "error"); }
    finally { setLoading(false); }
  }

  async function handleAddNotice(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotice),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewNotice({ title: "", content: "", priority: "normal" });
        addToast("Notice posted successfully");
        fetchNotices();
      } else { addToast("Failed to create notice", "error"); }
    } catch { addToast("Something went wrong", "error"); }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/notices/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Notice deleted");
        setDeleteConfirm(null);
        fetchNotices();
      } else { addToast("Failed to delete notice", "error"); }
    } catch { addToast("Something went wrong", "error"); }
  }

  const filteredNotices = notices
    .filter((n) => activeFilter === "all" || n.priority === activeFilter)
    .filter((n) => searchTerm === "" || n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.content.toLowerCase().includes(searchTerm.toLowerCase()));

  const priorityConfig: Record<string, { borderColor: string; bgColor: string; textColor: string; label: string }> = {
    high: { borderColor: "#ef4444", bgColor: "rgba(239,68,68,0.06)", textColor: "#dc2626", label: "High Priority" },
    medium: { borderColor: "#f59e0b", bgColor: "rgba(245,158,11,0.06)", textColor: "#d97706", label: "Medium" },
    normal: { borderColor: "#3b82f6", bgColor: "rgba(37,99,235,0.06)", textColor: "#2563eb", label: "Normal Priority" },
  };

  const filterTabs = [
    { key: "all" as FilterTab, label: "All" },
    { key: "high" as FilterTab, label: "Academic" },
    { key: "normal" as FilterTab, label: "Events" },
  ];

  return (
    <div>
      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="confirm-overlay">
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "32px", maxWidth: "400px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#0f1729", marginBottom: "8px" }}>Delete Notice?</h3>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>This notice will be permanently deleted.</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)} style={{ padding: "10px 24px", borderRadius: "10px", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header - exact Stitch style */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a" }}>
            Notices & Announcements
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px", marginTop: "4px" }}>
            Stay updated with the latest campus news and official notifications
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button className="btn-ghost" onClick={() => fetchNotices()}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>filter_list</span>
            Filter
          </button>
          <button className="btn-primary" onClick={() => fetchNotices()}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>refresh</span>
            Refresh
          </button>
          {role === "ADMIN" && (
            <button className="btn-accent" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Cancel" : "+ Post Notice"}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs - exact Stitch pill buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            style={{
              padding: "8px 20px",
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: activeFilter === tab.key ? "#2563eb" : "#ffffff",
              color: activeFilter === tab.key ? "#ffffff" : "#334155",
              boxShadow: activeFilter === tab.key ? "0 4px 14px rgba(37,99,235,0.2)" : "none",
              ...(activeFilter !== tab.key && { border: "1px solid #e2e8f0" }),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Notice Form */}
      {showAddForm && (
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", marginBottom: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "20px" }}>
            Post New Notice
          </h3>
          <form onSubmit={handleAddNotice}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>Title</label>
                  <input className="input-field" placeholder="Notice title..." value={newNotice.title} onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>Priority</label>
                  <select className="input-field" value={newNotice.priority} onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}>
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>Content</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Write your notice here..."
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  required
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
            <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
              <button type="submit" className="btn-accent">Publish Notice</button>
              <button type="button" className="btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Notices Feed - exact Stitch card grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", minHeight: "240px", opacity: 0.6 }}>
              <div style={{ width: "120px", height: "24px", background: "#f1f5f9", borderRadius: "9999px", marginBottom: "20px" }} />
              <div style={{ width: "85%", height: "20px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "12px" }} />
              <div style={{ width: "50%", height: "16px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "24px" }} />
              <div style={{ width: "100%", height: "48px", background: "#f8fafc", borderRadius: "8px" }} />
            </div>
          ))}
        </div>
      ) : filteredNotices.length === 0 ? (
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "60px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
          <p style={{ color: "#64748b", fontSize: "16px" }}>
            {searchTerm ? "No notices match your search" : "No notices posted yet"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
          {filteredNotices.map((notice, i) => {
            const config = priorityConfig[notice.priority] || priorityConfig.normal;
            return (
              <article
                key={notice.id}
                className="animate-fade-in"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "#ffffff",
                  borderRadius: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  border: "1px solid #f1f5f9",
                  overflow: "hidden",
                  borderTop: `4px solid ${config.borderColor}`,
                  transition: "all 0.3s ease",
                  animationDelay: `${i * 0.08}s`,
                  opacity: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 40px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                }}
              >
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
                  {/* Badge + Date */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        background: config.bgColor,
                        color: config.textColor,
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        borderRadius: "9999px",
                      }}
                    >
                      {config.label}
                    </span>
                    <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
                      {new Date(notice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: "8px" }}>
                    {notice.title}
                  </h3>

                  {/* Author */}
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "16px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>account_circle</span>
                    {notice.createdBy || "Admin Office"}
                  </p>

                  {/* Content snippet */}
                  <p style={{
                    color: "#64748b",
                    fontSize: "14px",
                    lineHeight: 1.7,
                    flex: 1,
                    marginBottom: "20px",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {notice.content}
                  </p>

                  {/* Footer actions */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "16px",
                    borderTop: "1px solid #f1f5f9",
                  }}>
                    <a
                      href="#"
                      style={{
                        color: "#2563eb",
                        fontWeight: 700,
                        fontSize: "14px",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Read More
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_forward</span>
                    </a>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button style={{ padding: "8px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", borderRadius: "8px", transition: "color 0.2s" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>share</span>
                      </button>
                      <button style={{ padding: "8px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", borderRadius: "8px", transition: "color 0.2s" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>bookmark</span>
                      </button>
                      {role === "ADMIN" && (
                        <button
                          onClick={() => setDeleteConfirm(notice.id)}
                          style={{ padding: "8px", border: "none", background: "transparent", cursor: "pointer", color: "#ef4444", borderRadius: "8px" }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
