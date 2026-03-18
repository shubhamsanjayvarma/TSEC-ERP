"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type SidebarLink = {
  href?: string;
  label: string;
  icon: string;
  subLinks?: { href: string; label: string }[];
};

const adminLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
<<<<<<< HEAD
  { href: "/dashboard/students", label: "Students", icon: "school" },
  { href: "/dashboard/faculty", label: "Faculty", icon: "groups" },
  { href: "/dashboard/departments", label: "Departments", icon: "apartment" },
  { href: "/dashboard/subjects", label: "Subjects", icon: "book" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "fact_check" },
  { href: "/dashboard/exams", label: "Exams", icon: "quiz" },
  { href: "/dashboard/notices", label: "Notices", icon: "campaign" },
  { href: "/dashboard/feedback", label: "Feedback", icon: "reviews" },
=======
  { 
    label: "Users & Staff", icon: "manage_accounts", 
    subLinks: [
      { href: "/dashboard/students", label: "Manage Students" },
      { href: "/dashboard/faculty", label: "Manage Faculty" }
    ]
  },
  { 
    label: "Academics", icon: "apartment", 
    subLinks: [
      { href: "/dashboard/departments", label: "Departments" },
      { href: "/dashboard/subjects", label: "Subjects" }
    ]
  },
  { 
    label: "Operations", icon: "rule", 
    subLinks: [
      { href: "/dashboard/attendance", label: "Attendance Overview" },
      { href: "/dashboard/exams", label: "Manage Exams" }
    ]
  },
  { 
    label: "Communications", icon: "campaign", 
    subLinks: [
      { href: "/dashboard/notices", label: "Manage Notices" }
    ]
  }
>>>>>>> 00bfa95a603ad922511238600a5e437fb31bca74
];

const facultyLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { 
    label: "My Academics", icon: "school", 
    subLinks: [
      { href: "/dashboard/subjects", label: "My Subjects" },
      { href: "/dashboard/attendance", label: "Mark Attendance" }
    ]
  },
  { 
    label: "Assessments", icon: "quiz", 
    subLinks: [
      { href: "/dashboard/exams", label: "Upload Marks" }
    ]
  },
  { 
    label: "Communications", icon: "campaign", 
    subLinks: [
      { href: "/dashboard/notices", label: "Notices" }
    ]
  }
];

const studentLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { 
    label: "Student", icon: "person", 
    subLinks: [
      { href: "/dashboard/profile", label: "Display Profile" },
      { href: "/dashboard/attendance", label: "Marks & Attendance" },
      { href: "/dashboard/results", label: "Provisional Marksheet" },
      { href: "/dashboard/profile", label: "Change Login" }
    ]
  },
  { 
    label: "Feed-Back", icon: "reviews",
    subLinks: [
      { href: "/dashboard/feedback/lecture", label: "For Lecture" },
      { href: "/dashboard/feedback/practical", label: "For Practical" },
      { href: "/dashboard/feedback/expert", label: "Expert / Guest Lecture" }
    ]
  },
  { 
    label: "Survey", icon: "poll",
    subLinks: [
      { href: "/dashboard/survey/course", label: "Course Exit" },
      { href: "/dashboard/survey/program", label: "Program Exit" }
    ]
  },
  { 
    label: "Online", icon: "language",
    subLinks: [
      { href: "/dashboard/online/exam", label: "Online Exam" },
      { href: "/dashboard/online/quiz", label: "Online Quiz" }
    ]
  },
  { 
    label: "Syllabus", icon: "menu_book",
    subLinks: [
      { href: "/dashboard/syllabus", label: "Syllabus Content" },
      { href: "/dashboard/belt/topic", label: "Display Topic" }
    ]
  },
  { 
    label: "Time-Table", icon: "calendar_month",
    subLinks: [
      { href: "/dashboard/timetable/dept", label: "Dept. Time Table" }
    ]
  },
  { 
    label: "Upload", icon: "upload_file",
    subLinks: [
      { href: "/dashboard/upload/certificate", label: "Certificate" }
    ]
  },
  { 
    label: "Online Forms", icon: "description",
    subLinks: [
      { href: "/dashboard/forms/exam", label: "Exam Form" }
    ]
  },
  { href: "/dashboard/notices", label: "Notices", icon: "campaign" },
];

function SidebarItem({ 
  link, 
  pathname, 
  isOpen, 
  onToggle 
}: { 
  link: SidebarLink; 
  pathname: string; 
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isActive = link.href 
    ? pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))
    : link.subLinks?.some(sub => pathname === sub.href);

  if (link.subLinks) {
    return (
      <div>
        <div
          onClick={onToggle}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: isActive ? 700 : 500,
            color: isActive ? "#0f1729" : "#64748b",
            background: isActive ? "rgba(37,99,235,0.06)" : "transparent",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "22px", color: isActive ? "#2563eb" : "#94a3b8" }}
            >
              {link.icon}
            </span>
            {link.label}
          </div>
          <span
            className="material-symbols-outlined"
            style={{ 
              fontSize: "18px", 
              color: "#94a3b8",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease"
            }}
          >
            expand_more
          </span>
        </div>
        
        {isOpen && (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "2px",
            marginTop: "2px",
            marginLeft: "24px",
            paddingLeft: "10px",
            borderLeft: "2px solid #e2e8f0"
          }}>
            {link.subLinks.map(sub => {
              const isSubActive = pathname === sub.href;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: isSubActive ? 600 : 500,
                    color: isSubActive ? "#2563eb" : "#64748b",
                    textDecoration: "none",
                    background: isSubActive ? "rgba(37,99,235,0.06)" : "transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  {sub.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={link.href!}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: isActive ? 700 : 500,
        color: isActive ? "#0f1729" : "#64748b",
        background: isActive ? "rgba(37,99,235,0.06)" : "transparent",
        textDecoration: "none",
        transition: "all 0.2s ease",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: "22px", color: isActive ? "#2563eb" : "#94a3b8" }}
      >
        {link.icon}
      </span>
      {link.label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [openSection, setOpenSection] = useState<string | null>(null);

  const links =
    role === "ADMIN"
      ? adminLinks
      : role === "FACULTY"
      ? facultyLinks
      : studentLinks;

  // Set initial open section based on current path
  React.useEffect(() => {
    const activeSection = links.find(link => 
      link.subLinks?.some(sub => pathname === sub.href)
    );
    if (activeSection) {
      setOpenSection(activeSection.label);
    }
  }, [pathname, role]);

  return (
    <aside
      style={{
        width: "260px",
        height: "100vh",
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "20px 24px 10px 24px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <img
            src="/img/TSEC-logo.webp"
            alt="TSEC"
            style={{
              width: "28px",
              height: "28px",
              objectFit: "contain",
              filter: "brightness(1.2)",
            }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            TSEC ERP
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: 500,
            }}
          >
            College Management
          </div>
        </div>
      </div>

      {/* Navigation - Scrollable Area */}
      <nav 
        style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "16px",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE
        }}
      >
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        <div className="scrollbar-hide">
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "0 12px",
              marginBottom: "8px",
            }}
          >
            Main Menu
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {links.map((link, idx) => (
              <SidebarItem 
                key={link.label + idx} 
                link={link} 
                pathname={pathname} 
                isOpen={openSection === link.label}
                onToggle={() => setOpenSection(openSection === link.label ? null : link.label)}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User card at bottom */}
      <div style={{ padding: "16px", flexShrink: 0, borderTop: "1px solid #f1f5f9" }}>
        <div
          style={{
            padding: "14px",
            borderRadius: "14px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9999px",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
              }}
            >
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {session?.user?.name || "User"}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                {role || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
