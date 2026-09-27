$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

# Stop before contacting hosting if this release does not pass local checks.
& npm.cmd run typecheck
if ($LASTEXITCODE -ne 0) { throw "Type checking failed." }
& npm.cmd test
if ($LASTEXITCODE -ne 0) { throw "Frontend tests failed." }
Push-Location backend
try {
    & php artisan test --compact
    if ($LASTEXITCODE -ne 0) { throw "Backend tests failed." }
} finally { Pop-Location }
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

# This script uploads only the SmartServe release files. It never uploads .env,
# vendor, storage, tests, database exports, or any password.
$remote = "u418942075@145.79.25.99"
$port = "65002"
$backend = "~/domains/superhealthcenter.net/smartserve/smartserve-backend"

function Upload-Files {
    param(
        [string[]] $Source,
        [string] $Destination
    )

    & scp -P $port @Source "${remote}:$Destination"
    if ($LASTEXITCODE -ne 0) {
        throw "Upload stopped. No further files were uploaded."
    }
}

$backupConfirmation = Read-Host "Have you saved a current Hostinger files AND database backup? Type YES to deploy"
if ($backupConfirmation -cne "YES") { throw "Deployment cancelled before any hosting changes. Create the backup first." }

Write-Host "Putting the application in maintenance mode and preparing release directories..." -ForegroundColor Cyan
& ssh -p $port $remote "cd $backend && php artisan down && mkdir -p app/Console/Commands app/Support app/Notifications app/Http/Middleware resources/views/emails"
if ($LASTEXITCODE -ne 0) { throw "Could not prepare the server. No files uploaded." }
Write-Host "Uploading SmartServe backend release files..." -ForegroundColor Cyan
Upload-Files @(
    "backend/app/Http/Controllers/Api/AdministrationController.php",
    "backend/app/Http/Controllers/Api/PatientAuthController.php",
    "backend/app/Http/Controllers/Api/StaffAuthController.php",
    "backend/app/Http/Controllers/Api/AccountAccessController.php",
    "backend/app/Http/Controllers/Api/AccountProfileController.php"
) "$backend/app/Http/Controllers/Api/"

Upload-Files @("backend/app/Models/User.php") "$backend/app/Models/"
# Upload the maintenance command, but NEVER run it as part of deployment.
Upload-Files @("backend/app/Console/Commands/ResetClinicDemoAccounts.php") "$backend/app/Console/Commands/"
Upload-Files @("backend/app/Support/AccountEmails.php") "$backend/app/Support/"
Upload-Files @("backend/app/Notifications/ClinicAccountMail.php") "$backend/app/Notifications/"
Upload-Files @("backend/app/Http/Middleware/ActiveVerifiedAccount.php") "$backend/app/Http/Middleware/"
Upload-Files @("backend/resources/views/emails/account.blade.php", "backend/resources/views/emails/account-text.blade.php") "$backend/resources/views/emails/"
Upload-Files @("backend/app/Providers/AppServiceProvider.php") "$backend/app/Providers/"
Upload-Files @("backend/routes/api.php", "backend/routes/console.php") "$backend/routes/"
Upload-Files @("backend/config/smartserve.php") "$backend/config/"
Upload-Files @("backend/database/migrations/2026_09_22_000400_create_pending_email_verifications_table.php") "$backend/database/migrations/"
Upload-Files @("backend/database/migrations/2026_09_22_000500_create_patient_registration_drafts_table.php") "$backend/database/migrations/"
Upload-Files @("backend/database/migrations/2026_09_25_000600_create_account_email_tokens_table.php") "$backend/database/migrations/"

Write-Host "Uploading the new browser application..." -ForegroundColor Cyan
& scp -P $port -r "backend/public/assets" "${remote}:~/domains/superhealthcenter.net/public_html/"
if ($LASTEXITCODE -ne 0) {
    throw "Browser assets were not fully uploaded."
}
Upload-Files @("backend/public/index.html") "$backend/public/index.html"

& ssh -p $port $remote "cd $backend && php artisan migrate --force && php artisan optimize:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan up"
if ($LASTEXITCODE -ne 0) { throw "Finalization failed. The application remains in maintenance mode. Inspect the error before running php artisan up." }
Write-Host "Release deployed. Test activation delivery, password reset, and each role on the website." -ForegroundColor Green
