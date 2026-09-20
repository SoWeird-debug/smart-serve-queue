# SmartServe backend delivery checklist

This is the live implementation checklist. Completed work is retained below for
traceability; only unfinished work appears in **Current work**.

## Current work

- [ ] Connect the React screens to the Laravel API and remove prototype-only local storage for live use.
- [ ] Complete the queue lifecycle: nurse/doctor call and complete/absent actions, release a finished number for reuse, and enforce the priority-first alternating scheduled/walk-in order.
- [ ] Add staff administration endpoints: create staff, roles, care-area assignments, activation, reset password, and audit trail.
- [ ] Add nurse triage and doctor consultation endpoints, including Animal Bite vaccination-dose recording.
- [ ] Add pharmacy inventory, dispensing, low-stock, and transaction endpoints.
- [ ] Add analytics and printable/exportable report endpoints.
- [ ] Import and maintain the complete authoritative Isabela PSGC barangay directory.
- [ ] Add real email verification, password reset, and Google sign-in.
- [ ] Configure Hostinger production environment: MySQL/MariaDB, mail, HTTPS, CORS, backups, scheduled jobs, monitoring, and deployment automation.
- [ ] Perform role/security/privacy testing and user acceptance testing with non-production data.

## Completed foundation

- [x] Laravel 12 backend scaffolded with Sanctum token authentication.
- [x] Core MySQL-compatible clinical schema created: patients, addresses, services, appointments, queues, triage, consultations, Animal Bite vaccination, inventory, prescriptions, notifications, and audit logs.
- [x] Reference seed created for Isabela municipalities, verified Jones/Santiago City barangays, care areas, and services. No patient or clinical records are seeded.
- [x] Patient registration/login and appointment APIs implemented and covered by automated tests.
- [x] First-administrator setup and staff login APIs implemented and covered by automated tests.
- [x] Staff queue intake API implemented: check in scheduled patients, add a registered walk-in, list the active queue, and automatically assign the first available number from 001–100 per care area/day.

## Database deployment status

- [x] Local development database switched to MySQL: `smartserve_db` was migrated and reference-seeded successfully. The obsolete SQLite file was removed.
- Hostinger MySQL/MariaDB: pending credentials and database creation. No external database has been modified by this project yet.
