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


// Website plan id  →  UISP service plan id (verified against evolveenterprise.uisp.com)
const UISP_PLAN_MAP: Record<string, number> = {
  "ecd-starter": 2,   // Basic Plan 5K
  "ecd-family": 3,    // Preffered Plan 8K
  "ecd-power": 4,     // Premium Plan 10K
  "r1-essential": 7,  // PK Basic 10K
  "r1-standard": 5,   // PK Preferred 15K
  "r1-premium": 6,    // PK Premium 25K
};

/**
 * Find the next account number in Evolve's E-sequence (userIdent).
 * Account numbers (e.g. E11749) are a manually-maintained sequence, separate
 * from the UISP client id. We read the most recent clients and continue from
 * the current maximum. Returns null if it can't be determined (so we leave the
 * number pending rather than risk a collision).
 */
async function nextAccountNumber(headers: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(
      `${UISP_BASE_URL}/crm/api/v1.0/clients?limit=400&order=client.id&direction=DESC`,
      { headers },
    );
    if (!res.ok) return null;
    const clients = (await res.json()) as Array<{ userIdent?: string }>;
    let max = 0;
    for (const c of clients) {
      const m = /^[eE](\d+)$/.exec((c.userIdent || "").trim());
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
    return max > 0 ? `E${max + 1}` : null;
  } catch {
    return null;
  }
}

/**
 * Provision a fully-installed customer in UISP CRM.
 *
 * Called by the field-tech install form (/staff/install) the moment an
 * installation is completed. Creates a real client, continues Evolve's
 * E-number account sequence (userIdent), maps the plan explicitly, and
 * activates the monthly service.
 *
 * Returns { uispClientId, uispServiceId, accountNumber } — or null if UISP
 * isn't configured (so the signup can still be saved and synced later).
 *
 * Requires a UISP CRM App Key set as UISP_API_TOKEN in Vercel.
 */
export async function provisionInstalledClient(data: {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  region?: string;
  planId: string;
  gpsLat?: number | null;
  gpsLon?: number | null;
}): Promise<{ uispClientId: string; uispServiceId: string | null; accountNumber: string | null; serviceError: string | null } | null> {
  if (!UISP_TOKEN) {
    console.warn("UISP: No CRM App Key configured — install saved as pending_sync.");
    return null;
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Auth-App-Key": UISP_TOKEN,
  };

  const servicePlanId = UISP_PLAN_MAP[data.planId] ?? null;
  const accountNumber = await nextAccountNumber(headers);

  // 1) Create the client (real client, not a lead), continuing the E-sequence.
  const clientRes = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/clients`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      clientType: 1,        // Residential
      organizationId: 1,
      firstName: data.firstName,
      lastName: data.lastName,
      ...(accountNumber ? { userIdent: accountNumber } : {}),
      street1: data.address || "",
      city: data.city || (data.region === "region1" ? "Port Kaituma" : "Georgetown"),
      countryId: 110,       // Guyana (verified against live CRM)
      isLead: false,
      contacts: [
        {
          name: `${data.firstName} ${data.lastName}`.trim(),
          isBilling: true,
          isContact: true,
          ...(data.email ? { email: data.email } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
        },
      ],
    }),
  });

  if (!clientRes.ok) {
    throw new Error(`UISP client creation failed (${clientRes.status}): ${await clientRes.text()}`);
  }

  const client = await clientRes.json();
  const clientId: number = client.id;
  // Prefer whatever UISP actually stored as userIdent; fall back to what we sent.
  const finalAccount: string | null = client.userIdent || accountNumber || null;

  // 2) Activate the service. UISP requires the plan's *billing period* id
  //    (servicePlanId is rejected for recurring services) and full ISO-8601
  //    datetimes. The enabled monthly period is looked up live so price edits
  //    in UISP never break provisioning. GPS coords pin the service on the map.
  let uispServiceId: string | null = null;
  let serviceError: string | null = null;
  if (servicePlanId) {
    try {
      const planRes = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/service-plans/${servicePlanId}`, { headers });
      let periodId: number | null = null;
      if (planRes.ok) {
        const plan = await planRes.json();
        const monthly =
          (plan.periods || []).find((p: { period: number; enabled: boolean }) => p.enabled && p.period === 1) ||
          (plan.periods || []).find((p: { enabled: boolean }) => p.enabled);
        periodId = monthly?.id ?? null;
      }
      if (!periodId) {
        serviceError = `No enabled billing period on UISP plan ${servicePlanId}`;
        console.error("UISP:", serviceError);
      } else {
        const today = new Date().toISOString().split("T")[0] + "T00:00:00+0000";
        const svcRes = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/clients/${clientId}/services`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            servicePlanPeriodId: periodId,
            activeFrom: today,
            invoicingStart: today,
            street1: data.address || "",
            city: data.city || "Georgetown",
            ...(data.gpsLat != null && data.gpsLon != null
              ? { addressGpsLat: data.gpsLat, addressGpsLon: data.gpsLon }
              : {}),
          }),
        });
        if (svcRes.ok) {
          const svc = await svcRes.json();
          uispServiceId = String(svc.id);
        } else {
          serviceError = `Service activation failed (${svcRes.status}): ${await svcRes.text()}`;
          console.error("UISP:", serviceError);
        }
      }
    } catch (err) {
      serviceError = `Service activation error: ${(err as Error).message}`;
      console.error("UISP:", serviceError);
    }
  } else {
    serviceError = `No plan mapping for '${data.planId}'`;
    console.warn("UISP:", serviceError, "— client created without service.");
  }

  console.log(`UISP: provisioned client ${clientId} (${finalAccount ?? "no account #"}), service ${uispServiceId ?? "none"}`);
  return { uispClientId: String(clientId), uispServiceId, accountNumber: finalAccount, serviceError };
}

/**
 * Attach install photos to a UISP client's Documents.
 *
 * UISP's document upload wants JSON (not multipart): { clientId, name, file }
 * where `file` is base64. Verified against evolveenterprise.uisp.com (201).
 * Best-effort: returns the count uploaded; never throws.
 */
export async function attachClientDocuments(
  clientId: string | number,
  files: { name: string; base64: string }[],
): Promise<number> {
  if (!UISP_TOKEN || !files.length) return 0;
  const headers = { "Content-Type": "application/json", "X-Auth-App-Key": UISP_TOKEN };
  let ok = 0;
  for (const f of files) {
    try {
      const res = await fetch(`${UISP_BASE_URL}/crm/api/v1.0/documents`, {
        method: "POST",
        headers,
        body: JSON.stringify({ clientId: Number(clientId), name: f.name, file: f.base64 }),
      });
      if (res.ok) ok++;
      else console.error("UISP document upload failed:", res.status, (await res.text()).slice(0, 200));
    } catch (err) {
      console.error("UISP document upload error:", (err as Error).message);
    }
  }
  return ok;
}
