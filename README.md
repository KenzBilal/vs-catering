# VS-Catering

A web application for managing catering registrations, attendance, and payments.

---

## Tech Stack

- **Frontend**: React + Vite
- **Database**: Convex
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

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

### Step 4 — Seed the drop points

After Convex is running, open your browser console on the app and run or call the `seedDropPoints` mutation once. This adds Main Gate, Dakoha, and Law Gate as defaults. You can also trigger this from the Convex dashboard.

### Step 5 — Run the app locally

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

## Deploying to Vercel

1. Push this project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Add environment variable: `VITE_CONVEX_URL` = your Convex URL.
4. Deploy. Vercel auto-detects Vite.

For Convex production deployment:
```bash
npx convex deploy
```

---

## Setting up the first Admin

1. Sign up on the website as a normal student.
2. Go to the Convex dashboard → Data → users table.
3. Find your user record and change the `role` field from `"student"` to `"admin"`.
4. Refresh the app — you will now see the Admin dashboard.

After that, you can promote other users to sub-admin or admin directly from the Settings page inside the app.

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

- Student signup and login with name and phone number
- Catering listing with status: Today, Tomorrow, Upcoming, Ended
- Student registration with role selection, drop point, and optional photo
- Queue system — registrations beyond slot limit go on waiting list
- Two-day catering support with same or different slots per day
- Admin creates caterings with all details, dress code, photo requirement
- Auto-generated WhatsApp message with copyable registration link
- Sub-admins mark attendance, change roles, record rejections with reason
- Payment tracking per student per catering — pending and cleared
- Confirmation step before marking payment as cleared
- Monthly analytics — total caterings, students, payouts, pending amounts
- Drop point management from settings
- Role management — promote students to sub-admin or admin
