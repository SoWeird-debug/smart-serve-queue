# SmartServe backend delivery checklist

This is the live implementation checklist. Completed work is retained below for
traceability; only unfinished work appears in **Current work**.

## Current work

- [ ] Connect the remaining doctor, pharmacy, and administrator screens to Laravel APIs; then remove their prototype-only local storage.
- [ ] Complete the queue lifecycle: nurse/doctor call and complete/absent actions, release a finished number for reuse, and enforce the priority-first alternating scheduled/walk-in order.
- [ ] Add staff administration endpoints: create staff, roles, care-area assignments, activation, reset password, and audit trail.
- [ ] Add nurse triage and doctor consultation endpoints, including Animal Bite vaccination-dose recording.
- [ ] Import and maintain the complete authoritative Isabela PSGC barangay directory.
- [ ] Add real email verification, password reset, and Google sign-in.
- [ ] Configure Hostinger production environment: MySQL/MariaDB, mail, HTTPS, CORS, backups, scheduled jobs, monitoring, and deployment automation.
- [ ] Perform role/security/privacy testing and user acceptance testing with non-production data.

## Completed foundation

- [x] Laravel 12 backend scaffolded with Sanctum token authentication.
- [x] Core MySQL-compatible clinical schema created: patients, addresses, services, appointments, queues, triage, consultations, Animal Bite vaccination, inventory, prescriptions, notifications, and audit logs.
- [x] Reference seed created for Isabela municipalities, verified Jones/Santiago City barangays, care areas, and services. No patient or clinical records are seeded.
- [x] Patient registration/login and appointment APIs implemented and covered by automated tests.
- [x] Patient API expanded to preserve complete registration and residence data, profile updates, and secure password changes.
- [x] Patient mobile registration, sign-in, and appointment creation now call Laravel/MySQL. Patient sessions are memory-only and are not retained in browser storage.
- [x] First-administrator setup and staff login APIs implemented and covered by automated tests.
- [x] Staff/admin access gateway converted from browser local storage to Laravel/MySQL authentication. Its token is memory-only and is never written to localStorage or sessionStorage.
- [x] Staff queue intake API implemented: check in scheduled patients, add a registered walk-in, list the active queue, and automatically assign the first available number from 001–100 per care area/day.
- [x] Added separate privacy-safe public queue-board paths for General Clinic and Animal Bite, with a Laravel public display feed and LAN fallback URLs.
- [x] Nurse triage API implemented: start triage, record vital signs/exposure/priority, and route a patient to the doctor queue.
- [x] Staff UI conversion started: signed-in staff clinic assignment, scheduled check-in/search, no-show, and triage now read/write Laravel/MySQL rather than browser prototype data.
- [x] Front-desk walk-in UI now searches MySQL patient records, uses the MySQL service directory, and creates its queue ticket through Laravel.
- [x] Front-desk onsite registration UI now creates the patient/user/address in MySQL and returns a patient number plus one-time default password. The account is marked to require a password change on first login.
- [x] Doctor API implemented: call and complete consultation, create follow-ups/prescriptions, record Animal Bite vaccine plans, and release completed queue numbers.
- [x] Pharmacy API implemented for medicine catalogue reads, low-stock calculation, and auditable stock receiving.
- [x] Pharmacy dispensing API implemented with FEFO batch allocation, stock deduction, prescription-progress tracking, and transaction records.
- [x] Administrator API implemented for staff directory, account creation/update, password reset, care-area assignment, doctor availability, and audit entries.
- [x] Analytics and appointment-report APIs implemented from MySQL data; printable frontend layouts and CSV/download controls still need API wiring.

## Database deployment status

- [x] Local development database switched to MySQL: `smartserve_db` was migrated and reference-seeded successfully. The obsolete SQLite file was removed.
- Hostinger MySQL/MariaDB: pending credentials and database creation. No external database has been modified by this project yet.
