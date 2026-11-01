<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Test application API health.
     */
    public function test_api_status_endpoint_returns_success(): void
    {
        $response = $this->getJson('/api/v1/ping');
        $response->assertStatus(200)
            ->assertJson(['status' => 'ok', 'app' => 'Eduvera API']);
    }

    /**
     * Test Super Admin login authentication and API token generation.
     */
    public function test_super_admin_can_login_and_receive_token(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@eduvera.school',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'name', 'email', 'role', 'status', 'permissions'],
                    'token',
                    'token_type',
                ],
            ]);

        $this->assertEquals('Admin', $response->json('data.user.role'));
        $this->assertNotEmpty($response->json('data.token'));
    }

    /**
     * Test Finance user role segregation:
     * - Can access fees module
     * - Forbidden (403) from staff and admin endpoints
     */
    public function test_finance_role_segregation(): void
    {
        $financeUser = User::where('email', 'finance@eduvera.school')->first();
        $this->assertNotNull($financeUser, 'Finance user must exist in MySQL');

        $token = $financeUser->api_token;

        // Finance role CAN access fees summary
        $feesResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/fees/summary');
        $feesResponse->assertStatus(200);

        // Finance role CANNOT access staff directory
        $staffResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/staff');
        $staffResponse->assertStatus(403);

        // Finance role CANNOT access admin user management
        $adminResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/admin/users');
        $adminResponse->assertStatus(403);
    }

    /**
     * Test Super Admin user provisioning and dynamic role updates.
     */
    public function test_super_admin_can_manage_user_roles(): void
    {
        $adminUser = User::where('email', 'admin@eduvera.school')->first();
        $this->assertNotNull($adminUser, 'Admin user must exist in MySQL');

        $token = $adminUser->api_token;

        // Admin can list users
        $usersResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/admin/users');
        $usersResponse->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'email', 'role', 'status'],
                ],
            ]);

        // Admin can reassign role
        $financeUser = User::where('email', 'finance@eduvera.school')->first();
        $updateResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/v1/admin/users/{$financeUser->id}/role", [
                'role' => 'HR',
            ]);
        $updateResponse->assertStatus(200);

        $financeUser->refresh();
        $this->assertEquals('HR', $financeUser->role);

        // Reset back to Finance
        $financeUser->update(['role' => 'Finance']);
    }

    /**
     * Test invalid login fails.
     */
    public function test_invalid_login_rejected(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@eduvera.school',
            'password' => 'wrongpassword123',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test institutional signup creates Super Admin account.
     */
    public function test_institutional_registration_creates_super_admin(): void
    {
        $uniqueEmail = 'principal_' . time() . '@academy.test';

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Principal Vance',
            'email' => $uniqueEmail,
            'password' => 'SecurePass123!',
            'school_name' => 'Vance International Academy',
            'phone' => '+1 555-0199',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'role', 'status'],
                    'token',
                ],
            ]);

        $this->assertEquals('Admin', $response->json('data.user.role'));

        // Clean up test record
        User::where('email', $uniqueEmail)->delete();
    }
}

