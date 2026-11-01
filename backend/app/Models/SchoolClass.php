<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'school_classes';

    protected $fillable = [
        'name',
        'numeric_grade',
        'sections',
        'class_teacher',
        'capacity',
        'is_demo',
    ];

    protected $casts = [
        'sections' => 'array',
        'is_demo' => 'boolean',
        'numeric_grade' => 'integer',
        'capacity' => 'integer',
    ];

    /**
     * Relationship: Class subjects
     */
    public function classSubjects()
    {
        return $this->hasMany(ClassSubject::class, 'class_id');
    }

    /**
     * Relationship: Subjects assigned to this class
     */
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'class_subjects', 'class_id', 'subject_id')
            ->withPivot('teacher_name', 'periods_per_week', 'is_compulsory')
            ->withTimestamps();
    }
}
