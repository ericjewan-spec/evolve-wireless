/**
 * Append a completed install as a row in the Google Sheet payment ledger.
 *
 * Routes by region to the matching tab (handled inside the Apps Script):
 *   • ECD       → Internet2023
 *   • Region 1  → Mabaruma_MA
 *
 * Uses a Google Apps Script Web App webhook (SHEETS_WEBHOOK_URL). The URL
 * carries a ?token=... the script validates, so a leaked URL alone can't be
 * abused. Best-effort: never throws, never blocks a signup.
 */
export async function appendInstallToSheet(row: {
  accountNumber: string | null;
  name: string;
  address: string;
  phone: string;
  monthlyGyd: number;
  installDate: string; // YYYY-MM-DD
  region: string;
}): Promise<boolean> {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) return false;

  const d = new Date((row.installDate || "") + "T00:00:00");
  const dueDate = isNaN(d.getTime()) ? "" : d.getDate();
  const fee = "$" + Math.round(row.monthlyGyd || 0).toLocaleString("en-US");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "follow",
      body: JSON.stringify({
        accountNumber: row.accountNumber || "",
        name: row.name,
        address: row.address,
        phone: row.phone,
        fee,
        dueDate,
        region: row.region,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Sheets append error:", (err as Error).message);
    return false;
  }
}
