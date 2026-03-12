/**
 * Email Service — Evolve Wireless
 * Uses Resend API for transactional emails
 * 
 * Setup: Add RESEND_API_KEY to Vercel env vars
 * Get your key at https://resend.com (free tier: 3,000 emails/month)
 * 
 * Optional: RESEND_FROM_EMAIL (default: noreply@evolvewireless.gy)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Evolve Wireless <noreply@evolvewireless.gy>";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "evolveenterprise592@gmail.com";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log("[EMAIL] Skipped (no RESEND_API_KEY):", options.subject, "→", options.to);
    return { success: false, error: "Email not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[EMAIL] Failed:", text);
      return { success: false, error: text };
    }

    return { success: true };
  } catch (e) {
    console.error("[EMAIL] Error:", e);
    return { success: false, error: (e as Error).message };
  }
}

// ══════════════════════════════════════
// PRE-BUILT EMAIL TEMPLATES
// ══════════════════════════════════════

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 560px; margin: 0 auto; padding: 32px 24px;
  background: #FFFFFF; color: #2C1810;
`;
const headerStyle = `
  text-align: center; padding-bottom: 24px; margin-bottom: 24px;
  border-bottom: 2px solid #D4654A;
`;
const btnStyle = `
  display: inline-block; padding: 14px 28px; background: #D4654A;
  color: #ffffff; text-decoration: none; border-radius: 9999px;
  font-weight: 600; font-size: 15px;
`;
const footerStyle = `
  margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee;
  font-size: 13px; color: #8B7355; text-align: center;
`;

function wrap(content: string): string {
  return `
    <div style="background: #FDF8F3; padding: 40px 16px;">
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <strong style="font-size: 20px; color: #2C1810;">Evolve Wireless</strong>
        </div>
        ${content}
        <div style="${footerStyle}">
          <p>Evolve Wireless Internet · Georgetown, Guyana</p>
          <p>📱 +592 609-2487 · WhatsApp 24/7</p>
        </div>
      </div>
    </div>
  `;
}

/** Welcome email sent after signup — sends to customer + admin notification */
export async function sendWelcomeEmail(to: string, name: string, planName: string) {
  const ADMIN_EMAIL = "evolveenterprise592@gmail.com";
  
  // Send welcome to customer (may fail if domain not verified in Resend)
  const customerResult = await sendEmail({
    to,
    subject: `Welcome to Evolve Wireless, ${name.split(" ")[0]}! 🇬🇾`,
    html: wrap(`
      <h2 style="font-size: 22px; margin-bottom: 8px;">Welcome to Evolve Wireless!</h2>
      <p style="color: #4A3728; line-height: 1.7;">
        Hi ${name.split(" ")[0]},<br><br>
        Your <strong>${planName}</strong> account has been created. Our team will contact you within 
        <strong>24 hours</strong> to schedule your installation.
      </p>
      <p style="color: #4A3728; line-height: 1.7;">Here's what happens next:</p>
      <ol style="color: #4A3728; line-height: 2; padding-left: 20px;">
        <li>Our technician calls you to confirm your installation date</li>
        <li>We arrive and install everything (router + antenna included)</li>
        <li>You're online — usually within 48 hours</li>
      </ol>
      <p style="text-align: center; margin: 28px 0;">
        <a href="https://evolvewireless.gy/portal" style="${btnStyle}">Go to My Dashboard</a>
      </p>
      <p style="color: #8B7355; font-size: 14px;">
        Questions? WhatsApp us anytime at <strong>+592 609-2487</strong>
      </p>
    `),
  });

  // Always send admin notification (to verified email — always works)
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `🎉 New Signup: ${name} — ${planName}`,
    html: wrap(`
      <h2 style="font-size: 22px; margin-bottom: 8px;">New Customer Signup!</h2>
      <table style="width: 100%; font-size: 14px; color: #4A3728;">
        <tr><td style="padding: 8px 0; font-weight: 600; width: 100px;">Name</td><td>${name}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Email</td><td>${to}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Plan</td><td>${planName}</td></tr>
      </table>
      <p style="color: #8B7355; font-size: 14px; margin-top: 16px;">
        ${customerResult.success ? "✅ Welcome email sent to customer" : "⚠️ Customer email failed (domain not verified in Resend) — follow up manually"}
      </p>
    `),
  });

  return customerResult;
}

