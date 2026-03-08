# Evolve Wireless Internet

Fast, reliable wireless internet for Guyana. Built with Next.js, Supabase, and Tailwind CSS.

## Getting Started

```bash
npm install
cp .env.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
```

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- - **Backend**: Supabase (PostgreSQL + PostGIS + Auth + Realtime)
  - - **Deployment**: Vercel
   
    - ## Pages
   
    - - `/` - Homepage (hero, about, services, plans, contact)
      - - `/plans` - Internet packages with GYD pricing
        - - `/coverage` - Coverage zones across Guyana
          - - `/contact` - Contact form + WhatsApp integration
