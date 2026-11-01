<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceAuditLog extends Model
{
    use HasFactory;

    protected $table = 'attendance_audit_logs';

    protected $fillable = [
        'attendance_type',
        'attendance_id',
        'target_name',
        'attendance_date',
        'previous_status',
        'new_status',
        'changed_by_name',
        'reason',
    ];

    protected $casts = [
        'attendance_date' => 'date',
    ];
}
