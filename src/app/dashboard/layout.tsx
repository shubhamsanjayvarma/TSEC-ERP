"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f7f8",
        }}
      >
        <div className="gradient-text" style={{ fontSize: "24px", fontWeight: 700 }}>
          Loading TSEC ERP...
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f7f8" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: "260px", overflowY: "auto" }}>
        <Navbar />
        <div style={{ padding: "24px 32px", maxWidth: "1400px", margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
