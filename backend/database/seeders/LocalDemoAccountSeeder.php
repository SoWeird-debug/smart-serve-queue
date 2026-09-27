<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class LocalDemoAccountSeeder extends Seeder
{
    public const PASSWORD = 'SmartServeDemo123!';

    public const ROLES = ['administrator', 'front_desk', 'nurse_triage', 'doctor', 'pharmacy'];

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->warn('Local demo accounts were not created outside the local/testing environment.');

            return;
        }

        $areas = DB::table('care_areas')->where('is_active', true)->pluck('id')->all();
        foreach (self::ROLES as $role) {
            $username = 'demo_'.$role;
            $email = $username.'@demo.invalid';
            $user = User::where('username', $username)->orWhere('email', $email)->first();
            if ($user && ($user->username !== $username || $user->email !== $email || $user->role !== $role || $user->patientProfile()->exists())) {
                throw new RuntimeException('Reserved local demo identity is already used by another account: '.$username);
            }

            $user ??= new User;
            $user->forceFill([
                'name' => 'Demo '.Str::headline($role),
                'username' => $username,
                'email' => $email,
                'role' => $role,
                'is_active' => true,
                'email_verified_at' => $user->email_verified_at ?? now(),
                'must_change_password' => false,
                'assigned_care_areas' => $areas,
            ]);
            if (! $user->exists || ! Hash::check(self::PASSWORD, (string) $user->password)) {
                $user->password = self::PASSWORD;
            }
            $user->save();
        }

        $this->command?->info('Local demo accounts are ready. Password: '.self::PASSWORD);
    }
}
