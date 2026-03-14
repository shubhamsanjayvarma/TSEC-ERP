"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function AttendancePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const studentId = (session?.user as any)?.studentId;
  const facultyId = (session?.user as any)?.facultyId;

  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Student view
  const [myAttendance, setMyAttendance] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (role === "FACULTY" || role === "ADMIN") {
      fetchSubjects();
    }
    if (role === "STUDENT" && studentId) {
      fetchMyAttendance();
    }
  }, [role, studentId]);

  async function fetchSubjects() {
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  }

  async function fetchStudentsForSubject(subjectId: string) {
    try {
      const res = await fetch(`/api/students?limit=200`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        const initial: Record<string, string> = {};
        data.students.forEach((s: any) => {
          initial[s.id] = "PRESENT";
        });
        setAttendanceRecords(initial);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  }

  async function fetchMyAttendance() {
    setLoadingAttendance(true);
    try {
      const res = await fetch(`/api/attendance?studentId=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setMyAttendance(data);
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoadingAttendance(false);
    }
  }

  async function handleMarkAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSubject) return;
    setSubmitting(true);
    setMessage("");

    try {
      const records = Object.entries(attendanceRecords).map(
        ([studentId, status]) => ({ studentId, status })
      );

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubject,
          facultyId,
          date: attendanceDate,
          records,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage("❌ Failed to mark attendance");
      }
    } catch {
      setMessage("❌ Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // Student View
  if (role === "STUDENT") {
    return (
      <div>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>
            My Attendance
          </h1>
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>
            View your attendance records
          </p>
        </div>

        {loadingAttendance ? (
          <p style={{ color: "#64748b" }}>Loading...</p>
        ) : myAttendance ? (
          <>
            {/* Summary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {[
                { label: "Total Classes", value: myAttendance.summary.total, color: "#3b82f6" },
                { label: "Present", value: myAttendance.summary.present, color: "#10b981" },
                { label: "Absent", value: myAttendance.summary.absent, color: "#ef4444" },
                { label: "Percentage", value: `${myAttendance.summary.percentage}%`, color: myAttendance.summary.percentage >= 75 ? "#10b981" : "#ef4444" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card" style={{ padding: "20px" }}>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Records table */}
            <div className="glass-card" style={{ overflow: "hidden" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttendance.records.slice(0, 50).map((record: any) => (
                    <tr key={record.id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{record.subject.name}</td>
                      <td>
                        <span className={`badge ${record.status === "PRESENT" ? "badge-success" : "badge-danger"}`}>
                          {record.status}
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

  // Faculty / Admin View
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>
          Mark Attendance
        </h1>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>
          Select subject and mark student attendance
        </p>
      </div>

      {message && (
        <div
          className="glass-card"
          style={{
            padding: "16px",
            marginBottom: "16px",
            borderLeft: message.startsWith("✅")
              ? "3px solid #10b981"
              : "3px solid #ef4444",
          }}
        >
          {message}
        </div>
      )}

      {/* Subject & Date Selection */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
              Select Subject
            </label>
            <select
              className="input-field"
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                if (e.target.value) fetchStudentsForSubject(e.target.value);
              }}
            >
              <option value="">Choose Subject</option>
              {subjects.map((sub: any) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} - {sub.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
              Date
            </label>
            <input
              type="date"
              className="input-field"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Attendance Marking */}
      {selectedSubject && students.length > 0 && (
        <form onSubmit={handleMarkAttendance}>
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 600 }}>{student.rollNumber}</td>
                    <td>{student.user.name}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {(["PRESENT", "ABSENT", "LATE"] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              setAttendanceRecords({
                                ...attendanceRecords,
                                [student.id]: status,
                              })
                            }
                            style={{
                              padding: "6px 14px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 600,
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              background:
                                attendanceRecords[student.id] === status
                                  ? status === "PRESENT"
                                    ? "#10b981"
                                    : status === "ABSENT"
                                    ? "#ef4444"
                                    : "#f59e0b"
                                  : "rgba(51,65,85,0.5)",
                              color:
                                attendanceRecords[student.id] === status
                                  ? "white"
                                  : "#94a3b8",
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Attendance"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
