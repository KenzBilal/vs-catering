# Catering Management Platform

A professional, production-grade web application designed to streamline the management of large-scale catering operations. This platform handles everything from student registrations and role-based assignments to live attendance tracking and financial payouts.

---

## 🌟 Core Purpose

This application serves as a central hub for catering coordinators (Admins) and student workers. It eliminates manual paperwork, automates student queues, and provides real-time financial transparency for both organizers and staff.

---

## 🛠️ Usage & Key Workflows

### For Students
- **Smart Registration**: Sign up with your details, including gender and hostel status. Once registered, you can browse available catering events.
- **Role Selection**: Choose your preferred role (Service Boy, Service Girl, or Captain) based on the event's requirements.
- **Waitlist Management**: If an event is full, the system automatically places you on a waitlist. If a spot opens up, the queue advances automatically.
- **Personal Dashboard**: Track your upcoming assignments, view your work history, and check the status of your payments (Pending vs. Cleared).

### For Admins & Coordinators
- **Event Orchestration**: Create detailed catering events with specific dates, times, and venues. Supports single-day or multi-day events with customized staff requirements for each day.
- **Live Attendance**: Use the "Attendance Mission Control" to mark students present as they arrive. Admins can search by name or phone and quickly verify student identities via profile photos.
- **Payment Lifecycle**: Manage the financial aspect of the operation. Admins can clear payments individually or in bulk, with support for tracking both Cash and UPI transactions.
- **Real-time Analytics**: The dashboard provides an instant overview of monthly performance, including total payout amounts, number of active events, and pending financial liabilities.

---

## 🔐 Security & Data Integrity

The platform is built with a "Security First" mindset:
- **Server-Side Verification**: Every action (from marking attendance to editing an event) is verified on the backend. Even if someone tries to bypass the UI, the database will reject unauthorized requests.
- **Role-Based Access (RBAC)**: Distinct permissions for Students, Sub-Admins, and Admins ensure that sensitive data and financial controls are only accessible to authorized personnel.
- **Rate Limiting**: Built-in protection against brute-force login attempts to keep user accounts secure.

---

## 🚀 Key Features

- **Automated Event Lifecycle**: Events automatically move from `upcoming` to `today` and then to `ended` based on the date, with no manual intervention required.
- **Photo Verification**: Integrated profile photo management ensuring that the person working matches the registered student.
- **LPU Registration Integration**: Optional 8-digit registration number tracking for university-specific compliance.
- **Responsive Design**: A sleek, "Cream & Stone" themed interface that works perfectly on both mobile (for live attendance) and desktop (for admin management).
