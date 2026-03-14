"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/components/Toast";
import { SkeletonTable } from "@/components/Skeleton";

interface Student {
  id: string;
  rollNumber: string;
  batch: string;
  semester: number;
  user: { name: string; email: string; status: string };
  department: { name: string; code: string };
}

export default function StudentsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const { addToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [newStudent, setNewStudent] = useState({
    name: "", email: "", rollNumber: "", departmentId: "", batch: "2024", semester: 1,
  });

  useEffect(() => { fetchStudents(); }, [page, debouncedSearch]);
  useEffect(() => { fetchDepartments(); }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?page=${page}&search=${debouncedSearch}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTotalPages(data.pagination.totalPages);
      }
    } catch { addToast("Failed to fetch students", "error"); }
    finally { setLoading(false); }
  }

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) setDepartments(await res.json());
    } catch {}
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewStudent({ name: "", email: "", rollNumber: "", departmentId: "", batch: "2024", semester: 1 });
        addToast("Student added successfully");
        fetchStudents();
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to add student", "error");
      }
    } catch { addToast("Something went wrong", "error"); }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Student deleted successfully");
        setDeleteConfirm(null);
        fetchStudents();
      } else { addToast("Failed to delete student", "error"); }
    } catch { addToast("Something went wrong", "error"); }
  }

  async function handleToggleStatus(student: Student) {
    const newStatus = student.user.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        addToast(`Student ${newStatus === "active" ? "activated" : "deactivated"}`);
        fetchStudents();
      }
    } catch { addToast("Failed to update status", "error"); }
  }

  return (
    <div>
      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="confirm-overlay">
          <div className="glass-card" style={{ padding: "32px", maxWidth: "400px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#f1f5f9", marginBottom: "8px" }}>Delete Student?</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px" }}>This action cannot be undone. All related attendance and marks will be deleted.</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)} style={{ padding: "10px 24px", borderRadius: "10px", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>Students</h1>
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>Manage student records</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {role === "ADMIN" && (
            <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Cancel" : "+ Add Student"}
            </button>
          )}
        </div>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9", marginBottom: "16px" }}>Add New Student</h3>
          <form onSubmit={handleAddStudent}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Full Name</label>
                <input className="input-field" placeholder="John Doe" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Email</label>
                <input className="input-field" type="email" placeholder="student@tsec.edu" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Roll Number</label>
                <input className="input-field" placeholder="CE2024001" value={newStudent.rollNumber} onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Department</label>
                <select className="input-field" value={newStudent.departmentId} onChange={(e) => setNewStudent({ ...newStudent, departmentId: e.target.value })} required>
                  <option value="">Select Department</option>
                  {departments.map((dept: any) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Batch</label>
                <input className="input-field" placeholder="2024" value={newStudent.batch} onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Semester</label>
                <select className="input-field" value={newStudent.semester} onChange={(e) => setNewStudent({ ...newStudent, semester: parseInt(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => <option key={sem} value={sem}>Semester {sem}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
              <button type="submit" className="btn-primary">Add Student</button>
              <button type="button" className="btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: "16px" }}>
        <input className="input-field" placeholder="🔍 Search by name or roll number..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: "400px" }} id="student-search" />
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={8} />
      ) : (
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr><th>Roll No.</th><th>Name</th><th>Email</th><th>Department</th><th>Batch</th><th>Semester</th><th>Status</th>{role === "ADMIN" && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No students found</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 600, color: "#e2e8f0" }}>{student.rollNumber}</td>
                    <td>{student.user.name}</td>
                    <td style={{ color: "#94a3b8" }}>{student.user.email}</td>
                    <td><span className="badge badge-info">{student.department.code}</span></td>
                    <td>{student.batch}</td>
                    <td>Sem {student.semester}</td>
                    <td>
                      <span
                        className={`badge ${student.user.status === "active" ? "badge-success" : "badge-danger"}`}
                        style={{ cursor: role === "ADMIN" ? "pointer" : "default" }}
                        onClick={() => role === "ADMIN" && handleToggleStatus(student)}
                        title={role === "ADMIN" ? "Click to toggle status" : ""}
                      >
                        {student.user.status}
                      </span>
                    </td>
                    {role === "ADMIN" && (
                      <td>
                        <button
                          onClick={() => setDeleteConfirm(student.id)}
                          style={{ padding: "4px 12px", borderRadius: "6px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "12px", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: "8px 16px", opacity: page <= 1 ? 0.5 : 1 }}>Previous</button>
          <span style={{ display: "flex", alignItems: "center", padding: "0 16px", fontSize: "13px", color: "#94a3b8" }}>Page {page} of {totalPages}</span>
          <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: "8px 16px", opacity: page >= totalPages ? 0.5 : 1 }}>Next</button>
        </div>
      )}
    </div>
  );
}
