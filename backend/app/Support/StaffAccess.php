<?php

namespace App\Support;

use Illuminate\Http\Request;

class StaffAccess
{
    public static function require(Request $request, array $roles): void
    {
        $user = $request->user();
        abort_unless(
            $user && $user->is_active && in_array($user->role, $roles, true) && $user->tokenCan($user->role),
            403,
            'Staff access required.',
        );
    }

    public static function requireCareArea(Request $request, int $careAreaId): void
    {
        $user = $request->user();
        if ($user->role === 'administrator') {
            return;
        }
        $assigned = collect($user->assigned_care_areas ?? [])->map(fn ($area) => (int) $area);
        abort_unless($assigned->contains($careAreaId), 403, 'This staff account is not assigned to this care area.');
    }
}
