<?php

namespace Tests\Feature;

use App\Models\User;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffAuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_administrator_setup_and_staff_login_are_database_backed(): void
    {
        $this->getJson('/api/v1/staff-auth/setup-status')
            ->assertOk()
            ->assertJsonPath('setup_required', true);

        $this->postJson('/api/v1/staff-auth/setup-administrator', [
            'name' => 'Clinic Administrator',
            'username' => 'admin',
            'email' => 'admin@smartserve.test',
            'password' => 'SecureAdmin123!',
            'password_confirmation' => 'SecureAdmin123!',
        ])
            ->assertCreated()
            ->assertJsonPath('user.role', 'administrator')
            ->assertJsonMissingPath('token');

        $this->postJson('/api/v1/staff-auth/login', [
            'username' => 'admin', 'password' => 'SecureAdmin123!',
        ])->assertUnprocessable();
        User::where('username', 'admin')->update(['email_verified_at' => now(), 'must_change_password' => false]);

        $this->postJson('/api/v1/staff-auth/login', [
            'username' => 'admin',
            'password' => 'SecureAdmin123!',
        ])
            ->assertOk()
            ->assertJsonPath('user.username', 'admin');

        $this->getJson('/api/v1/staff-auth/setup-status')
            ->assertOk()
            ->assertJsonPath('setup_required', false);
    }
}
