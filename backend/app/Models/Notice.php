<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notice extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'category',
        'posted_by',
        'date',
        'target_audience',
        'content',
        'is_urgent',
        'is_active',
        'expiry_date',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'expiry_date' => 'date:Y-m-d',
        'is_urgent' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
