<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolSetting extends Model
{
    use HasFactory;

    protected $table = 'school_settings';

    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * Get a setting by key with optional fallback
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value by key
     */
    public static function set(string $key, mixed $value): void
    {
        static::updateOrInsert(
            ['key' => $key],
            ['value' => is_array($value) ? json_encode($value) : $value, 'updated_at' => now()]
        );
    }

    /**
     * Get all school settings as an associative key-value map
     */
    public static function getAllSettings(): array
    {
        return static::pluck('value', 'key')->toArray();
    }
}
