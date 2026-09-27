<?php

namespace App\Console\Commands;

use App\Models\User;
use Database\Seeders\LocalDemoAccountSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ResetClinicDemoAccounts extends Command
{
    protected $signature = 'smartserve:demo-accounts {--apply : Apply the previewed changes} {--create-only : Local testing only; add missing demo accounts without changing existing accounts}';

    protected $description = 'Preview or reset clinic access without deleting patient or clinical history';

    public function handle(): int
    {
        $roles = ['administrator', 'front_desk', 'nurse_triage', 'doctor', 'pharmacy'];
        $createOnly = (bool) $this->option('create-only');
        if ($createOnly && ! app()->environment(['local', 'testing'])) {
            $this->error('Create-only demo setup is restricted to local/testing environments.');

            return self::FAILURE;
        }
        $existing = User::whereIn('role', $roles)->get();
        $this->info('Environment: '.app()->environment().' | Database: '.DB::connection()->getDatabaseName());
        $this->warn($createOnly ? 'Only missing demo accounts will be added. Existing accounts and records remain unchanged.' : 'Existing clinic logins will be disabled. Patient accounts and clinical records are preserved.');
        $this->line('Clinic accounts in scope: '.$existing->count());
        if (! $this->option('apply')) {
            $this->info('Preview only. Run again with --apply after backing up the database.');

            return self::SUCCESS;
        }
        if (! $this->confirm($createOnly ? 'Create missing local demo accounts without changing existing accounts?' : 'Have you backed up this database and want to replace clinic access with five demo logins?', false)) {
            return self::FAILURE;
        }

        // Abort before any writes if a reserved demo identity belongs to another account.
        foreach ($roles as $role) {
            $username = 'demo_'.$role;
            $email = $username.'@demo.invalid';
            $collision = User::where(function ($query) use ($username, $email) {
                $query->where('username', $username)->orWhere('email', $email);
            })->get()->contains(fn ($user) => $user->role !== $role || $user->username !== $username || $user->email !== $email || $user->patientProfile()->exists());
            if ($collision) {
                $this->error('Reserved demo identity is already in use: '.$username.'. No changes made.');

                return self::FAILURE;
            }
        }
        if (! $createOnly && $existing->contains(fn ($user) => $user->patientProfile()->exists())) {
            $this->error('A clinic account has a patient profile. Resolve this mixed identity first. No changes made.');

            return self::FAILURE;
        }

        if ($createOnly) {
            app(LocalDemoAccountSeeder::class)->run();
            $this->table(['Role', 'Username', 'Password'], collect(LocalDemoAccountSeeder::ROLES)
                ->map(fn (string $role) => [$role, 'demo_'.$role, LocalDemoAccountSeeder::PASSWORD])
                ->all());
            $this->info('No existing non-demo accounts or clinical records changed.');

            return self::SUCCESS;
        }

        $credentials = DB::transaction(function () use ($existing, $roles) {
            foreach ($existing as $user) {
                $user->update(['is_active' => false, 'remember_token' => null]);
                $user->tokens()->delete();
                DB::table('sessions')->where('user_id', $user->id)->delete();
                DB::table('account_email_tokens')->where('user_id', $user->id)->delete();
                DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            }
            $areas = DB::table('care_areas')->where('is_active', true)->pluck('id')->all();
            $credentials = [];
            foreach ($roles as $role) {
                $username = 'demo_'.$role;
                $password = Str::random(24).'!7aA';
                User::updateOrCreate(['username' => $username], [
                    'name' => 'Demo '.Str::headline($role),
                    'email' => $username.'@demo.invalid',
                    'password' => $password,
                    'role' => $role,
                    'is_active' => true,
                    'email_verified_at' => now(),
                    'must_change_password' => false,
                    'assigned_care_areas' => $areas,
                ]);
                $credentials[] = [$role, $username, $password];
            }

            return $credentials;
        });
        $this->table(['Role', 'Username', 'Password (save privately)'], $credentials);
        $this->warn('These demo inboxes cannot receive mail. Normal signup and real-email recovery are unchanged.');
        $this->warn('Demo actions use the real database. Do not enter fake clinical encounters on the live site.');
        $this->info('No patients or clinical records were deleted. Re-running rotates all demo passwords.');

        return self::SUCCESS;
    }
}
