<?php

use App\Http\Controllers\Api\PatientAuthController;
use App\Http\Controllers\Api\DirectoryController;
use App\Http\Controllers\Api\StaffAuthController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\StaffQueueController;
use App\Http\Controllers\Api\PublicQueueBoardController;
use App\Http\Controllers\Api\TriageController;
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\AdministrationController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', fn () => response()->json([
        'status' => 'ok',
        'application' => config('app.name'),
    ]));

    Route::post('/patient-auth/register', [PatientAuthController::class, 'register'])->middleware('throttle:6,1');
    Route::post('/patient-auth/login', [PatientAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::get('/staff-auth/setup-status', [StaffAuthController::class, 'setupStatus'])->middleware('throttle:30,1');
    Route::post('/staff-auth/setup-administrator', [StaffAuthController::class, 'setupAdministrator'])->middleware('throttle:3,1');
    Route::post('/staff-auth/login', [StaffAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::get('/directories/municipalities', [DirectoryController::class, 'municipalities']);
    Route::get('/directories/municipalities/{municipalityId}/barangays', [DirectoryController::class, 'barangays']);
    Route::get('/services', [DirectoryController::class, 'services']);
    Route::get('/public/queue-board/{board}', [PublicQueueBoardController::class, 'show'])->middleware('throttle:120,1');
    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/patient-auth/me', [PatientAuthController::class, 'current']);
        Route::post('/patient-auth/logout', [PatientAuthController::class, 'logout']);
        Route::patch('/patient-auth/profile', [PatientAuthController::class, 'updateProfile']);
        Route::post('/patient-auth/change-password', [PatientAuthController::class, 'changePassword']);
        Route::get('/staff-auth/me', [StaffAuthController::class, 'current']);
        Route::get('/staff/queue', [StaffQueueController::class, 'index']);
        Route::get('/staff/appointments/scheduled', [StaffQueueController::class, 'scheduled']);
        Route::get('/staff/patients/search', [StaffQueueController::class, 'patientSearch']);
        Route::post('/staff/patients', [StaffQueueController::class, 'registerOnsite']);
        Route::post('/staff/appointments/{appointmentId}/check-in', [StaffQueueController::class, 'checkIn']);
        Route::post('/staff/appointments/{appointmentId}/absent', [StaffQueueController::class, 'markAbsent']);
        Route::post('/staff/walk-ins', [StaffQueueController::class, 'walkIn']);
        Route::post('/staff/appointments/{appointmentId}/triage/start', [TriageController::class, 'start']);
        Route::post('/staff/appointments/{appointmentId}/triage/complete', [TriageController::class, 'complete']);
        Route::post('/staff/appointments/{appointmentId}/doctor/call', [ConsultationController::class, 'call']);
        Route::post('/staff/appointments/{appointmentId}/doctor/complete', [ConsultationController::class, 'complete']);
        Route::get('/inventory/medicines', [InventoryController::class, 'index']);
        Route::post('/inventory/medicines', [InventoryController::class, 'storeMedicine']);
        Route::post('/inventory/receive', [InventoryController::class, 'receive']);
        Route::get('/inventory/prescriptions', [InventoryController::class, 'prescriptions']);
        Route::post('/inventory/dispense', [InventoryController::class, 'dispense']);
        Route::get('/admin/staff', [AdministrationController::class, 'staff']);
        Route::post('/admin/staff', [AdministrationController::class, 'createStaff']);
        Route::patch('/admin/staff/{staffId}', [AdministrationController::class, 'updateStaff']);
        Route::post('/admin/staff/{staffId}/reset-password', [AdministrationController::class, 'resetPassword']);
        Route::patch('/doctor/availability', [AdministrationController::class, 'doctorAvailability']);
        Route::get('/admin/analytics', [ReportController::class, 'analytics']);
        Route::get('/admin/reports/appointments', [ReportController::class, 'appointments']);
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::post('/appointments/{appointmentId}/cancel', [AppointmentController::class, 'cancel']);
    });
});
