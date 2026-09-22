# SmartServe setup ZIP

This ZIP intentionally excludes secrets and generated dependencies:

- `backend/.env`
- `node_modules`
- `backend/vendor`
- database exports
- built frontend assets

## On a new Windows computer

1. Extract the ZIP to a short path, for example `D:\SmartServe`.
2. Install PHP 8.2+, Composer, Node.js LTS, Git, and MySQL/MariaDB (XAMPP is fine).
3. Open PowerShell in the extracted folder and run:

   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\setup-local.ps1
   ```

4. Edit `backend\.env` with the local MySQL database credentials.
5. Create an empty MySQL database named `smartserve_db`.
6. Run:

   ```powershell
   cd backend
   php artisan migrate --seed
   php artisan serve
   ```

7. In another PowerShell window:

   ```powershell
   cd D:\SmartServe
   npm run dev
   ```
