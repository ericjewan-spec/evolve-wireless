/**
 * Slack Integration — Evolve Wireless
 * Posts notifications to Slack channels via Incoming Webhooks
 * 
 * Setup:
 * 1. Go to https://api.slack.com/apps → Create New App → From scratch
 * 2. Enable "Incoming Webhooks" → Add to your workspace
 * 3. Create webhooks for each channel:
 *    - #new-signups     → SLACK_WEBHOOK_SIGNUPS
 *    - #support-tickets → SLACK_WEBHOOK_SUPPORT 
 *    - #contact-form    → SLACK_WEBHOOK_CONTACT
 *    - #general or #ops → SLACK_WEBHOOK_GENERAL (fallback)
 * 4. Add webhook URLs to Vercel env vars
 */

const WEBHOOKS = {
  signups: process.env.SLACK_WEBHOOK_SIGNUPS || process.env.SLACK_WEBHOOK_GENERAL || "",
  support: process.env.SLACK_WEBHOOK_SUPPORT || process.env.SLACK_WEBHOOK_GENERAL || "",
  contact: process.env.SLACK_WEBHOOK_CONTACT || process.env.SLACK_WEBHOOK_GENERAL || "",
  general: process.env.SLACK_WEBHOOK_GENERAL || "",
  billing: process.env.SLACK_WEBHOOK_BILLING || process.env.SLACK_WEBHOOK_GENERAL || "",
  field: process.env.SLACK_WEBHOOK_FIELD || process.env.SLACK_WEBHOOK_BILLING || process.env.SLACK_WEBHOOK_GENERAL || "",
};

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: { type: string; text: string }[];
  accessory?: Record<string, unknown>;
}

async function postToSlack(
  webhookUrl: string,
  text: string,
  blocks?: SlackBlock[]
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl) {
    console.log("[SLACK] Skipped (no webhook):", text);
    return { success: false, error: "Slack webhook not configured" };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, blocks }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("[SLACK] Failed:", t);
      return { success: false, error: t };
    }

    return { success: true };
  } catch (e) {
    console.error("[SLACK] Error:", e);
    return { success: false, error: (e as Error).message };
  }
}

// ══════════════════════════════════════
// NOTIFICATION FUNCTIONS
// ══════════════════════════════════════

/** New customer signup notification → #new-signups */
export async function slackNewSignup(data: {
  name: string;
  email: string;
  phone: string;
  plan: string;
  region: string;
  address: string;
}) {
  return postToSlack(WEBHOOKS.signups, `🎉 New Signup: ${data.name}`, [
    {
      type: "header",
      text: { type: "plain_text", text: "🎉 New Customer Signup!", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name:*\n${data.name}` },
        { type: "mrkdwn", text: `*Plan:*\n${data.plan}` },
        { type: "mrkdwn", text: `*Phone:*\n${data.phone}` },
        { type: "mrkdwn", text: `*Region:*\n${data.region}` },
        { type: "mrkdwn", text: `*Email:*\n${data.email}` },
        { type: "mrkdwn", text: `*Address:*\n${data.address}` },
      ],
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `📅 ${new Date().toLocaleString("en-GY", { timeZone: "America/Guyana" })} GYT · Via evolvewireless.gy` },
      ],
    },
  ]);
}

/** Support ticket notification → #support-tickets */
export async function slackNewTicket(data: {
  ticketNumber: string;
  customerName: string;
  customerPhone?: string;
  type: string;
  priority: string;
  description: string;
}) {
  const priorityEmoji: Record<string, string> = {
    low: "🟢", medium: "🟡", high: "🟠", critical: "🔴",
  };

  return postToSlack(WEBHOOKS.support, `🎫 New Ticket: ${data.ticketNumber}`, [
    {
      type: "header",
      text: { type: "plain_text", text: `🎫 Support Ticket ${data.ticketNumber}`, emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Customer:*\n${data.customerName}` },
        { type: "mrkdwn", text: `*Priority:*\n${priorityEmoji[data.priority] || "🟡"} ${data.priority}` },
        { type: "mrkdwn", text: `*Type:*\n${data.type.replace(/_/g, " ")}` },
        { type: "mrkdwn", text: `*Phone:*\n${data.customerPhone || "Not provided"}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Description:*\n> ${data.description.substring(0, 300)}${data.description.length > 300 ? "..." : ""}` },
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `⏰ SLA: Respond within 1 hour · ${new Date().toLocaleString("en-GY", { timeZone: "America/Guyana" })} GYT` },
      ],
    },
  ]);
}

