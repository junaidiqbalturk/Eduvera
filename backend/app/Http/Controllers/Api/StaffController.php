<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get list of Staff / Teachers
     */
    public function index(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        if (!$isDemo) {
            return $this->successResponse([], 'Staff directory retrieved');
        }

        $staff = [
            [
                'id' => 1,
                'employee_id' => 'EMP-101',
                'name' => 'Dr. Robert Vance',
                'department' => 'Mathematics',
                'designation' => 'Senior HOD Teacher',
                'email' => 'robert.vance@eduvera.school',
                'phone' => '+1 (555) 111-2233',
                'qualification' => 'Ph.D. in Pure Mathematics',
                'joining_date' => '2018-09-01',
                'status' => 'Active',
                'avatar' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            ],
            [
                'id' => 2,
                'employee_id' => 'EMP-102',
                'name' => 'Ms. Eleanor Vance',
                'department' => 'Science',
                'designation' => 'Physics Instructor',
                'email' => 'eleanor.vance@eduvera.school',
                'phone' => '+1 (555) 222-3344',
                'qualification' => 'M.Sc. Physics',
                'joining_date' => '2020-01-15',
                'status' => 'Active',
                'avatar' => 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            ],
            [
                'id' => 3,
                'employee_id' => 'EMP-103',
                'name' => 'Dr. Alan Grant',
                'department' => 'Biology',
                'designation' => 'Senior Lecturer',
                'email' => 'alan.grant@eduvera.school',
                'phone' => '+1 (555) 333-4455',
                'qualification' => 'Ph.D. Paleontology & Biology',
                'joining_date' => '2016-04-10',
                'status' => 'Active',
                'avatar' => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
            ],
            [
                'id' => 4,
                'employee_id' => 'EMP-104',
                'name' => 'Mrs. Clara Oswald',
                'department' => 'English & Literature',
                'designation' => 'Lead Educator',
                'email' => 'clara.oswald@eduvera.school',
                'phone' => '+1 (555) 444-5566',
                'qualification' => 'M.A. English Literature',
                'joining_date' => '2021-08-20',
                'status' => 'Active',
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            ],
        ];

        return $this->successResponse($staff, 'Staff directory retrieved');
    }

    /**
     * Get Departments & Designations
     */
    public function getDepartments(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        if (!$isDemo) {
            return $this->successResponse([], 'Departments retrieved successfully');
        }

        $departments = [
            ['id' => 1, 'name' => 'Mathematics', 'head' => 'Dr. Robert Vance', 'staff_count' => 8],
            ['id' => 2, 'name' => 'Science', 'head' => 'Dr. Alan Grant', 'staff_count' => 12],
            ['id' => 3, 'name' => 'Languages', 'head' => 'Mrs. Clara Oswald', 'staff_count' => 6],
            ['id' => 4, 'name' => 'Computer Science', 'head' => 'Mr. David Chen', 'staff_count' => 5],
            ['id' => 5, 'name' => 'Administration & Accounts', 'head' => 'Mr. James Miller', 'staff_count' => 7],
        ];

        return $this->successResponse($departments, 'Departments retrieved successfully');
    }
}
