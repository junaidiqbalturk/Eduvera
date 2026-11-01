<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffAttendance extends Model
{
    use HasFactory;

    protected $table = 'staff_attendances';

    protected $fillable = [
        'staff_id',
        'staff_name',
        'employee_id',
        'department',
        'attendance_date',
        'status',
        'punch_in',
        'punch_out',
        'work_hours',
        'leave_request_id',
        'remarks',
        'marked_by_name',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'work_hours' => 'float',
    ];

    public function leaveRequest()
    {
        return $this->belongsTo(LeaveRequest::class, 'leave_request_id');
    }
}
