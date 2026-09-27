# Account access release

Patients sign in with email; clinic team members sign in with username. All accounts must be active, email-verified, and have completed activation. The activation page reviews the role/name/username, sets a personal password, and returns to sign-in. **Sign up / activate account** accepts one email: existing pending clinic accounts receive clinic activation; new patients and onsite claims retain their patient verification flow. Already activated users receive a sign-in reminder, never a new activation token. Public responses do not disclose account existence or roles. Forgot password accepts a verified account's email for any role, or a clinic username.

Each clinic role has **My profile**, profile-save feedback, a password change form, and logout. Changing recovery email requires the current password. The old email remains active until the new address is confirmed. Confirmation and password changes revoke existing sessions. Roles and clinic assignments cannot be changed through self-service.

Onsite patients verify through patient sign-up, enter their temporary clinic password, review/edit their identity and contact details, confirm consent, and choose a new password. The existing patient ID and consultation history are preserved. Clinic address and insurance corrections currently require clinic staff.

Verification, activation, and reset messages use the Super Health Center branded HTML template with a plain-text alternative. Verification links last 30 minutes; patient registration sessions last two hours. No medical records are included in email.

## Local verification

Shared-signup update: 26 backend tests (219 assertions), 14 frontend tests, and TypeScript pass. Mail is intercepted in tests; real SMTP delivery still needs a post-deployment check. No production data was changed. The existing expiry/replay tests cover the reused activation flow.

Verified on September 25, 2026: application TypeScript check, 13 frontend tests, 21 backend tests (132 assertions), and the production Vite build pass. Browser checks used the isolated SQLite fixture: doctor profile save, administrator doctor-account creation and its activation message, pharmacy profile/logout, and clinic-role layouts at phone/tablet widths. No production mail was sent during these checks.

The login JavaScript entry is now about 387 kB before gzip (previously about 1.24 MB), because workspaces load on demand. The administrator chunk remains relatively large because it includes reports and charts; Vite reports this as a non-blocking performance warning.

Run `npm run typecheck`, `npm test`, `npm run build`, and `php artisan test --compact` from `backend`.
Backend tests use in-memory SQLite and the array mail transport. They do not touch the live database or deliver real email.
`backend/tests/browser-fixture.php` creates only `backend/storage/framework/browser-review.sqlite` for isolated browser testing. Never deploy test fixtures.

## Hostinger release

1. Have a current Hostinger file and database backup available for rollback.
2. Keep the production `.env` and `APP_KEY`. Confirm `APP_URL` and `SMARTSERVE_FRONTEND_URL` are `https://superhealthcenter.net`, and the working SMTP credentials remain configured. Set `APP_DEBUG=false` and `MAIL_FROM_NAME="Super Health Center — Jones, Isabela"`.
3. From the project root, run `./DEPLOY-HOSTINGER-UNIFIED-AUTH.ps1`. It checks/tests/builds locally, enters maintenance mode, uploads the explicit release files and browser assets, runs additive migrations, caches configuration/routes/views, then leaves maintenance mode. Never use `migrate:fresh`, reseed production, or generate a new app key.
4. If an upload or finalization fails, finish or restore the release while maintenance mode remains enabled. Do not bring up a partially uploaded release.
5. Configure a Hostinger cron job to run `php /home/u418942075/domains/superhealthcenter.net/smartserve/smartserve-backend/artisan schedule:run` every minute. This schedules daily removal of expired registration drafts and email tokens. Choose the same PHP executable/version used for the application.
6. Verify one real activation email and password-reset email arrive, open the links on a phone, and verify each role’s sign-in/profile. Local tests cannot confirm production SMTP delivery or hosting configuration.

Existing users with unverified email are intentionally required to activate before access. Look up their username in Staff & Roles. Recovery through username only sends to the verified email; an unverified account should use activation instead.

The deployment script does not upload `.env`, vendor, storage, test databases, or test fixtures. The new migration adds only the email-token table; patient records are retained.
