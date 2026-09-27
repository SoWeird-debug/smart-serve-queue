<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('smartserve:prune-registration', function () {
    DB::table('patient_registration_drafts')->where('expires_at', '<', now())->delete();
    DB::table('account_email_tokens')->where('expires_at', '<', now())->delete();
    DB::table('pending_email_verifications')->where(function ($query) {
        $query->where('registration_expires_at', '<', now())->orWhere(function ($query) {
            $query->whereNull('registration_expires_at')->where('verification_expires_at', '<', now());
        });
    })->delete();
    $this->info('Expired registration drafts and verification links removed.');
})->purpose('Remove expired, incomplete registration information');
Schedule::command('smartserve:prune-registration')->daily();

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
