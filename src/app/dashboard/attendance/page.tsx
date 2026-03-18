"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";

type ActiveTab = "lists" | "mark";

export default function AttendancePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const studentId = (session?.user as any)?.studentId;
  const facultyId = (session?.user as any)?.facultyId;

  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("lists");

  // Class lists state
  const [classLists, setClassLists] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [newList, setNewList] = useState({ name: "", description: "", subjectId: "", studentIds: [] as string[] });
  const [creatingList, setCreatingList] = useState(false);

  // Mark attendance state
  const [selectedList, setSelectedList] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [listStudents, setListStudents] = useState<any[]>([]);

  // Student view state
  const [myAttendance, setMyAttendance] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (role === "FACULTY" || role === "ADMIN") {
      fetchClassLists();
      fetchSubjects();
    }
    if (role === "STUDENT" && studentId) {
      fetchMyAttendance();
    }
  }, [role, studentId]);

  async function fetchClassLists() {
    try {
      const res = await fetch("/api/class-lists");
      if (res.ok) setClassLists(await res.json());
    } catch { /* silent */ } finally {
      setLoadingLists(false);
    }
  }

  async function fetchSubjects() {
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) setSubjects(await res.json());
    } catch { /* silent */ }
  }

  async function fetchAllStudents() {
    try {
      const res = await fetch("/api/students?limit=200");
      if (res.ok) {
        const data = await res.json();
        setAllStudents(data.students || []);
      }
    } catch { /* silent */ }
  }

  async function fetchMyAttendance() {
    setLoadingAttendance(true);
    try {
      const res = await fetch(`/api/attendance?studentId=${studentId}`);
      if (res.ok) setMyAttendance(await res.json());
    } catch { /* silent */ } finally {
      setLoadingAttendance(false);
    }
  }

  function openCreateModal() {
    setNewList({ name: "", description: "", subjectId: "", studentIds: [] });
    setStudentSearch("");
    fetchAllStudents();
    setShowCreateModal(true);
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (newList.studentIds.length === 0) {
      addToast("Select at least 1 student!", "error");
      return;
    }
    setCreatingList(true);
    try {
      const res = await fetch("/api/class-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newList.name,
          description: newList.description || undefined,
          subjectId: newList.subjectId || undefined,
          studentIds: newList.studentIds,
        }),
      });
      if (res.ok) {
        addToast("Class list created! 🎉");
        setShowCreateModal(false);
        fetchClassLists();
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to create", "error");
      }
    } catch {
      addToast("Something went wrong", "error");
    } finally {
      setCreatingList(false);
    }
  }

  async function handleDeleteList(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/class-lists/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("List deleted");
        fetchClassLists();
      }
    } catch { addToast("Failed to delete", "error"); }
  }

  function selectListForAttendance(listId: string) {
    setSelectedList(listId);
    const list = classLists.find((l) => l.id === listId);
    if (list) {
      const studs = list.students.map((s: any) => s.student);
      setListStudents(studs);
      const initial: Record<string, string> = {};
      studs.forEach((s: any) => { initial[s.id] = "PRESENT"; });
      setAttendanceRecords(initial);
      if (list.subjectId) setSelectedSubject(list.subjectId);
    }
    setActiveTab("mark");
  }

  async function handleMarkAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSubject) { addToast("Select a subject!", "error"); return; }
    setSubmitting(true);
    try {
      const records = Object.entries(attendanceRecords).map(([sid, status]) => ({ studentId: sid, status }));
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: selectedSubject, facultyId, date: attendanceDate, records }),
      });
      if (res.ok) {
        const data = await res.json();
        addToast(`✅ ${data.message}`);
      } else {
        addToast("Failed to mark attendance", "error");
      }
    } catch {
      addToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function markAll(status: string) {
    const updated: Record<string, string> = {};
    listStudents.forEach((s: any) => { updated[s.id] = status; });
    setAttendanceRecords(updated);
  }

  function toggleStudentInList(id: string) {
    setNewList((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(id)
        ? prev.studentIds.filter((s) => s !== id)
        : [...prev.studentIds, id],
    }));
  }

  const filteredStudents = allStudents.filter((s) => {
    const name = s.user?.name?.toLowerCase() || "";
    const roll = s.rollNumber?.toLowerCase() || "";
    const q = studentSearch.toLowerCase();
    return name.includes(q) || roll.includes(q);
  });

  // ============ STUDENT VIEW ============
  if (role === "STUDENT") {
    return (
      <div>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            My Attendance
          </h1>
          <p style={{ fontSize: "15px", color: "#64748b" }}>View your attendance records</p>
        </div>

        {loadingAttendance ? (
          <p style={{ color: "#64748b" }}>Loading...</p>
        ) : myAttendance ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "Total Classes", value: myAttendance.summary.total, color: "#2563eb", bg: "rgba(37,99,235,0.08)", icon: "calendar_month" },
                { label: "Present", value: myAttendance.summary.present, color: "#059669", bg: "rgba(5,150,105,0.08)", icon: "check_circle" },
                { label: "Absent", value: myAttendance.summary.absent, color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: "cancel" },
                { label: "Percentage", value: `${myAttendance.summary.percentage}%`, color: myAttendance.summary.percentage >= 75 ? "#059669" : "#ef4444", bg: myAttendance.summary.percentage >= 75 ? "rgba(5,150,105,0.08)" : "rgba(239,68,68,0.08)", icon: "percent" },
              ].map((stat, i) => (
                <div key={stat.label} className="animate-fade-in" style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "22px", color: stat.color }}>{stat.icon}</span>
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginTop: "2px" }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Date</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Subject</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttendance.records.slice(0, 50).map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontSize: "14px", color: "#0f172a" }}>{new Date(r.date).toLocaleDateString()}</td>
                      <td style={{ padding: "12px 16px", fontSize: "14px", color: "#0f172a" }}>{r.subject.name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, background: r.status === "PRESENT" ? "rgba(5,150,105,0.1)" : "rgba(239,68,68,0.1)", color: r.status === "PRESENT" ? "#059669" : "#ef4444" }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p style={{ color: "#64748b" }}>No attendance records found</p>
        )}
      </div>
    );
  }

  // ============ FACULTY / ADMIN VIEW ============
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Attendance</h1>
          <p style={{ fontSize: "15px", color: "#64748b" }}>Manage class lists and mark attendance</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "28px", background: "#f1f5f9", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
        {([
          { key: "lists" as ActiveTab, label: "My Class Lists", icon: "groups" },
          { key: "mark" as ActiveTab, label: "Mark Attendance", icon: "fact_check" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "10px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 600,
              border: "none", cursor: "pointer", transition: "all 0.2s ease",
              background: activeTab === tab.key ? "#ffffff" : "transparent",
              color: activeTab === tab.key ? "#0f172a" : "#64748b",
              boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====== TAB 1: CLASS LISTS ====== */}
      {activeTab === "lists" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>
              {classLists.length} Class {classLists.length === 1 ? "List" : "Lists"}
            </h3>
            <button className="btn-accent" onClick={openCreateModal} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
              Create New List
            </button>
          </div>

          {loadingLists ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {[1, 2].map((i) => (
                <div key={i} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", opacity: 0.5 }}>
                  <div style={{ width: "120px", height: "20px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "12px" }} />
                  <div style={{ width: "80%", height: "16px", background: "#f1f5f9", borderRadius: "6px" }} />
                </div>
              ))}
            </div>
          ) : classLists.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
              <p style={{ fontSize: "16px", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>No class lists yet</p>
              <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "16px" }}>Create your first class list to start marking attendance</p>
              <button className="btn-accent" onClick={openCreateModal}>Create First List</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {classLists.map((list, i) => (
                <div
                  key={list.id}
                  className="animate-fade-in"
                  style={{
                    background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0",
                    padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    borderTop: "4px solid #2563eb", animationDelay: `${i * 0.08}s`, opacity: 0,
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 40px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>{list.name}</h4>
                      {list.description && <p style={{ fontSize: "12px", color: "#94a3b8" }}>{list.description}</p>}
                    </div>
                    <button onClick={() => handleDeleteList(list.id, list.name)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                    </button>
                  </div>

                  {list.subject && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#2563eb" }}>book</span>
                      <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>{list.subject.code} - {list.subject.name}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#64748b" }}>group</span>
                    <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>{list.students.length} students</span>
                  </div>

                  {/* Student avatars preview */}
                  <div style={{ display: "flex", marginBottom: "16px" }}>
                    {list.students.slice(0, 5).map((s: any, idx: number) => (
                      <div key={s.id} style={{
                        width: "30px", height: "30px", borderRadius: "50%",
                        background: `hsl(${(idx * 60) % 360}, 70%, 60%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: 700, color: "#fff",
                        border: "2px solid #fff", marginLeft: idx > 0 ? "-8px" : "0",
                        zIndex: 10 - idx,
                      }}>
                        {s.student?.user?.name?.[0]?.toUpperCase() || "S"}
                      </div>
                    ))}
                    {list.students.length > 5 && (
                      <div style={{
                        width: "30px", height: "30px", borderRadius: "50%",
                        background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", fontWeight: 700, color: "#64748b",
                        border: "2px solid #fff", marginLeft: "-8px",
                      }}>
                        +{list.students.length - 5}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => selectListForAttendance(list.id)}
                    className="btn-primary"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>fact_check</span>
                    Mark Attendance
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====== TAB 2: MARK ATTENDANCE ====== */}
      {activeTab === "mark" && (
        <div>
          {classLists.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "60px", textAlign: "center" }}>
              <p style={{ color: "#64748b" }}>Create a class list first to mark attendance</p>
              <button className="btn-accent" onClick={() => { setActiveTab("lists"); openCreateModal(); }} style={{ marginTop: "12px" }}>
                Create Class List
              </button>
            </div>
          ) : (
            <form onSubmit={handleMarkAttendance}>
              {/* Selection row */}
              <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>Class List *</label>
                    <select className="input-field" value={selectedList} onChange={(e) => selectListForAttendance(e.target.value)}>
                      <option value="">Choose Class List</option>
                      {classLists.map((l) => (
                        <option key={l.id} value={l.id}>{l.name} ({l.students.length} students)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>Subject *</label>
                    <select className="input-field" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                      <option value="">Choose Subject</option>
                      {subjects.map((sub: any) => (
                        <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>Date</label>
                    <input type="date" className="input-field" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Student attendance table */}
              {selectedList && listStudents.length > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>{listStudents.length} students loaded</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="button" onClick={() => markAll("PRESENT")} style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: "rgba(5,150,105,0.1)", color: "#059669" }}>
                        ✅ Mark All Present
                      </button>
                      <button type="button" onClick={() => markAll("ABSENT")} style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                        ❌ Mark All Absent
                      </button>
                    </div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "20px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Roll No.</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Student Name</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Dept</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listStudents.map((student: any) => (
                          <tr key={student.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }}>
                            <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{student.rollNumber}</td>
                            <td style={{ padding: "12px 16px", fontSize: "14px", color: "#0f172a" }}>{student.user?.name}</td>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748b" }}>{student.department?.code || "—"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {(["PRESENT", "ABSENT", "LATE"] as const).map((status) => {
                                  const isActive = attendanceRecords[student.id] === status;
                                  const colors: Record<string, { bg: string; active: string }> = {
                                    PRESENT: { bg: "rgba(5,150,105,0.08)", active: "#059669" },
                                    ABSENT: { bg: "rgba(239,68,68,0.08)", active: "#ef4444" },
                                    LATE: { bg: "rgba(245,158,11,0.08)", active: "#f59e0b" },
                                  };
                                  return (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() => setAttendanceRecords({ ...attendanceRecords, [student.id]: status })}
                                      style={{
                                        padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                                        border: isActive ? "none" : "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.2s",
                                        background: isActive ? colors[status].active : "#fff",
                                        color: isActive ? "#fff" : "#64748b",
                                      }}
                                    >
                                      {status}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="submit" className="btn-accent" disabled={submitting} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                    {submitting ? "Submitting..." : "Submit Attendance"}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      )}

      {/* ====== CREATE MODAL ====== */}
      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", width: "680px", maxHeight: "85vh", overflow: "auto", padding: "32px", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>Create Class List</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: "#94a3b8" }}>✕</button>
            </div>
            <form onSubmit={handleCreateList}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>List Name *</label>
                  <input className="input-field" placeholder="e.g. DSA Batch A" value={newList.name} onChange={(e) => setNewList({ ...newList, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>Subject (optional)</label>
                  <select className="input-field" value={newList.subjectId} onChange={(e) => setNewList({ ...newList, subjectId: e.target.value })}>
                    <option value="">None</option>
                    {subjects.map((sub: any) => (<option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>Description (optional)</label>
                <input className="input-field" placeholder="e.g. Semester 4 lab batch" value={newList.description} onChange={(e) => setNewList({ ...newList, description: e.target.value })} />
              </div>

              {/* Student picker */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
                    Select Students * <span style={{ color: "#2563eb" }}>({newList.studentIds.length} selected)</span>
                  </label>
                  {allStudents.length > 0 && (
                    <button type="button" onClick={() => {
                      if (newList.studentIds.length === allStudents.length) {
                        setNewList({ ...newList, studentIds: [] });
                      } else {
                        setNewList({ ...newList, studentIds: allStudents.map((s) => s.id) });
                      }
                    }} style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>
                      {newList.studentIds.length === allStudents.length ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>
                <input
                  className="input-field"
                  placeholder="🔍 Search by name or roll number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ marginBottom: "10px" }}
                />
                <div style={{ maxHeight: "280px", overflow: "auto", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                  {filteredStudents.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>No students found</div>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSelected = newList.studentIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleStudentInList(s.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            padding: "10px 14px", cursor: "pointer",
                            borderBottom: "1px solid #f1f5f9",
                            background: isSelected ? "rgba(37,99,235,0.04)" : "#fff",
                            transition: "background 0.15s",
                          }}
                        >
                          <div style={{
                            width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
                            border: isSelected ? "none" : "2px solid #cbd5e1",
                            background: isSelected ? "#2563eb" : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s",
                          }}>
                            {isSelected && <span style={{ color: "#fff", fontSize: "14px", fontWeight: 700 }}>✓</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{s.user?.name}</div>
                            <div style={{ fontSize: "12px", color: "#94a3b8" }}>{s.rollNumber} • {s.department?.code || "—"}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-primary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-accent" disabled={creatingList} style={{ flex: 1 }}>
                  {creatingList ? "Creating..." : "Create List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
