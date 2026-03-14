import { PrismaClient, Role, AttendanceStatus, ExamType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TSEC ERP database...\n");

  // 1. Create Departments
  console.log("📁 Creating departments...");
  const departments = await Promise.all([
    prisma.department.create({ data: { name: "Computer Engineering", code: "CE" } }),
    prisma.department.create({ data: { name: "AI & Machine Learning", code: "AIML" } }),
    prisma.department.create({ data: { name: "Information Technology", code: "IT" } }),
    prisma.department.create({ data: { name: "Mechanical Engineering", code: "ME" } }),
    prisma.department.create({ data: { name: "Electronics Engineering", code: "EXTC" } }),
    prisma.department.create({ data: { name: "Civil Engineering", code: "CIVIL" } }),
  ]);

  // 2. Create Users
  console.log("👥 Creating users...");
  const password = await bcrypt.hash("admin123", 10);
  const facPassword = await bcrypt.hash("faculty123", 10);
  const stuPassword = await bcrypt.hash("student123", 10);

  // Admin user
  await prisma.user.create({
    data: {
      name: "Dr. Rajesh Sharma",
      email: "admin@tsec.edu",
      password,
      role: Role.ADMIN,
    },
  });

  // Accounts user
  await prisma.user.create({
    data: {
      name: "Priya Desai",
      email: "accounts@tsec.edu",
      password,
      role: Role.ACCOUNTS,
    },
  });

  // 3. Create Faculty
  console.log("👨‍🏫 Creating faculty...");
  const facultyData = [
    { name: "Prof. Amit Patel", email: "faculty@tsec.edu", dept: 0, empId: "FAC001", designation: "Associate Professor" },
    { name: "Prof. Sneha Kulkarni", email: "sneha@tsec.edu", dept: 0, empId: "FAC002", designation: "Assistant Professor" },
    { name: "Prof. Rahul Joshi", email: "rahul@tsec.edu", dept: 1, empId: "FAC003", designation: "HOD" },
    { name: "Prof. Meera Singh", email: "meera@tsec.edu", dept: 2, empId: "FAC004", designation: "Assistant Professor" },
    { name: "Prof. Vikram Deshmukh", email: "vikram@tsec.edu", dept: 3, empId: "FAC005", designation: "Associate Professor" },
  ];

  const facultyUsers = [];
  for (const f of facultyData) {
    const user = await prisma.user.create({
      data: {
        name: f.name,
        email: f.email,
        password: facPassword,
        role: Role.FACULTY,
        faculty: {
          create: {
            employeeId: f.empId,
            designation: f.designation,
            departmentId: departments[f.dept].id,
          },
        },
      },
      include: { faculty: true },
    });
    facultyUsers.push(user);
  }

  // 4. Create Subjects
  console.log("📚 Creating subjects...");
  const subjectData = [
    { name: "Data Structures & Algorithms", code: "CS301", credits: 4, semester: 3, dept: 0 },
    { name: "Database Management Systems", code: "CS302", credits: 4, semester: 3, dept: 0 },
    { name: "Operating Systems", code: "CS303", credits: 3, semester: 3, dept: 0 },
    { name: "Computer Networks", code: "CS304", credits: 3, semester: 3, dept: 0 },
    { name: "Machine Learning", code: "AI401", credits: 4, semester: 4, dept: 1 },
    { name: "Deep Learning", code: "AI402", credits: 4, semester: 4, dept: 1 },
    { name: "Web Development", code: "IT301", credits: 4, semester: 3, dept: 2 },
    { name: "Thermodynamics", code: "ME301", credits: 3, semester: 3, dept: 3 },
  ];

  const subjects = [];
  for (const s of subjectData) {
    const subject = await prisma.subject.create({
      data: {
        name: s.name,
        code: s.code,
        credits: s.credits,
        semester: s.semester,
        departmentId: departments[s.dept].id,
      },
    });
    subjects.push(subject);
  }

  // 5. Create Students
  console.log("🎓 Creating students...");
  const studentNames = [
    "Aarav Sharma", "Aditi Patil", "Arjun Desai", "Ananya Iyer",
    "Dhruv Mehta", "Ishaan Reddy", "Kavya Nair", "Manav Gupta",
    "Neha Joshi", "Prachi Tiwari", "Rohan Verma", "Sanya Mishra",
    "Tanishq Kumar", "Varun Singh", "Zoya Khan", "Aditya Rao",
    "Divya Chopra", "Harsh Patel", "Kriti Saxena", "Mihir Bhatt",
  ];

  const studentUsers = [];
  for (let i = 0; i < studentNames.length; i++) {
    const deptIndex = i % 4; // Distribute across departments
    const user = await prisma.user.create({
      data: {
        name: studentNames[i],
        email: i === 0 ? "student@tsec.edu" : `student${i + 1}@tsec.edu`,
        password: stuPassword,
        role: Role.STUDENT,
        student: {
          create: {
            rollNumber: `${departments[deptIndex].code}2024${String(i + 1).padStart(3, "0")}`,
            batch: "2024",
            semester: 3,
            departmentId: departments[deptIndex].id,
          },
        },
      },
      include: { student: true },
    });
    studentUsers.push(user);
  }

  // 6. Create Subject Assignments (faculty → subject)
  console.log("📋 Assigning subjects to faculty...");
  await prisma.subjectAssignment.createMany({
    data: [
      { facultyId: facultyUsers[0].faculty!.id, subjectId: subjects[0].id },
      { facultyId: facultyUsers[0].faculty!.id, subjectId: subjects[1].id },
      { facultyId: facultyUsers[1].faculty!.id, subjectId: subjects[2].id },
      { facultyId: facultyUsers[2].faculty!.id, subjectId: subjects[4].id },
      { facultyId: facultyUsers[3].faculty!.id, subjectId: subjects[6].id },
    ],
  });

  // 7. Create Attendance Records
  console.log("📋 Creating attendance records...");
  const today = new Date();
  for (let day = 0; day < 30; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

    for (const studentUser of studentUsers.slice(0, 10)) {
      await prisma.attendance.create({
        data: {
          studentId: studentUser.student!.id,
          subjectId: subjects[0].id,
          facultyId: facultyUsers[0].faculty!.id,
          date,
          status: Math.random() > 0.2 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
        },
      });
    }
  }

  // 8. Create Exams and Marks
  console.log("📝 Creating exams and marks...");
  const exam = await prisma.exam.create({
    data: {
      name: "Mid Semester Exam",
      type: ExamType.INTERNAL,
      date: new Date(),
      maxMarks: 30,
      subjectId: subjects[0].id,
    },
  });

  for (const studentUser of studentUsers.slice(0, 10)) {
    const marks = Math.floor(Math.random() * 15) + 15;
    let grade = "F";
    if (marks >= 27) grade = "O";
    else if (marks >= 24) grade = "A";
    else if (marks >= 21) grade = "B";
    else if (marks >= 18) grade = "C";
    else if (marks >= 15) grade = "D";

    await prisma.mark.create({
      data: {
        examId: exam.id,
        studentId: studentUser.student!.id,
        marksObtained: marks,
        grade,
      },
    });
  }

  // 9. Create Notices
  console.log("📢 Creating notices...");
  await prisma.notice.createMany({
    data: [
      {
        title: "Mid-Semester Examination Schedule Released",
        content: "The mid-semester examination schedule for all departments has been released. Please check your respective department notice boards for detailed timetables. Exams will commence from March 25, 2026.",
        priority: "high",
        createdBy: "admin",
      },
      {
        title: "Workshop on AI & Machine Learning",
        content: "A 2-day workshop on AI & ML applications in engineering will be conducted on March 20-21, 2026. All interested students can register through the student portal.",
        priority: "medium",
        createdBy: "admin",
      },
      {
        title: "Library Timing Update",
        content: "The central library will remain open from 8:00 AM to 8:00 PM during the examination period. Students are encouraged to utilize the reading halls.",
        priority: "normal",
        createdBy: "admin",
      },
      {
        title: "Fee Payment Deadline",
        content: "Last date for semester fee payment is March 31, 2026. Late fee of ₹500 per day will be applicable after the deadline.",
        priority: "high",
        createdBy: "accounts",
      },
      {
        title: "Annual Sports Day",
        content: "TSEC Annual Sports Day will be held on April 5, 2026. Students interested in participating should register with their department sports coordinator.",
        priority: "normal",
        createdBy: "admin",
      },
    ],
  });

  console.log("\n✅ Seed completed!");
  console.log("---");
  console.log("Demo Login Credentials:");
  console.log("Admin:   admin@tsec.edu / admin123");
  console.log("Faculty: faculty@tsec.edu / faculty123");
  console.log("Student: student@tsec.edu / student123");
  console.log("---\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
