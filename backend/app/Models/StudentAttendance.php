<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentAttendance extends Model
{
    use HasFactory;

    protected $table = 'student_attendances';

    protected $fillable = [
        'student_id',
        'student_name',
        'student_roll',
        'class_name',
        'section',
        'attendance_date',
        'status',
        'half_day_session',
        'arrival_time',
        'minutes_late',
        'leave_request_id',
        'remarks',
        'is_makeup_session',
        'marked_by_name',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'minutes_late' => 'integer',
        'is_makeup_session' => 'boolean',
    ];

    public function leaveRequest()
    {
        return $this->belongsTo(LeaveRequest::class, 'leave_request_id');
    }
}
