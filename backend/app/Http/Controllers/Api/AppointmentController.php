<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profileId = $this->patientProfileId($request);

        return response()->json([
            'data' => DB::table('appointments')
                ->join('services', 'services.id', '=', 'appointments.service_id')
                ->join('care_areas', 'care_areas.id', '=', 'appointments.care_area_id')
                ->where('appointments.patient_profile_id', $profileId)
                ->orderBy('appointments.appointment_date')
                ->orderBy('appointments.created_at')
                ->get([
                    'appointments.id', 'appointments.appointment_date',
                    'appointments.time_slot', 'appointments.visit_type',
                    'appointments.attendance_status', 'appointments.status',
                    'services.name as service_name', 'care_areas.name as care_area',
                    'care_areas.building',
                ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $profileId = $this->patientProfileId($request);
        $data = $request->validate([
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
        ]);
        $service = DB::table('services')
            ->where('id', $data['service_id'])
            ->where('is_active', true)
            ->first();
        abort_unless($service, 422, 'This service is not currently available.');

        $appointment = DB::transaction(function () use ($data, $profileId, $service): array {
            $booked = DB::table('appointments')
                ->where('service_id', $service->id)
                ->where('appointment_date', $data['appointment_date'])
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->lockForUpdate()
                ->count();
            abort_if($booked >= $service->daily_capacity, 422, 'No remaining appointment capacity for this date.');

            $id = DB::table('appointments')->insertGetId([
                'patient_profile_id' => $profileId,
                'service_id' => $service->id,
                'care_area_id' => $service->care_area_id,
                'appointment_date' => $data['appointment_date'],
                'time_slot' => 'Clinic hours',
                'visit_type' => 'scheduled',
                'attendance_status' => 'pending',
                'status' => 'scheduled',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return (array) DB::table('appointments')->where('id', $id)->first();
        });

        return response()->json(['data' => $appointment], 201);
    }

    public function cancel(Request $request, int $appointmentId): JsonResponse
    {
        $profileId = $this->patientProfileId($request);
        $updated = DB::table('appointments')
            ->where('id', $appointmentId)
            ->where('patient_profile_id', $profileId)
            ->whereIn('status', ['scheduled'])
            ->update(['status' => 'cancelled', 'updated_at' => now()]);
        abort_unless($updated, 422, 'This appointment cannot be cancelled.');

        return response()->json(status: 204);
    }

    private function patientProfileId(Request $request): int
    {
        abort_unless($request->user()->tokenCan('patient'), 403, 'Patient access required.');
        $id = DB::table('patient_profiles')->where('user_id', $request->user()->id)->value('id');
        abort_unless($id, 404, 'Patient profile not found.');

        return (int) $id;
    }
}
