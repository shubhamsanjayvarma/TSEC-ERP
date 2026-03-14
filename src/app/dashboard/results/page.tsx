"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function ResultsPage() {
  const { data: session } = useSession();
  const studentId = (session?.user as any)?.studentId;
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) fetchResults();
  }, [studentId]);

  async function fetchResults() {
    try {
      const res = await fetch(`/api/marks?studentId=${studentId}`);
      if (res.ok) setResults(await res.json());
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const totalMarks = results.reduce((acc, r) => acc + r.marksObtained, 0);
  const totalMaxMarks = results.reduce((acc, r) => acc + r.exam.maxMarks, 0);
  const avgPercentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
  const passCount = results.filter((r) => r.grade !== "F").length;

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>My Results</h1>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>View your examination results</p>
      </div>

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading results...</p>
      ) : results.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "#64748b" }}>No results available yet</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Total Exams", value: results.length, color: "#3b82f6" },
              { label: "Passed", value: passCount, color: "#10b981" },
              { label: "Failed", value: results.length - passCount, color: "#ef4444" },
              { label: "Avg. Percentage", value: `${avgPercentage}%`, color: avgPercentage >= 60 ? "#10b981" : "#f59e0b" },
            ].map((s) => (
              <div key={s.label} className="glass-card" style={{ padding: "20px" }}>
                <div style={{ fontSize: "28px", fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Results table */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r: any) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500, color: "#e2e8f0" }}>{r.exam.name}</td>
                    <td>
                      <span style={{ color: "#94a3b8" }}>{r.exam.subject.code}</span>
                      {" "}{r.exam.subject.name}
                    </td>
                    <td><span className="badge badge-info">{r.exam.type}</span></td>
                    <td style={{ fontWeight: 600 }}>{r.marksObtained} / {r.exam.maxMarks}</td>
                    <td>
                      <span style={{
                        padding: "4px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 700,
                        background: r.grade === "O" ? "rgba(16,185,129,0.15)" : r.grade === "A" ? "rgba(59,130,246,0.15)" : r.grade === "F" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                        color: r.grade === "O" ? "#34d399" : r.grade === "A" ? "#60a5fa" : r.grade === "F" ? "#f87171" : "#fbbf24",
                      }}>
                        {r.grade}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.grade !== "F" ? "badge-success" : "badge-danger"}`}>
                        {r.grade !== "F" ? "PASS" : "FAIL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
