<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $table = 'subjects';

    protected $fillable = [
        'code',
        'name',
        'department',
        'credits',
        'type',
        'is_demo',
    ];

    protected $casts = [
        'credits' => 'integer',
        'is_demo' => 'boolean',
    ];

    /**
     * Relationship: Classes that teach this subject
     */
    public function classes()
    {
        return $this->belongsToMany(SchoolClass::class, 'class_subjects', 'subject_id', 'class_id')
            ->withPivot('teacher_name', 'periods_per_week', 'is_compulsory')
            ->withTimestamps();
    }
}
