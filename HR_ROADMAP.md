# Evolve HR System — Roadmap

This document tracks what's done, what's next, and what's planned for the internal HR tool at `/admin`. Update it after each session.

**Last updated:** May 12, 2026 (end of Session 1)

---

## ✅ Tier 1 — Foundations (Session 1 — DONE)

The administrative core: real auth, full employee profiles, document management, audit trail.

### Auth & access
- [x] `admins` table backed by Supabase Auth (real email + password, no shared password)
- [x] Roles: `owner` / `hr` / `finance` / `admin`
- [x] `create_admin` RPC — owner can create new admins from `/admin/admins`
- [x] `current_admin` view for client-side checks
- [x] `touch_admin_last_login` RPC — tracks last sign-in
- [x] Server-side middleware gates all `/admin/*` routes
- [x] Sign-out from user menu in admin top bar
- [x] Active/deactivate admins without deleting (preserves audit trail)

### Employee profile expansion
- [x] New columns: `date_of_birth`, `gender`, `marital_status`, `address`, `nis_number`, `tin_number`, `emergency_contact_name/phone/relationship`, `photo_url`, `notes`, `bank_name`, `bank_account`
- [x] Profile detail page at `/admin/payroll/employees/[id]` with Profile / Documents / History tabs
- [x] Edit any field with live save
- [x] Delete employee (with confirmation)

### Documents
- [x] Supabase Storage bucket `employee-documents` (private, 10 MB limit)
- [x] Storage bucket `employee-photos` (private, 5 MB limit)
- [x] `employee_documents` table with category, expiry, notes, uploader
- [x] Upload PDF/image/Word/Excel via UI
- [x] Signed-URL download (60s expiry, no public exposure)
- [x] Delete documents (storage + DB row both removed)
- [x] Expiry highlighting: red if expired, amber if expiring in 30 days

### Audit trail
- [x] `employee_audit_log` table — append-only, no UPDATE or DELETE policies
- [x] One entry per changed field on profile edits (with old → new values)
- [x] Entries for: create, update (per field), delete, document upload, document delete
- [x] Stamped with admin's name and email (denormalised, survives admin deletion)
- [x] History tab on each employee profile shows full timeline

### Security hardening
- [x] Removed `NEXT_PUBLIC_ADMIN_PASSWORD` env var
- [x] Reverted permissive `anon` write policies added during initial setup
- [x] RLS now requires `auth.uid()` IS in active `admins` table for all writes
- [x] `/clock` PIN flow still works via narrow `anon` SELECT + INSERT/UPDATE on attendance only

---

## ⏳ Tier 2 — Operations (Session 2)

Day-to-day workflow improvements.

- [ ] **Leave management** — apply for leave, approve/decline, balance auto-decrement, calendar view
- [ ] **Public holidays for Guyana** — pre-loaded (Mashramani, Phagwah, Easter, Labour Day, Indian Arrival, Independence, CARICOM, Emancipation, Diwali, Christmas, Boxing Day)
- [ ] **Shift schedules** — per-employee weekly templates (e.g., Joshua's Mon–Fri 8-5, Sat 8-3)
- [ ] **Late-arrival auto-flagging** — clock-in past scheduled start = "late" status
- [ ] **Missed-clock-out reconciliation** — daily morning task showing employees who didn't clock out yesterday, admin can set the time
- [ ] **Attendance calendar view** — month grid showing each employee's present/absent/late/leave per day

## ⏳ Tier 3 — Guyana Payroll (Session 3)

Make payroll actually usable for a Guyanese ISP.

- [ ] **NIS deduction** — 5.6% employee + 8.4% employer (2026 rates)
- [ ] **PAYE income tax** — threshold + 28% / 40% brackets with monthly calculation
- [ ] **Payslip PDF generation** — branded, includes gross, NIS, PAYE, deductions, net, YTD figures
- [ ] **Email payslips** — auto-send to each employee on payroll run completion
- [ ] **Year-end tax certificate (7B form equivalent)** — total earnings, total deductions, downloadable PDF
- [ ] **Lock paid payroll runs** — once a run is marked paid, it becomes read-only

## ⏳ Tier 4 — Self-Service Portal (Session 4)

Employees access their own data.

- [ ] **Employee login** at `/staff/login` (separate auth namespace from /admin and /portal)
- [ ] **My profile** — view + edit phone, address, emergency contact (changes go to audit log)
- [ ] **My payslips** — list of all past payslips, downloadable
- [ ] **My attendance** — current pay period, with hours worked + missed clock-outs to fix
- [ ] **Request leave** — submit + see status of past requests
- [ ] **My documents** — view (not delete) HR-uploaded documents about them

## ⏳ Tier 5 — Performance & Onboarding (Session 5)

- [ ] **Performance reviews** — quarterly or annual templates, goals/KPIs, 1-on-1 notes
- [ ] **Training records** — what training, when, certificate uploaded to documents
- [ ] **Onboarding checklist** — per-employee, items: signed contract, NIS registration, email setup, uniform, laptop assignment
- [ ] **Offboarding checklist** — final pay, return of equipment, exit interview, NDA reminder, deactivate accounts
- [ ] **Probation tracking** — alert at 60 days, 80 days, day-of-end-of-probation
- [ ] **Reminders** — birthdays, work anniversaries, probation expiry, document expiry, scheduled review due

## ⏳ Tier 6 — Polish & Reporting (Session 6)

- [ ] **Org chart** — visual hierarchy, reports-to relationships
- [ ] **Granular permissions** — managers see only direct reports, finance sees pay but not personal data, etc.
- [ ] **Slack integrations** — late-clock-in to #hr, payroll-run-complete to #finance, new-hire to #general
- [ ] **Dashboards** — headcount over time, attendance rate, average hours, payroll cost
- [ ] **Reports** — exportable CSV/PDF: headcount, payroll summary, leave taken, attendance
- [ ] **Bulk actions** — bulk import employees from CSV, bulk leave balance adjustment

---

## How to use this roadmap

After each session: tick off completed items, move any unfinished work back to the next-tier "next" list, and update the timestamp at the top. If Eric wants to reorder tiers, edit the headings here — the document is the source of truth for what comes next.

## Notes on architecture

- **Database:** Supabase (PostgreSQL + Auth + Storage + RLS). Project ref `zqlixzklxrqewxvqhfzc`.
- **App:** Next.js 15 (App Router) on Vercel. Auto-deploy from `main`.
- **Storage:** Two buckets — `employee-documents` (10 MB, all doc types) and `employee-photos` (5 MB, images only). Both private, signed URLs only.
- **RLS pattern:** writes require the user's `auth.uid()` to exist in the active `admins` table. `/clock` PIN flow has narrow `anon` policies that allow only PIN-matching SELECT and clock-in/out INSERT/UPDATE.
- **Audit log:** append-only by design. No admin can edit or delete entries. Denormalised with `admin_name` and `admin_email` so the trail survives admin deletion.
