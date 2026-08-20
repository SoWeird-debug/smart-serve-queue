# SmartServe prototype acceptance checklist

## Approved privacy-safe patient journey

1. Patient books a service date. This creates a **Scheduled** booking only; no queue number is issued.
2. Front desk privately verifies the booking, identity, consent, and attendance. Only then does **Check in** assign the next daily queue number.
3. Nurse/triage records vitals, allergy information, chief complaint, and priority. Completing triage moves the patient to **Waiting for Doctor**.
4. Queue staff call only the queue number. The public board displays queue number, service stage, and room—never a patient name, initials, diagnosis, contact detail, or booking reference.
5. Queue staff mark the patient **Arrived at doctor** after the patient responds. This releases the patient to the doctor workspace.
6. Doctor reviews the triage handoff, records the consultation, and completes it. Medicine availability is read-only and does not create an electronic prescription.
7. Pharmacy verifies the presented clinic-approved/manual prescription and the patient privately. It may dispense only after the consultation is complete; actual dispensing deducts shared stock.
8. Admin review must ultimately contain the full audit: who, role, action, patient/visit reference, timestamp, before/after values, and reason where relevant.

## Prototype data shared in local storage

- Appointment/attendance/queue status
- Queue number assigned at check-in
- Triage record and clinical priority
- Consultation completion and digital record
- Medicine stock, receiving, and dispensing quantity
- Local audit events (kept for demonstration)

## Verify before approving the UX

- Check-in cannot expose names on the public TV board.
- A new booking is **Scheduled** and has no number until it is checked in.
- Check-in assigns one unique number and sends the person only to triage.
- Only triaged patients can be called for the doctor.
- The doctor only sees patients marked as arrived at the doctor.
- Consultation completion unlocks pharmacy dispensing; doctors cannot change inventory.
- Pharmacy deductions use the quantity actually dispensed, never a doctor recommendation.
- Local persistence survives role switching and browser refresh. Use the browser's local-storage controls to reset demo data until the UI adds an administrator reset action.
- Emergency triage must have an operational escalation path (immediate care/referral), not ordinary queueing.
- Queue numbering rules must be agreed: daily reset, service prefix/counter prefix, duplicate prevention, reprint rules, and no-show recall policy.
- Staff must verify a patient privately before discussing a queue number or clinical information.

## Required before real-world deployment

This is a UI prototype only. Do not use it with real patient data. Replace local storage with a secure backend, authenticated role-based access, server-side authorization, encrypted transport/storage, immutable audit logs, backup/recovery, consent controls, retention rules, validation, training, and formal Philippines Data Privacy Act / DOH / LGU review.
