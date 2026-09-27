<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ActiveVerifiedAccount
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_unless($user && $user->is_active && $user->hasVerifiedEmail() && ! $user->must_change_password, 403,
            'Your account needs activation. Please sign in again and verify your email.');

        return $next($request);
    }
}
