# PATCH: Add NIS card to /admin/payroll/runs page

**File:** `src/app/admin/payroll/runs/page.tsx`

This is a *small* addition to the existing page — adds a second button next to the "Year-end 7B" link that takes you to `/admin/payroll/nis`.

## FIND this block (around line 130, in the header actions):

```tsx
<Link href="/admin/payroll/year-end" style={{
  padding: "10px 16px", background: "transparent", color: "#E9B44C",
  border: "1px solid #2a2420", borderRadius: 10, fontWeight: 600,
  fontSize: 13, textDecoration: "none",
}}>Year-end 7B</Link>
```

## REPLACE with:

```tsx
<Link href="/admin/payroll/nis" style={{
  padding: "10px 16px", background: "transparent", color: "#D4654A",
  border: "1px solid #2a2420", borderRadius: 10, fontWeight: 600,
  fontSize: 13, textDecoration: "none",
}}>NIS schedules</Link>
<Link href="/admin/payroll/year-end" style={{
  padding: "10px 16px", background: "transparent", color: "#E9B44C",
  border: "1px solid #2a2420", borderRadius: 10, fontWeight: 600,
  fontSize: 13, textDecoration: "none",
}}>Year-end 7B</Link>
```

That's the only change. The new NIS link points to the new page created by this feature.

This patch is optional — the `/admin/payroll/nis` page is reachable by direct URL even without it. Apply it so the link is discoverable from the payroll runs screen.
