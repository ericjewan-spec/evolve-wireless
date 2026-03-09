/**
 * UISP (Ubiquiti ISP) CRM Integration
 * 
 * Evolve Wireless uses UISP for:
 * - Network management & monitoring
 * - Customer/client CRM
 * - Service plan management
 * - Invoice generation
 * - Device monitoring (CPE, APs, towers)
 * 
 * Configure via environment variables:
 *   UISP_BASE_URL=https://your-uisp-instance.com
 *   UISP_API_TOKEN=your-api-token
 * 
 * UISP API docs: https://uisp.ui.com/api/v2.1
 */

const UISP_BASE_URL = process.env.UISP_BASE_URL || "";
const UISP_TOKEN = process.env.UISP_API_TOKEN || "";

interface UISPRequestOptions {
  method?: string;
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

async function uispFetch<T>(endpoint: string, options: UISPRequestOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;

  const url = new URL(`/nms/api/v2.1${endpoint}`, UISP_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-auth-token": UISP_TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UISP API error ${res.status}: ${text}`);
  }

  return res.json();
}

// Also support CRM (UCRM) endpoints
async function ucrmFetch<T>(endpoint: string, options: UISPRequestOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;

  const url = new URL(`/crm/api/v1.0${endpoint}`, UISP_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-auth-token": UISP_TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UCRM API error ${res.status}: ${text}`);
  }

  return res.json();
}

// ══════════════════════════════════════
// CLIENT MANAGEMENT (UCRM)
// ══════════════════════════════════════

export interface UISPClient {
  id: number;
  firstName: string;
  lastName: string;
  companyName?: string;
  street1?: string;
  city?: string;
  countryId?: number;
  contacts: Array<{
    email?: string;
    phone?: string;
    name?: string;
    type: { id: number; name: string };
  }>;
  attributes?: Record<string, unknown>;
  accountBalance: number;
  accountStandingsCredit: number;
  currencyCode: string;
  isLead: boolean;
  registrationDate: string;
}

/** List all UISP CRM clients */
export async function listClients(): Promise<UISPClient[]> {
  return ucrmFetch<UISPClient[]>("/clients");
}

/** Get a single client by UISP ID */
export async function getClient(clientId: number): Promise<UISPClient> {
  return ucrmFetch<UISPClient>(`/clients/${clientId}`);
}

/** Create a new client in UISP CRM */
export async function createClient(data: {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  street1?: string;
  city?: string;
}): Promise<UISPClient> {
  return ucrmFetch<UISPClient>("/clients", {
    method: "POST",
    body: {
      firstName: data.firstName,
      lastName: data.lastName,
      street1: data.street1 || "",
      city: data.city || "Georgetown",
      countryId: 93, // Guyana
      isLead: false,
      contacts: [
        ...(data.email ? [{ email: data.email, name: `${data.firstName} ${data.lastName}`, type: { id: 1 } }] : []),
        ...(data.phone ? [{ phone: data.phone, name: `${data.firstName} ${data.lastName}`, type: { id: 1 } }] : []),
      ],
    },
  });
}

/** Update an existing client */
export async function updateClient(clientId: number, data: Partial<UISPClient>): Promise<UISPClient> {
  return ucrmFetch<UISPClient>(`/clients/${clientId}`, {
    method: "PATCH",
    body: data as Record<string, unknown>,
  });
}

// ══════════════════════════════════════
// SERVICE PLANS (UCRM)
// ══════════════════════════════════════

export interface UISPServicePlan {
  id: number;
  name: string;
  organizationId: number;
  downloadBurst?: number;
  downloadSpeed?: number;
  uploadBurst?: number;
  uploadSpeed?: number;
  dataUsageLimit?: number;
  price: number;
  taxable: boolean;
  active: boolean;
}

/** List all service plans from UISP */
export async function listServicePlans(): Promise<UISPServicePlan[]> {
  return ucrmFetch<UISPServicePlan[]>("/service-plans");
}

/** Get a service plan by ID */
export async function getServicePlan(planId: number): Promise<UISPServicePlan> {
  return ucrmFetch<UISPServicePlan>(`/service-plans/${planId}`);
}

// ══════════════════════════════════════
// CLIENT SERVICES (Active subscriptions in UCRM)
// ══════════════════════════════════════

export interface UISPClientService {
  id: number;
  clientId: number;
  status: number; // 1=Prepared, 2=Active, 3=Ended, 5=Suspended, 6=Deferred, 7=Quoted
  name: string;
  servicePlanId: number;
  servicePlanName: string;
  price: number;
  currencyCode: string;
  invoicingStart: string;
  invoicingPeriodStartDay: number;
  activeFrom: string;
  activeTo?: string;
}

/** Get all services for a client */
export async function getClientServices(clientId: number): Promise<UISPClientService[]> {
  return ucrmFetch<UISPClientService[]>(`/clients/${clientId}/services`);
}

/** Create a new service for a client (activate a plan) */
export async function createClientService(clientId: number, data: {
  servicePlanId: number;
  street1?: string;
  city?: string;
  invoicingStart?: string;
  activeFrom?: string;
}): Promise<UISPClientService> {
  return ucrmFetch<UISPClientService>(`/clients/${clientId}/services`, {
    method: "POST",
    body: {
      servicePlanId: data.servicePlanId,
      street1: data.street1,
      city: data.city,
      invoicingStart: data.invoicingStart || new Date().toISOString().split("T")[0],
      activeFrom: data.activeFrom || new Date().toISOString().split("T")[0],
      invoicingPeriodType: 4, // Monthly
      invoicingPeriodStartDay: 1,
    },
  });
}

/** Suspend a client service */
export async function suspendClientService(serviceId: number): Promise<void> {
  await ucrmFetch(`/clients/services/${serviceId}/suspend`, { method: "PATCH" });
}

/** Unsuspend / reactivate a client service */
export async function unsuspendClientService(serviceId: number): Promise<void> {
  await ucrmFetch(`/clients/services/${serviceId}/unsuspend`, { method: "PATCH" });
}

// ══════════════════════════════════════
// INVOICES (UCRM)
// ══════════════════════════════════════

export interface UISPInvoice {
  id: number;
  clientId: number;
  number: string;
  createdDate: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  status: number; // 0=Draft, 1=Unpaid, 2=PartiallyPaid, 3=Paid, 4=Void, 5=Proforma
  currencyCode: string;
  pdfUrl?: string;
}

/** List invoices for a client */
export async function getClientInvoices(clientId: number): Promise<UISPInvoice[]> {
  return ucrmFetch<UISPInvoice[]>(`/clients/${clientId}/invoices`);
}

/** Get single invoice */
export async function getInvoice(invoiceId: number): Promise<UISPInvoice> {
  return ucrmFetch<UISPInvoice>(`/invoices/${invoiceId}`);
}

/** Get invoice PDF */
export async function getInvoicePdf(invoiceId: number): Promise<Blob> {
  const url = new URL(`/crm/api/v1.0/invoices/${invoiceId}/pdf`, UISP_BASE_URL);
  const res = await fetch(url.toString(), {
    headers: { "x-auth-token": UISP_TOKEN },
  });
  return res.blob();
}

/** Add a payment to an invoice */
export async function addPayment(invoiceId: number, data: {
  amount: number;
  method: string;
  note?: string;
}): Promise<unknown> {
  return ucrmFetch(`/payments`, {
    method: "POST",
    body: {
      invoiceId,
      amount: data.amount,
      currencyCode: "GYD",
      method: { id: getPaymentMethodId(data.method) },
      note: data.note || "",
    },
  });
}

function getPaymentMethodId(method: string): number {
  switch (method) {
    case "cash": return 1;
    case "bank_transfer": return 2;
    case "card": return 3;
    case "mobile_money": return 4;
    default: return 1;
  }
}

// ══════════════════════════════════════
// NETWORK / DEVICES (NMS)
// ══════════════════════════════════════

export interface UISPDevice {
  identification: {
    id: string;
    name: string;
    hostname: string;
    model: string;
    type: string;
    firmwareVersion: string;
    site?: { id: string; name: string };
  };
  overview: {
    status: string; // "active", "inactive", "disconnected"
    lastSeen: string;
    uptime: number;
    signal?: number;
    cpu?: number;
    ram?: number;
  };
  ipAddress?: string;
}

/** List all network devices */
export async function listDevices(): Promise<UISPDevice[]> {
  return uispFetch<UISPDevice[]>("/devices");
}

/** Get device details */
export async function getDevice(deviceId: string): Promise<UISPDevice> {
  return uispFetch<UISPDevice>(`/devices/${deviceId}`);
}

/** List sites (towers, locations) */
export async function listSites(): Promise<unknown[]> {
  return uispFetch<unknown[]>("/sites");
}

/** Get device statistics (for diagnostics) */
export async function getDeviceStatistics(deviceId: string, interval: string = "hour"): Promise<unknown> {
  return uispFetch(`/devices/${deviceId}/statistics`, {
    params: { interval },
  });
}

// ══════════════════════════════════════
// UTILITY — Sync helpers
// ══════════════════════════════════════

/** Check if UISP is configured and reachable */
export async function healthCheck(): Promise<{ ok: boolean; error?: string }> {
  if (!UISP_BASE_URL || !UISP_TOKEN) {
    return { ok: false, error: "UISP not configured — set UISP_BASE_URL and UISP_API_TOKEN env vars" };
  }
  try {
    await uispFetch("/nms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
