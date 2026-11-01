<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get system overview metrics & widgets for main dashboard
     */
    public function getOverview(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        if ($isDemo) {
            $overview = [
                'is_demo' => true,
                'metrics' => [
                    'total_students' => 1248,
                    'total_teachers' => 84,
                    'total_classes' => 32,
                    'attendance_today_rate' => '94.8%',
                    'monthly_fee_collected' => '$124,300',
                    'pending_invoices' => 38,
                ],
                'recent_activities' => [
                    ['id' => 1, 'text' => 'New student admission registered: Alexander Wright (Grade 10)', 'time' => '10 mins ago', 'type' => 'student'],
                    ['id' => 2, 'text' => 'Fee receipt issued: #INV-2025-001 ($1,200.00)', 'time' => '32 mins ago', 'type' => 'finance'],
                    ['id' => 3, 'text' => 'Attendance completed for Grade 10 Section A', 'time' => '1 hour ago', 'type' => 'attendance'],
                    ['id' => 4, 'text' => 'Mid-Term Exam schedule posted to noticeboard', 'time' => '3 hours ago', 'type' => 'academic'],
                ],
                'attendance_chart' => [
                    'labels' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    'present' => [95, 93, 96, 94, 92],
                    'absent' => [5, 7, 4, 6, 8],
                ],
            ];
        } else {
            // Clean, fresh institutional state for newly registered schools
            $studentCount = \App\Models\Student::where('is_demo', false)->count();

            $overview = [
                'is_demo' => false,
                'metrics' => [
                    'total_students' => $studentCount,
                    'total_teachers' => 0,
                    'total_classes' => 0,
                    'attendance_today_rate' => '0%',
                    'monthly_fee_collected' => '$0',
                    'pending_invoices' => 0,
                ],
                'recent_activities' => [
                    [
                        'id' => 1,
                        'text' => 'Welcome to Eduvera! School portal initialized for ' . ($user->name ?? 'Administrator'),
                        'time' => 'Just now',
                        'type' => 'academic',
                    ],
                ],
                'attendance_chart' => [
                    'labels' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    'present' => [0, 0, 0, 0, 0],
                    'absent' => [0, 0, 0, 0, 0],
                ],
            ];
        }

        return $this->successResponse($overview, 'Dashboard metrics loaded');
    }
}
