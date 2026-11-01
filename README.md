# Eduvera — Modern Enterprise School Management & Academic ERP Platform

![Eduvera Banner](frontend/public/images/eduvera-logo-full.png)

> **Eduvera** is a full-featured, multi-tenant Academic ERP and School Management SaaS solution designed for K-12 schools, colleges, and higher-education institutions. Built on **Laravel 11 REST APIs** and **Next.js 16 (Turbopack, Tailwind CSS, TypeScript)**, Eduvera provides real-time administrative workflows, automated student admissions, financial accounting with 3-part bank vouchers, exam gradebooks, and Office 365-style institutional branding.

---

## 🌟 Key Product Features

### 1. Multi-Portal Authentication & Role-Based Access Control (RBAC)
- Dedicated sign-in interfaces for **Super Admin**, **Academic Admin**, **Teachers**, **Students**, and **Parents**.
- Complete data separation: new institutions start with clean ledgers, while demo profiles can explore pre-populated showcase datasets.
- JWT/Sanctum Bearer token session management with automatic route-level privilege enforcement.

### 2. Interactive Institution Onboarding (`/onboarding`)
- **Step 1: Color Themes**: Choose from 6 Microsoft Office 365-inspired enterprise palettes (*Eduvera Classic, Word Sapphire, Excel Emerald, PowerPoint Crimson, OneNote Purple, Outlook Azure*).
- **Step 2: School Branding**: Upload school logos with instant cropping, live preview, and database persistence.
- **Step 3: Campus Identity**: Configure campus name, motto, physical address, contact telephone, email, and accreditation details.

### 3. Dynamic Theming Engine
- Real-time CSS custom variable injection (`eduvera-dynamic-theme-css`) instantly transforms the entire application's primary buttons, navigation highlights, metric cards, and headers without requiring a page reload.

### 4. Academics, Classes & Subject Catalog
- **Class & Cohort Management**: Define grades/classes, active sections (e.g. *Section A, B, Science, Commerce*), classroom capacities, and assigned class teachers.
- **Curriculum Catalog**: Manage course directories with course codes, credit hours, department classifications, and course types (*Core, Elective, Practical Lab*).
- **Class-Wise Subject Mapping**: Assign catalog subjects to specific classes with period allotments, compulsory/elective flags, and designated faculty instructors.
- **Grading Scales**: Configure GPA point boundaries and percentage criteria (e.g., A+, A, B, C, D, Fail).

### 5. Student Admissions & Ledger Directory
- Digital admission suite ("+ Enroll Student") generating standardized institutional IDs (`EDV-2026-XXXX`) and automated roll numbers.
- Dynamic cascading dropdowns: Selecting a Class automatically filters and loads its configured sections.
- Comprehensive student directory with multi-field search, class filtering, guardian contacts, and full student profiles.

### 6. Attendance & Timesheet Hub
- **Daily Student Roster**: Mark daily attendance records (*Present, Absent, Late, Excused Leave, Half-Day*).
- **Monthly Matrix (1–31 Grid)**: Visual grid displaying daily student attendance throughout the month.
- **Faculty & Staff Timesheets**: Record punch-in, punch-out times, and calculated shift durations.
- **Leave & Holiday Management**: Submit leave requests with approval workflows and maintain institutional holiday calendars.

### 7. Examinations & Report Card Generation
- Manage exam schedules and academic terms.
- Subject-wise and section-wise marks entry gradebook.
- **Printable Marksheets**: Generates official institution-branded report cards with subject marks, percentage, letter grades, GPA, and teacher remarks.

### 8. Financial Management & Fee Vouchers
- **Fee Invoicing**: Issue structured invoices for tuition, labs, transport, and extracurricular activities.
- **3-Part Bank Challan / Voucher**: Generates print-ready 3-part vouchers (*Student Copy, School Copy, Bank Copy*) complete with institution logo and bank instructions.
- **Payment Processing**: Record payments across Cash, Bank Transfer, Card, and Cheque with printable official receipts.

### 9. Faculty & HR Management
- Staff directory tracking designations, departmental roles, qualifications, and employment history.

### 10. Campus Noticeboard & Circulars
- Publish school-wide circulars targeted to specific audiences (*All, Teachers, Students, Parents*) with priority badges (*Urgent, Normal*).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **Backend** | Laravel 11 / PHP 8.3, RESTful API Architecture |
| **Database** | MySQL / MariaDB |
| **Authentication** | Token-Based Sanctum / JWT with Role & Audit Middleware |
| **Styling & Themes** | Dynamic CSS Root Custom Properties & Theme Context API |

---

## 🏗️ Repository Branch Strategy

This repository follows a 3-tier release workflow:

```text
[ New-features ]  ──►  Feature development, enhancements & bug fixes
       │
       ▼
  [ UAT-dev ]     ──►  User Acceptance Testing, staging verification & QA
       │
       ▼
 [ Production ]   ──►  Stable, production-ready releases
```

1. **`New-features`**: Active development branch where new modules and features are introduced.
2. **`UAT-dev`**: Staging and pre-production branch used for end-to-end testing and stakeholder reviews.
3. **`Production`**: The stable branch powering live production deployments.

---

## 🚀 Getting Started

### Prerequisites
- **PHP** >= 8.2 with Composer installed
- **Node.js** >= 18.x and npm / pnpm
- **MySQL** running locally or via Laragon / XAMPP

### Backend Setup (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```
The backend API will run on `http://127.0.0.1:8000/api/v1`.

### Frontend Setup (Next.js)
```bash
cd frontend
npm install
npm run dev
```
The frontend portal will be accessible at `http://localhost:3000`.

---

## 📄 License
This software is proprietary and confidential. Developed for Eduvera Institutional Management Systems.
