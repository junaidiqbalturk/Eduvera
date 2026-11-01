<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\ClassSubject;
use App\Models\Student;
use App\Models\GradingScale;

class AcademicController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get list of Academic Years
     */
    public function getAcademicYears(): JsonResponse
    {
        $years = [
            ['id' => 1, 'year' => '2025-2026', 'title' => 'Academic Year 2025-2026', 'is_current' => true, 'start_date' => '2025-08-01', 'end_date' => '2026-06-30', 'status' => 'Active'],
            ['id' => 2, 'year' => '2024-2025', 'title' => 'Academic Year 2024-2025', 'is_current' => false, 'start_date' => '2024-08-01', 'end_date' => '2025-06-30', 'status' => 'Archived'],
            ['id' => 3, 'year' => '2026-2027', 'title' => 'Academic Year 2026-2027', 'is_current' => false, 'start_date' => '2026-08-01', 'end_date' => '2027-06-30', 'status' => 'Upcoming'],
        ];

        return $this->successResponse($years, 'Academic years retrieved successfully');
    }

    /**
     * Get list of Classes and Sections
     */
    public function getClasses(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        $query = SchoolClass::with('subjects');
        if ($isDemo) {
            $classes = $query->orderBy('numeric_grade', 'asc')->get();
        } else {
            $classes = $query->where('is_demo', false)->orderBy('numeric_grade', 'asc')->get();
        }

        $result = $classes->map(function ($cls) {
            $studentCount = Student::where('class_name', $cls->name)->count();
            return [
                'id' => $cls->id,
                'name' => $cls->name,
                'numeric_grade' => $cls->numeric_grade,
                'sections' => is_array($cls->sections) ? $cls->sections : ($cls->sections ? json_decode($cls->sections, true) : ['Section A']),
                'student_count' => $studentCount > 0 ? $studentCount : ($cls->is_demo ? 120 : 0),
                'class_teacher' => $cls->class_teacher ?: 'Unassigned',
                'capacity' => $cls->capacity,
                'subjects_count' => $cls->subjects->count(),
                'subjects' => $cls->subjects->map(fn($s) => [
                    'id' => $s->id,
                    'code' => $s->code,
                    'name' => $s->name,
                    'type' => $s->type,
                    'credits' => $s->credits,
                    'department' => $s->department,
                    'teacher_name' => $s->pivot->teacher_name,
                    'periods_per_week' => $s->pivot->periods_per_week,
                    'is_compulsory' => $s->pivot->is_compulsory,
                ]),
            ];
        });

        return $this->successResponse($result, 'Classes retrieved successfully');
    }

    /**
     * Create a New Class
     */
    public function storeClass(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'numeric_grade' => 'nullable|integer',
            'sections' => 'nullable|array',
            'class_teacher' => 'nullable|string|max:150',
            'capacity' => 'nullable|integer',
            'subject_ids' => 'nullable|array',
        ]);

        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        $numGrade = $request->numeric_grade;
        if (!$numGrade) {
            preg_match('/\d+/', $request->name, $matches);
            $numGrade = isset($matches[0]) ? (int)$matches[0] : 1;
        }

        $cls = SchoolClass::create([
            'name' => trim($request->name),
            'numeric_grade' => $numGrade,
            'sections' => $request->sections ?: ['Section A'],
            'class_teacher' => $request->class_teacher,
            'capacity' => $request->capacity ?? 40,
            'is_demo' => (bool)$isDemo,
        ]);

        if ($request->has('subject_ids') && is_array($request->subject_ids)) {
            foreach ($request->subject_ids as $subId) {
                ClassSubject::updateOrCreate(
                    ['class_id' => $cls->id, 'subject_id' => $subId],
                    ['teacher_name' => $cls->class_teacher, 'periods_per_week' => 5, 'is_compulsory' => true]
                );
            }
        }

        return $this->successResponse($cls->load('subjects'), 'Class created successfully', 201);
    }

    /**
     * Update an Existing Class
     */
    public function updateClass(Request $request, int $id): JsonResponse
    {
        $cls = SchoolClass::findOrFail($id);
        $cls->update([
            'name' => $request->name ?? $cls->name,
            'numeric_grade' => $request->numeric_grade ?? $cls->numeric_grade,
            'sections' => $request->sections ?? $cls->sections,
            'class_teacher' => $request->has('class_teacher') ? $request->class_teacher : $cls->class_teacher,
            'capacity' => $request->capacity ?? $cls->capacity,
        ]);

        return $this->successResponse($cls->load('subjects'), 'Class updated successfully');
    }

    /**
     * Delete a Class
     */
    public function deleteClass(int $id): JsonResponse
    {
        $cls = SchoolClass::findOrFail($id);
        ClassSubject::where('class_id', $id)->delete();
        $cls->delete();

        return $this->successResponse(null, 'Class deleted successfully');
    }

    /**
     * Get list of Subjects / Courses
     */
    public function getSubjects(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        $query = Subject::with('classes');
        if (!$isDemo) {
            $query->where('is_demo', false);
        }

        $subjects = $query->orderBy('name', 'asc')->get();

        $result = $subjects->map(function ($s) {
            return [
                'id' => $s->id,
                'code' => $s->code,
                'name' => $s->name,
                'department' => $s->department,
                'credits' => $s->credits,
                'type' => $s->type,
                'classes' => $s->classes->map(fn($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                ]),
            ];
        });

        return $this->successResponse($result, 'Subjects retrieved successfully');
    }

    /**
     * Create a New Subject / Course
     */
    public function storeSubject(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:150',
            'department' => 'nullable|string|max:100',
            'credits' => 'nullable|integer',
            'type' => 'nullable|in:Core,Elective,Optional',
            'class_ids' => 'nullable|array',
        ]);

        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        $sub = Subject::create([
            'code' => strtoupper(trim($request->code)),
            'name' => trim($request->name),
            'department' => $request->department ?? 'General',
            'credits' => $request->credits ?? 3,
            'type' => $request->type ?? 'Core',
            'is_demo' => (bool)$isDemo,
        ]);

        if ($request->has('class_ids') && is_array($request->class_ids)) {
            foreach ($request->class_ids as $cId) {
                ClassSubject::updateOrCreate(
                    ['class_id' => $cId, 'subject_id' => $sub->id],
                    ['periods_per_week' => 5, 'is_compulsory' => true]
                );
            }
        }

        return $this->successResponse($sub->load('classes'), 'Subject created successfully', 201);
    }

    /**
     * Update an Existing Subject / Course
     */
    public function updateSubject(Request $request, int $id): JsonResponse
    {
        $sub = Subject::findOrFail($id);
        $sub->update([
            'code' => $request->code ? strtoupper(trim($request->code)) : $sub->code,
            'name' => $request->name ?? $sub->name,
            'department' => $request->department ?? $sub->department,
            'credits' => $request->credits ?? $sub->credits,
            'type' => $request->type ?? $sub->type,
        ]);

        return $this->successResponse($sub->load('classes'), 'Subject updated successfully');
    }

    /**
     * Delete a Subject / Course
     */
    public function deleteSubject(int $id): JsonResponse
    {
        $sub = Subject::findOrFail($id);
        ClassSubject::where('subject_id', $id)->delete();
        $sub->delete();

        return $this->successResponse(null, 'Subject deleted successfully');
    }

    /**
     * Get Class-Wise Subjects / Courses for a specific Class
     */
    public function getClassSubjects(int $classId): JsonResponse
    {
        $cls = SchoolClass::findOrFail($classId);
        $classSubjects = ClassSubject::with('subject')
            ->where('class_id', $classId)
            ->get();

        $result = $classSubjects->map(function ($cs) {
            return [
                'id' => $cs->id,
                'class_id' => $cs->class_id,
                'subject_id' => $cs->subject_id,
                'code' => $cs->subject->code ?? '',
                'name' => $cs->subject->name ?? '',
                'department' => $cs->subject->department ?? '',
                'credits' => $cs->subject->credits ?? 3,
                'type' => $cs->subject->type ?? 'Core',
                'teacher_name' => $cs->teacher_name,
                'periods_per_week' => $cs->periods_per_week,
                'is_compulsory' => $cs->is_compulsory,
            ];
        });

        return $this->successResponse([
            'class' => [
                'id' => $cls->id,
                'name' => $cls->name,
                'class_teacher' => $cls->class_teacher,
            ],
            'subjects' => $result,
        ], 'Class subjects loaded successfully');
    }

    /**
     * Assign / Map Subjects to a specific Class (Class-Wise Courses)
     */
    public function assignSubjectsToClass(Request $request, int $classId): JsonResponse
    {
        $cls = SchoolClass::findOrFail($classId);
        $request->validate([
            'assignments' => 'required|array',
        ]);

        // Clear existing assignments and set new
        ClassSubject::where('class_id', $classId)->delete();

        foreach ($request->assignments as $assign) {
            $subId = is_array($assign) ? ($assign['subject_id'] ?? null) : $assign;
            if ($subId) {
                ClassSubject::create([
                    'class_id' => $classId,
                    'subject_id' => $subId,
                    'teacher_name' => is_array($assign) ? ($assign['teacher_name'] ?? $cls->class_teacher) : $cls->class_teacher,
                    'periods_per_week' => is_array($assign) ? ($assign['periods_per_week'] ?? 5) : 5,
                    'is_compulsory' => is_array($assign) ? ($assign['is_compulsory'] ?? true) : true,
                ]);
            }
        }

        return $this->getClassSubjects($classId);
    }

    /**
     * Get Timetable / Routine
     */
    public function getRoutine(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        if (!$isDemo) {
            return $this->successResponse([
                'class_id' => 0,
                'class_name' => 'No Class Configured',
                'timetable' => [],
            ], 'Class routine retrieved successfully');
        }

        $classId = $request->query('class_id', 1);

        $routine = [
            'class_id' => (int) $classId,
            'class_name' => 'Grade 10 - Section A',
            'timetable' => [
                'Monday' => [
                    ['period' => 1, 'time' => '08:00 AM - 08:50 AM', 'subject' => 'Mathematics', 'teacher' => 'Mr. Vance', 'room' => 'Lab 201'],
                    ['period' => 2, 'time' => '09:00 AM - 09:50 AM', 'subject' => 'Physics', 'teacher' => 'Dr. Grant', 'room' => 'Science Hall A'],
                    ['period' => 3, 'time' => '10:00 AM - 10:50 AM', 'subject' => 'English', 'teacher' => 'Mrs. Oswald', 'room' => 'Room 104'],
                    ['period' => 4, 'time' => '11:10 AM - 12:00 PM', 'subject' => 'Computer Science', 'teacher' => 'Mr. Chen', 'room' => 'CS Lab 1'],
                ],
                'Tuesday' => [
                    ['period' => 1, 'time' => '08:00 AM - 08:50 AM', 'subject' => 'Chemistry', 'teacher' => 'Dr. Aris', 'room' => 'Chem Lab B'],
                    ['period' => 2, 'time' => '09:00 AM - 09:50 AM', 'subject' => 'Mathematics', 'teacher' => 'Mr. Vance', 'room' => 'Lab 201'],
                    ['period' => 3, 'time' => '10:00 AM - 10:50 AM', 'subject' => 'Physical Education', 'teacher' => 'Coach Miller', 'room' => 'Gymnasium'],
                    ['period' => 4, 'time' => '11:10 AM - 12:00 PM', 'subject' => 'History', 'teacher' => 'Ms. Davis', 'room' => 'Room 108'],
                ],
            ],
        ];

        return $this->successResponse($routine, 'Class routine retrieved successfully');
    }

    /**
     * Get active grading scheme and scales configuration
     */
    public function getGradingScale(): JsonResponse
    {
        $system = GradingScale::getActiveSystemType();
        $scales = GradingScale::where('system_type', $system)
            ->where('is_active', true)
            ->orderBy('order_index', 'asc')
            ->get();

        return $this->successResponse([
            'system' => $system,
            'scales' => $scales,
        ], 'Grading scale configuration retrieved');
    }

    /**
     * Update active grading scheme and customized thresholds
     */
    public function updateGradingScale(Request $request): JsonResponse
    {
        $request->validate([
            'system' => 'required|in:percentage,gpa',
            'scales' => 'nullable|array',
        ]);

        $system = $request->system;

        // Persist active system in school_settings
        \Illuminate\Support\Facades\DB::table('school_settings')->updateOrInsert(
            ['key' => 'grading_system'],
            ['value' => $system, 'updated_at' => now()]
        );

        if ($request->has('scales') && is_array($request->scales)) {
            foreach ($request->scales as $index => $item) {
                if (isset($item['grade'])) {
                    GradingScale::updateOrCreate(
                        [
                            'system_type' => $system,
                            'grade' => $item['grade'],
                        ],
                        [
                            'min_percentage' => (float)($item['min_percentage'] ?? 0),
                            'max_percentage' => (float)($item['max_percentage'] ?? 100),
                            'gpa_point' => (float)($item['gpa_point'] ?? 0),
                            'label' => $item['label'] ?? null,
                            'is_pass' => (bool)($item['is_pass'] ?? true),
                            'order_index' => $index + 1,
                            'is_active' => true,
                        ]
                    );
                }
            }
        }

        $updatedScales = GradingScale::where('system_type', $system)
            ->where('is_active', true)
            ->orderBy('order_index', 'asc')
            ->get();

        return $this->successResponse([
            'system' => $system,
            'scales' => $updatedScales,
        ], 'Grading scale configuration successfully updated');
    }
}
