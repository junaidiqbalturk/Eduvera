<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Holidays & Calendar Breaks Table
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->date('date')->unique();
            $table->string('type')->default('National'); // National, Religious, Academic Break, Emergency/Weather, Other
            $table->text('description')->nullable();
            $table->string('academic_year')->default('2025-2026');
            $table->timestamps();
        });

        // 2. Student & Staff Leave Requests Table
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->enum('applicant_type', ['Student', 'Staff'])->default('Student');
            $table->unsignedBigInteger('applicant_id');
            $table->string('applicant_name');
            $table->string('identifier'); // Roll Number or Employee ID
            $table->string('class_or_department'); // e.g. 'Grade 10 - Section A' or 'Mathematics'
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedInteger('days_count')->default(1);
            $table->string('leave_type')->default('Sick / Medical'); // Sick / Medical, Casual, Family Emergency, Academic / Sports Event, Other
            $table->text('reason');
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
            $table->string('approved_by_name')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            $table->index(['applicant_type', 'applicant_id']);
            $table->index(['start_date', 'end_date', 'status']);
        });

        // 3. Student Attendances Table (with Unique Compound Constraint)
        Schema::create('student_attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->string('student_name');
            $table->string('student_roll');
            $table->string('class_name');
            $table->string('section')->default('Section A');
            $table->date('attendance_date');
            $table->enum('status', ['Present', 'Absent', 'Late', 'Half-day', 'Excused Leave', 'Suspended'])->default('Present');
            $table->enum('half_day_session', ['Morning', 'Afternoon'])->nullable();
            $table->string('arrival_time', 20)->nullable();
            $table->unsignedSmallInteger('minutes_late')->default(0);
            $table->unsignedBigInteger('leave_request_id')->nullable();
            $table->string('remarks')->nullable();
            $table->boolean('is_makeup_session')->default(false);
            $table->string('marked_by_name')->default('System');
            $table->timestamps();

            $table->unique(['student_id', 'attendance_date'], 'student_date_unique');
            $table->index(['class_name', 'attendance_date'], 'class_date_index');
            $table->index(['attendance_date', 'status'], 'date_status_index');
        });

        // 4. Staff Attendances Table (with Unique Compound Constraint)
        Schema::create('staff_attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('staff_id');
            $table->string('staff_name');
            $table->string('employee_id');
            $table->string('department');
            $table->date('attendance_date');
            $table->enum('status', ['Present', 'Absent', 'Late', 'Half-day', 'Excused Leave', 'On Duty'])->default('Present');
            $table->string('punch_in', 20)->nullable();
            $table->string('punch_out', 20)->nullable();
            $table->decimal('work_hours', 4, 2)->default(0.00);
            $table->unsignedBigInteger('leave_request_id')->nullable();
            $table->string('remarks')->nullable();
            $table->string('marked_by_name')->default('System');
            $table->timestamps();

            $table->unique(['staff_id', 'attendance_date'], 'staff_date_unique');
            $table->index(['department', 'attendance_date'], 'dept_date_index');
        });

        // 5. Attendance Audit Trail Table
        Schema::create('attendance_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('attendance_type', ['Student', 'Staff']);
            $table->unsignedBigInteger('attendance_id');
            $table->string('target_name');
            $table->date('attendance_date');
            $table->string('previous_status')->nullable();
            $table->string('new_status');
            $table->string('changed_by_name');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->index(['attendance_type', 'attendance_id'], 'audit_attendance_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_audit_logs');
        Schema::dropIfExists('staff_attendances');
        Schema::dropIfExists('student_attendances');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('holidays');
    }
};
