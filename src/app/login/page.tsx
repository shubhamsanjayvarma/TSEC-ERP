"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background orbs */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          animation: "pulseGlow 4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          animation: "pulseGlow 5s ease-in-out infinite",
        }}
      />

      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "0 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* College branding */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "32px",
              fontWeight: 800,
              color: "white",
              boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
            }}
          >
            T
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "4px",
              color: "#f1f5f9",
            }}
          >
            TSEC ERP
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#94a3b8",
              lineHeight: "1.5",
            }}
          >
            Thakur Shyamnarayan Engineering College
          </p>
        </div>

        {/* Login card */}
        <div
          className="glass-card"
          style={{
            padding: "36px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              marginBottom: "4px",
              color: "#f1f5f9",
            }}
          >
            Welcome back
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              marginBottom: "28px",
            }}
          >
            Sign in to your ERP account
          </p>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
                fontSize: "13px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#cbd5e1",
                  marginBottom: "8px",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="you@tsec.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="login-email"
              />
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#cbd5e1",
                  marginBottom: "8px",
                }}
              >
                Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="login-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              id="login-button"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "15px",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo credentials */}
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              borderRadius: "10px",
              background: "rgba(59,130,246,0.05)",
              border: "1px solid rgba(59,130,246,0.15)",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#60a5fa",
                marginBottom: "8px",
              }}
            >
              Demo Credentials
            </p>
            <div
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                lineHeight: "1.8",
              }}
            >
              <div>
                <strong style={{ color: "#cbd5e1" }}>Admin:</strong>{" "}
                admin@tsec.edu / admin123
              </div>
              <div>
                <strong style={{ color: "#cbd5e1" }}>Faculty:</strong>{" "}
                faculty@tsec.edu / faculty123
              </div>
              <div>
                <strong style={{ color: "#cbd5e1" }}>Student:</strong>{" "}
                student@tsec.edu / student123
              </div>
            </div>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#475569",
            marginTop: "24px",
          }}
        >
          © 2026 TSEC ERP. All rights reserved.
        </p>
      </div>
    </div>
  );
}
