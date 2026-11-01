# Eduvera API Backend

The backend engine for the **Eduvera School Management & Academic ERP Platform**, built on Laravel 11 and PHP 8.3.

---

## 🚀 Getting Started

### Prerequisites
- PHP >= 8.2
- Composer
- MySQL or MariaDB

### Local Setup
```bash
# 1. Install dependencies
composer install

# 2. Configure environment
cp .env.example .env

# 3. Generate application key
php artisan key:generate

# 4. Run database migrations and seeders
php artisan migrate --seed

# 5. Start development server
php artisan serve
```

The API endpoints will be accessible at `http://127.0.0.1:8000/api/v1`.

---

## 🏗️ Architecture & Modules

The backend is built around a modular REST API design located in `app/Http/Controllers/Api/`:
- `AuthController`: User registration, authentication, JWT/Sanctum bearer token issuance.
- `AcademicController`: Classes, cohorts, subjects, curriculum mapping, grading scales.
- `StudentController`: Student directory, enrollment, admissions ID generation.
- `AttendanceController`: Daily student/staff rosters, monthly 1–31 grid matrix, leave approvals.
- `ExaminationController`: Exam schedules, marks entry, official marksheet generation.
- `FeeController`: Invoicing, payment collection, 3-part bank voucher generation, receipts.
- `StaffController`: Faculty profiles, departmental designations.
- `NoticeboardController`: Institutional announcements with audience targeting.
- `AdminController`: User role management, security audits, school identity settings.

---

## 🧪 Testing

Run automated feature and unit tests with PHPUnit:
```bash
php artisan test
```

---

## 📄 License
Proprietary & Confidential. Developed for Eduvera Institutional Management Systems.
