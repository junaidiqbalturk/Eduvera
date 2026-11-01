<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class GradingScale extends Model
{
    use HasFactory;

    protected $fillable = [
        'system_type',
        'grade',
        'min_percentage',
        'max_percentage',
        'gpa_point',
        'label',
        'is_pass',
        'order_index',
        'is_active',
    ];

    protected $casts = [
        'min_percentage' => 'float',
        'max_percentage' => 'float',
        'gpa_point' => 'float',
        'is_pass' => 'boolean',
        'is_active' => 'boolean',
        'order_index' => 'integer',
    ];

    /**
     * Get the active grading system type ('percentage' or 'gpa')
     */
    public static function getActiveSystemType(): string
    {
        try {
            $setting = DB::table('school_settings')->where('key', 'grading_system')->first();
            return $setting ? ($setting->value ?? 'percentage') : 'percentage';
        } catch (\Throwable $e) {
            return 'percentage';
        }
    }

    /**
     * Dynamically evaluate grade and score metrics based on active institution scheme
     */
    public static function calculate(float $obtained, float $max = 100.0): array
    {
        if ($max <= 0) {
            return [
                'percentage' => 0.0,
                'grade' => 'Fail',
                'gpa_point' => 0.0,
                'label' => 'Fail',
                'is_pass' => false,
                'system_type' => 'percentage',
            ];
        }

        $percentage = round(($obtained / $max) * 100.0, 2);
        $systemType = self::getActiveSystemType();

        try {
            $rules = self::where('system_type', $systemType)
                ->where('is_active', true)
                ->orderBy('min_percentage', 'desc')
                ->get();

            foreach ($rules as $rule) {
                if ($percentage >= (float)$rule->min_percentage && $percentage <= (float)$rule->max_percentage) {
                    return [
                        'percentage' => $percentage,
                        'grade' => $rule->grade,
                        'gpa_point' => (float)$rule->gpa_point,
                        'label' => $rule->label ?? $rule->grade,
                        'is_pass' => (bool)$rule->is_pass,
                        'system_type' => $systemType,
                    ];
                }
            }
        } catch (\Throwable $e) {
            // Fallback to Pakistani percentage system default
        }

        // Pakistani Percentage Scale Default:
        // Over 80% -> A+
        // 70% to 79% -> A
        // 60% to 69% -> B
        // 50% to 59% -> C
        // Below 50% -> Fail
        if ($systemType === 'percentage') {
            if ($percentage >= 80.0) {
                return ['percentage' => $percentage, 'grade' => 'A+', 'gpa_point' => 4.0, 'label' => 'Outstanding (Distinction)', 'is_pass' => true, 'system_type' => 'percentage'];
            } elseif ($percentage >= 70.0) {
                return ['percentage' => $percentage, 'grade' => 'A', 'gpa_point' => 3.5, 'label' => 'Excellent (1st Division)', 'is_pass' => true, 'system_type' => 'percentage'];
            } elseif ($percentage >= 60.0) {
                return ['percentage' => $percentage, 'grade' => 'B', 'gpa_point' => 3.0, 'label' => 'Very Good (1st Division)', 'is_pass' => true, 'system_type' => 'percentage'];
            } elseif ($percentage >= 50.0) {
                return ['percentage' => $percentage, 'grade' => 'C', 'gpa_point' => 2.0, 'label' => 'Good (2nd Division)', 'is_pass' => true, 'system_type' => 'percentage'];
            } else {
                return ['percentage' => $percentage, 'grade' => 'Fail', 'gpa_point' => 0.0, 'label' => 'Fail (Below 50%)', 'is_pass' => false, 'system_type' => 'percentage'];
            }
        }

        // GPA fallback
        if ($percentage >= 90.0) {
            return ['percentage' => $percentage, 'grade' => 'A+', 'gpa_point' => 4.0, 'label' => 'Superior', 'is_pass' => true, 'system_type' => 'gpa'];
        } elseif ($percentage >= 80.0) {
            return ['percentage' => $percentage, 'grade' => 'A', 'gpa_point' => 3.7, 'label' => 'Excellent', 'is_pass' => true, 'system_type' => 'gpa'];
        } elseif ($percentage >= 70.0) {
            return ['percentage' => $percentage, 'grade' => 'B', 'gpa_point' => 3.0, 'label' => 'Good', 'is_pass' => true, 'system_type' => 'gpa'];
        } elseif ($percentage >= 60.0) {
            return ['percentage' => $percentage, 'grade' => 'C', 'gpa_point' => 2.0, 'label' => 'Satisfactory', 'is_pass' => true, 'system_type' => 'gpa'];
        } elseif ($percentage >= 50.0) {
            return ['percentage' => $percentage, 'grade' => 'D', 'gpa_point' => 1.0, 'label' => 'Passing', 'is_pass' => true, 'system_type' => 'gpa'];
        } else {
            return ['percentage' => $percentage, 'grade' => 'F', 'gpa_point' => 0.0, 'label' => 'Failing', 'is_pass' => false, 'system_type' => 'gpa'];
        }
    }
}
