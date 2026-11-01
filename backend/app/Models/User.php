<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_demo',
        'status',
        'avatar',
        'phone',
        'api_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_demo' => 'boolean',
        ];
    }

    /**
     * Role Check Helpers
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['Admin', 'Super Admin']);
    }

    public function isFinance(): bool
    {
        return $this->role === 'Finance' || $this->isAdmin();
    }

    public function isHR(): bool
    {
        return $this->role === 'HR' || $this->isAdmin();
    }

    public function isAcademic(): bool
    {
        return $this->role === 'Academic' || $this->isAdmin();
    }

    public function hasRole(string|array $roles): bool
    {
        if (is_string($roles)) {
            $roles = array_map('trim', explode(',', $roles));
        }

        if ($this->isAdmin()) {
            return true;
        }

        return in_array($this->role, $roles);
    }
}
