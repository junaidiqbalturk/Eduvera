<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'admission_no',
        'roll_no',
        'first_name',
        'last_name',
        'gender',
        'dob',
        'blood_group',
        'class_name',
        'section',
        'status',
        'guardian_name',
        'guardian_relation',
        'guardian_phone',
        'guardian_email',
        'address',
        'admission_date',
        'avatar',
        'emergency_contact',
        'is_demo',
    ];

    protected $casts = [
        'dob' => 'date:Y-m-d',
        'admission_date' => 'date:Y-m-d',
        'is_demo' => 'boolean',
    ];

    /**
     * Scope query by filter terms
     */
    public function scopeFilter($query, array $filters)
    {
        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                    ->orWhere('last_name', 'like', "%{$s}%")
                    ->orWhere('admission_no', 'like', "%{$s}%")
                    ->orWhere('roll_no', 'like', "%{$s}%")
                    ->orWhere('guardian_name', 'like', "%{$s}%")
                    ->orWhere('guardian_phone', 'like', "%{$s}%");
            });
        }

        if (!empty($filters['class_name']) && $filters['class_name'] !== 'All' && $filters['class_name'] !== 'All Classes') {
            $query->where('class_name', $filters['class_name']);
        }

        if (!empty($filters['section']) && $filters['section'] !== 'All') {
            $query->where('section', $filters['section']);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'All') {
            $query->where('status', $filters['status']);
        }

        return $query;
    }

    /**
     * Generate next sequential admission number: EDU-YYYY-XXXX
     */
    public static function generateAdmissionNumber(): string
    {
        $year = date('Y');
        $latest = self::where('admission_no', 'like', "EDU-{$year}-%")
            ->orderBy('id', 'desc')
            ->first();

        if ($latest && preg_match('/EDU-\d{4}-(\d+)/', $latest->admission_no, $matches)) {
            $nextSeq = intval($matches[1]) + 1;
        } else {
            $count = self::count();
            $nextSeq = $count + 1;
        }

        return sprintf("EDU-%s-%04d", $year, $nextSeq);
    }

    /**
     * Generate next roll number for class and section
     */
    public static function generateRollNumber(string $className, string $section): string
    {
        preg_match('/\d+/', $className, $matches);
        $gradeNumber = !empty($matches) ? $matches[0] : '10';

        $lastStudent = self::where('class_name', $className)
            ->where('section', $section)
            ->orderBy('id', 'desc')
            ->first();

        if ($lastStudent && is_numeric($lastStudent->roll_no)) {
            return (string) (intval($lastStudent->roll_no) + 1);
        }

        return sprintf("%s%02d", $gradeNumber, 1);
    }
}
