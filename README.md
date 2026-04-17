# VS-Catering

A production-grade web application for managing catering registrations, attendance, and payments.

---

## Tech Stack

- **Frontend**: React + Vite
- **Database**: Convex (Serverless Database)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

---

## Architecture & Security

This project employs a robust, server-side verified Role-Based Access Control (RBAC) system. 
- **Session Tokens**: Rather than storing sensitive user roles locally, users authenticate and receive a secure 30-day session token (UUID).
- **Backend Enforced**: All data-mutating functions verify the user's token against the `sessions` table. 
  - `createCatering`, `setUserRole` → Strictly require `admin` privileges.
  - `markAttendance`, `createPayment` → Require `sub_admin` or `admin` privileges.
- **Automated Lifecycle**: A server-side Convex Cron Job automatically processes and updates the status of catering events (`upcoming`, `today`, `ended`) every day at midnight IST.

---

## Setup Instructions

### Step 1 — Install dependencies

```bash
cd vs-catering
npm install
```

### Step 2 — Set up Convex

1. Go to [convex.dev](https://convex.dev) and create a free account.
2. Create a new project.
3. Run the following command in your project folder:

```bash
npx convex dev
```

This will:
- Ask you to log in to Convex
- Connect your project
- Auto-generate the `convex/_generated/` folder
- Give you your `VITE_CONVEX_URL`

### Step 3 — Set up environment variables

Create a `.env.local` file in the root of the project:

```
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

Convex will print this URL when you run `npx convex dev`.

### Step 4 — Run the app locally

In one terminal:
```bash
npx convex dev
```

In another terminal:
```bash
npm run dev
```

The app will be at `http://localhost:5173`.

---

## Deploying to Vercel (Production)

To push this site live on Vercel, you need to configure your database for production.

### Step 1 — Deploy the Backend
Run the deployment command:
```bash
npx convex deploy
```
*Convex will deploy your database, tables, cron jobs, and give you a **Production URL** (e.g., `https://utmost-gerbil-978.convex.cloud`).*

### Step 2 — Import & Configure Vercel
1. Push this project to your GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and import your repository.
3. In the setup screen, go to **Environment Variables** and add:
   - Name: `VITE_CONVEX_URL`
   - Value: `https://utmost-gerbil-978.convex.cloud` *(replace with the URL from Step 1)*
4. Click **Deploy**. Vercel will auto-detect Vite and build your app.

---

## Setting up the first Admin

Because security is strictly enforced on the server side, you cannot make yourself an admin from the frontend app initially.

1. Sign up on the website as a normal student.
2. Go to the [Convex Dashboard](https://dashboard.convex.dev) → Data → `users` table.
3. Find your user record and change the `role` field from `"student"` to `"admin"`.
4. Log out of the app and log back in to get your new session token.
5. You will now see the Admin dashboard and have permission to promote other users.

---

## Pages

| Page | Who can access |
|---|---|
| `/` | All logged-in users |
| `/catering/:id` | All logged-in users |
| `/catering/:id/register` | Students |
| `/my-caterings` | Students |
| `/profile` | All logged-in users |
| `/admin` | Admin, Sub-Admin |
| `/admin/create-catering` | Admin only |
| `/admin/catering/:id/attendance` | Admin, Sub-Admin |
| `/admin/catering/:id/payments` | Admin, Sub-Admin |
| `/admin/settings` | Admin only |

---

## Features

- **Hardened Security**: Custom token-based authentication with backend role validation.
- **Automated Lifecycle**: Cron jobs auto-update event statuses at midnight.
- **Student Flow**: Signup/login, registration with role selection, drop point, and optional photo.
- **Queue System**: Registrations beyond slot limit go on a waiting list.
- **Event Management**: Two-day catering support with same or different slots per day.
- **Attendance**: Sub-admins mark attendance, change roles, record rejections with reason.
- **Payments**: Track payments per student per catering (pending, cleared, cash/UPI).
- **Fast Analytics**: Highly indexed database queries to calculate total caterings, payouts, and pending amounts instantly.
- **Role Management**: Promote students to sub-admin or admin securely from settings.
