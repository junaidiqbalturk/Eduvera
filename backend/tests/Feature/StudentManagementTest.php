<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Tests\TestCase;

class StudentManagementTest extends TestCase
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
     * Test listing students returns records from MySQL
     */
    public function test_get_students_list(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/students');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'admission_no',
                        'first_name',
                        'last_name',
                        'gender',
                        'class',
                        'section',
                        'roll_no',
                        'status',
                    ],
                ],
            ]);

        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    /**
     * Test filtering students by class name
     */
    public function test_filter_students_by_class(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/students?class_name=Grade 10');

        $response->assertStatus(200);
        $data = $response->json('data');

        foreach ($data as $st) {
            $this->assertEquals('Grade 10', $st['class']);
        }
    }

    /**
     * Test student enrollment (POST /api/v1/students) creates record in MySQL
     */
    public function test_enroll_new_student_success(): void
    {
        $payload = [
            'first_name' => 'Lucas',
            'last_name' => 'Mendoza',
            'gender' => 'Male',
            'dob' => '2010-03-25',
            'blood_group' => 'B+',
            'class_name' => 'Grade 9',
            'section' => 'Section A',
            'guardian_name' => 'Carlos Mendoza',
            'guardian_relation' => 'Father',
            'guardian_phone' => '+1 (555) 999-8888',
            'guardian_email' => 'carlos.m@example.com',
            'address' => '500 Maple St, Cityville',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/students', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'first_name' => 'Lucas',
                    'last_name' => 'Mendoza',
                    'class' => 'Grade 9',
                    'status' => 'Active',
                ],
            ]);

        $studentData = $response->json('data');
        $this->assertNotEmpty($studentData['admission_no']);
        $this->assertNotEmpty($studentData['roll_no']);

        // Verify in MySQL
        $this->assertDatabaseHas('students', [
            'first_name' => 'Lucas',
            'last_name' => 'Mendoza',
            'guardian_phone' => '+1 (555) 999-8888',
        ]);
    }

    /**
     * Test student enrollment validation failure
     */
    public function test_enroll_student_validation_failure(): void
    {
        // Missing required guardian and names
        $payload = [
            'first_name' => '',
            'class_name' => 'Grade 10',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/students', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * Test retrieving student profile
     */
    public function test_get_student_profile(): void
    {
        $student = Student::first();
        $this->assertNotNull($student);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/students/' . $student->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'admission_no',
                    'first_name',
                    'last_name',
                    'academic_record' => [
                        'gpa',
                        'attendance_percentage',
                    ],
                ],
            ]);
    }

    /**
     * Test updating student record
     */
    public function test_update_student_record(): void
    {
        $student = Student::where('first_name', 'Lucas')->first() ?? Student::first();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson('/api/v1/students/' . $student->id, [
                'guardian_phone' => '+1 (555) 777-6666',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'guardian_phone' => '+1 (555) 777-6666',
        ]);
    }
}
