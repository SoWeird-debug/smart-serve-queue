<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DirectoryController extends Controller
{
    public function careAreas(): JsonResponse
    {
        return response()->json([
            'data' => DB::table('care_areas')
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'building']),
        ]);
    }

    public function municipalities(Request $request): JsonResponse
    {
        $query = DB::table('municipalities')
            ->join('provinces', 'provinces.id', '=', 'municipalities.province_id')
            ->select('municipalities.id', 'municipalities.name', 'municipalities.postal_code');

        if ($request->filled('province')) {
            $query->where('provinces.name', $request->string('province')->toString());
        }

        return response()->json(['data' => $query->orderBy('municipalities.name')->get()]);
    }

    public function barangays(int $municipalityId): JsonResponse
    {
        return response()->json([
            'data' => DB::table('barangays')
                ->where('municipality_id', $municipalityId)
                ->orderBy('name')
                ->get(['id', 'name', 'postal_code']),
        ]);
    }

    public function services(): JsonResponse
    {
        return response()->json([
            'data' => DB::table('services')
                ->join('care_areas', 'care_areas.id', '=', 'services.care_area_id')
                ->where('services.is_active', true)
                ->orderBy('services.name')
                ->get([
                    'services.id', 'services.name', 'services.description',
                    'services.duration_minutes', 'services.daily_capacity',
                    'services.follow_up_eligible', 'care_areas.name as care_area',
                    'care_areas.building',
                ]),
        ]);
    }
}
