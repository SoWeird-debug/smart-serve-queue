<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PublicQueueBoardController extends Controller
{
    /**
     * A deliberately minimal, unauthenticated display feed. It returns queue
     * numbers and workflow state only—never patient names, patient numbers,
     * contact details, diagnoses, or clinical notes.
     */
    public function show(string $board): JsonResponse
    {
        $areaName = match ($board) {
            'general-clinic' => 'General Clinic',
            'animal-bite' => 'Animal Bite Center',
            default => abort(404, 'Queue board not found.'),
        };
        $area = DB::table('care_areas')->where('name', $areaName)->where('is_active', true)->first();
        abort_unless($area, 404, 'Queue board is not available.');

        $statusLabels = [
            'waiting_for_triage' => 'Waiting for Triage',
            'triage' => 'Triage',
            'waiting_for_doctor' => 'Waiting for Doctor',
            'called' => 'Called',
            'in_consultation' => 'In Consultation',
        ];
        $appointments = DB::table('queue_tickets')
            ->join('appointments', 'appointments.id', '=', 'queue_tickets.appointment_id')
            ->where('queue_tickets.care_area_id', $area->id)
            ->where('queue_tickets.queue_date', today()->toDateString())
            ->whereNotNull('queue_tickets.active_queue_number')
            ->whereIn('appointments.status', array_keys($statusLabels))
            ->orderByRaw("CASE queue_tickets.priority WHEN 'emergency' THEN 1 WHEN 'urgent' THEN 2 WHEN 'priority' THEN 3 ELSE 4 END")
            ->orderBy('queue_tickets.queue_sequence')
            ->get([
                'queue_tickets.id', 'queue_tickets.queue_number', 'queue_tickets.priority',
                'queue_tickets.entered_queue_at', 'appointments.status',
            ])
            ->map(fn (object $ticket) => [
                'id' => (string) $ticket->id,
                'queueNumber' => str_pad((string) $ticket->queue_number, 3, '0', STR_PAD_LEFT),
                'queueStatus' => $statusLabels[$ticket->status],
                'room' => $area->building ?: 'assigned room',
                'queueArea' => $areaName,
                'triagePriority' => ucfirst((string) $ticket->priority),
                'queueEnteredAt' => $ticket->entered_queue_at,
                'createdAt' => $ticket->entered_queue_at,
            ]);

        return response()->json([
            'appointments' => $appointments,
            'doctors' => [],
            'updatedAt' => now()->toIso8601String(),
        ])->header('Cache-Control', 'no-store, private');
    }
}
