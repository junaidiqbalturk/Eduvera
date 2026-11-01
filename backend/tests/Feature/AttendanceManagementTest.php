<?php

namespace Tests\Feature;

use App\Models\AttendanceAuditLog;
use App\Models\Holiday;
use App\Models\LeaveRequest;
use App\Models\StaffAttendance;
use App\Models\StudentAttendance;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

class AttendanceManagementTest extends TestCase
{
    protected string $adminToken;
    protected string $academicToken;
    protected string $hrToken;
    protected string $financeToken;

    protected function setUp(): void
    {
        parent::setUp();

        $admin = User::where('email', 'admin@eduvera.school')->first();
        $this->adminToken = $admin ? $admin->api_token : '';

        $academic = User::where('email', 'academic@eduvera.school')->first();
        $this->academicToken = $academic ? $academic->api_token : '';

        $hr = User::where('email', 'hr@eduvera.school')->first();
        $this->hrToken = $hr ? $hr->api_token : '';

        $finance = User::where('email', 'finance@eduvera.school')->first();
        $this->financeToken = $finance ? $finance->api_token : '';
    }

    /**
     * Test 1: Attendance Summary returns KPI metrics and weekly trend
     */
    public function test_get_summary_returns_kpi_metrics(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->getJson('/api/v1/attendance/summary');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'date',
                    'class_name',
                    'total_students',
                    'total_marked',
                    'present',
                    'absent',
                    'late',
                    'half_day',
                    'excused_leave',
                    'attendance_rate',
                    'staff_summary',
                    'pending_leaves_count',
                    'chronic_absentees_count',
                    'weekly_trend',
                ],
            ]);
    }

    /**
     * Test 2: Class student sheet returns roster and holiday detection
     */
    public function test_get_student_sheet_returns_roster_and_holiday_meta(): void
    {
        $todayStr = Carbon::today()->format('Y-m-d');
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->getJson("/api/v1/attendance/students/sheet?class_name=Grade+10&section=Section+A&date={$todayStr}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'date',
                    'class_name',
                    'section',
                    'is_future',
                    'is_weekend',
                    'is_holiday',
                    'roster',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.roster'));
    }

    /**
     * Test 3: Future date attendance recording is strictly rejected (HTTP 422)
     */
    public function test_future_date_attendance_is_strictly_rejected(): void
    {
        $futureDate = Carbon::tomorrow()->addDays(2)->format('Y-m-d');

        $payload = [
            'attendance_date' => $futureDate,
            'class_name' => 'Grade 10',
            'section' => 'Section A',
            'records' => [
                [
                    'student_id' => 1,
                    'student_name' => 'Alexander Wright',
                    'student_roll' => '1001',
                    'status' => 'Present',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->postJson('/api/v1/attendance/students/mark', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertStringContainsString('future date', strtolower($response->json('message')));
    }

    /**
     * Test 4: Holiday or weekend marking without make-up session flag is rejected (HTTP 422)
     */
    public function test_holiday_marking_without_makeup_flag_is_rejected(): void
    {
        // Pick a past weekend date (e.g. past Sunday)
        $pastSunday = Carbon::today()->previous(Carbon::SUNDAY)->format('Y-m-d');

        $payload = [
            'attendance_date' => $pastSunday,
            'class_name' => 'Grade 10',
            'section' => 'Section A',
            'is_makeup_session' => false,
            'records' => [
                [
                    'student_id' => 1,
                    'student_name' => 'Alexander Wright',
                    'student_roll' => '1001',
                    'status' => 'Present',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->postJson('/api/v1/attendance/students/mark', $payload);

        $response->assertStatus(422);
        $this->assertStringContainsString('make-up session', strtolower($response->json('message')));
    }

    /**
     * Test 5: Setting is_makeup_session = true allows attendance recording on holiday/weekend
     */
    public function test_makeup_session_flag_allows_holiday_attendance(): void
    {
        $pastSunday = Carbon::today()->previous(Carbon::SUNDAY)->format('Y-m-d');

        $payload = [
            'attendance_date' => $pastSunday,
            'class_name' => 'Grade 10',
            'section' => 'Section A',
            'is_makeup_session' => true,
            'override_reason' => 'Authorized examination coaching session',
            'records' => [
                [
                    'student_id' => 1,
                    'student_name' => 'Alexander Wright',
                    'student_roll' => '1001',
                    'status' => 'Present',
                    'arrival_time' => '08:00 AM',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->postJson('/api/v1/attendance/students/mark', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('student_attendances', [
            'student_id' => 1,
            'attendance_date' => $pastSunday,
            'is_makeup_session' => true,
        ]);
    }

    /**
     * Test 6: Idempotent upsert prevents duplicate rows for (student_id, attendance_date)
     */
    public function test_idempotent_upsert_prevents_duplicate_records(): void
    {
        // Use a past weekday
        $targetDate = Carbon::today()->isWeekend() ? Carbon::today()->previous(Carbon::FRIDAY)->format('Y-m-d') : Carbon::today()->format('Y-m-d');

        $initialCount = StudentAttendance::where('student_id', 1)->where('attendance_date', $targetDate)->count();

        $payload = [
            'attendance_date' => $targetDate,
            'class_name' => 'Grade 10',
            'section' => 'Section A',
            'is_makeup_session' => true,
            'records' => [
                [
                    'student_id' => 1,
                    'student_name' => 'Alexander Wright',
                    'student_roll' => '1001',
                    'status' => 'Present',
                    'arrival_time' => '07:55 AM',
                ],
            ],
        ];

        // First post
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->postJson('/api/v1/attendance/students/mark', $payload);
        $res1->assertStatus(200);

        // Second post with updated status to Late
        $payload['records'][0]['status'] = 'Late';
        $payload['records'][0]['arrival_time'] = '08:20 AM';
        $payload['records'][0]['minutes_late'] = 20;

        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->postJson('/api/v1/attendance/students/mark', $payload);
        $res2->assertStatus(200);

        // Verify exactly 1 record exists in DB, not 2
        $finalCount = StudentAttendance::where('student_id', 1)->where('attendance_date', $targetDate)->count();
        $this->assertEquals(1, $finalCount);

        // Verify status updated to Late
        $record = StudentAttendance::where('student_id', 1)->where('attendance_date', $targetDate)->first();
        $this->assertEquals('Late', $record->status);
        $this->assertEquals(20, $record->minutes_late);
    }

    /**
     * Test 7: Approved Leave automatically tags student as Excused Leave
     */
    public function test_approved_leave_prepopulates_and_locks_status(): void
    {
        // Check Sophia Martinez (ID 2) who has approved leave seeded
        $yesterday = Carbon::yesterday()->format('Y-m-d');

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->getJson("/api/v1/attendance/students/sheet?class_name=Grade+10&section=Section+A&date={$yesterday}");

        $response->assertStatus(200);
        $roster = $response->json('data.roster');

        $sophia = collect($roster)->firstWhere('student_id', 2);
        $this->assertNotNull($sophia);
        $this->assertEquals('Excused Leave', $sophia['status']);
        $this->assertTrue($sophia['is_leave_locked']);
    }

    /**
     * Test 8: Status modification logs audit trail in attendance_audit_logs
     */
    public function test_status_change_creates_audit_log(): void
    {
        $targetDate = Carbon::today()->isWeekend() ? Carbon::today()->previous(Carbon::FRIDAY)->format('Y-m-d') : Carbon::today()->format('Y-m-d');

        // Ensure record exists
        StudentAttendance::updateOrCreate(
            ['student_id' => 3, 'attendance_date' => $targetDate],
            [
                'student_name' => 'Liam Johnson',
                'student_roll' => '1003',
                'class_name' => 'Grade 10',
                'section' => 'Section A',
                'status' => 'Present',
                'marked_by_name' => 'Teacher',
            ]
        );

        $initialLogs = AttendanceAuditLog::where('attendance_date', $targetDate)->where('target_name', 'Liam Johnson')->count();

        // Update status to Absent
        $payload = [
            'attendance_date' => $targetDate,
            'class_name' => 'Grade 10',
            'section' => 'Section A',
            'is_makeup_session' => true,
            'override_reason' => 'Updated by coordinator after morning roll-call review',
            'records' => [
                [
                    'student_id' => 3,
                    'student_name' => 'Liam Johnson',
                    'student_roll' => '1003',
                    'status' => 'Absent',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/attendance/students/mark', $payload);

        $response->assertStatus(200);

        $newLogs = AttendanceAuditLog::where('attendance_date', $targetDate)->where('target_name', 'Liam Johnson')->count();
        $this->assertGreaterThan($initialLogs, $newLogs);
    }

    /**
     * Test 9: Chronic Absentees detection identifies high-risk students
     */
    public function test_chronic_absentees_detection(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->getJson('/api/v1/attendance/chronic-absentees?class_name=Grade+10');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'student_id',
                        'name',
                        'roll_no',
                        'class_name',
                        'guardian_name',
                        'guardian_phone',
                        'attendance_rate',
                        'consecutive_absent_days',
                        'severity',
                        'reasons',
                    ],
                ],
            ]);

        // Emma Watson was seeded with consecutive absences
        $flagged = collect($response->json('data'));
        $emma = $flagged->firstWhere('student_id', 4);
        $this->assertNotNull($emma, 'Emma Watson should be flagged for chronic / consecutive absence');
    }

    /**
     * Test 10: Staff attendance sheet and punch in/out recording
     */
    public function test_staff_attendance_and_work_hours_recording(): void
    {
        $targetDate = Carbon::today()->isWeekend() ? Carbon::today()->previous(Carbon::FRIDAY)->format('Y-m-d') : Carbon::today()->format('Y-m-d');

        $payload = [
            'attendance_date' => $targetDate,
            'records' => [
                [
                    'staff_id' => 1,
                    'staff_name' => 'Dr. Robert Vance',
                    'employee_id' => 'EMP-101',
                    'department' => 'Mathematics',
                    'status' => 'Present',
                    'punch_in' => '07:45 AM',
                    'punch_out' => '04:15 PM',
                    'work_hours' => 8.5,
                    'remarks' => 'Full faculty duty',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->hrToken)
            ->postJson('/api/v1/attendance/staff/mark', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('staff_attendances', [
            'staff_id' => 1,
            'attendance_date' => $targetDate,
            'status' => 'Present',
            'work_hours' => 8.5,
        ]);
    }

    /**
     * Test 11: Leave approval automatically updates existing attendances in the date window
     */
    public function test_leave_approval_updates_attendance_window(): void
    {
        $targetDate = Carbon::today()->isWeekend() ? Carbon::today()->previous(Carbon::FRIDAY)->format('Y-m-d') : Carbon::today()->format('Y-m-d');

        // Create initial attendance as Absent
        StudentAttendance::updateOrCreate(
            ['student_id' => 5, 'attendance_date' => $targetDate],
            [
                'student_name' => 'Ethan Hunt',
                'student_roll' => '1005',
                'class_name' => 'Grade 10',
                'section' => 'Section A',
                'status' => 'Absent',
                'marked_by_name' => 'Teacher',
            ]
        );

        // Submit a leave request for Ethan
        $leave = LeaveRequest::create([
            'applicant_type' => 'Student',
            'applicant_id' => 5,
            'applicant_name' => 'Ethan Hunt',
            'identifier' => '1005',
            'class_or_department' => 'Grade 10 - Section A',
            'start_date' => $targetDate,
            'end_date' => $targetDate,
            'days_count' => 1,
            'leave_type' => 'Sick / Medical',
            'reason' => 'Emergency dental appointment',
            'status' => 'Pending',
        ]);

        // Approve the leave request
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->patchJson("/api/v1/attendance/leaves/{$leave->id}/status", [
                'status' => 'Approved',
                'admin_notes' => 'Medical certificate provided and verified.',
            ]);

        $response->assertStatus(200);

        // Verify that Ethan's attendance on $targetDate is now 'Excused Leave'
        $att = StudentAttendance::where('student_id', 5)->where('attendance_date', $targetDate)->first();
        $this->assertEquals('Excused Leave', $att->status);
        $this->assertEquals($leave->id, $att->leave_request_id);
    }

    /**
     * Test 12: Monthly matrix (1-31 grid) returns formatted calendar columns
     */
    public function test_get_student_matrix_returns_monthly_grid(): void
    {
        $curMonth = Carbon::today()->month;
        $curYear = Carbon::today()->year;

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->getJson("/api/v1/attendance/students/matrix?class_name=Grade+10&section=Section+A&month={$curMonth}&year={$curYear}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'month',
                    'month_name',
                    'year',
                    'class_name',
                    'section',
                    'total_school_days',
                    'days_meta',
                    'students' => [
                        '*' => [
                            'student_id',
                            'name',
                            'roll_no',
                            'daily_statuses',
                            'present_days',
                            'absent_days',
                            'late_days',
                            'leave_days',
                            'attendance_pct',
                            'is_chronic',
                        ],
                    ],
                ],
            ]);
    }
}
