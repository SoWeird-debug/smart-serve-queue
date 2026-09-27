<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\AccountEmails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StaffAuthController extends Controller
{
    private const STAFF_ROLES = ['front_desk', 'nurse_triage', 'doctor', 'pharmacy', 'administrator'];

    public function setupStatus(): JsonResponse
    {
        return response()->json([
            'setup_required' => ! User::where('role', 'administrator')->exists(),
        ]);
    }

    public function setupAdministrator(Request $request): JsonResponse
    {
        abort_if(User::where('role', 'administrator')->exists(), 403, 'The first administrator has already been created.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'lowercase', 'alpha_dash', 'max:100', 'unique:users,username'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);
        $user = DB::transaction(function () use ($data): User {
            $user = User::create([
                'name' => $data['name'],
                'username' => $data['username'] ?? $this->usernameFromEmail($data['email']),
                'email' => strtolower($data['email']),
                'password' => $data['password'],
                'role' => 'administrator',
                'is_active' => true,
                'must_change_password' => true,
            ]);
            AccountEmails::send($user);

            return $user;
        });

        return response()->json([
            'message' => 'Administrator created. Check your email to activate your account.',
            'user' => $this->payload($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string'],
        ]);
        $user = User::where('username', $data['username'])->first();
        if (! $user || ! $user->is_active || ! in_array($user->role, self::STAFF_ROLES, true) || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid staff credentials.'], 422);
        }
        if (! $user->hasVerifiedEmail() || $user->must_change_password) {
            return response()->json(['message' => 'Activate your account through the verification email before signing in.'], 422);
        }
        $user->tokens()->where('name', 'staff workspace')->delete();

        return response()->json([
            'token' => $user->createToken('staff workspace', [$user->role])->plainTextToken,
            'user' => $this->payload($user),
        ]);
    }

    public function current(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->payload($request->user())]);
    }

    private function payload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            // The web client needs display names to select the correct staff
            // workspace. Database IDs remain the source of authorization.
            'assigned_care_areas' => DB::table('care_areas')
                ->whereIn('id', $user->assigned_care_areas ?? [])
                ->pluck('name')
                ->all(),
            'must_change_password' => $user->must_change_password,
        ];
    }

    private function usernameFromEmail(string $email): string
    {
        $base = substr(preg_replace('/[^a-z0-9_]/', '_', strtolower(strstr($email, '@', true) ?: $email)), 0, 88) ?: 'staff';
        $username = $base;
        $suffix = 1;
        while (User::where('username', $username)->exists()) {
            $username = substr($base, 0, 88).'-'.$suffix++;
        }

        return $username;
    }
}
