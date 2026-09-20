<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StaffQueueController extends Controller
{
    private const PRIORITIES = ['normal', 'priority', 'urgent', 'emergency'];

    public function index(Request $request): JsonResponse
    {
        $this->requireStaff($request, ['front_desk', 'nurse_triage', 'doctor', 'administrator']);
        $data = $request->validate([
            'care_area_id' => ['required', 'integer', 'exists:care_areas,id'],
            'queue_date' => ['nullable', 'date'],
        ]);
        $this->assertCareAreaAccess($request, (int) $data['care_area_id']);
        $queueDate = $data['queue_date'] ?? today()->toDateString();

        return response()->json([
            'data' => DB::table('queue_tickets')
                ->join('appointments', 'appointments.id', '=', 'queue_tickets.appointment_id')
                ->join('patient_profiles', 'patient_profiles.id', '=', 'appointments.patient_profile_id')
                ->join('services', 'services.id', '=', 'appointments.service_id')
                ->where('queue_tickets.care_area_id', $data['care_area_id'])
                ->where('queue_tickets.queue_date', $queueDate)
                ->whereNotNull('queue_tickets.active_queue_number')
                ->orderByRaw("CASE queue_tickets.priority WHEN 'emergency' THEN 1 WHEN 'urgent' THEN 2 WHEN 'priority' THEN 3 ELSE 4 END")
                ->orderBy('queue_tickets.queue_sequence')
                ->get([
                    'queue_tickets.id', 'queue_tickets.queue_number', 'queue_tickets.priority',
                    'queue_tickets.source_visit_type', 'queue_tickets.entered_queue_at',
                    'appointments.id as appointment_id', 'appointments.status', 'appointments.visit_type',
                    'patient_profiles.patient_number', 'patient_profiles.family_name', 'patient_profiles.given_name',
                    'services.name as service_name',
                ]),
        ]);
    }

    public function checkIn(Request $request, int $appointmentId): JsonResponse
    {
        $this->requireStaff($request, ['front_desk', 'administrator']);
        $data = $request->validate([
            'priority' => ['nullable', Rule::in(self::PRIORITIES)],
        ]);

        $ticket = DB::transaction(function () use ($appointmentId, $data, $request): array {
            $appointment = DB::table('appointments')->where('id', $appointmentId)->lockForUpdate()->first();
            abort_unless($appointment, 404, 'Appointment not found.');
            $this->assertCareAreaAccess($request, (int) $appointment->care_area_id);
            abort_if(in_array($appointment->status, ['cancelled', 'completed', 'no_show', 'skipped'], true), 422, 'This appointment can no longer be checked in.');
            abort_if(DB::table('queue_tickets')->where('appointment_id', $appointmentId)->exists(), 422, 'This appointment already has a queue ticket.');

            DB::table('appointments')->where('id', $appointmentId)->update([
                'attendance_status' => 'present',
                'status' => 'waiting_for_triage',
                'checked_in_at' => now(),
                'updated_at' => now(),
            ]);

            return $this->createTicket($appointment, $data['priority'] ?? 'normal');
        });

        return response()->json(['data' => $ticket], 201);
    }

    public function walkIn(Request $request): JsonResponse
    {
        $this->requireStaff($request, ['front_desk', 'administrator']);
        $data = $request->validate([
            'patient_lookup' => ['required', 'string', 'max:64'],
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'priority' => ['nullable', Rule::in(self::PRIORITIES)],
            'visit_reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $ticket = DB::transaction(function () use ($data, $request): array {
            $profile = DB::table('patient_profiles')
                ->where('patient_number', $data['patient_lookup'])
                ->orWhere('mobile_number', $data['patient_lookup'])
                ->lockForUpdate()
                ->first();
            abort_unless($profile, 404, 'No registered patient matches the supplied patient number or mobile number.');

            $service = DB::table('services')->where('id', $data['service_id'])->where('is_active', true)->lockForUpdate()->first();
            abort_unless($service, 422, 'This service is not currently available.');
            $this->assertCareAreaAccess($request, (int) $service->care_area_id);

            $appointmentId = DB::table('appointments')->insertGetId([
                'patient_profile_id' => $profile->id,
                'service_id' => $service->id,
                'care_area_id' => $service->care_area_id,
                'appointment_date' => today()->toDateString(),
                'time_slot' => 'Clinic hours',
                'visit_type' => 'walk_in',
                'attendance_status' => 'present',
                'status' => 'waiting_for_triage',
                'visit_reason' => $data['visit_reason'] ?? null,
                'checked_in_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $this->createTicket((object) [
                'id' => $appointmentId,
                'care_area_id' => $service->care_area_id,
                'visit_type' => 'walk_in',
            ], $data['priority'] ?? 'normal');
        });

        return response()->json(['data' => $ticket], 201);
    }

    private function createTicket(object $appointment, string $priority): array
    {
        $date = today()->toDateString();
        $used = DB::table('queue_tickets')
            ->where('care_area_id', $appointment->care_area_id)
            ->where('queue_date', $date)
            ->whereNotNull('active_queue_number')
            ->lockForUpdate()
            ->pluck('active_queue_number')
            ->all();
        $number = collect(range(1, 100))->first(fn (int $candidate) => ! in_array($candidate, $used, true));
        abort_if($number === null, 422, 'All queue numbers from 001 to 100 are currently in use. Complete or release a ticket before assigning another number.');

        $sequence = (int) DB::table('queue_tickets')
            ->where('care_area_id', $appointment->care_area_id)
            ->where('queue_date', $date)
            ->lockForUpdate()
            ->max('queue_sequence') + 1;
        $id = DB::table('queue_tickets')->insertGetId([
            'appointment_id' => $appointment->id,
            'care_area_id' => $appointment->care_area_id,
            'queue_date' => $date,
            'queue_number' => $number,
            'active_queue_number' => $number,
            'queue_sequence' => $sequence,
            'source_visit_type' => $appointment->visit_type,
            'priority' => $priority,
            'entered_queue_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return (array) DB::table('queue_tickets')->where('id', $id)->first();
    }

    private function requireStaff(Request $request, array $roles): void
    {
        $user = $request->user();
        abort_unless($user && $user->is_active && in_array($user->role, $roles, true) && $user->tokenCan($user->role), 403, 'Staff access required.');
    }

    private function assertCareAreaAccess(Request $request, int $careAreaId): void
    {
        $user = $request->user();
        if ($user->role === 'administrator') {
            return;
        }
        $assigned = collect($user->assigned_care_areas ?? [])->map(fn ($area) => (int) $area);
        abort_unless($assigned->contains($careAreaId), 403, 'This staff account is not assigned to this care area.');
    }
}
