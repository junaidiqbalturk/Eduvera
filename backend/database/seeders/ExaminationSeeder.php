<?php

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\ExamMark;
use App\Models\Student;
use Illuminate\Database\Seeder;

class ExaminationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seed Exam Terms
        $exams = [
            [
                'id' => 1,
                'name' => 'Mid-Term Examinations 2025',
                'academic_year' => '2025-2026',
                'start_date' => '2025-10-15',
                'end_date' => '2025-10-28',
                'status' => 'Upcoming',
                'description' => 'Mid-term standardized institutional assessments for Semester 1.',
            ],
            [
                'id' => 2,
                'name' => 'Final Term Examinations 2025',
                'academic_year' => '2024-2025',
                'start_date' => '2025-03-01',
                'end_date' => '2025-03-20',
                'status' => 'Completed',
                'description' => 'Annual summative evaluation and promotion examinations.',
            ],
            [
                'id' => 3,
                'name' => 'First Assessment Test',
                'academic_year' => '2025-2026',
                'start_date' => '2025-09-05',
                'end_date' => '2025-09-10',
                'status' => 'Completed',
                'description' => 'Diagnostic quiz and unit tests for foundation evaluation.',
            ],
        ];

        foreach ($exams as $ex) {
            Exam::updateOrCreate(['id' => $ex['id']], $ex);
        }

        // 2. Seed Sample Marks for Final Term Examinations 2025 (exam_id = 2)
        $students = Student::all();
        $subjects = [
            ['code' => 'MATH-101', 'name' => 'Mathematics'],
            ['code' => 'PHYS-101', 'name' => 'Physics'],
            ['code' => 'CHEM-101', 'name' => 'Chemistry'],
            ['code' => 'ENG-101', 'name' => 'English Literature'],
            ['code' => 'CS-101', 'name' => 'Computer Science'],
        ];

        foreach ($students as $st) {
            foreach ($subjects as $idx => $sub) {
                // Generate realistic marks between 70 and 99
                $baseMark = 85 + (($st->id * 3 + $idx * 4) % 14);
                if ($baseMark > 99) $baseMark = 98;
                $calc = ExamMark::calculateGradeAndGpa($baseMark, 100);

                ExamMark::updateOrCreate(
                    [
                        'exam_id' => 2,
                        'student_id' => $st->id,
                        'subject_code' => $sub['code'],
                    ],
                    [
                        'student_name' => $st->first_name . ' ' . $st->last_name,
                        'student_roll' => $st->roll_no,
                        'class_name' => $st->class_name,
                        'section' => $st->section,
                        'subject_name' => $sub['name'],
                        'marks_obtained' => $baseMark,
                        'max_marks' => 100.00,
                        'grade' => $calc['grade'],
                        'gpa_point' => $calc['gpa_point'],
                        'remarks' => 'Good academic proficiency demonstrated.',
                    ]
                );
            }
        }
    }
}
