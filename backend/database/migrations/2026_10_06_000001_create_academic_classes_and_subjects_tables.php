<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Classes & Cohorts Table
        if (!Schema::hasTable('school_classes')) {
            Schema::create('school_classes', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->integer('numeric_grade')->default(1);
                $table->json('sections')->nullable();
                $table->string('class_teacher')->nullable();
                $table->integer('capacity')->default(40);
                $table->boolean('is_demo')->default(false);
                $table->timestamps();
            });
        }

        // 2. Subjects & Courses Table
        if (!Schema::hasTable('subjects')) {
            Schema::create('subjects', function (Blueprint $table) {
                $table->id();
                $table->string('code')->index();
                $table->string('name');
                $table->string('department')->default('General');
                $table->integer('credits')->default(3);
                $table->string('type')->default('Core'); // 'Core', 'Elective', 'Optional'
                $table->boolean('is_demo')->default(false);
                $table->timestamps();
            });
        }

        // 3. Class-Wise Subject Assignment Table
        if (!Schema::hasTable('class_subjects')) {
            Schema::create('class_subjects', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('class_id')->index();
                $table->unsignedBigInteger('subject_id')->index();
                $table->string('teacher_name')->nullable();
                $table->integer('periods_per_week')->default(5);
                $table->boolean('is_compulsory')->default(true);
                $table->timestamps();

                $table->unique(['class_id', 'subject_id']);
            });
        }

        // Seed default demo classes
        $demoClasses = [
            [
                'id' => 1,
                'name' => 'Grade 9',
                'numeric_grade' => 9,
                'sections' => json_encode(['Section A', 'Section B', 'Section C']),
                'class_teacher' => 'Mr. Robert Vance',
                'capacity' => 120,
                'is_demo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'name' => 'Grade 10',
                'numeric_grade' => 10,
                'sections' => json_encode(['Section A', 'Section B']),
                'class_teacher' => 'Ms. Eleanor Vance',
                'capacity' => 90,
                'is_demo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'name' => 'Grade 11',
                'numeric_grade' => 11,
                'sections' => json_encode(['Science', 'Commerce', 'Arts']),
                'class_teacher' => 'Dr. Alan Grant',
                'capacity' => 120,
                'is_demo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 4,
                'name' => 'Grade 12',
                'numeric_grade' => 12,
                'sections' => json_encode(['Science-A', 'Science-B', 'Commerce-A']),
                'class_teacher' => 'Mrs. Clara Oswald',
                'capacity' => 120,
                'is_demo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($demoClasses as $cls) {
            DB::table('school_classes')->updateOrInsert(['id' => $cls['id']], $cls);
        }

        // Seed default demo subjects
        $demoSubjects = [
            ['id' => 101, 'code' => 'MATH-101', 'name' => 'Advanced Algebra & Trigonometry', 'department' => 'Mathematics', 'credits' => 4, 'type' => 'Core', 'is_demo' => true],
            ['id' => 102, 'code' => 'PHYS-101', 'name' => 'General Physics & Mechanics', 'department' => 'Science', 'credits' => 4, 'type' => 'Core', 'is_demo' => true],
            ['id' => 103, 'code' => 'CHEM-101', 'name' => 'Organic & Inorganic Chemistry', 'department' => 'Science', 'credits' => 4, 'type' => 'Core', 'is_demo' => true],
            ['id' => 104, 'code' => 'ENG-101', 'name' => 'World Literature & Composition', 'department' => 'Languages', 'credits' => 3, 'type' => 'Core', 'is_demo' => true],
            ['id' => 105, 'code' => 'CS-101', 'name' => 'Computer Science & Python', 'department' => 'Computer Science', 'credits' => 3, 'type' => 'Elective', 'is_demo' => true],
            ['id' => 106, 'code' => 'BIO-101', 'name' => 'Cell Biology & Physiology', 'department' => 'Science', 'credits' => 4, 'type' => 'Elective', 'is_demo' => true],
            ['id' => 107, 'code' => 'PAK-101', 'name' => 'Pakistan Studies & History', 'department' => 'Social Studies', 'credits' => 2, 'type' => 'Core', 'is_demo' => true],
            ['id' => 108, 'code' => 'ISL-101', 'name' => 'Islamic Studies / Ethics', 'department' => 'Social Studies', 'credits' => 2, 'type' => 'Core', 'is_demo' => true],
        ];

        foreach ($demoSubjects as $sub) {
            $sub['created_at'] = now();
            $sub['updated_at'] = now();
            DB::table('subjects')->updateOrInsert(['id' => $sub['id']], $sub);
        }

        // Seed Class-Wise course mappings for Demo
        // Grade 9 (id 1) -> Math, Physics, Chemistry, English, Pak Studies
        // Grade 10 (id 2) -> Math, Physics, Chemistry, English, Islamiyat
        // Grade 11 (id 3) -> Math, Physics, CS, English
        // Grade 12 (id 4) -> Math, Chemistry, Bio, English
        $mappings = [
            ['class_id' => 1, 'subject_id' => 101, 'teacher_name' => 'Mr. Robert Vance', 'periods_per_week' => 5],
            ['class_id' => 1, 'subject_id' => 102, 'teacher_name' => 'Dr. Alan Grant', 'periods_per_week' => 4],
            ['class_id' => 1, 'subject_id' => 103, 'teacher_name' => 'Ms. Eleanor Vance', 'periods_per_week' => 4],
            ['class_id' => 1, 'subject_id' => 104, 'teacher_name' => 'Mrs. Clara Oswald', 'periods_per_week' => 4],
            ['class_id' => 1, 'subject_id' => 107, 'teacher_name' => 'Prof. Tariq Aziz', 'periods_per_week' => 3],

            ['class_id' => 2, 'subject_id' => 101, 'teacher_name' => 'Mr. Robert Vance', 'periods_per_week' => 5],
            ['class_id' => 2, 'subject_id' => 102, 'teacher_name' => 'Dr. Alan Grant', 'periods_per_week' => 4],
            ['class_id' => 2, 'subject_id' => 103, 'teacher_name' => 'Ms. Eleanor Vance', 'periods_per_week' => 4],
            ['class_id' => 2, 'subject_id' => 104, 'teacher_name' => 'Mrs. Clara Oswald', 'periods_per_week' => 4],
            ['class_id' => 2, 'subject_id' => 108, 'teacher_name' => 'Qari Abdul Rahman', 'periods_per_week' => 3],

            ['class_id' => 3, 'subject_id' => 101, 'teacher_name' => 'Mr. Robert Vance', 'periods_per_week' => 5],
            ['class_id' => 3, 'subject_id' => 102, 'teacher_name' => 'Dr. Alan Grant', 'periods_per_week' => 5],
            ['class_id' => 3, 'subject_id' => 105, 'teacher_name' => 'Engr. Bilal Khan', 'periods_per_week' => 4],
            ['class_id' => 3, 'subject_id' => 104, 'teacher_name' => 'Mrs. Clara Oswald', 'periods_per_week' => 4],

            ['class_id' => 4, 'subject_id' => 101, 'teacher_name' => 'Mr. Robert Vance', 'periods_per_week' => 5],
            ['class_id' => 4, 'subject_id' => 103, 'teacher_name' => 'Ms. Eleanor Vance', 'periods_per_week' => 5],
            ['class_id' => 4, 'subject_id' => 106, 'teacher_name' => 'Dr. Fatima Noor', 'periods_per_week' => 4],
            ['class_id' => 4, 'subject_id' => 104, 'teacher_name' => 'Mrs. Clara Oswald', 'periods_per_week' => 4],
        ];

        foreach ($mappings as $m) {
            DB::table('class_subjects')->updateOrInsert(
                ['class_id' => $m['class_id'], 'subject_id' => $m['subject_id']],
                array_merge($m, ['is_compulsory' => true, 'created_at' => now(), 'updated_at' => now()])
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_subjects');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('school_classes');
    }
};
