<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Single Executive Super Admin
        User::updateOrCreate(
            ['email' => 'admin@eduvera.school'],
            [
                'name' => 'Dr. Sarah Jenkins',
                'password' => bcrypt('password123'),
                'role' => 'Admin',
                'status' => 'Active',
                'phone' => '+1 (555) 100-2001',
                'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                'api_token' => bin2hex(random_bytes(32)),
            ]
        );

        // 2. Finance User
        User::updateOrCreate(
            ['email' => 'finance@eduvera.school'],
            [
                'name' => 'Marcus Sterling',
                'password' => bcrypt('password123'),
                'role' => 'Finance',
                'status' => 'Active',
                'phone' => '+1 (555) 100-2002',
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                'api_token' => bin2hex(random_bytes(32)),
            ]
        );

        // 3. HR User
        User::updateOrCreate(
            ['email' => 'hr@eduvera.school'],
            [
                'name' => 'Elena Rostova',
                'password' => bcrypt('password123'),
                'role' => 'HR',
                'status' => 'Active',
                'phone' => '+1 (555) 100-2003',
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                'api_token' => bin2hex(random_bytes(32)),
            ]
        );

        // 4. Academic Coordinator User
        User::updateOrCreate(
            ['email' => 'academic@eduvera.school'],
            [
                'name' => 'Prof. Julian Hayes',
                'password' => bcrypt('password123'),
                'role' => 'Academic',
                'status' => 'Active',
                'phone' => '+1 (555) 100-2004',
                'avatar' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
                'api_token' => bin2hex(random_bytes(32)),
            ]
        );

        // 5. Seed Complete Fee Management System
        $this->call(FeeSeeder::class);

        // 6. Seed Complete Attendance Management System
        $this->call(AttendanceSeeder::class);

        // 7. Seed Student Directory Cohort
        $this->call(StudentSeeder::class);

        // 8. Seed Examination Sessions & Subject Marksheets
        $this->call(ExaminationSeeder::class);

        // 9. Seed Campus Noticeboard Bulletins
        $this->call(NoticeSeeder::class);
    }
}
