<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AccountAccessApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_signs_in_with_username_and_resets_password(): void
    {
        $user = User::factory()->create([
            'email' => 'staff@smartserve.test',
            'username' => 'frontdesk',
            'role' => 'front_desk',
            'is_active' => true,
            'password' => 'OriginalPassword123!',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'identifier' => 'frontdesk',
            'password' => 'OriginalPassword123!',
        ])->assertOk()->assertJsonPath('role', 'front_desk');

        $token = Password::broker()->createToken($user);
        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'staff@smartserve.test',
            'token' => $token,
            'password' => 'UpdatedPassword123!',
            'password_confirmation' => 'UpdatedPassword123!',
        ])->assertOk();

        $this->postJson('/api/v1/auth/login', [
            'identifier' => 'frontdesk',
            'password' => 'UpdatedPassword123!',
        ])->assertOk()->assertJsonPath('role', 'front_desk');
    }
}
