# Evolve Wireless — Go-Live & Operations Guide

*The complete map of how evolvewireless.gy runs, how changes go live, and how to operate every feature. Written 4 July 2026.*

---

## 1. The system at a glance

**One sentence:** The website is a Next.js app in GitHub, hosted on Vercel, with all data in Supabase, connected to UISP (billing/CRM), MMG (payments), Resend (email), and Slack (notifications).

| Piece | What it does | Where |
|---|---|---|
| **GitHub** | Holds the code | `github.com/ericjewan-spec/evolve-wireless` |
| **Vercel** | Hosts the live site, auto-deploys | vercel.com → evolve-wireless project |
| **Supabase** | Database, file storage, PDF functions | Project `zqlixzklxrqewxvqhfzc` |
| **UISP CRM** | Real customer accounts + billing | evolveenterprise.uisp.com |
| **Resend** | Sends emails from noreply@evolvewireless.gy | resend.com |
| **Let's Domains** | Registrar for evolvewireless.gy + evolve592.com | letsdomains |

**The golden rule of going live:** push code to the `main` branch on GitHub → Vercel automatically builds and deploys it → live in ~1 minute. That's it. There is no other deploy step.

---

## 2. Going live from zero (if you ever had to rebuild)

1. **Code** — clone the GitHub repo. Everything lives in it: pages in `src/app/`, shared logic in `src/lib/`, database history in `supabase/migrations/`.
2. **Supabase** — create a project, run the migration files in `supabase/migrations/` in number order (SQL Editor or the Supabase MCP). Create the private storage bucket `install-photos` (migration 005 does this).
3. **Vercel** — import the GitHub repo as a new project. Framework auto-detects (Next.js). Add the environment variables below. Every push to `main` now deploys.
4. **Domain** — in Vercel → Settings → Domains add `evolvewireless.gy`; at Let's Domains point the A record to `216.198.79.1`.
5. **Done** — the site is live.

### Environment variables (Vercel → Settings → Environment Variables)
| Name | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key — powers all server writes |
| `UISP_BASE_URL` | `https://evolveenterprise.uisp.com` |
| `UISP_API_TOKEN` | UISP **CRM App Key** (not the NMS token) |
| `RESEND_API_KEY` | Resend email key |
| `SLACK_WEBHOOK_GENERAL` (+ signup/quote/contact hooks) | Slack notifications |
| `NOTIFICATION_EMAIL` | Where admin notifications go |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Public WhatsApp contact |
| `NEXT_PUBLIC_SITE_URL` | `https://www.evolvewireless.gy` (used in contract links) |

⚠️ **After changing any env var you must Redeploy** (Deployments → ⋯ → Redeploy). Code pushes deploy themselves; env var changes don't.

---

## 3. What's on the site

**Customer-facing** — plans, coverage map (15 tower sites), solar calculator, speed test, bill-pay info (MMG), contact/quote forms (→ Slack + email).

**Field install sign-up** — `evolvewireless.gy/install`
- Gate: install code **5650** (entered once per phone; stored in the database, changeable any time without a deploy).
- Tech fills: customer, address, plan, WiFi login, **GPS location**, **install photos** (up to 12, auto-compressed), customer signature.
- On submit the system: creates the **real UISP client**, assigns the next **E-number** (continues your sequence automatically), activates the plan (monthly invoicing starts same day), pins the **GPS location on the UISP service map**, saves everything, and generates the contract.
- Success screen: account number + one-tap **Send on WhatsApp** (account no., WiFi login, contract link).
- Contract: `evolvewireless.gy/contract/<unique-token>` — the full agreement, pre-filled, with Save-as-PDF. The link is the customer's permanent copy.

**Staff portal** — `/staff` (login required): attendance, leave, payslips, documents, profile; admin side runs payroll (NIS/PAYE), leave approvals, payslip PDFs, Slack HR notifications.

---

## 4. Everyday operations

| Task | How |
|---|---|
| Give a tech access to sign-ups | Send them `evolvewireless.gy/install` + code **5650** |
| Change the install code | Update the `field_install_code` row in the `app_settings` table (Supabase → Table Editor). Takes effect instantly. |
| See all install sign-ups | Supabase → Table Editor → `field_signups` (includes GPS, photo paths, contract tokens) |
| View install photos | Supabase → Storage → `install-photos` bucket (private) |
| Re-send a customer's contract | Copy their `public_token` from `field_signups` → link is `evolvewireless.gy/contract/<token>` |
| Delete a test sign-up | Delete the client in UISP (frees its E-number automatically) — the form always continues from the highest E-number left in UISP |
| Check why something failed | Vercel → project → Logs (server errors); `field_signups.uisp_error` column (UISP rejections) |

**Account numbers:** the form scans UISP for the highest `E####` and assigns the next one. UISP is the single source of truth — nothing to maintain.

**Test sign-ups create real billing.** A successful submission = real UISP client + invoicing from that day. Archive/delete test clients in UISP afterwards.

---

## 5. Making changes to the site

1. Edit code (or ask Claude to).
2. Commit and push to `main`.
3. Vercel builds and deploys automatically (~1 min). Watch it under Deployments.
4. If a deploy breaks, Vercel keeps the previous one live; use "Instant Rollback" on any older deployment.

Database changes go through Supabase migrations (SQL files in `supabase/migrations/`, applied via the Supabase dashboard SQL editor or MCP) so the repo stays the historical record.

---

## 6. Keys & security

- All secrets live **only** in Vercel env vars — never in the code.
- The UISP **CRM App Key** ≠ the NMS token. CRM key: UISP → CRM Settings → System → Security → App Keys. Rotating it = generate new key → update `UISP_API_TOKEN` in Vercel → Redeploy.
- Supabase keys: Supabase → Settings → API Keys. The `service_role` key is the powerful one — treat like a bank password.
- The install code gates who can create billing clients — treat it like a door code; rotate it whenever a tech leaves (10-second table edit).
- Never paste live keys into chats/messages; when it happens, rotate them.

---

## 7. What's next (already scoped)

- **Route 2 WhatsApp** — contracts send themselves from an Evolve business number (needs Meta business verification + one template approval).
- **MMG Biller API** — automatic payment reconciliation into UISP (waiting on MMG).
- **Admin gallery** — view install photos per customer inside the staff portal instead of the Supabase dashboard.
