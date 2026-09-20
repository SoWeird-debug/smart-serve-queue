<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\StaffAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ConsultationController extends Controller
{
    public function call(Request $request, int $appointmentId): JsonResponse
    {
        StaffAccess::require($request, ['doctor', 'administrator']);
        $appointment = DB::table('appointments')->where('id', $appointmentId)->first();
        abort_unless($appointment, 404, 'Appointment not found.');
        StaffAccess::requireCareArea($request, (int) $appointment->care_area_id);
        abort_unless($appointment->status === 'waiting_for_doctor', 422, 'This appointment is not ready for a doctor.');
        DB::table('appointments')->where('id', $appointmentId)->update([
            'status' => 'called', 'updated_at' => now(),
        ]);
        DB::table('queue_tickets')->where('appointment_id', $appointmentId)->update([
            'called_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['data' => DB::table('appointments')->where('id', $appointmentId)->first()]);
    }

    public function complete(Request $request, int $appointmentId): JsonResponse
    {
        StaffAccess::require($request, ['doctor', 'administrator']);
        $data = $request->validate([
            'diagnosis' => ['required', 'string', 'max:4000'],
            'clinical_notes' => ['nullable', 'string', 'max:20000'],
            'follow_ups' => ['nullable', 'array'],
            'follow_ups.*.follow_up_date' => ['required_with:follow_ups', 'date', 'after_or_equal:today'],
            'follow_ups.*.type' => ['required_with:follow_ups', 'string', 'max:100'],
            'follow_ups.*.reason' => ['nullable', 'string', 'max:4000'],
            'prescription_items' => ['nullable', 'array'],
            'prescription_items.*.medicine_item_id' => ['required_with:prescription_items', 'integer', 'exists:medicine_items,id'],
            'prescription_items.*.quantity_prescribed' => ['required_with:prescription_items', 'integer', 'min:1'],
            'prescription_items.*.instructions' => ['nullable', 'string', 'max:4000'],
            'animal_bite' => ['nullable', 'array'],
            'animal_bite.exposure_category' => ['nullable', Rule::in(['category_i', 'category_ii', 'category_iii', 'pending_classification'])],
            'animal_bite.vaccine_plan' => ['nullable', Rule::in(['pep', 'not_ordered', 'refer'])],
            'animal_bite.rabies_immunoglobulin_status' => ['nullable', Rule::in(['assess', 'indicated', 'not_indicated', 'given_or_referred'])],
            'animal_bite.tetanus_protection_status' => ['nullable', Rule::in(['assess', 'indicated', 'not_indicated', 'given_or_referred'])],
            'animal_bite.protocol_note' => ['nullable', 'string', 'max:4000'],
            'animal_bite.doses' => ['nullable', 'array'],
            'animal_bite.doses.*.dose_number' => ['required_with:animal_bite.doses', 'integer', 'min:1', 'max:10'],
            'animal_bite.doses.*.scheduled_for' => ['required_with:animal_bite.doses', 'date'],
            'animal_bite.doses.*.medicine_item_id' => ['nullable', 'integer', 'exists:medicine_items,id'],
        ]);

        $consultation = DB::transaction(function () use ($request, $appointmentId, $data): array {
            $appointment = DB::table('appointments')->where('id', $appointmentId)->lockForUpdate()->first();
            abort_unless($appointment, 404, 'Appointment not found.');
            StaffAccess::requireCareArea($request, (int) $appointment->care_area_id);
            abort_unless(in_array($appointment->status, ['waiting_for_doctor', 'called', 'in_consultation'], true), 422, 'This appointment cannot be completed now.');

            $consultationId = DB::table('consultations')->insertGetId([
                'appointment_id' => $appointmentId,
                'doctor_id' => $request->user()->id,
                'diagnosis' => $data['diagnosis'],
                'clinical_notes' => $data['clinical_notes'] ?? null,
                'consulted_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            foreach ($data['follow_ups'] ?? [] as $followUp) {
                DB::table('consultation_follow_ups')->insert([
                    'consultation_id' => $consultationId,
                    'follow_up_date' => $followUp['follow_up_date'],
                    'type' => $followUp['type'],
                    'reason' => $followUp['reason'] ?? null,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
            if (! empty($data['prescription_items'])) {
                $prescriptionId = DB::table('prescriptions')->insertGetId([
                    'consultation_id' => $consultationId,
                    'status' => 'prescribed',
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                foreach ($data['prescription_items'] as $item) {
                    DB::table('prescription_items')->insert([
                        'prescription_id' => $prescriptionId,
                        'medicine_item_id' => $item['medicine_item_id'],
                        'quantity_prescribed' => $item['quantity_prescribed'],
                        'instructions' => $item['instructions'] ?? null,
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }
            if (isset($data['animal_bite'])) {
                $case = $data['animal_bite'];
                $caseId = DB::table('animal_bite_cases')->insertGetId([
                    'consultation_id' => $consultationId,
                    'exposure_category' => $case['exposure_category'] ?? 'pending_classification',
                    'vaccine_plan' => $case['vaccine_plan'] ?? 'pep',
                    'rabies_immunoglobulin_status' => $case['rabies_immunoglobulin_status'] ?? 'assess',
                    'tetanus_protection_status' => $case['tetanus_protection_status'] ?? 'assess',
                    'protocol_note' => $case['protocol_note'] ?? null,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                foreach ($case['doses'] ?? [] as $dose) {
                    DB::table('animal_bite_vaccine_doses')->insert([
                        'animal_bite_case_id' => $caseId,
                        'medicine_item_id' => $dose['medicine_item_id'] ?? null,
                        'dose_number' => $dose['dose_number'],
                        'scheduled_for' => $dose['scheduled_for'],
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }
            DB::table('appointments')->where('id', $appointmentId)->update([
                'status' => 'completed', 'updated_at' => now(),
            ]);
            // Releasing the active number makes it reusable after 001–100 are
            // exhausted, while retaining the historical queue number.
            DB::table('queue_tickets')->where('appointment_id', $appointmentId)->update([
                'active_queue_number' => null, 'completed_at' => now(), 'updated_at' => now(),
            ]);

            return (array) DB::table('consultations')->where('id', $consultationId)->first();
        });

        return response()->json(['data' => $consultation], 201);
    }
}
