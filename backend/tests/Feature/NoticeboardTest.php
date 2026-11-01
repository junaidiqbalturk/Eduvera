<?php

namespace Tests\Feature;

use App\Models\Notice;
use App\Models\User;
use Tests\TestCase;

class NoticeboardTest extends TestCase
{
    protected string $adminToken;
    protected string $academicToken;

    protected function setUp(): void
    {
        parent::setUp();

        $admin = User::where('email', 'admin@eduvera.school')->first();
        $this->adminToken = $admin ? $admin->api_token : '';

        $academic = User::where('email', 'academic@eduvera.school')->first();
        $this->academicToken = $academic ? $academic->api_token : '';
    }

    /**
     * Test retrieving notices list from MySQL
     */
    public function test_get_notices_list(): void
    {
        $response = $this->getJson('/api/v1/notices');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'category',
                        'posted_by',
                        'date',
                        'target_audience',
                        'content',
                        'is_urgent',
                    ],
                ],
            ]);

        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    /**
     * Test publishing a new notice
     */
    public function test_publish_new_notice_success(): void
    {
        $payload = [
            'title' => 'Science Exhibition & Robotics Showcase 2025',
            'category' => 'Academics',
            'posted_by' => 'Science Department',
            'date' => '2025-10-01',
            'target_audience' => 'All Students & Staff',
            'content' => 'Annual Science and Robotics Exhibition scheduled for next month in the Main Auditorium.',
            'is_urgent' => true,
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/notices', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Science Exhibition & Robotics Showcase 2025',
                    'category' => 'Academics',
                    'is_urgent' => true,
                ],
            ]);

        $this->assertDatabaseHas('notices', [
            'title' => 'Science Exhibition & Robotics Showcase 2025',
            'is_urgent' => 1,
        ]);
    }

    /**
     * Test publishing notice validation failure
     */
    public function test_publish_notice_validation_failure(): void
    {
        $payload = [
            'title' => '',
            'content' => '',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/notices', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * Test deleting a notice
     */
    public function test_delete_notice(): void
    {
        $notice = Notice::create([
            'title' => 'Temporary Notice To Delete',
            'category' => 'General',
            'posted_by' => 'Admin',
            'date' => '2025-09-20',
            'target_audience' => 'Parents',
            'content' => 'Temporary text content',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->deleteJson('/api/v1/notices/' . $notice->id);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseMissing('notices', [
            'id' => $notice->id,
        ]);
    }
}
