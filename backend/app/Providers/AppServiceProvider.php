<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            return rtrim(config('smartserve.frontend_url'), '/').'/?reset_email='.urlencode($notifiable->getEmailForPasswordReset()).'&reset_token='.urlencode($token);
        });
    }
}
