<?php

namespace Database\Seeders;

use App\Models\Holiday;
use App\Models\LeaveRequest;
use App\Models\StaffAttendance;
use App\Models\StudentAttendance;
use App\Models\AttendanceAuditLog;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttendanceSeeder extends Seeder
{
    /**
     * Seed realistic attendance data, holidays, and leave requests.
     */
    public function run(): void
    {
        // 1. Seed Holidays
        $holidays = [
            ['title' => "New Year's Day", 'date' => '2026-01-01', 'type' => 'National', 'description' => 'International New Year Holiday'],
            ['title' => 'Pakistan Day', 'date' => '2026-03-23', 'type' => 'National', 'description' => 'Resolution Day Celebration'],
            ['title' => 'Labor Day', 'date' => '2026-05-01', 'type' => 'National', 'description' => 'International Workers Day'],
            ['title' => 'Independence Day', 'date' => '2026-08-14', 'type' => 'National', 'description' => 'National Independence Celebration'],
            ['title' => 'Defense Day', 'date' => '2026-09-06', 'type' => 'National', 'description' => 'National Defense Day Commemoration'],
            ['title' => 'Autumn Term Break', 'date' => '2026-10-15', 'type' => 'Academic Break', 'description' => 'Mid-Semester Institutional Break'],
            ['title' => 'Iqbal Day', 'date' => '2026-11-09', 'type' => 'National', 'description' => 'National Poet Commemoration'],
            ['title' => 'Quaid-e-Azam Day & Winter Break', 'date' => '2026-12-25', 'type' => 'National', 'description' => 'Founder of the Nation Day'],
        ];

        foreach ($holidays as $h) {
            Holiday::updateOrCreate(['date' => $h['date']], $h);
        }

        // 2. Seed Approved and Pending Leave Requests
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        $leaves = [
            [
                'applicant_type' => 'Student',
                'applicant_id' => 2,
                'applicant_name' => 'Sophia Martinez',
                'identifier' => '1002',
                'class_or_department' => 'Grade 10 - Section A',
                'start_date' => $yesterday->format('Y-m-d'),
                'end_date' => $today->copy()->addDays(1)->format('Y-m-d'),
                'days_count' => 3,
                'leave_type' => 'Sick / Medical',
                'reason' => 'Severe viral flu and medical rest advised by pediatrician.',
                'status' => 'Approved',
                'approved_by_name' => 'Principal Vance',
                'admin_notes' => 'Medical certificate verified and archived.',
            ],
            [
                'applicant_type' => 'Student',
                'applicant_id' => 3,
                'applicant_name' => 'Liam Johnson',
                'identifier' => '1003',
                'class_or_department' => 'Grade 10 - Section A',
                'start_date' => $today->copy()->addDays(3)->format('Y-m-d'),
                'end_date' => $today->copy()->addDays(4)->format('Y-m-d'),
                'days_count' => 2,
                'leave_type' => 'Family Emergency',
                'reason' => 'Attending family bereavement outside the city.',
                'status' => 'Pending',
                'approved_by_name' => null,
                'admin_notes' => null,
            ],
            [
                'applicant_type' => 'Staff',
                'applicant_id' => 1,
                'applicant_name' => 'Dr. Robert Vance',
                'identifier' => 'EMP-101',
                'class_or_department' => 'Mathematics',
                'start_date' => $today->copy()->subDays(2)->format('Y-m-d'),
                'end_date' => $today->copy()->subDays(1)->format('Y-m-d'),
                'days_count' => 2,
                'leave_type' => 'Academic / Sports Event',
                'reason' => 'Keynote speaker at National STEM Mathematics Symposium.',
                'status' => 'Approved',
                'approved_by_name' => 'Super Admin',
                'admin_notes' => 'Official institutional sponsorship granted.',
            ],
            [
                'applicant_type' => 'Staff',
                'applicant_id' => 2,
                'applicant_name' => 'Ms. Eleanor Vance',
                'identifier' => 'EMP-102',
                'class_or_department' => 'Science',
                'start_date' => $today->copy()->addDays(2)->format('Y-m-d'),
                'end_date' => $today->copy()->addDays(2)->format('Y-m-d'),
                'days_count' => 1,
                'leave_type' => 'Casual',
                'reason' => 'Personal urgent errands at municipal bureau.',
                'status' => 'Pending',
                'approved_by_name' => null,
                'admin_notes' => null,
            ]
        ];

        foreach ($leaves as $l) {
            LeaveRequest::updateOrCreate(
                [
                    'applicant_type' => $l['applicant_type'],
                    'applicant_id' => $l['applicant_id'],
                    'start_date' => $l['start_date'],
                ],
                $l
            );
        }

        // 3. Seed Past 25 Days Attendance for Grade 10 - Section A
        // Students in Grade 10:
        $students = [
            ['id' => 1, 'name' => 'Alexander Wright', 'roll' => '1001', 'class' => 'Grade 10', 'section' => 'Section A'],
            ['id' => 2, 'name' => 'Sophia Martinez', 'roll' => '1002', 'class' => 'Grade 10', 'section' => 'Section A'],
            ['id' => 3, 'name' => 'Liam Johnson', 'roll' => '1003', 'class' => 'Grade 10', 'section' => 'Section A'],
            ['id' => 4, 'name' => 'Emma Watson', 'roll' => '1004', 'class' => 'Grade 10', 'section' => 'Section A'],
            ['id' => 5, 'name' => 'Ethan Hunt', 'roll' => '1005', 'class' => 'Grade 10', 'section' => 'Section A'],
            ['id' => 6, 'name' => 'Olivia Brown', 'roll' => '1006', 'class' => 'Grade 10', 'section' => 'Section A'],
            ['id' => 7, 'name' => 'Noah Davis', 'roll' => '1007', 'class' => 'Grade 10', 'section' => 'Section A'],
            ['id' => 8, 'name' => 'Ava Wilson', 'roll' => '1008', 'class' => 'Grade 10', 'section' => 'Section A'],
        ];

        // Seed weekdays for the past 25 days up to today
        $sophiaLeave = LeaveRequest::where('applicant_id', 2)->where('status', 'Approved')->first();

        for ($i = 25; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);

            // Skip weekends unless specifically testing makeup session
            if ($date->isWeekend()) {
                continue;
            }

            $dateStr = $date->format('Y-m-d');

            foreach ($students as $idx => $st) {
                $status = 'Present';
                $arrivalTime = '07:' . rand(45, 55) . ' AM';
                $minutesLate = 0;
                $leaveId = null;
                $remarks = null;

                // Special patterns to trigger corner cases and realistic analytics:
                // 1. Sophia has approved leave on yesterday and today
                if ($st['id'] === 2 && $dateStr >= $yesterday->format('Y-m-d') && $dateStr <= $today->format('Y-m-d')) {
                    $status = 'Excused Leave';
                    $arrivalTime = null;
                    $leaveId = $sophiaLeave?->id;
                    $remarks = 'Approved medical leave';
                }
                // 2. Emma Watson is a Chronic Absentee (>3 consecutive days absent, attendance < 75%)
                elseif ($st['id'] === 4) {
                    if ($i <= 4) {
                        $status = 'Absent';
                        $arrivalTime = null;
                        $remarks = 'Unexcused absence - consecutive day ' . (5 - $i);
                    } elseif ($i % 3 === 0) {
                        $status = 'Absent';
                        $arrivalTime = null;
                    }
                }
                // 3. Liam Johnson is occasionally Late
                elseif ($st['id'] === 3 && $i % 4 === 0) {
                    $status = 'Late';
                    $arrivalTime = '08:25 AM';
                    $minutesLate = 25;
                    $remarks = 'Transit bus breakdown';
                }
                // 4. Ethan Hunt had a Half-day last week
                elseif ($st['id'] === 5 && $i === 6) {
                    $status = 'Half-day';
                    $arrivalTime = '08:00 AM';
                    $remarks = 'Dental surgery scheduled for afternoon';
                }

                StudentAttendance::updateOrCreate(
                    [
                        'student_id' => $st['id'],
                        'attendance_date' => $dateStr,
                    ],
                    [
                        'student_name' => $st['name'],
                        'student_roll' => $st['roll'],
                        'class_name' => $st['class'],
                        'section' => $st['section'],
                        'status' => $status,
                        'half_day_session' => $status === 'Half-day' ? 'Morning' : null,
                        'arrival_time' => $arrivalTime,
                        'minutes_late' => $minutesLate,
                        'leave_request_id' => $leaveId,
                        'remarks' => $remarks,
                        'is_makeup_session' => false,
                        'marked_by_name' => 'Prof. Harrison',
                    ]
                );
            }
        }

        // 4. Seed Staff Attendance (Dr. Robert Vance, Ms. Eleanor Vance, Dr. Alan Grant)
        $staffMembers = [
            ['id' => 1, 'name' => 'Dr. Robert Vance', 'emp_id' => 'EMP-101', 'dept' => 'Mathematics'],
            ['id' => 2, 'name' => 'Ms. Eleanor Vance', 'emp_id' => 'EMP-102', 'dept' => 'Science'],
            ['id' => 3, 'name' => 'Dr. Alan Grant', 'emp_id' => 'EMP-103', 'dept' => 'Biology'],
            ['id' => 4, 'name' => 'Sarah Connor', 'emp_id' => 'EMP-104', 'dept' => 'Administration'],
        ];

        for ($i = 10; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            if ($date->isWeekend()) {
                continue;
            }
            $dateStr = $date->format('Y-m-d');

            foreach ($staffMembers as $stf) {
                $status = 'Present';
                $punchIn = '07:45 AM';
                $punchOut = '04:15 PM';
                $workHours = 8.5;
                $leaveId = null;
                $remarks = 'Normal shift';

                // Robert Vance had approved academic leave on days 2 and 1 ago
                if ($stf['id'] === 1 && in_array($i, [1, 2])) {
                    $status = 'Excused Leave';
                    $punchIn = null;
                    $punchOut = null;
                    $workHours = 0;
                    $remarks = 'Approved Academic Leave - Keynote';
                }

                StaffAttendance::updateOrCreate(
                    [
                        'staff_id' => $stf['id'],
                        'attendance_date' => $dateStr,
                    ],
                    [
                        'staff_name' => $stf['name'],
                        'employee_id' => $stf['emp_id'],
                        'department' => $stf['dept'],
                        'status' => $status,
                        'punch_in' => $punchIn,
                        'punch_out' => $punchOut,
                        'work_hours' => $workHours,
                        'leave_request_id' => $leaveId,
                        'remarks' => $remarks,
                        'marked_by_name' => 'Biometric Scanner / HR System',
                    ]
                );
            }
        }

        // 5. Seed Audit Log Example
        AttendanceAuditLog::create([
            'attendance_type' => 'Student',
            'attendance_id' => 3,
            'target_name' => 'Liam Johnson',
            'attendance_date' => Carbon::today()->subDays(4)->format('Y-m-d'),
            'previous_status' => 'Absent',
            'new_status' => 'Late',
            'changed_by_name' => 'Admin (Principal)',
            'reason' => 'Parent produced verifiable transit delay slip.',
        ]);
    }
}
