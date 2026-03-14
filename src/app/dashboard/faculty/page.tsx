"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { SkeletonFacultyCards } from "@/components/Skeleton";

interface FacultyMember {
  id: string;
  employeeId: string;
  designation: string;
  user: { name: string; email: string; status: string };
  department: { name: string; code: string };
  subjects: Array<{ subject: { name: string; code: string } }>;
}

export default function FacultyPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const { addToast } = useToast();
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newFaculty, setNewFaculty] = useState({
    name: "", email: "", employeeId: "", departmentId: "", designation: "Assistant Professor",
  });

  useEffect(() => { fetchFaculty(); fetchDepartments(); }, [search]);

  async function fetchFaculty() {
    setLoading(true);
    try {
      const res = await fetch(`/api/faculty?search=${search}`);
      if (res.ok) setFaculty(await res.json());
    } catch { addToast("Failed to fetch faculty", "error"); }
    finally { setLoading(false); }
  }

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) setDepartments(await res.json());
    } catch {}
  }

  async function handleAddFaculty(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFaculty),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewFaculty({ name: "", email: "", employeeId: "", departmentId: "", designation: "Assistant Professor" });
        addToast("Faculty added successfully");
        fetchFaculty();
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to add faculty", "error");
      }
    } catch { addToast("Something went wrong", "error"); }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/faculty/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Faculty deleted successfully");
        setDeleteConfirm(null);
        fetchFaculty();
      } else { addToast("Failed to delete faculty", "error"); }
    } catch { addToast("Something went wrong", "error"); }
  }

  return (
    <div>
      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="confirm-overlay">
          <div className="glass-card" style={{ padding: "32px", maxWidth: "400px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#f1f5f9", marginBottom: "8px" }}>Delete Faculty?</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px" }}>This will remove the faculty member and all their records.</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)} style={{ padding: "10px 24px", borderRadius: "10px", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>Faculty</h1>
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>Manage faculty members</p>
        </div>
        {role === "ADMIN" && (
          <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "+ Add Faculty"}
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9", marginBottom: "16px" }}>Add New Faculty</h3>
          <form onSubmit={handleAddFaculty}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Full Name</label>
                <input className="input-field" placeholder="Dr. John Doe" value={newFaculty.name} onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Email</label>
                <input className="input-field" type="email" placeholder="faculty@tsec.edu" value={newFaculty.email} onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Employee ID</label>
                <input className="input-field" placeholder="FAC010" value={newFaculty.employeeId} onChange={(e) => setNewFaculty({ ...newFaculty, employeeId: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Department</label>
                <select className="input-field" value={newFaculty.departmentId} onChange={(e) => setNewFaculty({ ...newFaculty, departmentId: e.target.value })} required>
                  <option value="">Select Department</option>
                  {departments.map((dept: any) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Designation</label>
                <select className="input-field" value={newFaculty.designation} onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}>
                  <option>Assistant Professor</option>
                  <option>Associate Professor</option>
                  <option>Professor</option>
                  <option>HOD</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
              <button type="submit" className="btn-primary">Add Faculty</button>
              <button type="button" className="btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <input className="input-field" placeholder="🔍 Search by name or employee ID..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: "400px" }} />
      </div>

      {loading ? (
        <SkeletonFacultyCards count={6} />
      ) : faculty.length === 0 ? (
        <p style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>No faculty found</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {faculty.map((f) => (
            <div key={f.id} className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                <div style={{
                  width: "50px", height: "50px", borderRadius: "14px",
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", fontWeight: 700, color: "white",
                }}>
                  {f.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9" }}>{f.user.name}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{f.employeeId}</div>
                </div>
                {role === "ADMIN" && (
                  <button
                    onClick={() => setDeleteConfirm(f.id)}
                    style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(239,68,68,0.1)", border: "none", color: "#f87171", fontSize: "14px", cursor: "pointer" }}
                    title="Delete faculty"
                  >
                    🗑️
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Email</span>
                  <span style={{ color: "#94a3b8" }}>{f.user.email}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Department</span>
                  <span className="badge badge-info">{f.department.code}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Designation</span>
                  <span style={{ color: "#e2e8f0" }}>{f.designation}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Status</span>
                  <span className={`badge ${f.user.status === "active" ? "badge-success" : "badge-danger"}`}>{f.user.status}</span>
                </div>
              </div>

              {f.subjects.length > 0 && (
                <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>ASSIGNED SUBJECTS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {f.subjects.map((s, i) => (
                      <span key={i} style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 500, background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>
                        {s.subject.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
