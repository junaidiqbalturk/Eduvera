<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamMark extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'student_id',
        'student_name',
        'student_roll',
        'class_name',
        'section',
        'subject_code',
        'subject_name',
        'marks_obtained',
        'max_marks',
        'grade',
        'gpa_point',
        'remarks',
    ];

    protected $casts = [
        'marks_obtained' => 'float',
        'max_marks' => 'float',
        'gpa_point' => 'float',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Compute letter grade and GPA points using the institution's active grading scheme
     */
    public static function calculateGradeAndGpa(float $obtained, float $max = 100.0): array
    {
        return GradingScale::calculate($obtained, $max);
    }
}
