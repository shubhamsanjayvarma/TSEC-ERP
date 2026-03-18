"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";

type FeedbackType = "LECTURE" | "PRACTICAL" | "EXPERT_GUEST";

const typeLabels: Record<FeedbackType, { title: string; subtitle: string; icon: string }> = {
  LECTURE: {
    title: "Lecture Feedback",
    subtitle: "Share your experience about lectures and teaching quality",
    icon: "school",
  },
  PRACTICAL: {
    title: "Practical Feedback",
    subtitle: "Rate your lab sessions and practical learning experience",
    icon: "science",
  },
  EXPERT_GUEST: {
    title: "Expert / Guest Lecture Feedback",
    subtitle: "Evaluate guest lectures and expert sessions",
    icon: "person_pin",
  },
};

export default function FeedbackForm({ feedbackType }: { feedbackType: FeedbackType }) {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState<any[]>([]);
  const [fetchingFeedbacks, setFetchingFeedbacks] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [form, setForm] = useState({
    subjectName: "",
    facultyName: "",
    rating: 0,
    comment: "",
    anonymous: true,
  });

  const meta = typeLabels[feedbackType];

  useEffect(() => {
    fetchMyFeedbacks();
  }, []);

  async function fetchMyFeedbacks() {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const all = await res.json();
        setMyFeedbacks(all.filter((f: any) => f.type === feedbackType));
      }
    } catch {
      // silent
    } finally {
      setFetchingFeedbacks(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.rating === 0) {
      addToast("Please select a rating", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: feedbackType }),
      });
      if (res.ok) {
        addToast("Feedback submitted successfully! 🎉");
        setForm({ subjectName: "", facultyName: "", rating: 0, comment: "", anonymous: true });
        setHoveredStar(0);
        fetchMyFeedbacks();
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to submit", "error");
      }
    } catch {
      addToast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  }

  const starDisplay = hoveredStar || form.rating;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "32px", color: "#2563eb" }}
          >
            {meta.icon}
          </span>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            {meta.title}
          </h1>
        </div>
        <p style={{ fontSize: "15px", color: "#64748b", marginLeft: "44px" }}>{meta.subtitle}</p>
      </div>

      {/* Feedback Form Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "32px",
          marginBottom: "32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#2563eb" }}>edit_note</span>
          Submit New Feedback
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>
                Subject Name *
              </label>
              <input
                className="input-field"
                placeholder="e.g. Data Structures, DBMS..."
                value={form.subjectName}
                onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>
                Faculty Name *
              </label>
              <input
                className="input-field"
                placeholder="e.g. Prof. Amit Patel..."
                value={form.facultyName}
                onChange={(e) => setForm({ ...form, facultyName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Star Rating */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "10px", fontWeight: 500 }}>
              Rating *
            </label>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm({ ...form, rating: star })}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "36px",
                    color: star <= starDisplay ? "#f59e0b" : "#e2e8f0",
                    transition: "all 0.15s ease",
                    transform: star <= starDisplay ? "scale(1.1)" : "scale(1)",
                    padding: "2px",
                  }}
                >
                  ★
                </button>
              ))}
              <span style={{
                fontSize: "14px",
                color: "#64748b",
                marginLeft: "12px",
                fontWeight: 500,
              }}>
                {form.rating > 0 ? `${form.rating}/5` : "Select rating"}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: 500 }}>
              Your Feedback *
            </label>
            <textarea
              className="input-field"
              rows={4}
              placeholder="Share your detailed feedback here..."
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              required
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Anonymous Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "24px",
              padding: "12px 16px",
              background: "#f8fafc",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              onClick={() => setForm({ ...form, anonymous: !form.anonymous })}
              style={{
                width: "44px",
                height: "24px",
                borderRadius: "12px",
                background: form.anonymous ? "#2563eb" : "#cbd5e1",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  position: "absolute",
                  top: "2px",
                  left: form.anonymous ? "22px" : "2px",
                  transition: "left 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                Submit Anonymously
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                {form.anonymous ? "Your identity will be hidden from faculty" : "Your name will be visible to admin & faculty"}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>

      {/* Previous Submissions */}
      <div>
        <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#64748b" }}>history</span>
          Your Previous Submissions
        </h3>

        {fetchingFeedbacks ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", opacity: 0.6 }}>
                <div style={{ width: "120px", height: "20px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "12px" }} />
                <div style={{ width: "80%", height: "16px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "8px" }} />
                <div style={{ width: "60%", height: "14px", background: "#f1f5f9", borderRadius: "6px" }} />
              </div>
            ))}
          </div>
        ) : myFeedbacks.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>📝</div>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>No feedback submitted yet</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {myFeedbacks.map((fb, i) => (
              <div
                key={fb.id}
                className="animate-fade-in"
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  border: "1px solid #f1f5f9",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  borderTop: "3px solid #2563eb",
                  animationDelay: `${i * 0.08}s`,
                  opacity: 0,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} style={{ fontSize: "16px", color: s <= fb.rating ? "#f59e0b" : "#e2e8f0" }}>★</span>
                    ))}
                  </div>
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                    {new Date(fb.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>
                  {fb.subjectName}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>person</span>
                  {fb.facultyName}
                </div>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>
                  {fb.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
