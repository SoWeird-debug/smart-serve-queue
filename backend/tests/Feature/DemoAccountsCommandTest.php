<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoAccountsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_only_preserves_existing_accounts_and_passwords(): void
    {
        $admin = User::factory()->create(['role' => 'administrator', 'is_active' => true]);
        $before = $admin->fresh()->getAttributes();
        $question = 'Create missing local demo accounts without changing existing accounts?';
        $this->artisan('smartserve:demo-accounts --create-only --apply')->expectsConfirmation($question, 'yes')->assertSuccessful();
        $this->assertSame($before, $admin->fresh()->getAttributes());
        $password = User::where('username', 'demo_administrator')->value('password');
        $this->artisan('smartserve:demo-accounts --create-only --apply')->expectsConfirmation($question, 'yes')->assertSuccessful();
        $this->assertDatabaseCount('users', 6);
        $this->assertSame($password, User::where('username', 'demo_administrator')->value('password'));
    }

    public function test_preview_does_not_modify_accounts(): void
    {
        $staff = User::factory()->create(['role' => 'administrator', 'is_active' => true]);
        $this->artisan('smartserve:demo-accounts')->assertSuccessful();
        $this->assertTrue($staff->fresh()->is_active);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_reset_preserves_patient_and_old_staff_rows_and_rotates_demo_access(): void
    {
        $patient = User::factory()->create(['role' => 'patient', 'is_active' => true]);
        $before = $patient->fresh()->getAttributes();
        $staff = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
        $staff->createToken('staff workspace');
        $question = 'Have you backed up this database and want to replace clinic access with five demo logins?';
        $this->artisan('smartserve:demo-accounts --apply')->expectsConfirmation($question, 'yes')->assertSuccessful();
        $this->assertSame($before, $patient->fresh()->getAttributes());
        $this->assertFalse($staff->fresh()->is_active);
        $this->assertSame(0, $staff->tokens()->count());
        $this->assertDatabaseCount('users', 7);
        $demo = User::where('username', 'demo_administrator')->firstOrFail();
        $this->assertTrue($demo->is_active);
        $this->assertTrue($demo->hasVerifiedEmail());
        $this->assertFalse($demo->must_change_password);
        $oldPassword = $demo->password;
        $this->artisan('smartserve:demo-accounts --apply')->expectsConfirmation($question, 'yes')->assertSuccessful();
        $this->assertDatabaseCount('users', 7);
        $this->assertNotSame($oldPassword, $demo->fresh()->password);
    }
}
