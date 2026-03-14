"use client";

export function SkeletonCard({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: "20px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-card"
          style={{ padding: "24px", overflow: "hidden", position: "relative" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <SkeletonBox width="48px" height="48px" radius="12px" />
          </div>
          <SkeletonBox width="60px" height="32px" radius="6px" />
          <div style={{ marginTop: "8px" }}>
            <SkeletonBox width="100px" height="14px" radius="4px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass-card" style={{ overflow: "hidden" }}>
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><SkeletonBox width="80px" height="12px" radius="4px" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j}><SkeletonBox width={j === 0 ? "100px" : "120px"} height="14px" radius="4px" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonFacultyCards({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
            <SkeletonBox width="50px" height="50px" radius="14px" />
            <div>
              <SkeletonBox width="120px" height="15px" radius="4px" />
              <div style={{ marginTop: "6px" }}><SkeletonBox width="60px" height="12px" radius="4px" /></div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <SkeletonBox width="100%" height="13px" radius="4px" />
            <SkeletonBox width="100%" height="13px" radius="4px" />
            <SkeletonBox width="100%" height="13px" radius="4px" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonBox({
  width, height, radius = "4px",
}: {
  width: string; height: string; radius?: string;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite linear",
      }}
    />
  );
}
