# SmartServe UI catalog

This catalog lists the user interfaces currently included in the frontend prototype, their intended users, and their functions. All entries use sample data only.

## Shared interface

| UI | Role | Function |
| --- | --- | --- |
| Role switcher | Demonstration users | Switches between Patient, Staff / Queue, Doctor, Pharmacy, and Admin workspaces. It is for prototype demonstration; it is not a real role-based login. |
| Application footer | All users | Identifies the SmartServe prototype for the Super Health Center of Jones, Isabela. |

## Patient mobile application

| UI / screen | Role | Function |
| --- | --- | --- |
| Sign in / Register | Patient | Demo sign-in or registration form using mobile number and password. |
| Home | Patient | Shows next appointment, queue number/status, quick booking action, clinic services, and health advisories. |
| Notifications | Patient | Shows appointment reminders, queue changes, confirmations, and clinic health alerts. |
| Services | Patient | Lets the patient choose a clinic service such as consultation, prenatal care, immunization, dental, laboratory, or TB/DOTS. |
| Date and time selection | Patient | Lets the patient select a service schedule and a location pin. |
| Booking confirmation | Patient | Displays the appointment confirmation, queue number, clinic address, selected time, room, and estimated wait. |
| My appointments / queue | Patient | Shows appointment list, service, date, queue number, queue status, and attendance status. |
| My medical records | Patient | Shows the patient’s permitted digital visit history, diagnosis, doctor notes, prescription instructions, and dispensing status. |
| Bottom navigation | Patient | Navigates between Home, Book, Queue, Records, and Alerts. |

## Staff / queue workspace

| UI / screen | Role | Function |
| --- | --- | --- |
| TV Queue Board | Front desk / queue staff; patients view it | Displays live now-serving queue numbers, masked patient names, room, next patients, and daily queue statistics. |
| Patient check-in | Front desk / queue staff | Finds scheduled patients, marks them Present or Absent, and changes scheduled patients to Waiting after check-in. |
| Triage and vital signs | Nurse / triage staff | Selects a patient; records triage priority, blood pressure, temperature, weight, known allergies, and chief complaint; includes demo save and walk-in registration actions. |
| Queue control | Queue staff | Calls the next patient, marks a consultation completed, records no-shows, and displays waiting patients and counter status. |

## Doctor workspace

| UI / screen | Role | Function |
| --- | --- | --- |
| Today’s patients | Doctor | Selects a patient for consultation. |
| Patient summary | Doctor | Shows selected patient profile, allergy summary, latest vital-sign example, and consultation status. |
| Consultation record | Doctor | Records assessment/diagnosis, follow-up date, and clinical notes. |
| Prescription and stock check | Doctor | Selects medicine and quantity, checks read-only pharmacy availability, batch, expiry, and low-stock status, then sends a prescription to pharmacy. Doctors cannot alter inventory. |
| Medical record history | Doctor | Reviews previous digital consultations, diagnoses, notes, prescription status, and identifies when older paper records must be digitized. |

## Pharmacy and inventory workspace

| UI / screen | Role | Function |
| --- | --- | --- |
| Prescriptions for pickup | Pharmacy staff | Shows prescriptions sent by doctors, patient identity, diagnosis, medicine, quantity, instructions, and Ready/Dispensed status. |
| Confirm dispensing | Pharmacy staff | Confirms the actual medicine handoff, updates the demo receipt status to Dispensed, and deducts the dispensed quantity from the displayed inventory. |
| Medicine inventory | Pharmacy / inventory staff | Searches medicine; shows form, stock on hand, reorder level, batch, expiry date, available status, and low-stock warnings. |
| Receive stock action | Inventory staff | Placeholder interface action for receiving deliveries. The receiving form and permanent inventory storage are not yet implemented. |

## Administrator workspace

| UI / screen | Role | Function |
| --- | --- | --- |
| Overview dashboard | Administrator | Shows high-level clinic operations, appointments, patients served, disease activity, and recent activity. |
| Appointments | Administrator | Reviews appointment queue, patient, service, time, room, attendance, and status. |
| Patient records | Administrator / authorized records staff | Searches and views registered patient demographic records. Real medical-record access controls are not yet implemented. |
| Services and schedules | Administrator | Views/manages the presentation of clinic services, capacity, and schedules. |
| Disease trends | Administrator / health program staff | Shows disease surveillance data, geographic monitoring, and trends. |
| Resource forecasting | Administrator | Shows predicted staffing, equipment, and supply demand. |
| Inventory and audit | Administrator | Oversees medicine stock, low-stock items, digital record entries, prescription status, and sample audit trail. |
| Reports and analytics | Administrator | Displays operational, service, disease, patient, and no-show reporting options; export actions are presentation-only. |
| Staff and user management | Administrator | Lists sample staff, departments, roles, and statuses; invitation/manage actions are presentation-only. |

## UI status and missing functional implementation

The interfaces above are available in the prototype. The following buttons and data flows are illustrative until the backend phase begins:

- Real sign-in, registration, password recovery, and identity verification.
- Persistent appointments, triage records, consultations, prescriptions, receipts, and inventory changes.
- Receiving stock, stock adjustments, approval workflow, returns, and expiry disposal.
- Real patient-record upload/scanning, medical-document attachment, and paper-record validation.
- User permissions, audit logs, data encryption, backups, notifications, report exports, and public-clinic compliance controls.
