<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\StaffAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function analytics(Request $request): JsonResponse
    {
        StaffAccess::require($request, ['administrator']);
        $today = today()->toDateString();
        $lowStock = DB::table('medicine_items')
            ->leftJoin('inventory_batches', 'inventory_batches.medicine_item_id', '=', 'medicine_items.id')
            ->where('medicine_items.is_active', true)
            ->groupBy('medicine_items.id', 'medicine_items.reorder_level')
            ->havingRaw('COALESCE(SUM(inventory_batches.quantity_on_hand), 0) <= medicine_items.reorder_level')
            ->count();

        return response()->json(['data' => [
            'today' => [
                'appointments' => DB::table('appointments')->where('appointment_date', $today)->count(),
                'waiting_for_triage' => DB::table('appointments')->where('appointment_date', $today)->where('status', 'waiting_for_triage')->count(),
                'waiting_for_doctor' => DB::table('appointments')->where('appointment_date', $today)->where('status', 'waiting_for_doctor')->count(),
                'completed' => DB::table('appointments')->where('appointment_date', $today)->where('status', 'completed')->count(),
                'low_stock_items' => $lowStock,
            ],
            'appointments_by_day' => DB::table('appointments')
                ->whereBetween('appointment_date', [today()->subDays(29)->toDateString(), $today])
                ->selectRaw('appointment_date as date, count(*) as total')
                ->groupBy('appointment_date')->orderBy('appointment_date')->get(),
            'appointments_by_care_area' => DB::table('appointments')
                ->join('care_areas', 'care_areas.id', '=', 'appointments.care_area_id')
                ->whereBetween('appointment_date', [today()->subDays(29)->toDateString(), $today])
                ->selectRaw('care_areas.name as care_area, count(*) as total')
                ->groupBy('care_areas.name')->orderByDesc('total')->get(),
        ]]);
    }

    public function appointments(Request $request): JsonResponse
    {
        StaffAccess::require($request, ['administrator']);
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'care_area_id' => ['nullable', 'integer', 'exists:care_areas,id'],
        ]);
        $query = DB::table('appointments')
            ->join('patient_profiles', 'patient_profiles.id', '=', 'appointments.patient_profile_id')
            ->join('services', 'services.id', '=', 'appointments.service_id')
            ->join('care_areas', 'care_areas.id', '=', 'appointments.care_area_id')
            ->leftJoin('queue_tickets', 'queue_tickets.appointment_id', '=', 'appointments.id')
            ->orderByDesc('appointments.appointment_date')->orderByDesc('appointments.id');
        if (! empty($data['from'])) $query->where('appointments.appointment_date', '>=', $data['from']);
        if (! empty($data['to'])) $query->where('appointments.appointment_date', '<=', $data['to']);
        if (! empty($data['care_area_id'])) $query->where('appointments.care_area_id', $data['care_area_id']);

        return response()->json(['data' => $query->get([
            'appointments.id', 'appointments.appointment_date', 'appointments.time_slot', 'appointments.visit_type',
            'appointments.attendance_status', 'appointments.status', 'patient_profiles.patient_number',
            'patient_profiles.given_name', 'patient_profiles.family_name', 'services.name as service_name',
            'care_areas.name as care_area', 'queue_tickets.queue_number', 'queue_tickets.priority',
        ])]);
    }
}
