/**
 * UISP Sync — Wrapper for integrating website events with UISP CRM
 *
 * Connects to: evolveenterprise.uisp.com
 * 
 * Configure in Vercel Environment Variables:
 *   UISP_BASE_URL=https://evolveenterprise.uisp.com
 *   UISP_API_TOKEN=your-uisp-api-token
 *
 * To get your UISP API token:
 *   1. Log into UISP at evolveenterprise.uisp.com
 *   2. Go to Settings → Users → Your user → API Tokens
 *   3. Create a new token with full access
 *   4. Copy it and add to Vercel env vars
 */

const UISP_BASE_URL = process.env.UISP_BASE_URL || "https://evolveenterprise.uisp.com";
const UISP_TOKEN = process.env.UISP_API_TOKEN || "";

interface UISPClientData {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  street1?: string;
  city?: string;
}

/**
 * Create a new client in UISP CRM
 * Called when: someone fills out the contact form or signs up
 */
export async function createClient(data: UISPClientData) {
  if (!UISP_TOKEN) {
    console.warn("UISP: No API token configured — skipping CRM sync. Set UISP_API_TOKEN in Vercel env vars.");
    return null;
  }

  const contacts = [];
  if (data.email) {
    contacts.push({
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      type: { id: 1 },
      isLogin: true,
    });
  }
  if (data.phone) {
    contacts.push({
      phone: data.phone,
      name: `${data.firstName} ${data.lastName}`,
      type: { id: 1 },
    });
  }

  const res = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-token": UISP_TOKEN,
    },
    body: JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      street1: data.street1 || "",
      city: data.city || "Georgetown",
      countryId: 93, // Guyana
      isLead: true,
      contacts,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UISP client creation failed (${res.status}): ${text}`);
  }

  const client = await res.json();
  console.log(`UISP: Client created — ID: ${client.id}, Name: ${data.firstName} ${data.lastName}`);
  return client;
}

/**
 * Create a client and assign a service plan in UISP
 * Called when: someone completes the signup flow
 */
export async function createClientWithService(data: UISPClientData & {
  servicePlanId?: number;
  address?: string;
  region?: string;
}) {
  if (!UISP_TOKEN) {
    console.warn("UISP: No API token configured — skipping CRM sync.");
    return null;
  }

  // Create the client first (as a real client, not a lead)
  const clientRes = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-token": UISP_TOKEN,
    },
    body: JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      street1: data.address || data.street1 || "",
      city: data.city || (data.region === "region1" ? "Port Kaituma" : "Georgetown"),
      countryId: 93,
      isLead: false,
      contacts: [
        ...(data.email ? [{ email: data.email, name: `${data.firstName} ${data.lastName}`, type: { id: 1 }, isLogin: true }] : []),
        ...(data.phone ? [{ phone: data.phone, name: `${data.firstName} ${data.lastName}`, type: { id: 1 } }] : []),
      ],
    }),
  });

  if (!clientRes.ok) {
    const text = await clientRes.text();
    throw new Error(`UISP client creation failed (${clientRes.status}): ${text}`);
  }

  const client = await clientRes.json();

  // If a service plan ID is provided, assign the service
  if (data.servicePlanId) {
    try {
      const serviceRes = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/clients/${client.id}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": UISP_TOKEN,
        },
        body: JSON.stringify({
          servicePlanId: data.servicePlanId,
          street1: data.address || "",
          city: data.city || "Georgetown",
          invoicingStart: new Date().toISOString().split("T")[0],
          activeFrom: new Date().toISOString().split("T")[0],
          invoicingPeriodType: 4, // Monthly
          invoicingPeriodStartDay: 1,
        }),
      });

      if (!serviceRes.ok) {
        console.error("UISP: Service assignment failed:", await serviceRes.text());
      }
    } catch (err) {
      console.error("UISP: Service assignment error:", err);
    }
  }

  return client;
}

/**
 * List all UISP service plans (to map website plans to UISP plan IDs)
 */
export async function listServicePlans() {
  if (!UISP_TOKEN) return [];

  const res = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/service-plans`, {
    headers: { "x-auth-token": UISP_TOKEN },
  });

  if (!res.ok) return [];
  return res.json();
}

/**
 * Check if UISP is configured and reachable
 */
