import { createServiceClient } from "@/lib/supabase-service";
import { notFound } from "next/navigation";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

const fmtGyd = (n: number) => "GYD " + Math.round(n || 0).toLocaleString("en-GY");
const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GY", { day: "2-digit", month: "2-digit", year: "numeric" });

type Signup = {
  full_name: string;
  phone: string;
  email: string | null;
  region: string;
  village: string | null;
  address: string;
  plan_name: string;
  monthly_gyd: number;
  base_mbps: number;
  install_fee_gyd: number;
  equipment: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  landlord_name: string | null;
  subscriber_signature: string | null;
  account_number: string | null;
  install_date: string;
};

// The Evolve Wireless customer agreement clauses (from the signed East Coast agreement).
const CLAUSES: string[] = [
  `EW agrees to lease to Client equipment necessary to establish a wireless Internet connection, specifically, a UBIQUITI LITEBEAM AC GEN2 or UBIQUITI NANOSTATION GEN2 (the "Leased Equipment"). With the exception of manufacturing defects, which shall be remedied by EW without charge to Client during the term of the Agreement, Client shall bear all risk of loss in respect to the Leased Equipment, including damage caused by weather or other conditions at Client's location, and Client shall return the Leased Equipment to EW in good working order within ten (10) days of any termination of this Agreement, or Client is subject to a cost of replacement.`,
  `EW shall provide Client with the labor necessary for the normal installation of wireless Internet equipment at the location set forth below. In consideration for the installation, Client shall pay EW a one-time installation fee which shall be due upon Client execution hereof.`,
  `Client understands that the installation services included in this contract are limited to the installation of a Subscriber Antenna (SA), one cable to connect the SA to the customer location via one (1) hole through an exterior wall of Client's structure. EW shall not be responsible for additional installation tasks not specifically listed, which may be deemed desirable or necessary by Client or the installer. Client shall be responsible for additional work subsequently requested by Client.`,
  `All payments for service, lease and/or installation should be in the form of cash, cheque or through any Mobile Money Guyana (MMG) agent countrywide using the provided account number.`,
  `Client understands that the Connection operates through an Ethernet Connection; any additional cable requested will be solely at the Client's expense.`,
  `EW shall not be responsible or liable for: (a) any obstruction(s) erected or grown between the antenna at Client's location and the POP which causes degradation or loss of service; (b) debris on the antenna at Client's location; (c) repair or restoration of any structure or surface altered or penetrated by EW during installation or removal of antenna, mast, tripod, wiring or other EW equipment.`,
  `Client understands that wireless Internet connectivity requires direct radio line of sight, and that any obstruction between the POP and the antenna may block the signal and cause failure of the Connection. If foliage disrupts service, EW will attempt to reconfigure the equipment to restore service; Client may incur charges for extra hardware and service labor. If service cannot be restored within fifteen (15) days of Client's notice, either party may terminate this Agreement, and Client shall receive a pro-rata refund for any period in excess of forty-eight (48) hours paid for but not operational.`,
  `Client acknowledges that all fees are non-refundable after the Connection becomes operational (the "Activation Date").`,
  `Permitting and Landlord Approval. It shall be Client's responsibility to obtain any required permits, consents or, for installation on property not owned by Client, landlord approval. The landlord consents to the installation, maintenance and removal of equipment required for the Connection.`,
  `Client will be invoiced monthly in advance for all amounts due. All payments are due within three (3) days after the date of such invoice. Service may be suspended if payment is not received within three (3) days. If disconnected or unpaid for more than 14–30 days, a reconnection fee of GYD 2,000–10,000 applies. Payments shall be made at 41 Success Railway Embankment, East Coast Demerara, at any Mobile Money Guyana agent countrywide, or at any alternative address EW may advise.`,
  `Client represents and warrants that the Leased Equipment shall at all times, prior to its return to EW, be located at the address of Client written below.`,
  `The Connection is intended solely for use within the home, apartment, or office in which it is originally installed. Client may not share the connection with other locations, unrelated parties, other business entities or their employees.`,
  `Through the Connection, EW provides Client access to the Internet, a separate and independent network not owned, operated or managed by EW. Client's use of the Internet is solely at Client's own risk and subject to all applicable laws and regulations.`,
  `The Connection and EW's network can only be used for lawful purposes. Transmission of any material in violation of any local or international law or regulation is prohibited, including copyrighted material, threatening or obscene material, trade secrets, bulk e-mail, or peer-to-peer networks.`,
  `EW makes no warranty, express or implied, including that the Connection is suitable for a particular purpose. EW shall not be responsible for any loss of data resulting from delays, non-deliveries, mis-deliveries or service interruption, however caused.`,
  `Routine maintenance, system repairs, upgrades and reconfigurations, public emergency, force majeure, restrictions imposed by law, acts of God, labor disputes and mechanical or electrical breakdowns may result in temporary impairment or interruption of service. EW does not guarantee continuous or uninterrupted service and reserves the right to temporarily reduce or suspend service without notice. Client consents to periodic monitoring of Client's use of the Connection for quality control.`,
  `Upon any breach by Client, EW reserves the right, in addition to other remedies, to terminate this Agreement and the services to Client.`,
  `Client agrees to pay all costs incurred by EW in enforcing this Agreement, including reasonable attorney fees. In any litigation arising out of this Agreement, the prevailing party shall be indemnified for all costs, including reasonable attorney fees.`,
  `This Agreement is deemed entered into in the Country of Guyana, and any dispute shall have its venue in Georgetown, Guyana, and shall be governed by the laws of Guyana.`,
  `EW may assign this Agreement without Client's prior consent. The Agreement shall not be assignable by Client except with EW's written consent. This Agreement shall be binding upon the parties and their respective successors and assigns.`,
  `Neither party shall disclose any terms and conditions of this Agreement without prior written consent of the other.`,
  `Client agrees to indemnify and hold EW harmless for any injuries or damages sustained during or as a result of the installation of the Leased Equipment by Client or any agent of Client.`,
  `If any provision of this Agreement is held invalid, the remainder shall not be affected thereby.`,
  `This Agreement contains the entire understanding between the parties and supersedes any prior understandings and agreements respecting the subject matter.`,
  `Customer must give Evolve Wireless Internet seven (7) days notice of termination of service. Client shall receive a pro-rated refund only if seven (7) days notice has been given.`,
];

