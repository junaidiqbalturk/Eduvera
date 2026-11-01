<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AcademicController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\ExaminationController;
use App\Http\Controllers\Api\FeeController;
use App\Http\Controllers\Api\NoticeboardController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AdminController;

/*
|--------------------------------------------------------------------------
| Eduvera School Management System - Modular API Routes
|--------------------------------------------------------------------------
| Base Prefix: /api/v1 (Configured in bootstrap/app.php)
| Security Middleware: 'role:Super Admin,Admin', 'audit'
|
*/

// Health Check & Workspace Settings
Route::get('/ping', fn() => response()->json(['status' => 'ok', 'app' => 'Eduvera API', 'version' => '1.0.0']));
Route::get('/settings', [AdminController::class, 'getSettings']);
Route::post('/settings', [AdminController::class, 'updateSettings']);

// 1. Authentication Module
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// 2. Executive Admin Security & Management Portal (Guarded by RBAC & Audit Middleware)
Route::prefix('admin')->middleware(['role:Super Admin,Admin', 'audit'])->group(function () {
    Route::get('/security-health', [AdminController::class, 'getSecurityHealth']);
    Route::get('/permissions', [AdminController::class, 'getPermissionsMatrix']);
    Route::get('/audit-logs', [AdminController::class, 'getAuditLogs']);
    Route::get('/settings', [AdminController::class, 'getSettings']);
    Route::post('/settings', [AdminController::class, 'updateSettings']);
    
    // User Provisioning & Dynamic Role Assignment
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::match(['patch', 'put'], '/users/{id}/role', [AdminController::class, 'updateUserRole']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
});

// 3. Dashboard Overview Endpoint
Route::get('/dashboard/overview', [DashboardController::class, 'getOverview']);

// 4. Academic Management Module
Route::prefix('academics')->middleware(['role:Admin,Academic', 'audit'])->group(function () {
    Route::get('/years', [AcademicController::class, 'getAcademicYears']);
    
    // Classes Management
    Route::get('/classes', [AcademicController::class, 'getClasses']);
    Route::post('/classes', [AcademicController::class, 'storeClass']);
    Route::match(['put', 'patch'], '/classes/{id}', [AcademicController::class, 'updateClass']);
    Route::delete('/classes/{id}', [AcademicController::class, 'deleteClass']);

    // Subjects & Courses Management
    Route::get('/subjects', [AcademicController::class, 'getSubjects']);
    Route::post('/subjects', [AcademicController::class, 'storeSubject']);
    Route::match(['put', 'patch'], '/subjects/{id}', [AcademicController::class, 'updateSubject']);
    Route::delete('/subjects/{id}', [AcademicController::class, 'deleteSubject']);

    // Class-Wise Courses Assignment
    Route::get('/classes/{id}/subjects', [AcademicController::class, 'getClassSubjects']);
    Route::post('/classes/{id}/subjects', [AcademicController::class, 'assignSubjectsToClass']);

    Route::get('/routine', [AcademicController::class, 'getRoutine']);
    Route::get('/grading-scale', [AcademicController::class, 'getGradingScale']);
    Route::post('/grading-scale', [AcademicController::class, 'updateGradingScale']);
});

// 5. Student Management Module
Route::prefix('students')->middleware(['role:Admin,Academic,Finance', 'audit'])->group(function () {
    Route::get('/', [StudentController::class, 'index']);
    Route::post('/', [StudentController::class, 'store']);
    Route::get('/{id}', [StudentController::class, 'show']);
    Route::match(['put', 'patch'], '/{id}', [StudentController::class, 'update']);
    Route::delete('/{id}', [StudentController::class, 'destroy']);
});

// 6. Staff & HR Module
Route::prefix('staff')->middleware(['role:Admin,HR', 'audit'])->group(function () {
    Route::get('/', [StaffController::class, 'index']);
    Route::get('/departments', [StaffController::class, 'getDepartments']);
});

// 7. Attendance Management Module (Guarded by RBAC: Super Admin, Academic, HR, Finance)
Route::prefix('attendance')->middleware(['role:Admin,HR,Academic,Finance', 'audit'])->group(function () {
    Route::get('/summary', [AttendanceController::class, 'getSummary']);
    Route::get('/students/sheet', [AttendanceController::class, 'getStudentSheet']);
    Route::post('/students/mark', [AttendanceController::class, 'markStudentAttendance']);
    Route::get('/students/matrix', [AttendanceController::class, 'getStudentMatrix']);
    Route::get('/chronic-absentees', [AttendanceController::class, 'getChronicAbsentees']);
    Route::get('/staff/sheet', [AttendanceController::class, 'getStaffSheet']);
    Route::post('/staff/mark', [AttendanceController::class, 'markStaffAttendance']);
    Route::get('/leaves', [AttendanceController::class, 'getLeaveRequests']);
    Route::post('/leaves', [AttendanceController::class, 'submitLeaveRequest']);
    Route::match(['patch', 'put'], '/leaves/{id}/status', [AttendanceController::class, 'updateLeaveStatus']);
    Route::get('/holidays', [AttendanceController::class, 'getHolidays']);
    Route::post('/holidays', [AttendanceController::class, 'createHoliday']);

    // Backward compatibility aliases
    Route::get('/', [AttendanceController::class, 'getSummary']);
    Route::post('/mark', [AttendanceController::class, 'markStudentAttendance']);
});

// 8. Examinations & Grading Module
Route::prefix('examinations')->middleware(['role:Admin,Academic', 'audit'])->group(function () {
    Route::get('/exams', [ExaminationController::class, 'getExams']);
    Route::get('/marksheet/{student_id}', [ExaminationController::class, 'getMarksheet']);
    Route::get('/marks/sheet', [ExaminationController::class, 'getMarksEntrySheet']);
    Route::post('/marks/save', [ExaminationController::class, 'saveMarks']);
});

// 9. Finance & Fee Management Module (Guarded by RBAC: Super Admin & Finance User)
Route::prefix('fees')->middleware(['role:Admin,Finance', 'audit'])->group(function () {
    Route::get('/summary', [FeeController::class, 'getFeeSummary']);
    Route::get('/invoices', [FeeController::class, 'getInvoices']);
    Route::post('/invoices', [FeeController::class, 'createInvoice']);
    Route::get('/invoices/{id}', [FeeController::class, 'showInvoice']);
    Route::get('/invoices/{id}/voucher', [FeeController::class, 'getVoucher']);
    Route::post('/invoices/{id}/pay', [FeeController::class, 'collectPayment']);
    Route::get('/receipts/{receiptNumber}', [FeeController::class, 'getReceipt']);
    Route::get('/structures', [FeeController::class, 'getStructures']);
    Route::post('/structures', [FeeController::class, 'createStructure']);
    Route::get('/transactions', [FeeController::class, 'getTransactions']);
    Route::get('/defaulters', [FeeController::class, 'getDefaulters']);
});

// 10. Noticeboard & Announcements Module
Route::prefix('notices')->group(function () {
    Route::get('/', [NoticeboardController::class, 'index']);
    Route::post('/', [NoticeboardController::class, 'store'])->middleware(['role:Admin,Super Admin,Academic', 'audit']);
    Route::delete('/{id}', [NoticeboardController::class, 'destroy'])->middleware(['role:Admin,Super Admin', 'audit']);
});
