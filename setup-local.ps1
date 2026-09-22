# SmartServe local setup
# Run from the extracted SmartServe project folder:
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\setup-local.ps1

$ErrorActionPreference = "Stop"

function Require-Command([string]$name, [string]$installHint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "$name is required. $installHint"
  }
}

Require-Command "php" "Install PHP 8.2+ (or XAMPP) and add it to PATH."
Require-Command "composer" "Install Composer and reopen PowerShell."
Require-Command "node" "Install Node.js LTS and reopen PowerShell."
Require-Command "npm" "Install Node.js LTS and reopen PowerShell."

$projectRoot = $PSScriptRoot
$backend = Join-Path $projectRoot "backend"
if (-not (Test-Path (Join-Path $backend "artisan"))) {
  throw "This script must stay in the SmartServe project root beside the backend folder."
}

Write-Host "Installing Laravel dependencies..." -ForegroundColor Cyan
Push-Location $backend
composer install

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created backend/.env. Update its MySQL DB_* values before migration." -ForegroundColor Yellow
}
php artisan key:generate --force
Pop-Location

Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Push-Location $projectRoot
npm ci
Pop-Location

Write-Host "" 
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Next: edit backend/.env with MySQL credentials, then run:" -ForegroundColor Yellow
Write-Host "  cd backend"
Write-Host "  php artisan migrate --seed"
Write-Host "  php artisan serve"
Write-Host "Open another PowerShell window and run: npm run dev"