export default async function ContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const svc = createServiceClient();
  const { data } = await svc
    .from("field_signups")
    .select(
      "full_name, phone, email, region, village, address, plan_name, monthly_gyd, base_mbps, install_fee_gyd, equipment, wifi_name, wifi_password, landlord_name, subscriber_signature, account_number, install_date",
    )
    .eq("public_token", token)
    .maybeSingle();

  if (!data) notFound();
  const c = data as Signup;

  const wrap: React.CSSProperties = { color: "#111", lineHeight: 1.55, fontSize: 13 };

  return (
    <div style={{ background: "#e9e9e9", minHeight: "100vh", padding: "24px 12px" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      <div className="no-print" style={{ maxWidth: 800, margin: "0 auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ color: "#4A3728", fontSize: 14 }}>
          Your Evolve Wireless service agreement. Save a copy for your records.
        </div>
        <PrintButton />
      </div>

      <div
        className="sheet"
        style={{
          maxWidth: 800,
          margin: "0 auto",
          background: "#fff",
          padding: "48px 56px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          fontFamily: "Georgia, 'Times New Roman', serif",
          ...wrap,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1F6F3D", letterSpacing: 0.5 }}>
            EVOLVE WIRELESS INTERNET
          </div>
          <div style={{ fontSize: 12, color: "#555" }}>Wireless Internet Access / Lease / Installation Agreement</div>
        </div>

        <p style={{ marginBottom: 12 }}>
          1. This Wireless Internet Access/Lease/Installation Agreement (&ldquo;this Agreement&rdquo;) is entered into on the date below by and between <strong>Evolve Wireless Internet</strong> (&ldquo;EW&rdquo;) and the Client identified below.
        </p>

        {/* Identity table */}
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0 18px", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={cellHead}>DATE</th>
              <th style={cellHead}>NAME</th>
              <th style={cellHead}>ACCOUNT NO. (MMG)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cell}>{fmtDate(c.install_date)}</td>
              <td style={cell}>{c.full_name}</td>
              <td style={{ ...cell, background: "#FFE08A", fontWeight: 700, fontSize: 18, textAlign: "center" }}>
                {c.account_number || "PENDING"}
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ marginBottom: 12 }}>
          2. EW shall provide Client with a wireless connection to the Internet (the &ldquo;Connection&rdquo;) with a{" "}
          <strong>{c.base_mbps} Mbps</strong> base bandwidth. In consideration for the Connection, Client shall pay EW the
          sum of <strong>{fmtGyd(c.monthly_gyd)}</strong> each month during the term hereof.
        </p>
        <p style={{ textAlign: "center", fontWeight: 700, textDecoration: "underline", margin: "10px 0 16px" }}>
          (YOU ARE NOT THE OWNER OF THE ANTENNA)
        </p>

        {/* Numbered clauses (start at 3) */}
        <ol start={3} style={{ paddingLeft: 20, margin: 0 }}>
          {CLAUSES.map((text, i) => {
            // Insert the installation fee into the labor clause (original clause 4).
            const filled =
              i === 1
                ? text.replace("a one-time installation fee", `a one-time installation fee of ${fmtGyd(c.install_fee_gyd)}`)
                : text;
            return (
              <li key={i} style={{ marginBottom: 10 }}>
                {filled}
                {i === 8 && c.landlord_name && (
                  <div style={{ marginTop: 4 }}>
                    Landlord: <strong>{c.landlord_name}</strong> (consent on file).
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* Service details */}
        <div style={{ marginTop: 22, padding: 14, border: "1px solid #ccc", borderRadius: 6, background: "#fafafa", fontFamily: "Arial, sans-serif" }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: "#1F6F3D" }}>Service Details</div>
          <div style={detailRow}><span style={detailLabel}>Plan</span><span>{c.plan_name}</span></div>
          <div style={detailRow}><span style={detailLabel}>Equipment</span><span>{c.equipment}</span></div>
          <div style={detailRow}><span style={detailLabel}>Service Address</span><span>{c.address}{c.village ? `, ${c.village}` : ""}</span></div>
          <div style={detailRow}><span style={detailLabel}>Contact</span><span>{c.phone}{c.email ? ` · ${c.email}` : ""}</span></div>
          {c.wifi_name && <div style={detailRow}><span style={detailLabel}>WiFi Name</span><span><strong>{c.wifi_name}</strong></span></div>}
          {c.wifi_password && <div style={detailRow}><span style={detailLabel}>WiFi Password</span><span><strong>{c.wifi_password}</strong></span></div>}
        </div>

        <p style={{ textAlign: "center", fontWeight: 700, textDecoration: "underline", margin: "20px 0 8px" }}>
          (YOU ARE NOT THE OWNER OF THE ANTENNA)
        </p>

        {/* Signature */}
        <div style={{ marginTop: 24, fontFamily: "Arial, sans-serif" }}>
          <div style={{ fontSize: 12, color: "#555" }}>Subscriber Signature</div>
          {c.subscriber_signature ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.subscriber_signature} alt="Subscriber signature" style={{ height: 70, marginTop: 4 }} />
          ) : (
            <div style={{ borderBottom: "1px solid #333", width: 320, height: 40 }} />
          )}
        </div>

        <div style={{ marginTop: 20, fontSize: 12, color: "#555", fontFamily: "Arial, sans-serif", borderTop: "1px solid #eee", paddingTop: 12 }}>
          Technical Support: 609-2487 · WhatsApp · Facebook (Evolve Wireless Internet)
        </div>
      </div>

      <div className="no-print" style={{ textAlign: "center", marginTop: 16 }}>
        <PrintButton />
      </div>
    </div>
  );
}

const cellHead: React.CSSProperties = { border: "1px solid #333", padding: "6px 8px", background: "#f0f0f0", fontSize: 12, textAlign: "center" };
const cell: React.CSSProperties = { border: "1px solid #333", padding: "8px 10px" };
const detailRow: React.CSSProperties = { display: "flex", gap: 10, fontSize: 13, padding: "3px 0" };
const detailLabel: React.CSSProperties = { minWidth: 130, color: "#666", fontWeight: 600 };
