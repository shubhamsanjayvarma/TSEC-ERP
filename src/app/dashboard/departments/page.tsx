"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function DepartmentsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", code: "" });

  useEffect(() => { fetchDepartments(); }, []);

  async function fetchDepartments() {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      if (res.ok) setDepartments(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDept),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewDept({ name: "", code: "" });
        fetchDepartments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed");
      }
    } catch { alert("Something went wrong"); }
  }

  const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>Departments</h1>
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>Academic departments</p>
        </div>
        {role === "ADMIN" && (
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "+ Add Department"}
          </button>
        )}
      </div>

      {showAdd && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <form onSubmit={handleAdd} style={{ display: "flex", gap: "16px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Department Name</label>
              <input className="input-field" placeholder="Data Science" value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} required />
            </div>
            <div style={{ width: "150px" }}>
              <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Code</label>
              <input className="input-field" placeholder="DS" value={newDept.code} onChange={(e) => setNewDept({ ...newDept, code: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary">Add</button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>Loading...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {departments.map((dept, i) => (
            <div key={dept.id} className="glass-card" style={{ padding: "28px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px",
                background: `${colors[i % colors.length]}20`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "24px", fontWeight: 800, color: colors[i % colors.length],
                marginBottom: "16px",
              }}>
                {dept.code.slice(0, 2)}
              </div>
              <div style={{ fontSize: "17px", fontWeight: 600, color: "#f1f5f9", marginBottom: "4px" }}>{dept.name}</div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>Code: {dept.code}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
