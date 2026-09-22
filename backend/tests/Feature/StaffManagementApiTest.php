<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_administrator_can_create_a_database_backed_staff_login(): void
    {
        $careAreaId = DB::table('care_areas')->insertGetId([
            'name' => 'General Clinic',
            'is_active' => true,
        ]);
        $administrator = User::factory()->create([
            'role' => 'administrator',
            'is_active' => true,
        ]);
        Sanctum::actingAs($administrator, ['administrator']);

        $this->getJson('/api/v1/directories/care-areas')
            ->assertOk()
            ->assertJsonPath('data.0.id', $careAreaId);

        $this->postJson('/api/v1/admin/staff', [
            'name' => 'Front Desk User',
            'username' => 'frontdesk',
            'password' => 'SecureStaff123!',
            'password_confirmation' => 'SecureStaff123!',
            'role' => 'front_desk',
            'is_active' => true,
            'assigned_care_area_ids' => [$careAreaId],
        ])
            ->assertCreated()
            ->assertJsonPath('data.username', 'frontdesk')
            ->assertJsonPath('data.assigned_care_area_ids.0', $careAreaId);

        $this->postJson('/api/v1/staff-auth/login', [
            'username' => 'frontdesk',
            'password' => 'SecureStaff123!',
        ])
            ->assertOk()
            ->assertJsonPath('user.role', 'front_desk');
    }
}
