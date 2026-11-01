<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceAuditLog;
use App\Models\Holiday;
use App\Models\LeaveRequest;
use App\Models\StaffAttendance;
use App\Models\StudentAttendance;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends Controller
{
    use ApiResponseTrait;

    /**
     * Default Student Roster Definition
     */
    protected array $defaultStudents = [
        ['id' => 1, 'name' => 'Alexander Wright', 'roll' => '1001', 'class' => 'Grade 10', 'section' => 'Section A', 'guardian_name' => 'Michael Wright', 'guardian_phone' => '+1 (555) 234-5678'],
        ['id' => 2, 'name' => 'Sophia Martinez', 'roll' => '1002', 'class' => 'Grade 10', 'section' => 'Section A', 'guardian_name' => 'Elena Martinez', 'guardian_phone' => '+1 (555) 876-5432'],
        ['id' => 3, 'name' => 'Liam Johnson', 'roll' => '1003', 'class' => 'Grade 10', 'section' => 'Section A', 'guardian_name' => 'David Johnson', 'guardian_phone' => '+1 (555) 345-6789'],
        ['id' => 4, 'name' => 'Emma Watson', 'roll' => '1004', 'class' => 'Grade 10', 'section' => 'Section A', 'guardian_name' => 'Arthur Watson', 'guardian_phone' => '+1 (555) 901-2345'],
        ['id' => 5, 'name' => 'Ethan Hunt', 'roll' => '1005', 'class' => 'Grade 10', 'section' => 'Section A', 'guardian_name' => 'Sarah Hunt', 'guardian_phone' => '+1 (555) 678-9012'],
        ['id' => 6, 'name' => 'Olivia Brown', 'roll' => '1006', 'class' => 'Grade 10', 'section' => 'Section A', 'guardian_name' => 'Thomas Brown', 'guardian_phone' => '+1 (555) 789-0123'],
        ['id' => 7, 'name' => 'Noah Davis', 'roll' => '1007', 'class' => 'Grade 10', 'section' => 'Section A', 'guardian_name' => 'Catherine Davis', 'guardian_phone' => '+1 (555) 890-1234'],
        ['id' => 8, 'name' => 'Ava Wilson', 'roll' => '1008', 'class' => 'Grade 10', 'section' => 'Section A', 'guardian_name' => 'James Wilson', 'guardian_phone' => '+1 (555) 901-5678'],
    ];

    /**
     * Default Staff Roster Definition
     */
    protected array $defaultStaff = [
        ['id' => 1, 'name' => 'Dr. Robert Vance', 'emp_id' => 'EMP-101', 'department' => 'Mathematics', 'role' => 'Senior HOD'],
        ['id' => 2, 'name' => 'Ms. Eleanor Vance', 'emp_id' => 'EMP-102', 'department' => 'Science', 'role' => 'Physics Teacher'],
        ['id' => 3, 'name' => 'Dr. Alan Grant', 'emp_id' => 'EMP-103', 'department' => 'Biology', 'role' => 'Biology Professor'],
        ['id' => 4, 'name' => 'Sarah Connor', 'emp_id' => 'EMP-104', 'department' => 'Administration', 'role' => 'Registrar'],
        ['id' => 5, 'name' => 'Marcus Aurelius', 'emp_id' => 'EMP-105', 'department' => 'Humanities', 'role' => 'Philosophy & History'],
    ];

    /**
     * 1. Overall Attendance Analytics Summary
     */
    public function getSummary(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        $className = $request->query('class_name', 'Grade 10');

        if (!$isDemo) {
            return $this->successResponse([
                'date' => $date,
                'class_name' => $className,
                'total_students' => 0,
                'total_marked' => 0,
                'present' => 0,
                'absent' => 0,
                'late' => 0,
                'half_day' => 0,
                'excused' => 0,
                'attendance_rate' => '0.0%',
                'staff_present' => 0,
                'staff_total' => 0,
                'pending_leaves' => 0,
                'chronic_absentees' => 0,
                'weekly_trend' => [],
            ], 'Attendance summary retrieved successfully');
        }

        $query = StudentAttendance::where('attendance_date', $date);
        if ($className && $className !== 'All') {
            $query->where('class_name', $className);
        }

        $records = $query->get();
        $totalMarked = $records->count();

        $presentCount = $records->where('status', 'Present')->count();
        $absentCount = $records->where('status', 'Absent')->count();
        $lateCount = $records->where('status', 'Late')->count();
        $halfDayCount = $records->where('status', 'Half-day')->count();
        $excusedCount = $records->where('status', 'Excused Leave')->count();

        $effectivePresent = $presentCount + $lateCount + ($halfDayCount * 0.5);
        $attendanceRate = $totalMarked > 0 
            ? round(($effectivePresent / $totalMarked) * 100, 1) . '%' 
            : '0.0%';

        // Staff attendance today
        $staffRecords = StaffAttendance::where('attendance_date', $date)->get();
        $staffPresent = $staffRecords->whereIn('status', ['Present', 'Late', 'On Duty'])->count();
        $staffTotal = max($staffRecords->count(), count($this->defaultStaff));

        // Pending leaves count
        $pendingLeavesCount = LeaveRequest::where('status', 'Pending')->count();

        // Chronic absentees count (< 75% attendance in past 30 days)
        $chronicCount = count($this->calculateChronicAbsentees());

        // Weekly 7-day attendance trend
        $weeklyTrend = [];
        for ($d = 6; $d >= 0; $d--) {
            $trendDate = Carbon::today()->subDays($d);
            $trendDateStr = $trendDate->format('Y-m-d');
            $dayRecords = StudentAttendance::where('attendance_date', $trendDateStr)->get();
            $dPresent = $dayRecords->whereIn('status', ['Present', 'Late'])->count();
            $dAbsent = $dayRecords->where('status', 'Absent')->count();
            $weeklyTrend[] = [
                'day' => $trendDate->format('D'),
                'date' => $trendDateStr,
                'present' => $dPresent,
                'absent' => $dAbsent,
                'is_weekend' => $trendDate->isWeekend(),
            ];
        }

        return $this->successResponse([
            'date' => $date,
            'class_name' => $className,
            'total_students' => count($this->defaultStudents),
            'total_marked' => $totalMarked,
            'present' => $presentCount,
            'absent' => $absentCount,
            'late' => $lateCount,
            'half_day' => $halfDayCount,
            'excused_leave' => $excusedCount,
            'attendance_rate' => $attendanceRate,
            'staff_summary' => [
                'total' => $staffTotal,
                'present' => $staffPresent,
                'absent' => max(0, $staffTotal - $staffPresent),
            ],
            'pending_leaves_count' => $pendingLeavesCount,
            'chronic_absentees_count' => $chronicCount,
            'weekly_trend' => $weeklyTrend,
        ], 'Attendance summary loaded successfully');
    }

    /**
     * 2. Daily Student Attendance Sheet
     * Handles holiday detection, weekend warnings, and approved leave pre-population.
     */
    public function getStudentSheet(Request $request): JsonResponse
    {
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        $className = $request->query('class_name', 'Grade 10');
        $section = $request->query('section', 'Section A');

        $carbonDate = Carbon::parse($date);
        $isFuture = $carbonDate->isFuture() && $date > Carbon::today()->format('Y-m-d');
        $isWeekend = $carbonDate->isWeekend();

        // Check for registered holiday
        $holiday = Holiday::where('date', $date)->first();
        $isHoliday = $holiday !== null;

        // Fetch existing records for this class & date
        $existingRecords = StudentAttendance::where('class_name', $className)
            ->where('section', $section)
            ->where('attendance_date', $date)
            ->get()
            ->keyBy('student_id');

        $roster = [];

        foreach ($this->defaultStudents as $student) {
            $studentId = $student['id'];
            $existing = $existingRecords->get($studentId);

            // Check if student has an approved leave request on this date
            $approvedLeave = LeaveRequest::where('applicant_type', 'Student')
                ->where('applicant_id', $studentId)
                ->where('status', 'Approved')
                ->whereDate('start_date', '<=', $date)
                ->whereDate('end_date', '>=', $date)
                ->first();

            if ($existing) {
                $status = $existing->status;
                $arrivalTime = $existing->arrival_time;
                $minutesLate = $existing->minutes_late;
                $halfDaySession = $existing->half_day_session;
                $remarks = $existing->remarks;
                $isLocked = ($approvedLeave !== null);
                $leaveReason = $approvedLeave ? $approvedLeave->reason : null;
            } elseif ($approvedLeave) {
                // Pre-populate with Excused Leave and lock status
                $status = 'Excused Leave';
                $arrivalTime = null;
                $minutesLate = 0;
                $halfDaySession = null;
                $remarks = 'Approved Leave: ' . $approvedLeave->leave_type;
                $isLocked = true;
                $leaveReason = $approvedLeave->reason;
            } else {
                // Default fresh sheet: Present
                $status = 'Present';
                $arrivalTime = '07:50 AM';
                $minutesLate = 0;
                $halfDaySession = null;
                $remarks = '';
                $isLocked = false;
                $leaveReason = null;
            }

            $roster[] = [
                'student_id' => $studentId,
                'name' => $student['name'],
                'roll_no' => $student['roll'],
                'class_name' => $student['class'],
                'section' => $student['section'],
                'guardian_name' => $student['guardian_name'],
                'guardian_phone' => $student['guardian_phone'],
                'status' => $status,
                'arrival_time' => $arrivalTime,
                'minutes_late' => $minutesLate,
                'half_day_session' => $halfDaySession,
                'remarks' => $remarks,
                'is_leave_locked' => $isLocked,
                'leave_reason' => $leaveReason,
                'is_already_marked' => ($existing !== null),
            ];
        }

        return $this->successResponse([
            'date' => $date,
            'class_name' => $className,
            'section' => $section,
            'is_future' => $isFuture,
            'is_weekend' => $isWeekend,
            'is_holiday' => $isHoliday,
            'holiday_title' => $holiday ? $holiday->title : ($isWeekend ? 'Weekend Break' : null),
            'holiday_type' => $holiday ? $holiday->type : ($isWeekend ? 'Weekend' : null),
            'roster' => $roster,
        ], 'Class attendance roster loaded');
    }

    /**
     * 3. Mark Student Attendance (Bulk / Single Upsert)
     * Enforces future date check, holiday warnings, late calculation, and audit trail.
     */
    public function markStudentAttendance(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'attendance_date' => 'required|date_format:Y-m-d',
            'class_name' => 'required|string',
            'section' => 'nullable|string',
            'records' => 'required|array|min:1',
            'records.*.student_id' => 'required|integer',
            'records.*.student_name' => 'required|string',
            'records.*.student_roll' => 'required|string',
            'records.*.status' => 'required|in:Present,Absent,Late,Half-day,Excused Leave,Suspended',
            'records.*.arrival_time' => 'nullable|string',
            'records.*.minutes_late' => 'nullable|integer',
            'records.*.half_day_session' => 'nullable|in:Morning,Afternoon',
            'records.*.remarks' => 'nullable|string',
            'is_makeup_session' => 'nullable|boolean',
            'override_reason' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error: ' . $validator->errors()->first(), 422, $validator->errors());
        }

        $date = $request->input('attendance_date');
        $className = $request->input('class_name');
        $section = $request->input('section', 'Section A');
        $isMakeup = (bool) $request->input('is_makeup_session', false);
        $overrideReason = $request->input('override_reason');

        $carbonDate = Carbon::parse($date);
        $todayStr = Carbon::today()->format('Y-m-d');

        // CORNER CASE 1: Future Date Prevention
        if ($date > $todayStr) {
            return $this->errorResponse(
                "Cannot mark attendance for a future date ($date). Future attendance recording is strictly prohibited.",
                422
            );
        }

        // CORNER CASE 2: Holiday / Weekend Prevention without Make-up Session Confirmation
        $holiday = Holiday::where('date', $date)->first();
        $isWeekend = $carbonDate->isWeekend();

        if (($isHoliday = ($holiday !== null) || $isWeekend) && !$isMakeup) {
            $reason = $holiday ? "official holiday ('{$holiday->title}')" : "a scheduled weekend break";
            return $this->errorResponse(
                "Selected date ($date) is {$reason}. If conducting an authorized class, please enable 'Special Make-up Session' to record attendance.",
                422
            );
        }

        // CORNER CASE 3: Historical Backdating Limit (> 7 Days requires override reason)
        $sevenDaysAgo = Carbon::today()->subDays(7)->format('Y-m-d');
        if ($date < $sevenDaysAgo && empty($overrideReason)) {
            return $this->errorResponse(
                "Modifying historical attendance older than 7 days ($date) requires an administrative override reason.",
                422
            );
        }

        $records = $request->input('records');
        $user = $request->user();
        $markerName = $user ? $user->name : 'Teacher Harrison';

        DB::beginTransaction();
        try {
            $updatedCount = 0;

            foreach ($records as $item) {
                $studentId = $item['student_id'];
                $status = $item['status'];
                $arrivalTime = $item['arrival_time'] ?? null;
                $minutesLate = (int) ($item['minutes_late'] ?? 0);
                $halfDaySession = $item['half_day_session'] ?? null;
                $remarks = $item['remarks'] ?? null;

                // CORNER CASE 4: Late threshold calculation (if marked Late but minutes not given)
                if ($status === 'Late' && $minutesLate === 0 && !empty($arrivalTime)) {
                    // Standard school gate cutoff is 08:00 AM
                    try {
                        $parsedArrival = Carbon::createFromTimeString($arrivalTime);
                        $schoolStart = Carbon::createFromTimeString('08:00:00');
                        if ($parsedArrival->gt($schoolStart)) {
                            $minutesLate = $schoolStart->diffInMinutes($parsedArrival);
                        }
                    } catch (\Exception $e) {
                        $minutesLate = 15; // default fallback
                    }
                }

                // CORNER CASE 5: Check Approved Leave status protection
                $approvedLeave = LeaveRequest::where('applicant_type', 'Student')
                    ->where('applicant_id', $studentId)
                    ->where('status', 'Approved')
                    ->whereDate('start_date', '<=', $date)
                    ->whereDate('end_date', '>=', $date)
                    ->first();

                $leaveId = null;
                if ($approvedLeave) {
                    // If student has an approved medical/casual leave, keep as Excused Leave
                    $status = 'Excused Leave';
                    $leaveId = $approvedLeave->id;
                    $remarks = $remarks ?: 'Approved Leave: ' . $approvedLeave->reason;
                }

                // Check existing record for Audit Trail
                $existing = StudentAttendance::where('student_id', $studentId)
                    ->where('attendance_date', $date)
                    ->first();

                if ($existing && $existing->status !== $status) {
                    AttendanceAuditLog::create([
                        'attendance_type' => 'Student',
                        'attendance_id' => $existing->id,
                        'target_name' => $item['student_name'],
                        'attendance_date' => $date,
                        'previous_status' => $existing->status,
                        'new_status' => $status,
                        'changed_by_name' => $markerName,
                        'reason' => $overrideReason ?: 'Daily attendance update',
                    ]);
                }

                // Atomic Upsert (Unique Compound Key: student_id + attendance_date)
                StudentAttendance::updateOrCreate(
                    [
                        'student_id' => $studentId,
                        'attendance_date' => $date,
                    ],
                    [
                        'student_name' => $item['student_name'],
                        'student_roll' => $item['student_roll'],
                        'class_name' => $className,
                        'section' => $section,
                        'status' => $status,
                        'half_day_session' => $status === 'Half-day' ? ($halfDaySession ?: 'Morning') : null,
                        'arrival_time' => $status === 'Late' ? $arrivalTime : null,
                        'minutes_late' => $status === 'Late' ? $minutesLate : 0,
                        'leave_request_id' => $leaveId,
                        'remarks' => $remarks,
                        'is_makeup_session' => $isMakeup,
                        'marked_by_name' => $markerName,
                    ]
                );

                $updatedCount++;
            }

            DB::commit();

            return $this->successResponse([
                'updated_count' => $updatedCount,
                'date' => $date,
                'class_name' => $className,
                'is_makeup_session' => $isMakeup,
            ], "Attendance successfully recorded for {$updatedCount} students on {$date}.");
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to record attendance: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 4. Monthly Attendance Matrix (1–31 Grid View)
     */
    public function getStudentMatrix(Request $request): JsonResponse
    {
        $className = $request->query('class_name', 'Grade 10');
        $section = $request->query('section', 'Section A');
        $month = (int) $request->query('month', Carbon::today()->month);
        $year = (int) $request->query('year', Carbon::today()->year);

        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();
        $daysInMonth = $startDate->daysInMonth;

        // Fetch all holidays in this month
        $holidays = Holiday::whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get()
            ->keyBy(fn($h) => Carbon::parse($h->date)->format('Y-m-d'));

        // Fetch all attendance records for this class in this month
        $attendanceRecords = StudentAttendance::where('class_name', $className)
            ->where('section', $section)
            ->whereBetween('attendance_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get();

        $recordsGrouped = [];
        foreach ($attendanceRecords as $rec) {
            $recordsGrouped[$rec->student_id][$rec->attendance_date->format('Y-m-d')] = $rec;
        }

        // Build day header meta
        $daysMeta = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $curDate = Carbon::create($year, $month, $d);
            $curDateStr = $curDate->format('Y-m-d');
            $isWeekend = $curDate->isWeekend();
            $isHoliday = isset($holidays[$curDateStr]);

            $daysMeta[] = [
                'day' => $d,
                'date' => $curDateStr,
                'day_name' => $curDate->format('D'),
                'is_weekend' => $isWeekend,
                'is_holiday' => $isHoliday,
                'holiday_title' => $isHoliday ? $holidays[$curDateStr]->title : null,
            ];
        }

        // Student matrix rows
        $matrixRows = [];
        $totalSchoolDays = 0;
        foreach ($daysMeta as $dm) {
            if (!$dm['is_weekend'] && !$dm['is_holiday'] && $dm['date'] <= Carbon::today()->format('Y-m-d')) {
                $totalSchoolDays++;
            }
        }

        foreach ($this->defaultStudents as $student) {
            $studentId = $student['id'];
            $stRecords = $recordsGrouped[$studentId] ?? [];

            $dailyStatuses = [];
            $presentCount = 0;
            $absentCount = 0;
            $lateCount = 0;
            $halfDayCount = 0;
            $leaveCount = 0;

            foreach ($daysMeta as $dm) {
                $curDateStr = $dm['date'];
                $isFuture = $curDateStr > Carbon::today()->format('Y-m-d');

                if (isset($stRecords[$curDateStr])) {
                    $rec = $stRecords[$curDateStr];
                    $code = match ($rec->status) {
                        'Present' => 'P',
                        'Absent' => 'A',
                        'Late' => 'L',
                        'Half-day' => 'H',
                        'Excused Leave' => 'E',
                        'Suspended' => 'S',
                        default => 'P',
                    };

                    if ($rec->status === 'Present') $presentCount++;
                    elseif ($rec->status === 'Absent') $absentCount++;
                    elseif ($rec->status === 'Late') { $lateCount++; $presentCount++; }
                    elseif ($rec->status === 'Half-day') { $halfDayCount++; $presentCount += 0.5; }
                    elseif ($rec->status === 'Excused Leave') $leaveCount++;
                } else {
                    if ($dm['is_holiday']) {
                        $code = 'HD';
                    } elseif ($dm['is_weekend']) {
                        $code = 'W';
                    } elseif ($isFuture) {
                        $code = '-';
                    } else {
                        $code = 'A'; // unmarked past school day defaults to Absent
                        $absentCount++;
                    }
                }

                $dailyStatuses[$dm['day']] = [
                    'code' => $code,
                    'is_weekend' => $dm['is_weekend'],
                    'is_holiday' => $dm['is_holiday'],
                ];
            }

            $effectiveTotal = max(1, $totalSchoolDays - $leaveCount);
            $pct = round(($presentCount / $effectiveTotal) * 100, 1);

            $matrixRows[] = [
                'student_id' => $studentId,
                'name' => $student['name'],
                'roll_no' => $student['roll'],
                'daily_statuses' => $dailyStatuses,
                'present_days' => $presentCount,
                'absent_days' => $absentCount,
                'late_days' => $lateCount,
                'leave_days' => $leaveCount,
                'attendance_pct' => min(100.0, $pct) . '%',
                'is_chronic' => ($pct < 75.0),
            ];
        }

        return $this->successResponse([
            'month' => $month,
            'month_name' => $startDate->format('F'),
            'year' => $year,
            'class_name' => $className,
            'section' => $section,
            'total_school_days' => $totalSchoolDays,
            'days_meta' => $daysMeta,
            'students' => $matrixRows,
        ], 'Monthly attendance register loaded');
    }

    /**
     * 5. Chronic Absenteeism & Consecutive Absence Detection
     */
    public function getChronicAbsentees(Request $request): JsonResponse
    {
        $className = $request->query('class_name', 'Grade 10');
        $absentees = $this->calculateChronicAbsentees($className);

        return $this->successResponse($absentees, 'Chronic absentees and consecutive absence alerts retrieved');
    }

    /**
     * Helper to compute chronic absentees and consecutive absences.
     */
    protected function calculateChronicAbsentees(string $className = 'Grade 10'): array
    {
        $past30Days = Carbon::today()->subDays(30)->format('Y-m-d');
        $todayStr = Carbon::today()->format('Y-m-d');

        $flagged = [];

        foreach ($this->defaultStudents as $st) {
            $studentId = $st['id'];

            // 1. Calculate overall rate in past 30 days
            $records = StudentAttendance::where('student_id', $studentId)
                ->whereBetween('attendance_date', [$past30Days, $todayStr])
                ->orderBy('attendance_date', 'desc')
                ->get();

            $total = $records->count();
            if ($total === 0) continue;

            $present = $records->whereIn('status', ['Present', 'Late'])->count();
            $halfDay = $records->where('status', 'Half-day')->count();
            $effectivePresent = $present + ($halfDay * 0.5);
            $rate = round(($effectivePresent / $total) * 100, 1);

            // 2. Calculate consecutive absences
            $consecutiveAbsent = 0;
            foreach ($records as $r) {
                if ($r->status === 'Absent') {
                    $consecutiveAbsent++;
                } else {
                    break; // stop at first present/leave day
                }
            }

            $isChronic = ($rate < 75.0);
            $isConsecutiveAlert = ($consecutiveAbsent >= 3);

            if ($isChronic || $isConsecutiveAlert) {
                $flagged[] = [
                    'student_id' => $studentId,
                    'name' => $st['name'],
                    'roll_no' => $st['roll'],
                    'class_name' => $st['class'],
                    'section' => $st['section'],
                    'guardian_name' => $st['guardian_name'],
                    'guardian_phone' => $st['guardian_phone'],
                    'attendance_rate' => $rate . '%',
                    'consecutive_absent_days' => $consecutiveAbsent,
                    'total_days_evaluated' => $total,
                    'severity' => ($consecutiveAbsent >= 4 || $rate < 65.0) ? 'Critical' : 'Warning',
                    'reasons' => array_filter([
                        $isChronic ? "Chronic Low Attendance (< 75%)" : null,
                        $isConsecutiveAlert ? "Consecutive Absence ({$consecutiveAbsent} days)" : null,
                    ]),
                ];
            }
        }

        return $flagged;
    }

    /**
     * 6. Staff Attendance Sheet
     */
    public function getStaffSheet(Request $request): JsonResponse
    {
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        $department = $request->query('department', 'All');

        $carbonDate = Carbon::parse($date);
        $isWeekend = $carbonDate->isWeekend();
        $holiday = Holiday::where('date', $date)->first();

        $existingRecords = StaffAttendance::where('attendance_date', $date)->get()->keyBy('staff_id');

        $staffList = $this->defaultStaff;
        if ($department !== 'All') {
            $staffList = array_values(array_filter($staffList, fn($s) => $s['department'] === $department));
        }

        $roster = [];
        foreach ($staffList as $staff) {
            $staffId = $staff['id'];
            $existing = $existingRecords->get($staffId);

            // Check approved staff leave
            $approvedLeave = LeaveRequest::where('applicant_type', 'Staff')
                ->where('applicant_id', $staffId)
                ->where('status', 'Approved')
                ->whereDate('start_date', '<=', $date)
                ->whereDate('end_date', '>=', $date)
                ->first();

            if ($existing) {
                $status = $existing->status;
                $punchIn = $existing->punch_in;
                $punchOut = $existing->punch_out;
                $workHours = (float) $existing->work_hours;
                $remarks = $existing->remarks;
            } elseif ($approvedLeave) {
                $status = 'Excused Leave';
                $punchIn = null;
                $punchOut = null;
                $workHours = 0;
                $remarks = 'Approved Staff Leave: ' . $approvedLeave->reason;
            } else {
                $status = 'Present';
                $punchIn = '07:45 AM';
                $punchOut = '04:15 PM';
                $workHours = 8.5;
                $remarks = 'Standard faculty shift';
            }

            $roster[] = [
                'staff_id' => $staffId,
                'name' => $staff['name'],
                'employee_id' => $staff['emp_id'],
                'department' => $staff['department'],
                'role' => $staff['role'],
                'status' => $status,
                'punch_in' => $punchIn,
                'punch_out' => $punchOut,
                'work_hours' => $workHours,
                'remarks' => $remarks,
                'is_leave_locked' => ($approvedLeave !== null),
            ];
        }

        return $this->successResponse([
            'date' => $date,
            'department' => $department,
            'is_weekend' => $isWeekend,
            'is_holiday' => ($holiday !== null),
            'holiday_title' => $holiday ? $holiday->title : null,
            'roster' => $roster,
        ], 'Staff attendance roster retrieved');
    }

    /**
     * 7. Mark Staff Attendance (Punch In/Out / Daily Status)
     */
    public function markStaffAttendance(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'attendance_date' => 'required|date_format:Y-m-d',
            'records' => 'required|array|min:1',
            'records.*.staff_id' => 'required|integer',
            'records.*.staff_name' => 'required|string',
            'records.*.employee_id' => 'required|string',
            'records.*.department' => 'required|string',
            'records.*.status' => 'required|in:Present,Absent,Late,Half-day,Excused Leave,On Duty',
            'records.*.punch_in' => 'nullable|string',
            'records.*.punch_out' => 'nullable|string',
            'records.*.work_hours' => 'nullable|numeric',
            'records.*.remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error: ' . $validator->errors()->first(), 422, $validator->errors());
        }

        $date = $request->input('attendance_date');
        $todayStr = Carbon::today()->format('Y-m-d');

        if ($date > $todayStr) {
            return $this->errorResponse("Cannot mark staff attendance for future date ($date).", 422);
        }

        $records = $request->input('records');
        $marker = $request->user() ? $request->user()->name : 'HR Administrator';

        DB::beginTransaction();
        try {
            foreach ($records as $item) {
                $staffId = $item['staff_id'];
                $status = $item['status'];
                $punchIn = $item['punch_in'] ?? null;
                $punchOut = $item['punch_out'] ?? null;
                $workHours = isset($item['work_hours']) ? (float) $item['work_hours'] : 0.0;

                // Calculate hours if punch times exist
                if ($punchIn && $punchOut && $workHours === 0.0) {
                    try {
                        $tIn = Carbon::createFromTimeString($punchIn);
                        $tOut = Carbon::createFromTimeString($punchOut);
                        if ($tOut->gt($tIn)) {
                            $workHours = round($tIn->diffInMinutes($tOut) / 60, 2);
                        }
                    } catch (\Exception $e) {
                        $workHours = 8.0;
                    }
                }

                StaffAttendance::updateOrCreate(
                    [
                        'staff_id' => $staffId,
                        'attendance_date' => $date,
                    ],
                    [
                        'staff_name' => $item['staff_name'],
                        'employee_id' => $item['employee_id'],
                        'department' => $item['department'],
                        'status' => $status,
                        'punch_in' => $punchIn,
                        'punch_out' => $punchOut,
                        'work_hours' => $workHours,
                        'remarks' => $item['remarks'] ?? null,
                        'marked_by_name' => $marker,
                    ]
                );
            }

            DB::commit();

            return $this->successResponse([
                'count' => count($records),
                'date' => $date,
            ], 'Staff attendance recorded successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to record staff attendance: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 8. List Leave Requests
     */
    public function getLeaveRequests(Request $request): JsonResponse
    {
        $type = $request->query('applicant_type');
        $status = $request->query('status');

        $query = LeaveRequest::orderBy('id', 'desc');

        if ($type && $type !== 'All') {
            $query->where('applicant_type', $type);
        }

        if ($status && $status !== 'All') {
            $query->where('status', $status);
        }

        $leaves = $query->get()->map(function ($l) {
            return [
                'id' => $l->id,
                'applicant_type' => $l->applicant_type,
                'applicant_id' => $l->applicant_id,
                'applicant_name' => $l->applicant_name,
                'identifier' => $l->identifier,
                'class_or_department' => $l->class_or_department,
                'start_date' => Carbon::parse($l->start_date)->format('M d, Y'),
                'end_date' => Carbon::parse($l->end_date)->format('M d, Y'),
                'raw_start' => Carbon::parse($l->start_date)->format('Y-m-d'),
                'raw_end' => Carbon::parse($l->end_date)->format('Y-m-d'),
                'days_count' => $l->days_count,
                'leave_type' => $l->leave_type,
                'reason' => $l->reason,
                'status' => $l->status,
                'approved_by_name' => $l->approved_by_name,
                'admin_notes' => $l->admin_notes,
                'created_at' => $l->created_at->format('M d, Y h:i A'),
            ];
        });

        return $this->successResponse($leaves, 'Leave requests retrieved');
    }

    /**
     * 9. Submit a Leave Request
     */
    public function submitLeaveRequest(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'applicant_type' => 'required|in:Student,Staff',
            'applicant_id' => 'required|integer',
            'applicant_name' => 'required|string|max:150',
            'identifier' => 'required|string|max:50',
            'class_or_department' => 'required|string|max:100',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'leave_type' => 'required|string|max:100',
            'reason' => 'required|string|min:5|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error: ' . $validator->errors()->first(), 422, $validator->errors());
        }

        $startDate = Carbon::parse($request->input('start_date'));
        $endDate = Carbon::parse($request->input('end_date'));
        $daysCount = $startDate->diffInDays($endDate) + 1;

        $leave = LeaveRequest::create([
            'applicant_type' => $request->input('applicant_type'),
            'applicant_id' => $request->input('applicant_id'),
            'applicant_name' => $request->input('applicant_name'),
            'identifier' => $request->input('identifier'),
            'class_or_department' => $request->input('class_or_department'),
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'days_count' => $daysCount,
            'leave_type' => $request->input('leave_type'),
            'reason' => $request->input('reason'),
            'status' => 'Pending',
        ]);

        return $this->successResponse($leave, 'Leave request submitted successfully', 201);
    }

    /**
     * 10. Approve or Reject Leave Request
     */
    public function updateLeaveStatus(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:Approved,Rejected',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error: ' . $validator->errors()->first(), 422, $validator->errors());
        }

        $leave = LeaveRequest::find($id);
        if (!$leave) {
            return $this->errorResponse('Leave request not found', 404);
        }

        $approver = $request->user() ? $request->user()->name : 'Super Admin';
        $newStatus = $request->input('status');

        $leave->status = $newStatus;
        $leave->approved_by_name = $approver;
        $leave->admin_notes = $request->input('admin_notes');
        $leave->save();

        // If Approved, retroactively and proactively tag attendances in the date window as Excused Leave!
        if ($newStatus === 'Approved') {
            $period = CarbonPeriod::create($leave->start_date, $leave->end_date);
            foreach ($period as $dt) {
                $dateStr = $dt->format('Y-m-d');
                if ($leave->applicant_type === 'Student') {
                    $att = StudentAttendance::where('student_id', $leave->applicant_id)
                        ->where('attendance_date', $dateStr)
                        ->first();
                    if ($att) {
                        $att->status = 'Excused Leave';
                        $att->leave_request_id = $leave->id;
                        $att->remarks = 'Approved Leave: ' . $leave->reason;
                        $att->save();
                    }
                } else {
                    $att = StaffAttendance::where('staff_id', $leave->applicant_id)
                        ->where('attendance_date', $dateStr)
                        ->first();
                    if ($att) {
                        $att->status = 'Excused Leave';
                        $att->leave_request_id = $leave->id;
                        $att->remarks = 'Approved Staff Leave: ' . $leave->reason;
                        $att->save();
                    }
                }
            }
        }

        return $this->successResponse($leave, "Leave request {$newStatus} successfully");
    }

    /**
     * 11. List Academic Holidays
     */
    public function getHolidays(Request $request): JsonResponse
    {
        $year = $request->query('academic_year', '2025-2026');
        $holidays = Holiday::where('academic_year', $year)
            ->orderBy('date', 'asc')
            ->get();

        return $this->successResponse($holidays, 'Academic calendar holidays retrieved');
    }

    /**
     * 12. Create New Academic Holiday (Super Admin)
     */
    public function createHoliday(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:150',
            'date' => 'required|date_format:Y-m-d|unique:holidays,date',
            'type' => 'required|in:National,Religious,Academic Break,Emergency/Weather,Other',
            'description' => 'nullable|string|max:500',
            'academic_year' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error: ' . $validator->errors()->first(), 422, $validator->errors());
        }

        $holiday = Holiday::create([
            'title' => $request->input('title'),
            'date' => $request->input('date'),
            'type' => $request->input('type'),
            'description' => $request->input('description'),
            'academic_year' => $request->input('academic_year', '2025-2026'),
        ]);

        return $this->successResponse($holiday, 'Academic holiday scheduled successfully', 201);
    }
}