/** Contact form confirmation to the customer */
export async function sendContactConfirmation(to: string, name: string) {
  return sendEmail({
    to,
    subject: "We received your message — Evolve Wireless",
    html: wrap(`
      <h2 style="font-size: 22px; margin-bottom: 8px;">Message Received!</h2>
      <p style="color: #4A3728; line-height: 1.7;">
        Hi ${name.split(" ")[0]},<br><br>
        Thanks for reaching out. Our team will get back to you within <strong>1 business day</strong>.
        For urgent issues, WhatsApp us at <strong>+592 609-2487</strong> — we respond within the hour.
      </p>
    `),
  });
}

/** Contact form notification to Evolve team */
export async function sendContactNotification(data: {
  name: string; email: string; phone?: string; subject?: string; message: string;
}) {
  return sendEmail({
    to: SUPPORT_EMAIL,
    subject: `[Contact Form] ${data.subject || "New message"} from ${data.name}`,
    replyTo: data.email,
    html: wrap(`
      <h2 style="font-size: 22px; margin-bottom: 16px;">New Contact Form Submission</h2>
      <table style="width: 100%; font-size: 14px; color: #4A3728;">
        <tr><td style="padding: 8px 0; font-weight: 600; width: 100px;">Name</td><td>${data.name}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Email</td><td>${data.email}</td></tr>
        ${data.phone ? `<tr><td style="padding: 8px 0; font-weight: 600;">Phone</td><td>${data.phone}</td></tr>` : ""}
        ${data.subject ? `<tr><td style="padding: 8px 0; font-weight: 600;">Subject</td><td>${data.subject}</td></tr>` : ""}
      </table>
      <div style="margin-top: 16px; padding: 16px; background: #FFF9F4; border-radius: 8px; color: #4A3728; line-height: 1.7;">
        ${data.message}
      </div>
    `),
  });
}

/** Support ticket created notification */
export async function sendTicketCreated(to: string, ticketNumber: string, issueType: string) {
  return sendEmail({
    to,
    subject: `Support ticket ${ticketNumber} created — Evolve Wireless`,
    html: wrap(`
      <h2 style="font-size: 22px; margin-bottom: 8px;">Support Ticket Created</h2>
      <p style="color: #4A3728; line-height: 1.7;">
        Your ticket <strong>${ticketNumber}</strong> for <strong>${issueType.replace("_", " ")}</strong> 
        has been created. Our team will respond within <strong>1 hour</strong>.
      </p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="https://evolvewireless.gy/portal/support" style="${btnStyle}">View My Tickets</a>
      </p>
      <p style="color: #8B7355; font-size: 14px;">
        For urgent issues, WhatsApp us at <strong>+592 609-2487</strong>.
      </p>
    `),
  });
}

/** Invoice notification */
export async function sendInvoiceNotification(to: string, name: string, invoiceNumber: string, amount: number, dueDate: string) {
  return sendEmail({
    to,
    subject: `Invoice ${invoiceNumber} — GYD ${amount.toLocaleString()} due ${dueDate}`,
    html: wrap(`
      <h2 style="font-size: 22px; margin-bottom: 8px;">Invoice Ready</h2>
      <p style="color: #4A3728; line-height: 1.7;">
        Hi ${name.split(" ")[0]}, your invoice is ready:
      </p>
      <div style="background: #FFF9F4; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <div style="font-size: 14px; color: #8B7355;">${invoiceNumber}</div>
        <div style="font-size: 32px; font-weight: 700; color: #D4654A; margin: 8px 0;">GYD ${amount.toLocaleString()}</div>
        <div style="font-size: 14px; color: #4A3728;">Due: ${dueDate}</div>
      </div>
      <p style="text-align: center; margin: 28px 0;">
        <a href="https://evolvewireless.gy/portal/billing" style="${btnStyle}">View & Pay</a>
      </p>
      <p style="color: #8B7355; font-size: 14px;">
        Pay via WhatsApp (+592 609-2487), bank transfer, or cash at our office.
      </p>
    `),
  });
}
