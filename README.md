# Evolve Wireless Internet

Fast, reliable wireless internet for Guyana. Built with Next.js, Supabase, and Tailwind CSS.

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Deploy to Vercel

```bash
git init && git add -A && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ericjewan-spec/evolve-wireless.git
git push -u origin main --force
```

Then import on vercel.com and add these env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
