<?php

namespace App\Support;

use App\Models\User;
use App\Notifications\ClinicAccountMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class AccountEmails
{
    public static function send(User $user, string $purpose = 'activation', ?string $email = null): void
    {
        $email = strtolower($email ?? $user->email);
        $token = Str::random(64);
        DB::table('account_email_tokens')->updateOrInsert(
            ['user_id' => $user->id, 'purpose' => $purpose],
            ['email' => $email, 'token_hash' => hash('sha256', $token), 'expires_at' => now()->addMinutes(30), 'created_at' => now(), 'updated_at' => now()],
        );
        $change = $purpose === 'email_change';
        Notification::route('mail', $email)->notify(new ClinicAccountMail(
            $change ? 'Confirm your new email address' : 'Welcome to your clinic account',
            $change
                ? 'Confirm this address to use it for account recovery. Your current email remains in use until you confirm.'
                : 'Your Super Health Center account is ready to activate. Verify your email, review your account details, and choose your personal password. Clinic team members sign in with their username.',
            $change ? 'Review email change' : 'Review and activate account',
            rtrim(config('smartserve.frontend_url'), '/').'/?account_token='.urlencode($token),
        ));
    }
}
