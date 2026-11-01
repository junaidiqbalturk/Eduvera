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
        // 1. Examination Sessions & Terms Table
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('academic_year')->default('2025-2026');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['Upcoming', 'Active', 'Grading', 'Completed', 'Published'])->default('Upcoming');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. Exam Marks & Gradebook Ledger Table
        Schema::create('exam_marks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('student_name');
            $table->string('student_roll');
            $table->string('class_name');
            $table->string('section')->default('Section A');
            $table->string('subject_code');
            $table->string('subject_name');
            $table->decimal('marks_obtained', 5, 2)->default(0.00);
            $table->decimal('max_marks', 5, 2)->default(100.00);
            $table->string('grade', 5)->default('F');
            $table->decimal('gpa_point', 3, 2)->default(0.00);
            $table->string('remarks')->nullable();
            $table->timestamps();

            // Unique constraint: one mark record per student, per subject, per exam
            $table->unique(['exam_id', 'student_id', 'subject_code'], 'uniq_exam_student_subject');
            $table->index(['exam_id', 'class_name', 'section', 'subject_code'], 'idx_exam_class_subject');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_marks');
        Schema::dropIfExists('exams');
    }
};