export async function healthCheck(): Promise<{ connected: boolean; url: string; error?: string }> {
  if (!UISP_TOKEN) {
    return { connected: false, url: UISP_BASE_URL, error: "No UISP_API_TOKEN configured in Vercel env vars" };
  }

  try {
    const res = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/version`, {
      headers: { "x-auth-token": UISP_TOKEN },
    });
    if (res.ok) {
      return { connected: true, url: UISP_BASE_URL };
    }
    return { connected: false, url: UISP_BASE_URL, error: `HTTP ${res.status}` };
  } catch (err) {
    return { connected: false, url: UISP_BASE_URL, error: (err as Error).message };
  }
}

/**
 * Provision a fully-installed customer in UISP CRM.
 *
 * Called by the field-tech install form (/staff/install) the moment an
 * installation is completed. Unlike createClient() (which makes a lead),
 * this creates a real client, auto-maps the chosen plan to a UISP service
 * plan by matching monthly price, activates the service, and stamps the
 * client's Custom ID (userIdent) with the account number 'E{clientId}'.
 *
 * Returns { uispClientId, uispServiceId, accountNumber } — or null if UISP
 * isn't configured yet (so the signup can still be saved and synced later).
 *
 * NOTE: requires a UISP *CRM App Key* (Settings → System → Security →
 * App Keys inside UISP), NOT the NMS token. Set it as UISP_API_TOKEN in
 * Vercel. Until then this returns null and the install is marked pending_sync.
 */
export async function provisionInstalledClient(data: {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  region?: string;
  monthlyGyd: number;
}): Promise<{ uispClientId: string; uispServiceId: string | null; accountNumber: string } | null> {
  if (!UISP_TOKEN) {
    console.warn("UISP: No CRM App Key configured — install saved as pending_sync.");
    return null;
  }

  const headers = {
    "Content-Type": "application/json",
    "x-auth-app-key": UISP_TOKEN, // CRM API authenticates with the App Key
  };

  // 1) Try to auto-map the website plan to a UISP service plan by monthly price.
  let servicePlanId: number | null = null;
  try {
    const plansRes = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/service-plans`, { headers });
    if (plansRes.ok) {
      const plans = (await plansRes.json()) as Array<{ id: number; price: number; name: string }>;
      const match = plans.find((p) => Math.round(p.price) === Math.round(data.monthlyGyd));
      servicePlanId = match?.id ?? null;
      if (!servicePlanId) {
        console.warn(`UISP: no service plan matched GYD ${data.monthlyGyd}; creating client without service.`);
      }
    }
  } catch (err) {
    console.error("UISP: service-plan lookup failed:", err);
  }

  // 2) Create the client (real client, not a lead).
  const clientRes = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/clients`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      street1: data.address || "",
      city: data.city || (data.region === "region1" ? "Port Kaituma" : "Georgetown"),
      countryId: 93, // Guyana
      isLead: false,
      contacts: [
        ...(data.email ? [{ email: data.email, name: `${data.firstName} ${data.lastName}`, type: { id: 1 }, isLogin: true }] : []),
        ...(data.phone ? [{ phone: data.phone, name: `${data.firstName} ${data.lastName}`, type: { id: 1 } }] : []),
      ],
    }),
  });

  if (!clientRes.ok) {
    throw new Error(`UISP client creation failed (${clientRes.status}): ${await clientRes.text()}`);
  }

  const client = await clientRes.json();
  const clientId: number = client.id;
  const accountNumber = `E${clientId}`;

  // 3) Stamp the account number onto the client's Custom ID (userIdent).
  try {
    await fetch(`${UISP_BASE_URL}/crm/api/v1.0/clients/${clientId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ userIdent: accountNumber }),
    });
  } catch (err) {
    console.error("UISP: failed to set userIdent:", err);
  }

  // 4) Activate the service plan (monthly, invoiced from today).
  let uispServiceId: string | null = null;
  if (servicePlanId) {
    try {
      const svcRes = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/clients/${clientId}/services`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          servicePlanId,
          street1: data.address || "",
          city: data.city || "Georgetown",
          invoicingStart: new Date().toISOString().split("T")[0],
          activeFrom: new Date().toISOString().split("T")[0],
          invoicingPeriodType: 4, // Monthly
          invoicingPeriodStartDay: 1,
        }),
      });
      if (svcRes.ok) {
        const svc = await svcRes.json();
        uispServiceId = String(svc.id);
      } else {
        console.error("UISP: service activation failed:", await svcRes.text());
      }
    } catch (err) {
      console.error("UISP: service activation error:", err);
    }
  }

  console.log(`UISP: provisioned client ${clientId} (${accountNumber}), service ${uispServiceId ?? "none"}`);
  return { uispClientId: String(clientId), uispServiceId, accountNumber };
}
