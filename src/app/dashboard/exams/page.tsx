"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function ExamsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showUploadMarks, setShowUploadMarks] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");

  const [newExam, setNewExam] = useState({
    name: "",
    type: "INTERNAL",
    date: new Date().toISOString().split("T")[0],
    maxMarks: 100,
    subjectId: "",
  });

  useEffect(() => {
    fetchExams();
    fetchSubjects();
  }, []);

  async function fetchExams() {
    setLoading(true);
    try {
      const res = await fetch("/api/exams");
      if (res.ok) setExams(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function fetchSubjects() {
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) setSubjects(await res.json());
    } catch {}
  }

  async function fetchStudents() {
    try {
      const res = await fetch("/api/students?limit=200");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch {}
  }

  async function handleCreateExam(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExam),
      });
      if (res.ok) {
        setShowCreateExam(false);
        setNewExam({ name: "", type: "INTERNAL", date: new Date().toISOString().split("T")[0], maxMarks: 100, subjectId: "" });
        fetchExams();
      }
    } catch { alert("Failed to create exam"); }
  }

  async function handleUploadMarks(examId: string) {
    setMessage("");
    const marks = Object.entries(marksData)
      .filter(([_, v]) => v > 0)
      .map(([studentId, marksObtained]) => ({ studentId, marksObtained }));

    if (marks.length === 0) { setMessage("❌ Enter marks for at least one student"); return; }

    try {
      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, marks }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`✅ ${data.message}`);
        setShowUploadMarks(null);
        setMarksData({});
        fetchExams();
      }
    } catch { setMessage("❌ Failed to upload marks"); }
  }

  function openUploadMarks(examId: string) {
    setShowUploadMarks(examId);
    setMarksData({});
    fetchStudents();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>
            {role === "STUDENT" ? "My Results" : "Exams & Results"}
          </h1>
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>
            {role === "STUDENT" ? "View your exam results" : "Manage exams and upload marks"}
          </p>
        </div>
        {(role === "ADMIN" || role === "FACULTY") && (
          <button className="btn-primary" onClick={() => setShowCreateExam(!showCreateExam)}>
            {showCreateExam ? "Cancel" : "+ Create Exam"}
          </button>
        )}
      </div>

      {message && (
        <div className="glass-card" style={{ padding: "16px", marginBottom: "16px", borderLeft: message.startsWith("✅") ? "3px solid #10b981" : "3px solid #ef4444" }}>
          {message}
        </div>
      )}

      {/* Create Exam Form */}
      {showCreateExam && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9", marginBottom: "16px" }}>Create New Exam</h3>
          <form onSubmit={handleCreateExam}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Exam Name</label>
                <input className="input-field" placeholder="Mid Semester Exam" value={newExam.name} onChange={(e) => setNewExam({ ...newExam, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Subject</label>
                <select className="input-field" value={newExam.subjectId} onChange={(e) => setNewExam({ ...newExam, subjectId: e.target.value })} required>
                  <option value="">Select Subject</option>
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Type</label>
                <select className="input-field" value={newExam.type} onChange={(e) => setNewExam({ ...newExam, type: e.target.value })}>
                  <option value="INTERNAL">Internal</option>
                  <option value="EXTERNAL">External</option>
                  <option value="PRACTICAL">Practical</option>
                  <option value="ASSIGNMENT">Assignment</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Date</label>
                <input type="date" className="input-field" value={newExam.date} onChange={(e) => setNewExam({ ...newExam, date: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Max Marks</label>
                <input type="number" className="input-field" value={newExam.maxMarks} onChange={(e) => setNewExam({ ...newExam, maxMarks: parseInt(e.target.value) })} />
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <button type="submit" className="btn-primary">Create Exam</button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Marks Modal */}
      {showUploadMarks && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9", marginBottom: "16px" }}>Upload Marks</h3>
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Roll No.</th><th>Name</th><th>Marks</th></tr>
              </thead>
              <tbody>
                {students.map((s: any) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.rollNumber}</td>
                    <td>{s.user.name}</td>
                    <td>
                      <input type="number" className="input-field" style={{ width: "100px" }} placeholder="0"
                        min={0} max={100}
                        value={marksData[s.id] || ""}
                        onChange={(e) => setMarksData({ ...marksData, [s.id]: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
            <button className="btn-primary" onClick={() => handleUploadMarks(showUploadMarks)}>Submit Marks</button>
            <button className="btn-ghost" onClick={() => { setShowUploadMarks(null); setMarksData({}); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Exams List */}
      {loading ? (
        <p style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>Loading exams...</p>
      ) : exams.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "#64748b" }}>No exams created yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {exams.map((exam) => (
            <div key={exam.id} className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#f1f5f9" }}>{exam.name}</h3>
                  <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                    {exam.subject.code} - {exam.subject.name} | Max: {exam.maxMarks} | {new Date(exam.date).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className={`badge ${exam.type === "INTERNAL" ? "badge-info" : exam.type === "EXTERNAL" ? "badge-warning" : "badge-success"}`}>
                    {exam.type}
                  </span>
                  {(role === "ADMIN" || role === "FACULTY") && (
                    <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: "12px" }} onClick={() => openUploadMarks(exam.id)}>
                      Upload Marks
                    </button>
                  )}
                </div>
              </div>

              {/* Results */}
              {exam.marks.length > 0 && (
                <div style={{ overflow: "hidden", borderRadius: "10px", border: "1px solid #1e293b" }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Student</th><th>Marks</th><th>Grade</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {exam.marks.map((m: any) => (
                        <tr key={m.id}>
                          <td>{m.student.user.name}</td>
                          <td style={{ fontWeight: 600 }}>{m.marksObtained} / {exam.maxMarks}</td>
                          <td>
                            <span style={{
                              padding: "4px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 700,
                              background: m.grade === "O" ? "rgba(16,185,129,0.15)" : m.grade === "A" ? "rgba(59,130,246,0.15)" : m.grade === "F" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                              color: m.grade === "O" ? "#34d399" : m.grade === "A" ? "#60a5fa" : m.grade === "F" ? "#f87171" : "#fbbf24",
                            }}>
                              {m.grade}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${m.grade !== "F" ? "badge-success" : "badge-danger"}`}>
                              {m.grade !== "F" ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
