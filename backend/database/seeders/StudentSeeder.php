<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $students = [
            [
                'admission_no' => 'EDU-2025-0001',
                'first_name' => 'Alexander',
                'last_name' => 'Wright',
                'gender' => 'Male',
                'class_name' => 'Grade 10',
                'section' => 'Section A',
                'roll_no' => '1001',
                'dob' => '2009-04-12',
                'blood_group' => 'O+',
                'guardian_name' => 'Michael Wright',
                'guardian_relation' => 'Father',
                'guardian_phone' => '+1 (555) 234-5678',
                'guardian_email' => 'michael.w@example.com',
                'address' => '742 Evergreen Terrace, Springfield',
                'admission_date' => '2023-08-15',
                'status' => 'Active',
                'avatar' => 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
                'emergency_contact' => '+1 (555) 234-5679',
            ],
            [
                'admission_no' => 'EDU-2025-0002',
                'first_name' => 'Sophia',
                'last_name' => 'Martinez',
                'gender' => 'Female',
                'class_name' => 'Grade 10',
                'section' => 'Section A',
                'roll_no' => '1002',
                'dob' => '2009-08-22',
                'blood_group' => 'A+',
                'guardian_name' => 'Elena Martinez',
                'guardian_relation' => 'Mother',
                'guardian_phone' => '+1 (555) 876-5432',
                'guardian_email' => 'elena.m@example.com',
                'address' => '124 Conch Street, Pacific Pines',
                'admission_date' => '2023-08-16',
                'status' => 'Active',
                'avatar' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
                'emergency_contact' => '+1 (555) 876-5433',
            ],
            [
                'admission_no' => 'EDU-2025-0003',
                'first_name' => 'Liam',
                'last_name' => 'Johnson',
                'gender' => 'Male',
                'class_name' => 'Grade 11',
                'section' => 'Science',
                'roll_no' => '1105',
                'dob' => '2008-01-15',
                'blood_group' => 'B+',
                'guardian_name' => 'David Johnson',
                'guardian_relation' => 'Father',
                'guardian_phone' => '+1 (555) 345-6789',
                'guardian_email' => 'david.j@example.com',
                'address' => '42 Wallaby Way, Sydney Heights',
                'admission_date' => '2022-08-10',
                'status' => 'Active',
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                'emergency_contact' => '+1 (555) 345-6780',
            ],
            [
                'admission_no' => 'EDU-2025-0004',
                'first_name' => 'Emma',
                'last_name' => 'Watson',
                'gender' => 'Female',
                'class_name' => 'Grade 12',
                'section' => 'Science-A',
                'roll_no' => '1202',
                'dob' => '2007-11-30',
                'blood_group' => 'AB+',
                'guardian_name' => 'Arthur Watson',
                'guardian_relation' => 'Father',
                'guardian_phone' => '+1 (555) 901-2345',
                'guardian_email' => 'arthur.w@example.com',
                'address' => '221B Baker Street, North District',
                'admission_date' => '2021-08-20',
                'status' => 'Active',
                'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                'emergency_contact' => '+1 (555) 901-2346',
            ],
            [
                'admission_no' => 'EDU-2025-0005',
                'first_name' => 'Ethan',
                'last_name' => 'Hunt',
                'gender' => 'Male',
                'class_name' => 'Grade 9',
                'section' => 'Section B',
                'roll_no' => '9012',
                'dob' => '2010-06-18',
                'blood_group' => 'O-',
                'guardian_name' => 'Sarah Hunt',
                'guardian_relation' => 'Mother',
                'guardian_phone' => '+1 (555) 678-9012',
                'guardian_email' => 'sarah.h@example.com',
                'address' => '350 Fifth Avenue, Central Park',
                'admission_date' => '2024-08-12',
                'status' => 'Active',
                'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
                'emergency_contact' => '+1 (555) 678-9013',
            ],
        ];

        foreach ($students as $st) {
            Student::updateOrCreate(
                ['admission_no' => $st['admission_no']],
                $st
            );
        }
    }
}
