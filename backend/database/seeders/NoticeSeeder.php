<?php

namespace Database\Seeders;

use App\Models\Notice;
use Illuminate\Database\Seeder;

class NoticeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $notices = [
            [
                'id' => 1,
                'title' => 'Annual Sports Day & Cultural Fest Announcement',
                'category' => 'Events',
                'posted_by' => 'Principal Office',
                'date' => '2025-09-12',
                'target_audience' => 'All Students & Staff',
                'content' => 'We are thrilled to announce that the Annual Sports & Cultural Meet 2025 will take place from October 12th to October 15th. Registration for track & field events opens next week.',
                'is_urgent' => false,
                'is_active' => true,
            ],
            [
                'id' => 2,
                'title' => 'Mid-Term Exam Schedule Published',
                'category' => 'Academics',
                'posted_by' => 'Examination Cell',
                'date' => '2025-09-10',
                'target_audience' => 'Grades 9-12',
                'content' => 'The official timetable for Mid-Term Examinations is now available on the student and parent portal. Exams commence on October 15th.',
                'is_urgent' => true,
                'is_active' => true,
            ],
            [
                'id' => 3,
                'title' => 'Parent-Teacher Association (PTA) Quarterly Meeting',
                'category' => 'General',
                'posted_by' => 'Administration',
                'date' => '2025-09-08',
                'target_audience' => 'Parents',
                'content' => 'The quarterly PTA assembly will be conducted online via Zoom on Saturday, September 20th at 10:00 AM. Access links will be sent to registered parent emails.',
                'is_urgent' => false,
                'is_active' => true,
            ],
        ];

        foreach ($notices as $nt) {
            Notice::updateOrCreate(['id' => $nt['id']], $nt);
        }
    }
}
