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

```bash
npm run dev
```

Open the address printed in the terminal, normally `http://localhost:8080` or `http://localhost:5173`.

To stop the local server, press `Ctrl+C` in the terminal.

## 5. Check the production build

Before deploying, run:

```bash
npm run build
```

This creates the production files in `dist/`. Do not commit `node_modules/` or `dist/`; both are regenerated automatically.

## Deploying updates

After making changes, save them to GitHub:

```bash
git add .
git commit -m "Describe your change"
git push origin main
```

When the repository is connected to Vercel, every push to `main` automatically creates a new production deployment.
