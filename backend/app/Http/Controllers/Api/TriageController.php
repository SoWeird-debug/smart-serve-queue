<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\StaffAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TriageController extends Controller
{
    private const PRIORITIES = ['normal', 'priority', 'urgent', 'emergency'];

    public function start(Request $request, int $appointmentId): JsonResponse
    {
        StaffAccess::require($request, ['nurse_triage', 'administrator']);
        $appointment = DB::table('appointments')->where('id', $appointmentId)->first();
        abort_unless($appointment, 404, 'Appointment not found.');
        StaffAccess::requireCareArea($request, (int) $appointment->care_area_id);
        abort_unless($appointment->status === 'waiting_for_triage', 422, 'This appointment is not waiting for triage.');

        DB::table('appointments')->where('id', $appointmentId)->update([
            'status' => 'triage',
            'updated_at' => now(),
        ]);

        return response()->json(['data' => DB::table('appointments')->where('id', $appointmentId)->first()]);
    }

    public function complete(Request $request, int $appointmentId): JsonResponse
    {
        StaffAccess::require($request, ['nurse_triage', 'administrator']);
        $data = $request->validate([
            'blood_pressure' => ['nullable', 'string', 'max:32'],
            'temperature' => ['nullable', 'string', 'max:32'],
            'pulse_respiratory' => ['nullable', 'string', 'max:64'],
            'allergies' => ['nullable', 'string', 'max:4000'],
            'chief_complaint' => ['nullable', 'string', 'max:4000'],
            'priority' => ['required', Rule::in(self::PRIORITIES)],
            'animal_exposure' => ['nullable', 'array'],
        ]);

        $record = DB::transaction(function () use ($request, $appointmentId, $data): array {
            $appointment = DB::table('appointments')->where('id', $appointmentId)->lockForUpdate()->first();
            abort_unless($appointment, 404, 'Appointment not found.');
            StaffAccess::requireCareArea($request, (int) $appointment->care_area_id);
            abort_unless(in_array($appointment->status, ['triage', 'waiting_for_triage'], true), 422, 'This appointment cannot be triaged now.');

            DB::table('triage_records')->updateOrInsert(
                ['appointment_id' => $appointmentId],
                [
                    ...$data,
                    'nurse_id' => $request->user()->id,
                    'animal_exposure' => isset($data['animal_exposure']) ? json_encode($data['animal_exposure']) : null,
                    'completed_at' => now(),
                    'updated_at' => now(),
                    'created_at' => now(),
                ],
            );
            DB::table('queue_tickets')->where('appointment_id', $appointmentId)->update([
                'priority' => $data['priority'],
                'updated_at' => now(),
            ]);
            DB::table('appointments')->where('id', $appointmentId)->update([
                'status' => 'waiting_for_doctor',
                'triaged_at' => now(),
                'updated_at' => now(),
            ]);

            return (array) DB::table('triage_records')->where('appointment_id', $appointmentId)->first();
        });

        return response()->json(['data' => $record]);
    }
}