/** Contact form notification → #contact-form */
export async function slackContactForm(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  return postToSlack(WEBHOOKS.contact, `📩 Contact Form: ${data.name}`, [
    {
      type: "header",
      text: { type: "plain_text", text: "📩 New Contact Form Submission", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name:*\n${data.name}` },
        { type: "mrkdwn", text: `*Email:*\n${data.email}` },
        { type: "mrkdwn", text: `*Phone:*\n${data.phone || "Not provided"}` },
        { type: "mrkdwn", text: `*Subject:*\n${data.subject || "General inquiry"}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Message:*\n> ${data.message.substring(0, 500)}${data.message.length > 500 ? "..." : ""}` },
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `📅 ${new Date().toLocaleString("en-GY", { timeZone: "America/Guyana" })} GYT · Reply to: ${data.email}` },
      ],
    },
  ]);
}

/** Waitlist signup notification → #general */
export async function slackWaitlistSignup(data: {
  email: string;
  address?: string;
}) {
  return postToSlack(WEBHOOKS.general, `📍 Waitlist Signup: ${data.email}`, [
    {
      type: "section",
      text: { type: "mrkdwn", text: `📍 *New Waitlist Signup*\n*Email:* ${data.email}\n*Address:* ${data.address || "Not provided"}\n\n_Customer is in an uncovered area and wants to be notified when service becomes available._` },
    },
  ]);
}

/** Payment received notification → #general */
export async function slackPaymentReceived(data: {
  customerName: string;
  invoiceNumber: string;
  amount: number;
  method: string;
}) {
  return postToSlack(WEBHOOKS.general, `💰 Payment: GYD ${data.amount.toLocaleString()} from ${data.customerName}`, [
    {
      type: "section",
      text: { type: "mrkdwn", text: `💰 *Payment Received*\n*Customer:* ${data.customerName}\n*Invoice:* ${data.invoiceNumber}\n*Amount:* GYD ${data.amount.toLocaleString()}\n*Method:* ${data.method}` },
    },
  ]);
}


/** #billing-payments: field tech collected cash the office must receive. */
export async function slackFieldPayment(data: {
  accountNumber: string;
  customerName: string;
  itemsSummary: string;
  totalGyd: number;
  technicianName: string;
  uispPaymentId: string | null;
}): Promise<void> {
  const total = "GYD " + Math.round(data.totalGyd).toLocaleString("en-US");
  const text = `💵 Field payment collected — ${total} from ${data.accountNumber} (${data.customerName}) by ${data.technicianName}`;
  await postToSlack(WEBHOOKS.billing, text, [
    { type: "header", text: { type: "plain_text", text: `💵 Field Payment — ${total}`, emoji: true } },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Account:*\n${data.accountNumber} — ${data.customerName}` },
        { type: "mrkdwn", text: `*Paid for:*\n${data.itemsSummary}` },
        { type: "mrkdwn", text: `*Tech responsible for funds:*\n${data.technicianName} — to remit ${total} to office` },
        { type: "mrkdwn", text: `*UISP:*\n${data.uispPaymentId ? `recorded ✓ (payment #${data.uispPaymentId})` : "⚠️ NOT recorded — add manually"}` },
      ],
    },
  ]);
}


/** #billing-payments: tech checked out cash + equipment at start of day. */
export async function slackDayStart(data: {
  technicianName: string;
  cashAdvanceGyd: number;
  cashPurpose: string | null;
  equipment: { item: string; qty: number }[];
}): Promise<void> {
  const cash = "GYD " + Math.round(data.cashAdvanceGyd).toLocaleString("en-US");
  const equip = data.equipment.length
    ? data.equipment.map((e) => `${e.qty}× ${e.item}`).join(", ")
    : "none";
  await postToSlack(WEBHOOKS.billing, `🌅 Day started: ${data.technicianName} — advance ${cash}, equipment: ${equip}`, [
    { type: "header", text: { type: "plain_text", text: `🌅 Day Sheet — ${data.technicianName}`, emoji: true } },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Cash advance:*\n${cash}${data.cashPurpose ? ` — ${data.cashPurpose}` : ""}` },
        { type: "mrkdwn", text: `*Equipment taken:*\n${equip}` },
      ],
    },
  ]);
}

/** #billing-payments: end-of-day reconciliation for a tech's day sheet. */
export async function slackDayClose(data: {
  technicianName: string;
  cashAdvanceGyd: number;
  purchasesGyd: number;
  cashReturnedGyd: number;
  equipmentSummary: string;
  collectionsTotalGyd: number;
  collectionsCount: number;
  notes: string | null;
}): Promise<void> {
  const g = (n: number) => "GYD " + Math.round(n).toLocaleString("en-US");
  const diff = Math.round(data.cashAdvanceGyd - data.purchasesGyd - data.cashReturnedGyd);
  const cashLine = `Advance ${g(data.cashAdvanceGyd)} − receipts ${g(data.purchasesGyd)} − returned ${g(data.cashReturnedGyd)} = ${diff === 0 ? "✓ balanced" : `⚠️ ${g(Math.abs(diff))} ${diff > 0 ? "unaccounted" : "over-returned"}`}`;
  await postToSlack(
    WEBHOOKS.billing,
    `🌇 Day closed: ${data.technicianName} — ${cashLine}; collections to remit ${g(data.collectionsTotalGyd)}`,
    [
      { type: "header", text: { type: "plain_text", text: `🌇 Day Closed — ${data.technicianName}`, emoji: true } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Purchase cash:*\n${cashLine}` },
          { type: "mrkdwn", text: `*Equipment:*\n${data.equipmentSummary || "none taken"}` },
          { type: "mrkdwn", text: `*Customer collections to remit:*\n${g(data.collectionsTotalGyd)} (${data.collectionsCount} payment${data.collectionsCount === 1 ? "" : "s"})` },
          { type: "mrkdwn", text: `*Notes:*\n${data.notes || "—"}` },
        ],
      },
    ],
  );
}


/** Security: a tech's PIN unlocked the field tools on a device not seen before. */
export async function slackNewDeviceUnlock(tech: string, ip: string): Promise<void> {
  await postToSlack(
    WEBHOOKS.field,
    `🔓 ${tech} unlocked the field tools on a NEW device (ip ${ip}). If this wasn't them, deactivate their PIN in field_techs.`,
  );
}
