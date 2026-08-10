# Revised SmartServe core workflow

The revised prototype preserves the existing UI structure and changes only the actions and information needed for the approved clinic process.

```text
Patient
→ Appointment date and daily-capacity check
→ Front desk verification and check-in
→ Queue number assignment
→ Triage
→ Doctor consultation and medicine availability check
→ Physical / clinic-approved prescription outside SmartServe
→ Pharmacy manual dispensing record
→ Inventory deduction based on actual quantity given
→ Patient record and administration
```

## Implemented UI adaptations

- **Patient booking:** Patients choose a service and available **date**, not a specific consultation time. Booking confirmation displays a booking reference and clinic hours; the queue number appears only after check-in.
- **Patient queue and alerts:** Queue messaging uses check-in and triage states. Notifications no longer imply doctor-to-pharmacy electronic prescriptions.
- **Doctor:** The former prescription screen is now **Medicine availability**. Doctors can search/view stock only; they cannot enter quantity, alter inventory, or send prescriptions to pharmacy. Consultation records include care plan, referral, draft, and completion controls.
- **Pharmacy:** The former prescription inbox is now **Patient dispensing**. Pharmacy staff search/verify a patient who presents a physical or clinic-approved prescription, select medicine, enter actual quantity, and record fully/partially/unavailable dispensing. Stock changes only after this action.
- **Inventory:** The inventory view retains batch, expiry, stock and low-stock information, with a demo stock-in action. Stock adjustment, damaged/expired stock, returns, source/supplier, reference number, and audit persistence remain backend-phase work.
- **Staff:** Check-in assigns **Waiting for Triage**; triage includes pulse/respiratory rate and Normal/Priority/Urgent/Emergency levels. Queue staff call and route patients but do not clinically complete the consultation.
- **Admin:** Appointment listings emphasize booking reference, date, attendance, queue, and status rather than a patient-selected time. Services & Schedules now shows clinic hours, operating days, holiday closure, date status, and daily capacity information.

## Explicitly excluded

- Digital doctor-to-pharmacy prescription submission
- Prescription-ready-for-pickup notifications caused by an electronic transmission
- Inventory deduction when a doctor selects or recommends a medicine
- Any backend, authentication, database, or persistent medical data
