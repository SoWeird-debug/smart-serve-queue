# SmartServe production-readiness blueprint

## Launch decision

**Current status: training/demo prototype only — not approved for real patient data or live clinical use.**

The current React application keeps patient records, appointments, medical records,
inventory, staff accounts, passwords, and audit events in browser local storage. The
public queue board is supplied by an in-memory Vite development-server endpoint. That
means records can be changed or erased on a device, cannot be reliably shared across
workstations, and do not have server-enforced access control or an immutable audit
trail.

No user should enter real patient information until the production gates below are met.

## What is already useful

- Separate General Clinic and Animal Bite Center queues and public boards.
- Animal Bite exposure assessment before doctor handoff.
- Booking, check-in, triage, consultation, prescription, dispensing, and follow-up
  workflow screens.
- Role-specific workspaces, including care-area assignment for staff and doctors.
- Queue-number privacy on public displays.

## Critical production gaps

| Area | Current state | Production requirement |
| --- | --- | --- |
| Identity and login | Passwords and roles are browser-local prototype data. | Server-side identity provider, password hashing, MFA for privileged roles, session expiry, lockout/rate limiting, and password-reset controls. |
| Authorization | Role checks are UI routing only. | Database-enforced RBAC and row-level policies; every request validates the signed-in user and care-area assignment. |
| Patient records | Browser local storage. | Encrypted central database with data ownership, validation, transaction handling, and safe migrations. |
| Audit | Browser-editable events. | Append-only, server-timestamped audit ledger recording actor, role, action, patient/record reference, before/after summary, source IP/device, and reason for sensitive actions. |
| Queue | Dev-server memory feed. | Durable queue events, atomic status transitions, reconnect-safe public display feed, and a recovery procedure for downtime. |
| Consent/privacy | Checkbox captured in a local record. | Versioned privacy notice and treatment consent, purpose/lawful-basis record, guardian handling, retention schedule, access/correction request workflow, and incident process. |
| Location | Third-party map lookup and local coordinates. | Data-minimised collection, explicit purpose/retention policy, managed geocoding contract, access controls, and aggregated/de-identified trend reporting. |
| Backups/operations | No central backup or monitoring. | Encrypted backups, restore drills, disaster recovery objectives, uptime/error monitoring, alerting, environment separation, and change control. |

## Target production architecture

```text
Patient portal / Staff / Doctor / Pharmacy / Admin / TV board
                         │ HTTPS
                         ▼
                Application API / BFF
                  ├─ authenticated RBAC
                  ├─ validation and state machine
                  ├─ immutable audit events
                  └─ notification scheduler
                         │
                         ▼
       PostgreSQL + encrypted backups + object storage for documents
                         │
                         ├─ read-only, de-identified disease aggregates
                         └─ public queue feed (queue number, area, state only)
```

The public TV must never receive names, diagnosis, address, phone number, patient ID,
or location. It should use a short-lived read-only display token restricted to one care
area.

## Real-world workflow contract

### General Clinic

`Scheduled → Checked in → Waiting for triage → Triaged → Waiting for doctor → Called → In consultation → Completed → Pharmacy/Follow-up as applicable`

### Animal Bite Center

`Scheduled/walk-in → Checked in → Animal Bite assessment complete → Waiting for Animal Bite doctor → Called → In consultation → Vaccine/medicine dispensing → Follow-up dose or wound review`

Required Animal Bite assessment fields before a doctor can receive the case:

1. Animal and exposure type.
2. Wound site and severity/category as adopted by the clinic protocol.
3. Animal status/observability.
4. First aid/wound washing performed.
5. Time and date of exposure.
6. Tetanus/rabies history and clinical escalation flags, as defined by the clinic's
   physician-approved protocol.

Emergency flags must trigger a visible escalation workflow, not simply a higher queue
priority. Final clinical categories, vaccine schedule, contraindications, and treatment
logic must be approved by the clinic medical lead before implementation.

## Role boundaries

| Role | Allowed production actions |
| --- | --- |
| Front desk | Search/minimum-demographic verification, check-in, queue number, attendance. No clinical notes or diagnoses. |
| Triage | Vitals and initial assessment for assigned care area. Cannot edit completed doctor records or inventory. |
| Animal Bite triage | Animal Bite intake and required assessment only; cannot access General Clinic queue. |
| Doctor | Assigned-area encounters, clinical notes, orders, follow-up plans. Completed records require an addendum workflow, never silent overwrite. |
| Pharmacy | Verify orders, dispense actual quantities, capture batch/expiry/counselling. Cannot change a doctor diagnosis. |
| Inventory | Receive and adjust stock with reason, supplier/batch/expiry; adjustments require dual review where policy requires it. |
| Administrator | Account lifecycle, service configuration, reporting, and audit review. No unrestricted clinical-record editing by default. |
| Data Protection Officer | Privacy controls, data-subject requests, incident management, audit access. |

## Delivery phases and release gates

### Phase 0 — governance before real data

- Name the clinic system owner, medical lead, and Data Protection Officer.
- Complete a Privacy Impact Assessment, data inventory, retention schedule, and breach
  response plan.
- Approve the clinical workflow and Animal Bite protocol with the facility lead.
- Define who can create accounts, what devices are managed, and network requirements.

**Gate:** written approval to process real records.

### Phase 1 — secure foundation

- Provision a production PostgreSQL database and separate development/staging/production
  environments.
- Implement server authentication, RBAC, MFA for administrators, session management,
  password policy, and password-reset process.
- Move entities from `prototype-store.tsx` into versioned database migrations.
- Add server validation, append-only audit events, encrypted backup, restore test, and
  secret management.

**Gate:** threat model, penetration/security review, access-control tests, and successful
restore drill.

### Phase 2 — clinical operations

- Implement transactional queue state transitions and concurrency protection.
- Implement clinical record addenda, signatures/attestation, and safe correction policy.
- Add vaccine lot/batch/expiry traceability, dispense transaction history, and stock
reconciliation.
- Add follow-up reminder delivery with delivery status and staff escalation for missed
follow-ups.

**Gate:** clinician, nurse, pharmacy, and admin user-acceptance tests on staging data.

### Phase 3 — controlled launch

- Migrate only verified records under a documented migration and verification process.
- Train staff using role-specific scenarios and downtime procedures.
- Pilot one clinic area with closely monitored support, then conduct a post-pilot review
before wider rollout.

**Gate:** DPO/system-owner approval, trained users, support owner, and rollback plan.

## Test plan

- Unit tests for each allowed and forbidden queue transition.
- API authorization tests for every role and care-area boundary.
- End-to-end tests for registration, check-in, triage, doctor, pharmacy, follow-up, and
Animal Bite workflow.
- Data migration and restore tests.
- Accessibility tests for staff and patient flows.
- Load tests for concurrent check-in/queue actions and public display reconnects.
- Security tests: authentication, authorization, input validation, rate limiting,
dependency scanning, secret scanning, and audit integrity.

## Decisions required before implementation of Phase 1

1. Approved production backend and hosting owner.
2. DPO and medical lead for workflow/privacy approval.
3. Facility retention policy and patient-data migration source.
4. Notification channel and consent policy (SMS, email, or in-app only).
5. Whether deployment is clinic-network-only, internet-facing, or both.
