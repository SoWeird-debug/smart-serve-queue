<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\LocalDemoAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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
        $this->assertTrue(password_verify(LocalDemoAccountSeeder::PASSWORD, User::where('username', 'demo_administrator')->value('password')));
        $password = User::where('username', 'demo_administrator')->value('password');
        $this->artisan('smartserve:demo-accounts --create-only --apply')->expectsConfirmation($question, 'yes')->assertSuccessful();
        $this->assertDatabaseCount('users', 6);
        $this->assertSame($password, User::where('username', 'demo_administrator')->value('password'));
    }

    public function test_database_seeder_creates_five_verified_local_demo_accounts(): void
    {
        $existing = User::factory()->create(['role' => 'administrator']);
        $before = $existing->fresh()->getAttributes();
        $this->seed();
        $this->assertSame($before, $existing->fresh()->getAttributes());
        $this->assertSame(5, User::where('username', 'like', 'demo_%')->count());
        foreach (LocalDemoAccountSeeder::ROLES as $role) {
            $demo = User::where('username', 'demo_'.$role)->firstOrFail();
            $this->assertTrue($demo->is_active);
            $this->assertTrue($demo->hasVerifiedEmail());
            $this->assertFalse($demo->must_change_password);
            $this->assertTrue(password_verify(LocalDemoAccountSeeder::PASSWORD, $demo->password));
        }
    }

    public function test_local_demo_seeder_repairs_a_legacy_non_bcrypt_password(): void
    {
        $this->seed(LocalDemoAccountSeeder::class);
        DB::table('users')
            ->where('username', 'demo_administrator')
            ->update(['password' => 'legacy-plain-text-password']);

        $this->seed(LocalDemoAccountSeeder::class);

        $password = User::where('username', 'demo_administrator')->value('password');
        $this->assertTrue(password_verify(LocalDemoAccountSeeder::PASSWORD, $password));
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
