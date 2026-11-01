<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamMark;
use App\Models\Student;
use App\Models\User;
use Tests\TestCase;

class ExaminationMarksTest extends TestCase
{
    protected string $adminToken;
    protected string $academicToken;

    protected function setUp(): void
    {
        parent::setUp();

        $admin = User::where('email', 'admin@eduvera.school')->first();
        $this->adminToken = $admin ? $admin->api_token : '';

        $academic = User::where('email', 'academic@eduvera.school')->first();
        $this->academicToken = $academic ? $academic->api_token : '';
    }

    /**
     * Test retrieving exam terms list
     */
    public function test_get_exams_list(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/examinations/exams');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'academic_year',
                        'start_date',
                        'end_date',
                        'status',
                    ],
                ],
            ]);

        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    /**
     * Test marks entry sheet retrieval for class section & subject
     */
    public function test_get_marks_entry_sheet(): void
    {
        $exam = Exam::first();
        $this->assertNotNull($exam);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->getJson('/api/v1/examinations/marks/sheet?exam_id=' . $exam->id . '&class_name=Grade 10&section=Section A&subject_code=MATH-101');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'exam',
                    'class_name',
                    'section',
                    'subject_code',
                    'roster' => [
                        '*' => [
                            'student_id',
                            'student_name',
                            'marks_obtained',
                            'max_marks',
                            'grade',
                            'gpa_point',
                        ],
                    ],
                ],
            ]);
    }

    /**
     * Test saving student marks with automatic letter-grade and GPA calculation
     */
    public function test_save_marks_with_dynamic_gpa(): void
    {
        $exam = Exam::first();
        $student = Student::first();
        $this->assertNotNull($exam);
        $this->assertNotNull($student);

        $payload = [
            'exam_id' => $exam->id,
            'class_name' => 'Grade 10',
            'section' => 'Section A',
            'subject_code' => 'PHYS-101',
            'subject_name' => 'Physics',
            'records' => [
                [
                    'student_id' => $student->id,
                    'marks_obtained' => 94.50,
                    'max_marks' => 100.00,
                    'remarks' => 'Outstanding lab performance',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->postJson('/api/v1/examinations/marks/save', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Verify grade & gpa in database
        $this->assertDatabaseHas('exam_marks', [
            'exam_id' => $exam->id,
            'student_id' => $student->id,
            'subject_code' => 'PHYS-101',
            'grade' => 'A+',
            'gpa_point' => 4.00,
        ]);
    }

    /**
     * Test loading comprehensive student marksheet / report card
     */
    public function test_get_student_marksheet(): void
    {
        $student = Student::first();
        $this->assertNotNull($student);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/examinations/marksheet/' . $student->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'student_id',
                    'student_name',
                    'class',
                    'exam_name',
                    'gpa',
                    'overall_grade',
                    'total_marks',
                    'max_marks',
                    'subjects' => [
                        '*' => [
                            'subject_code',
                            'subject',
                            'marks_obtained',
                            'max_marks',
                            'grade',
                            'gpa_point',
                        ],
                    ],
                ],
            ]);
    }
}
