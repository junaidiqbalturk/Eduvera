<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveRequest extends Model
{
    use HasFactory;

    protected $table = 'leave_requests';

    protected $fillable = [
        'applicant_type',
        'applicant_id',
        'applicant_name',
        'identifier',
        'class_or_department',
        'start_date',
        'end_date',
        'days_count',
        'leave_type',
        'reason',
        'status',
        'approved_by_name',
        'admin_notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'days_count' => 'integer',
    ];

    /**
     * Scope to check if an applicant has an approved leave on a given date.
     */
    public function scopeActiveOnDate($query, string $type, int $applicantId, string $date)
    {
        return $query->where('applicant_type', $type)
            ->where('applicant_id', $applicantId)
            ->where('status', 'Approved')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date);
    }
}
