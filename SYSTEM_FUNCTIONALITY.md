# SmartServe: roles and clinic workflow

## Current prototype roles

| Role | Main actions in the prototype |
| --- | --- |
| Patient | Register/sign in (demo), book an appointment, pin address, view queue and alerts, and view their digital visit and prescription history. |
| Front desk / queue staff | Check in scheduled and walk-in patients, mark attendance, assign/manage queue status, call the next patient, and route patients to services. |
| Nurse / triage staff | Record vital signs, initial complaint, allergies, and triage priority before the consultation. This is a required workflow role; its dedicated form is the next UI module to add. |
| Doctor | Open a patient record, review history/allergies, record diagnosis and consultation notes, check read-only medicine availability, create a prescription, and send it to clinic pharmacy. |
| Pharmacy staff | Verify a prescription and patient, dispense the documented quantity, give a dispensing receipt, and mark the prescription as dispensed. |
| Inventory staff | Receive deliveries, add/adjust stock with a reason, track batch and expiry, review low-stock and expiry alerts, and maintain the medicine catalog. The screen currently demonstrates stock monitoring and dispensing; receive/adjust actions require forms next. |
| Administrator | Manage users/roles, services, schedules, patient-record access, inventory oversight, reports, audit logs, digitization controls, and system policies. |

## End-to-end workflow

1. The patient books online or is registered as a walk-in.
2. Front desk verifies identity, consent, and existing record; then assigns a queue number.
3. Triage staff record vital signs, allergies, and the reason for visit.
4. The doctor reviews the digital history and records the consultation, diagnosis, and care plan.
5. Before prescribing, the doctor checks the clinic pharmacy’s current stock. Doctors cannot edit stock.
6. The doctor creates a prescription and sends it to pharmacy; the patient receives a prescription/dispensing receipt.
7. Pharmacy staff verify the patient and prescription, dispense the actual quantity, and provide counselling/receipt.
8. The system deducts stock only after dispensing. It records partial dispensing, unavailable medicines, batch, expiry, staff member, and timestamp.
9. The patient can view the resulting visit, prescription status, and allowed medical history in their portal.
10. Administrators can search the patient record, review audit events, and monitor stock and reports. Existing paper records are scanned or encoded with a source, encoder, verifier, and date.

## Required safeguards before a real public-clinic launch

This repository remains a **frontend-only prototype** and is **not ready for live clinic use or public deployment with real patient data**. Before launch, it needs a secure backend/database, real authentication and role-based access control, encrypted data in transit and at rest, audit logs, backup and recovery, consent/privacy workflows, record-retention rules, input validation, security testing, user training, and formal compliance review under the Philippines Data Privacy Act and applicable DOH/LGU policies.

