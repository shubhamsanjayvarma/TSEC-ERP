"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        background: "#f6f7f8",
      }}
    >
      {/* Left side - branding with college building */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* College building background */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("/img/TSEC-Building.jpeg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.15,
        }} />

        {/* Geometric pattern overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.9) 100%)",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          {/* Official TSEC header logo */}
          <div style={{ marginBottom: "32px" }}>
            <img
              src="/img/TSEC-header.png"
              alt="TSEC Header"
              style={{
                maxWidth: "420px",
                width: "100%",
                filter: "brightness(1.1)",
              }}
            />
          </div>

          <div style={{
            width: "80px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            margin: "0 auto 24px",
          }} />

          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.8)", fontWeight: 600, marginBottom: "8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            ERP Portal
          </p>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", maxWidth: "360px", lineHeight: 1.6 }}>
            Enterprise Resource Planning System for Students, Faculty & Administration
          </p>

          {/* ISO & DTE info */}
          <div style={{
            marginTop: "40px",
            display: "flex",
            gap: "24px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            <div style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "8px",
              fontSize: "11px",
              color: "rgba(255,255,255,0.5)",
              fontWeight: 600,
            }}>
              ISO 9001:2015 Certified
            </div>
            <div style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "8px",
              fontSize: "11px",
              color: "rgba(255,255,255,0.5)",
              fontWeight: 600,
            }}>
              DTE Code: 03143
            </div>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          background: "#ffffff",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* TSEC logo above form */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <img
              src="/img/TSEC-logo.webp"
              alt="TSEC Logo"
              style={{ maxWidth: "200px", marginBottom: "16px" }}
            />
          </div>

          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.02em" }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: "15px", color: "#64748b", marginBottom: "32px" }}>
            Sign in to your ERP account
          </p>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "12px",
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#dc2626",
                fontSize: "14px",
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
                  fontWeight: 600,
                  color: "#334155",
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
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "8px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  id="login-password"
                  style={{ width: "100%", paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-accent"
              id="login-button"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "15px",
                opacity: loading ? 0.7 : 1,
                justifyContent: "center",
                borderRadius: "12px",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo credentials */}
          <div
            style={{
              marginTop: "28px",
              padding: "16px",
              borderRadius: "12px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#2563eb",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Demo Credentials
            </p>
            <div
              style={{
                fontSize: "13px",
                color: "#64748b",
                lineHeight: "2",
              }}
            >
              <div>
                <strong style={{ color: "#334155" }}>Admin:</strong>{" "}
                admin@tsec.edu / admin123
              </div>
              <div>
                <strong style={{ color: "#334155" }}>Faculty:</strong>{" "}
                faculty@tsec.edu / faculty123
              </div>
              <div>
                <strong style={{ color: "#334155" }}>Student:</strong>{" "}
                student@tsec.edu / student123
              </div>
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#94a3b8",
              marginTop: "28px",
            }}
          >
            © 2026 TSEC ERP. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
