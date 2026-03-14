"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const user = session?.user as any;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("Passwords don't match", "error");
      return;
    }
    if (newPassword.length < 6) {
      addToast("Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        addToast("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to change password", "error");
      }
    } catch { addToast("Something went wrong", "error"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>Profile</h1>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>Manage your account settings</p>
      </div>

      {/* User info card */}
      <div className="glass-card" style={{ padding: "28px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "16px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", fontWeight: 700, color: "white",
          }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#f1f5f9" }}>{user?.name}</div>
            <div style={{ fontSize: "14px", color: "#94a3b8" }}>{user?.email}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(15,23,42,0.5)" }}>
            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Role</div>
            <span className="badge badge-info">{user?.role}</span>
          </div>
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(15,23,42,0.5)" }}>
            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Department</div>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#e2e8f0" }}>{user?.department || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="glass-card" style={{ padding: "28px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9", marginBottom: "20px" }}>🔒 Change Password</h3>
        <form onSubmit={handleChangePassword}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Current Password</label>
              <input className="input-field" type="password" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>New Password</label>
              <input className="input-field" type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Confirm New Password</label>
              <input className="input-field" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "20px", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
