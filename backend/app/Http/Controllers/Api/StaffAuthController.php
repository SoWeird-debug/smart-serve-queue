<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
            'username' => ['required', 'string', 'alpha_dash', 'max:100', 'unique:users,username'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);
        $user = User::create([
            'name' => $data['name'],
            'username' => $data['username'],
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'role' => 'administrator',
            'is_active' => true,
        ]);

        return response()->json([
            'token' => $user->createToken('staff workspace', ['administrator'])->plainTextToken,
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
}
