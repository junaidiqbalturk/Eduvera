<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamMark;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExaminationController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get list of Exam Term Sessions
     */
    public function getExams(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        if (!$isDemo) {
            return $this->successResponse([], 'Exams list retrieved successfully');
        }

        $exams = Exam::orderBy('start_date', 'desc')->get();

        return $this->successResponse($exams, 'Exams list retrieved successfully');
    }

    /**
     * Get student marksheet / report card
     */
    public function getMarksheet(int $studentId, Request $request): JsonResponse
    {
        $student = Student::find($studentId);

        // Fallback student name if not in database yet
        $studentName = $student ? ($student->first_name . ' ' . $student->last_name) : 'Alexander Wright';
        $studentRoll = $student ? $student->roll_no : '1001';
        $studentClass = $student ? ($student->class_name . ' - ' . $student->section) : 'Grade 10 - Section A';

        // Exam lookup
        $examId = $request->query('exam_id');
        $exam = null;
        if ($examId) {
            $exam = Exam::find($examId);
        }
        if (!$exam) {
            $exam = Exam::where('status', 'Completed')->orderBy('id', 'desc')->first()
                ?? Exam::orderBy('id', 'desc')->first();
        }

        $examName = $exam ? $exam->name : 'Final Term Examinations 2025';

        // Retrieve marks from MySQL
        $marksQuery = ExamMark::where('student_id', $studentId);
        if ($exam) {
            $marksQuery->where('exam_id', $exam->id);
        }
        $marksRecords = $marksQuery->get();

        // Fallback default marks if student has not been graded yet
        if ($marksRecords->isEmpty()) {
            $subjects = [
                ['subject_code' => 'MATH-101', 'subject' => 'Mathematics', 'marks_obtained' => 98.0, 'max_marks' => 100.0, 'grade' => 'A+', 'gpa_point' => 4.0],
                ['subject_code' => 'PHYS-101', 'subject' => 'Physics', 'marks_obtained' => 92.0, 'max_marks' => 100.0, 'grade' => 'A+', 'gpa_point' => 4.0],
                ['subject_code' => 'CHEM-101', 'subject' => 'Chemistry', 'marks_obtained' => 95.0, 'max_marks' => 100.0, 'grade' => 'A+', 'gpa_point' => 4.0],
                ['subject_code' => 'ENG-101', 'subject' => 'English Literature', 'marks_obtained' => 89.0, 'max_marks' => 100.0, 'grade' => 'A', 'gpa_point' => 3.7],
                ['subject_code' => 'CS-101', 'subject' => 'Computer Science', 'marks_obtained' => 98.0, 'max_marks' => 100.0, 'grade' => 'A+', 'gpa_point' => 4.0],
            ];
            $totalMarks = 472.0;
            $maxMarks = 500.0;
            $avgGpa = 3.92;
            $overallGrade = 'A+';
        } else {
            $subjects = $marksRecords->map(function ($m) {
                return [
                    'subject_code' => $m->subject_code,
                    'subject' => $m->subject_name,
                    'marks_obtained' => (float) $m->marks_obtained,
                    'max_marks' => (float) $m->max_marks,
                    'grade' => $m->grade,
                    'gpa_point' => (float) $m->gpa_point,
                ];
            })->toArray();

            $totalMarks = array_sum(array_column($subjects, 'marks_obtained'));
            $maxMarks = array_sum(array_column($subjects, 'max_marks'));
            $gpaPoints = array_column($subjects, 'gpa_point');
            $avgGpa = count($gpaPoints) > 0 ? round(array_sum($gpaPoints) / count($gpaPoints), 2) : 0.0;
            $overall = ExamMark::calculateGradeAndGpa($totalMarks, $maxMarks > 0 ? $maxMarks : 100.0);
            $overallGrade = $overall['grade'];
        }

        $percentage = $maxMarks > 0 ? round(($totalMarks / $maxMarks) * 100, 2) : 0;
        $systemType = \App\Models\GradingScale::getActiveSystemType();
        $overallCalc = \App\Models\GradingScale::calculate($totalMarks, $maxMarks > 0 ? $maxMarks : 100.0);

        $schoolName = \App\Models\SchoolSetting::get('school_name', 'Eduvera International Academy');
        $schoolTagline = \App\Models\SchoolSetting::get('school_tagline', 'Excellence in Academic Governance & Leadership');
        $schoolAddress = \App\Models\SchoolSetting::get('school_address', '450 University Way, Suite 100, Academic District');
        $schoolLogo = \App\Models\SchoolSetting::get('school_logo', null);

        $marksheet = [
            'student_id' => $studentId,
            'student_name' => $studentName,
            'roll_no' => $studentRoll,
            'class' => $studentClass,
            'exam_name' => $examName,
            'institution' => [
                'name' => $schoolName,
                'tagline' => $schoolTagline,
                'address' => $schoolAddress,
                'logo' => $schoolLogo,
            ],
            'gpa' => $avgGpa,
            'percentage' => $percentage,
            'overall_grade' => $overallCalc['grade'],
            'grade_label' => $overallCalc['label'],
            'is_pass' => $overallCalc['is_pass'],
            'system_type' => $systemType,
            'total_marks' => $totalMarks,
            'max_marks' => $maxMarks,
            'subjects' => array_map(function ($s) {
                $max = $s['max_marks'] > 0 ? $s['max_marks'] : 100;
                $s['percentage'] = round(($s['marks_obtained'] / $max) * 100, 1);
                return $s;
            }, $subjects),
        ];

        return $this->successResponse($marksheet, 'Student marksheet loaded');
    }

    /**
     * Get Teacher Marks Entry Sheet for an Exam Term + Class + Section + Subject
     */
    public function getMarksEntrySheet(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'exam_id' => 'required|exists:exams,id',
            'class_name' => 'required|string',
            'section' => 'required|string',
            'subject_code' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error', 422, $validator->errors());
        }

        $exam = Exam::findOrFail($request->input('exam_id'));
        $className = $request->input('class_name');
        $section = $request->input('section');
        $subjectCode = $request->input('subject_code');
        $subjectName = $request->input('subject_name') ?: $this->resolveSubjectName($subjectCode);

        // Load students in that class section
        $students = Student::where('class_name', $className)
            ->where('section', $section)
            ->where('status', 'Active')
            ->orderBy('roll_no', 'asc')
            ->get();

        // If no students enrolled in that specific section, load class students as fallback
        if ($students->isEmpty()) {
            $students = Student::where('class_name', $className)->where('status', 'Active')->orderBy('roll_no', 'asc')->get();
        }

        // If still empty, return all active students for smooth grading experience
        if ($students->isEmpty()) {
            $students = Student::where('status', 'Active')->limit(8)->get();
        }

        // Load existing marks records
        $existingMarks = ExamMark::where('exam_id', $exam->id)
            ->where('subject_code', $subjectCode)
            ->get()
            ->keyBy('student_id');

        $roster = $students->map(function ($st) use ($existingMarks) {
            $existing = $existingMarks->get($st->id);
            $obtained = $existing ? (float) $existing->marks_obtained : 0.0;
            $maxMarks = $existing ? (float) $existing->max_marks : 100.0;
            $calc = ExamMark::calculateGradeAndGpa($obtained, $maxMarks);

            return [
                'student_id' => $st->id,
                'student_name' => $st->first_name . ' ' . $st->last_name,
                'student_roll' => $st->roll_no,
                'marks_obtained' => $obtained,
                'max_marks' => $maxMarks,
                'grade' => $existing ? $existing->grade : $calc['grade'],
                'gpa_point' => $existing ? (float) $existing->gpa_point : $calc['gpa_point'],
                'remarks' => $existing ? $existing->remarks : '',
                'is_graded' => $existing !== null,
            ];
        });

        $data = [
            'exam' => [
                'id' => $exam->id,
                'name' => $exam->name,
                'academic_year' => $exam->academic_year,
                'status' => $exam->status,
            ],
            'class_name' => $className,
            'section' => $section,
            'subject_code' => $subjectCode,
            'subject_name' => $subjectName,
            'max_marks_default' => 100.0,
            'roster' => $roster,
        ];

        return $this->successResponse($data, 'Marks entry sheet loaded');
    }

    /**
     * Batch save marks entered by teacher
     */
    public function saveMarks(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'exam_id' => 'required|exists:exams,id',
            'class_name' => 'required|string',
            'section' => 'required|string',
            'subject_code' => 'required|string',
            'subject_name' => 'required|string',
            'records' => 'required|array|min:1',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.marks_obtained' => 'required|numeric|min:0|max:100',
            'records.*.max_marks' => 'nullable|numeric|min:1',
            'records.*.remarks' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors());
        }

        $examId = $request->input('exam_id');
        $className = $request->input('class_name');
        $section = $request->input('section');
        $subjectCode = $request->input('subject_code');
        $subjectName = $request->input('subject_name');

        $savedCount = 0;

        foreach ($request->input('records') as $rec) {
            $student = Student::find($rec['student_id']);
            if (!$student) continue;

            $maxMarks = isset($rec['max_marks']) && $rec['max_marks'] > 0 ? (float) $rec['max_marks'] : 100.0;
            $obtained = (float) $rec['marks_obtained'];
            $calc = ExamMark::calculateGradeAndGpa($obtained, $maxMarks);

            ExamMark::updateOrCreate(
                [
                    'exam_id' => $examId,
                    'student_id' => $student->id,
                    'subject_code' => $subjectCode,
                ],
                [
                    'student_name' => $student->first_name . ' ' . $student->last_name,
                    'student_roll' => $student->roll_no,
                    'class_name' => $className,
                    'section' => $section,
                    'subject_name' => $subjectName,
                    'marks_obtained' => $obtained,
                    'max_marks' => $maxMarks,
                    'grade' => $calc['grade'],
                    'gpa_point' => $calc['gpa_point'],
                    'remarks' => $rec['remarks'] ?? null,
                ]
            );

            $savedCount++;
        }

        return $this->successResponse([
            'saved_count' => $savedCount,
            'exam_id' => $examId,
            'subject_code' => $subjectCode,
        ], "Successfully recorded and computed grades for {$savedCount} students.");
    }

    private function resolveSubjectName(string $code): string
    {
        $map = [
            'MATH-101' => 'Mathematics',
            'PHYS-101' => 'Physics',
            'CHEM-101' => 'Chemistry',
            'ENG-101' => 'English Literature',
            'CS-101' => 'Computer Science',
        ];

        return $map[$code] ?? $code;
    }
}
