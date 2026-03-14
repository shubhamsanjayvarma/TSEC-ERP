"use client";

import { useEffect, useState } from "react";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_subjects() {
      try {
        const res = await fetch("/api/subjects");
        if (res.ok) setSubjects(await res.json());
      } catch {} finally { setLoading(false); }
    }
    fetch_subjects();
  }, []);

  // Group by semester
  const grouped: Record<number, any[]> = {};
  subjects.forEach((s) => {
    if (!grouped[s.semester]) grouped[s.semester] = [];
    grouped[s.semester].push(s);
  });

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>Subjects</h1>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>Academic subjects by semester</p>
      </div>

      {loading ? (
        <p style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>Loading...</p>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([semester, subs]) => (
            <div key={semester} style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#94a3b8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Semester {semester}
              </h2>
              <div className="glass-card" style={{ overflow: "hidden" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Subject Name</th>
                      <th>Credits</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((s: any) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600, color: "#60a5fa" }}>{s.code}</td>
                        <td style={{ color: "#e2e8f0" }}>{s.name}</td>
                        <td>
                          <span className="badge badge-warning">{s.credits} credits</span>
                        </td>
                        <td>
                          <span className="badge badge-info">{s.department?.name}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
      )}
    </div>
  );
}
