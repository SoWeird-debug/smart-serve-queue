# SmartServe setup guide

Use these steps to run SmartServe after copying or cloning the repository on another computer.

## 1. Install the required software

Install the following first:

- [Node.js 20 LTS or newer](https://nodejs.org/)
- [Git](https://git-scm.com/downloads)

Verify the installations in a terminal:

```bash
node --version
npm --version
git --version
```

## 2. Get the project

Clone the repository, then open the project folder:

```bash
git clone https://github.com/SoWeird-debug/smart-serve-queue.git
cd smart-serve-queue
```

If the project was copied by USB or another method instead, open a terminal in the copied `smart-serve-queue` folder.

## 3. Install project packages

Run this once after cloning, and again whenever `package.json` or `package-lock.json` changes:

```bash
npm install
```

## 4. Start the app locally

Set up the Laravel backend first. Start MySQL in XAMPP, create a local
`smartserve_db` database, and configure `backend/.env`. Then run:

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

On `APP_ENV=local`, the seed creates five verified demo users without changing
other accounts. Use one of these usernames in the login field:

- `demo_administrator`
- `demo_front_desk`
- `demo_nurse_triage`
- `demo_doctor`
- `demo_pharmacy`

Their local-only password is `SmartServeDemo123!`. These demo inboxes cannot
receive verification or password-reset email. Real account verification remains
enabled. The demo users are never created when `APP_ENV=production`.

Open a second terminal in the project root:

```bash
npm ci
npm run dev
```

Open the address printed in the terminal, normally `http://localhost:8080` or `http://localhost:5173`.

To stop the local server, press `Ctrl+C` in the terminal.

## 5. Check the production build

Before deploying, run:

```bash
npm run build
```

This creates the production frontend in `backend/public/index.html` and `backend/public/assets/`. Do not commit `node_modules/` or generated bundles; they are rebuilt automatically.

## Deploying updates

After making changes, save them to GitHub:

```bash
git add .
git commit -m "Describe your change"
git push origin main
```

Pushing to GitHub saves source changes; it does not upload them to Hostinger. After backing up the Hostinger files and database, run this from Windows CMD:

```cmd
powershell -ExecutionPolicy Bypass -File .\DEPLOY-HOSTINGER-UNIFIED-AUTH.ps1
```

See `ACCOUNT-RELEASE.md` for deployment and verification steps. The local Vercel project link and generated OIDC token have been removed. Any existing remote Vercel Git integration is separate; disconnect it in the Vercel project settings if automatic GitHub deployments are still enabled.
