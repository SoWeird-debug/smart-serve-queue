<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\StaffAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class InventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        StaffAccess::require($request, ['pharmacy', 'administrator', 'doctor']);
        $data = $request->validate(['search' => ['nullable', 'string', 'max:100']]);
        $query = DB::table('medicine_items')
            ->leftJoin('inventory_batches', 'inventory_batches.medicine_item_id', '=', 'medicine_items.id')
            ->where('medicine_items.is_active', true)
            ->groupBy('medicine_items.id', 'medicine_items.name', 'medicine_items.strength', 'medicine_items.form', 'medicine_items.category', 'medicine_items.reorder_level')
            ->selectRaw('medicine_items.id, medicine_items.name, medicine_items.strength, medicine_items.form, medicine_items.category, medicine_items.reorder_level, COALESCE(SUM(inventory_batches.quantity_on_hand), 0) as stock_on_hand');
        if (! empty($data['search'])) {
            $query->where(function ($builder) use ($data): void {
                $builder->where('medicine_items.name', 'like', '%'.$data['search'].'%')
                    ->orWhere('medicine_items.strength', 'like', '%'.$data['search'].'%')
                    ->orWhere('medicine_items.form', 'like', '%'.$data['search'].'%');
            });
        }
        return response()->json(['data' => $query->orderBy('medicine_items.name')->get()->map(fn (object $item) => [
            ...((array) $item),
            'low_stock' => (int) $item->stock_on_hand <= (int) $item->reorder_level,
        ])]);
    }

    public function storeMedicine(Request $request): JsonResponse
    {
        StaffAccess::require($request, ['administrator']);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'strength' => ['nullable', 'string', 'max:80'],
            'form' => ['required', 'string', 'max:48'],
            'category' => ['required', Rule::in(['medicine', 'vaccine', 'immunoglobulin', 'supply'])],
            'reorder_level' => ['required', 'integer', 'min:0'],
        ]);
        $id = DB::table('medicine_items')->insertGetId([...$data, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['data' => DB::table('medicine_items')->where('id', $id)->first()], 201);
    }

    public function receive(Request $request): JsonResponse
    {
        StaffAccess::require($request, ['pharmacy', 'administrator']);
        $data = $request->validate([
            'medicine_item_id' => ['required', 'integer', 'exists:medicine_items,id'],
            'care_area_id' => ['nullable', 'integer', 'exists:care_areas,id'],
            'batch_number' => ['required', 'string', 'max:100'],
            'expiry_date' => ['nullable', 'date'],
            'supplier' => ['nullable', 'string', 'max:255'],
            'delivery_reference' => ['nullable', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:4000'],
        ]);
        if ($data['care_area_id'] ?? null) StaffAccess::requireCareArea($request, (int) $data['care_area_id']);
        $batch = DB::transaction(function () use ($request, $data): object {
            $batch = DB::table('inventory_batches')
                ->where('medicine_item_id', $data['medicine_item_id'])
                ->where('care_area_id', $data['care_area_id'] ?? null)
                ->where('batch_number', $data['batch_number'])
                ->lockForUpdate()->first();
            if ($batch) {
                DB::table('inventory_batches')->where('id', $batch->id)->update([
                    'quantity_received' => $batch->quantity_received + $data['quantity'],
                    'quantity_on_hand' => $batch->quantity_on_hand + $data['quantity'],
                    'expiry_date' => $data['expiry_date'] ?? $batch->expiry_date,
                    'updated_at' => now(),
                ]);
                $batch = DB::table('inventory_batches')->where('id', $batch->id)->first();
            } else {
                $id = DB::table('inventory_batches')->insertGetId([
                    'medicine_item_id' => $data['medicine_item_id'], 'care_area_id' => $data['care_area_id'] ?? null,
                    'batch_number' => $data['batch_number'], 'expiry_date' => $data['expiry_date'] ?? null,
                    'supplier' => $data['supplier'] ?? null, 'delivery_reference' => $data['delivery_reference'] ?? null,
                    'quantity_received' => $data['quantity'], 'quantity_on_hand' => $data['quantity'],
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                $batch = DB::table('inventory_batches')->where('id', $id)->first();
            }
            DB::table('inventory_transactions')->insert([
                'inventory_batch_id' => $batch->id, 'performed_by' => $request->user()->id,
                'type' => 'stock_in', 'quantity_change' => $data['quantity'], 'notes' => $data['notes'] ?? null,
                'transacted_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);
            return $batch;
        });
        return response()->json(['data' => $batch], 201);
    }

    public function prescriptions(Request $request): JsonResponse
    {
        StaffAccess::require($request, ['pharmacy', 'administrator']);
        return response()->json(['data' => DB::table('prescription_items')
            ->join('prescriptions', 'prescriptions.id', '=', 'prescription_items.prescription_id')
            ->join('consultations', 'consultations.id', '=', 'prescriptions.consultation_id')
            ->join('appointments', 'appointments.id', '=', 'consultations.appointment_id')
            ->join('patient_profiles', 'patient_profiles.id', '=', 'appointments.patient_profile_id')
            ->join('medicine_items', 'medicine_items.id', '=', 'prescription_items.medicine_item_id')
            ->whereColumn('prescription_items.quantity_dispensed', '<', 'prescription_items.quantity_prescribed')
            ->orderBy('prescriptions.created_at')
            ->get([
                'prescription_items.id', 'prescription_items.quantity_prescribed', 'prescription_items.quantity_dispensed',
                'prescription_items.instructions', 'prescriptions.status as prescription_status',
                'patient_profiles.patient_number', 'medicine_items.name as medicine_name',
                'medicine_items.strength', 'medicine_items.form',
            ])]);
    }

    public function dispense(Request $request): JsonResponse
    {
        StaffAccess::require($request, ['pharmacy', 'administrator']);
        $data = $request->validate([
            'prescription_item_id' => ['required', 'integer', 'exists:prescription_items,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'care_area_id' => ['nullable', 'integer', 'exists:care_areas,id'],
            'notes' => ['nullable', 'string', 'max:4000'],
        ]);
        if ($data['care_area_id'] ?? null) StaffAccess::requireCareArea($request, (int) $data['care_area_id']);

        $result = DB::transaction(function () use ($request, $data): array {
            $item = DB::table('prescription_items')->where('id', $data['prescription_item_id'])->lockForUpdate()->first();
            abort_unless($item, 404, 'Prescription item not found.');
            $remainingPrescription = $item->quantity_prescribed - $item->quantity_dispensed;
            abort_if($data['quantity'] > $remainingPrescription, 422, 'Requested quantity exceeds the remaining prescribed quantity.');
            $batches = DB::table('inventory_batches')
                ->where('medicine_item_id', $item->medicine_item_id)
                ->when($data['care_area_id'] ?? null, fn ($query, $areaId) => $query->where('care_area_id', $areaId))
                ->where('quantity_on_hand', '>', 0)
                ->orderByRaw('expiry_date IS NULL, expiry_date')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();
            abort_if($batches->sum('quantity_on_hand') < $data['quantity'], 422, 'Insufficient stock to dispense this prescription item.');

            $remaining = $data['quantity'];
            foreach ($batches as $batch) {
                if ($remaining === 0) break;
                $take = min($remaining, $batch->quantity_on_hand);
                DB::table('inventory_batches')->where('id', $batch->id)->update([
                    'quantity_on_hand' => $batch->quantity_on_hand - $take,
                    'updated_at' => now(),
                ]);
                DB::table('inventory_transactions')->insert([
                    'inventory_batch_id' => $batch->id,
                    'prescription_item_id' => $item->id,
                    'performed_by' => $request->user()->id,
                    'type' => 'dispense',
                    'quantity_change' => -$take,
                    'notes' => $data['notes'] ?? null,
                    'transacted_at' => now(), 'created_at' => now(), 'updated_at' => now(),
                ]);
                $remaining -= $take;
            }
            $quantityDispensed = $item->quantity_dispensed + $data['quantity'];
            DB::table('prescription_items')->where('id', $item->id)->update([
                'quantity_dispensed' => $quantityDispensed, 'updated_at' => now(),
            ]);
            $pending = DB::table('prescription_items')->where('prescription_id', $item->prescription_id)
                ->whereColumn('quantity_dispensed', '<', 'quantity_prescribed')->exists();
            DB::table('prescriptions')->where('id', $item->prescription_id)->update([
                'status' => $pending ? 'partially_dispensed' : 'dispensed', 'updated_at' => now(),
            ]);
            return ['quantity_dispensed' => $quantityDispensed, 'prescription_status' => $pending ? 'partially_dispensed' : 'dispensed'];
        });
        return response()->json(['data' => $result]);
    }
}
