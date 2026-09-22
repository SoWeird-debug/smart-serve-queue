# Hostinger Premium deployment

This repository is prepared for a **single-domain Laravel deployment**:

- Laravel serves the API at `/api/v1`.
- `npm run build` places the React application in `backend/public`.
- The domain document root must be `backend/public`.

## Before upload

1. Keep the repository private.
2. Do not commit `backend/.env`, `node_modules`, `backend/vendor`, or exported databases.
3. Build the frontend locally from the repository root:

   ```bash
   npm ci
   npm run build
   ```

4. Upload/deploy the repository and the generated `backend/public/index.html`
   and `backend/public/assets` files. These generated files are ignored by Git;
   upload them through File Manager or include them in a release ZIP.

## Hostinger setup

1. Create a PHP/Laravel website and a MySQL database/user in hPanel.
2. In Hostinger File Manager, upload the Laravel `backend` application into
   the private `smartserve/smartserve-backend` folder beside `public_html`. Do not expose it
   publicly. Upload `HOSTINGER-PUBLIC-INDEX.php` to `public_html` and rename
   it to `index.php`; it boots `../smartserve` securely.
3. Copy `backend/.env.hostinger.example` to `backend/.env` and fill in:

   ```env
   APP_KEY=
   APP_URL=https://your-real-domain
   DB_DATABASE=
   DB_USERNAME=
   DB_PASSWORD=
   SMARTSERVE_ONSITE_DEFAULT_PASSWORD=
   MAIL_MAILER=
   ```

4. Run from the `backend` directory over SSH:

   ```bash
   composer install --no-dev --optimize-autoloader
   php artisan key:generate --force
   php artisan migrate --seed --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

5. Ensure `storage` and `bootstrap/cache` are writable by the web-server user.
6. Enable SSL and force HTTPS in hPanel.

## Before accepting real patient data

- Configure transactional mail and test it.
- Change the onsite default password to a clinic-private value.
- Create the first administrator through the setup screen.
- Verify patient/staff role access using non-production accounts.
- Test a backup and restore of the MySQL database.
- Set up a daily Laravel scheduler cron entry after scheduled jobs are added:

  ```bash
  * * * * * cd /home/USERNAME/domains/YOUR-DOMAIN/backend && php artisan schedule:run >> /dev/null 2>&1
  ```

Database queue workers should only be enabled after a real queued job is added;
shared hosting cron can run short queue jobs, but it is not a permanent worker.
