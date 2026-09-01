import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

/**
 * Generate the Evolve Wireless customer agreement as a PDF (server-side).
 *
 * Faithful to the signed paper agreement: identity table with the highlighted
 * MMG account number, region-aware monthly fee options, all 27 clauses, the
 * subscriber's captured signature (if present), WiFi login and support footer.
 * Used by the field signup route to file the contract on the client's UISP
 * Documents automatically.
 */
export type ContractData = {
  accountNumber: string;
  fullName: string;
  installDate: string; // YYYY-MM-DD
  baseMbps: number;
  monthlyGyd: number;
  region: string; // 'ecd' | 'region1'
  address: string;
  village?: string | null;
  phone: string;
  wifiName?: string | null;
  wifiPassword?: string | null;
  signatureDataUrl?: string | null; // data:image/png;base64,...
};

const CLAUSES: string[] = [
  'EW agrees to lease to Client equipment necessary to establish a wireless Internet connection, specifically, a UBIQUITI LITEBEAM AC GEN2 or UBIQUITI NANOSTATION GEN2 equipment referred to herein as the "Leased Equipment"). With the exception of manufacturing defects, which shall be remedied by EW without charge to Client at any time during the term of the Agreement, Client shall bear all risk of loss in respect to the Leased Equipment, including, but not limited to damages caused by weather or other conditions existing at Clients location, and Client shall return the Leased Equipment to EW in good working order within ten (10) days of the date of any termination of this Agreement, or client is subject to a cost of replacement.',
  'EW shall provide Client with the labor necessary for the normal installation of wireless Internet equipment at the location set forth below. In consideration for the installation, Client shall pay EW a one-time installation fee of $ 20,000 which shall be due upon Client execution hereof.',
  "Client understands that the installation services included in this contract are limited to the installation of a Subscriber Antenna (SA), one cable to connect the SA to customer location via one (1) hole through an exterior wall of Client's structure. EW shall not be responsible for additional installation tasks not specifically listed in this Section 4, which may be deemed desirable or necessary by client or the installer. Client shall be responsible for the additional work subsequently requested by Client.",
  "All payments for service, lease and/or installation should be in the form of cash, Cheque or through any Mobile Money Guyana agent countrywide using the provided account number.",
  "Client understands that the Connection operates through an Ethernet Connection any additional cable requested will be solely at the Clients expense.",
  "EW shall not be responsible or liable for any of the following: (a) Any obstruction(s) that might be erected or grow between the antenna at Clients' location and the POP which causes degradation to loss of service. (b) Debris on the antenna located at Client's location. (c) Repair or restoration of any structure or surface altered or penetrated by EW during the installation or removal of antenna, mast, tripod, wiring or any other EW Equipment located at Client's location.",
  "Client understands that wireless Internet connectivity requires direct radio line of site, and that any obstruction between the POP and the antenna located at Client's location may block the signal and cause the failure of the Connection. In the event that foliage disrupts service, EW will attempt to reconfigure the equipment to restore service. Client may incur charges for any extra hardware and service labor at that time. If service cannot be restored within fifteen (15) days of Client's notice to EW of a service interruption, either party may terminate this Agreement. Upon any termination of the Agreement pursuant to the preceding sentence, Client shall receive a refund of a pro-rata portion of the service fee for any period in excess of forty-eight (48) hours that Client has paid for service, but the Connection was not operational.",
  'Client acknowledges that all fees are non-refundable after the Connection becomes operational (the "Activation Date").',
  "Permitting and Landlord Approval. (a) It shall be Client's responsibility to obtain any required permits, consents or, for the installation of EW Equipment on property not owned by Client, Landlord approval in the form set following: Landlord consents to the installation, maintenance and removal of equipment required for the Connection, _________________________ Signature of Landlord for Approval.",
  "Client will be invoiced monthly in advance for all amounts due and owing to EW. All payments are due within 3 days after the date of such an invoice. Client's use of the Connection may be suspended if payment is not received by EW within three (3) days of the date of the date of such an invoice. If said service has be disconnected or invoice not paid for more than 14-30 days there will be a reconnection fee of $2000-$10,000. Payments shall be made at 41 Success Railway Embankment East Coast Demerara, or at any Mobile Money Guyana agent location countrywide, or at any alternative address as EW may subsequently advise Client thereof.",
  "Client represents and warrants to EW that the Leased Equipment shall be at all times prior to its return to EW be located at the address of Client written below.",
  "The Connection is intended solely for use within the home, apartment, or office in which it is originally installed. Client may not share the connection with other locations, unrelated parties, other business entities or their employees.",
  "Through the Connection EW provides Client access to the Internet. Client hereby acknowledges that the Internet is a separate and independent network of computers, which is not owned, operated or managed by EW or any way affiliated with EW or any of its affiliates. Client's use of the Internet shall be solely at Client's own risk and is subject to all applicable laws and regulations. Access to the Internet is dependent on numerous factors, technologies, and systems, many of which are beyond EW's authority and control.",
  "The Connection and EW's network can only be used for lawful purposes. The transmission of any material in violation of any local, state, national or international law or regulation is prohibited. This includes, but is not limited to, copyrighted material, material legally judged to be threatening or obscene, material protected by trade secret, or material that is otherwise deemed to be proprietary or judged by EW to be inappropriate or improper, such as transmitting bulk e-mail messages, or using a peer-to-peer network.",
  "EW makes no warranty, express or implied, including but not limited to, that the Connection is suitable for a particular purpose. EW shall not be responsible for any loss of data resulting from delays, non-deliveries, mis-deliveries or service interruption, however caused. Use of any information obtained through EW's network shall be at Client's own risk. EW specifically disclaims any and all responsibility for the accuracy or quality of information obtained through the Connection.",
  "Routine maintenance and periodic system repairs, upgrades and reconfigurations, public emergency or necessity, force majeure, restrictions imposed by law, acts of God, labor disputes and other situations, including mechanical or electrical breakdowns, may result in temporary impairment or interruption of service. As a result, EW does not guarantee continuous or uninterrupted service and serves the right, from time to time, to temporarily reduce of suspend service without notice. Client shall indemnify and hold EW and its directors, officers, employees, and agents harmless from any and all obligations, charges, claims, liabilities and fees incurred as the result of interruptions or omissions of service under this Agreement. Client consents to the periodic monitoring of Client's use of the Connection and EW's network by EW as may be reasonably required by EW to conduct its quality control activities.",
  "Upon the occurrence of a breach by Client of any provision hereunder, EW, reserves the right, in addition to any other remedies which may be available to it, to terminate this Agreement and the services to Client therein.",
  "Client agrees to pay all costs incurred by EW in enforcing the terms of the Agreement, including, but not limited to reasonable attorney fees. In the event of any litigation arising out of this Agreement, the other party shall indemnify the prevailing party for all costs incurred in such litigation, including but not limited to, reasonable attorney fees.",
  "This Agreement is deemed to be entered into in the Country of Guyana and the parties agree that any dispute arising under this Agreement shall have its venue in Georgetown, Guyana, and any such dispute shall be governed by and constructed in accordance with the laws of Guyana.",
  "EW may assign this Agreement without Client's prior consent and all of EW's rights, title, and interest herein shall insure to the benefit of such assignee, its successors and assigns. The Agreement shall not be assignable by Client except with the written consent of EW. Subject to the foregoing, this Agreement shall be binding upon and insure to the benefit of the parties hereto and their respective successors and assigns.",
  "Neither party shall disclose any of the terms and conditions of the Agreement without prior written consent of the other.",
  "Client agrees to indemnify and hold EW harmless for any injuries or damages sustained during or as a result of the installation of the Leased Equipment by Client or by any agent of Client.",
  "If any provision of this Agreement, or the application of such provision to any person or circumstance, shall be held invalid, the remainder of this Agreement, or the application of such provision to persons or circumstances other than those as to which it is held invalid, shall not be affected thereby.",
  "This agreement contains the entire understanding between and among the parties and supersedes any prior understandings, and agreements among them respecting and subject matter of this agreement.",
  "Customer must give Evolve Wireless Internet (7) days notice of termination of service. Client shall receive a refund of a prorated portion of the service fee if and only if 7 days notice has been given.",
];

const FEE_TIERS: Record<string, number[]> = {
  ecd: [5000, 8000, 10000],
  region1: [10000, 15000, 25000],
};

const gyd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export async function generateContractPdf(data: ContractData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Evolve Wireless Agreement ${data.accountNumber}`);
  doc.setAuthor("Evolve Wireless Internet");

  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const PW = 612, PH = 792; // Letter
  const M = 68, LH = 14, FS = 10.5;
  let page: PDFPage = doc.addPage([PW, PH]);
  let y = PH - M;

  const newPage = () => { page = doc.addPage([PW, PH]); y = PH - M; };
  const need = (h: number) => { if (y - h < M) newPage(); };

  const wrap = (text: string, f: PDFFont, size: number, width: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (f.widthOfTextAtSize(t, size) <= width) line = t;
      else { if (line) lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    return lines;
  };

  const para = (text: string, opts: { font?: PDFFont; size?: number; indent?: number; after?: number } = {}) => {
    const f = opts.font || font, size = opts.size || FS;
    const indent = opts.indent || 0;
    const lines = wrap(text, f, size, PW - 2 * M - indent);
    for (const ln of lines) {
      need(LH);
      page.drawText(ln, { x: M + indent, y: y - LH + 3, size, font: f });
      y -= LH;
    }
    y -= opts.after ?? 8;
  };

  const center = (text: string, f: PDFFont, size: number, underline = false, after = 10) => {
    need(LH + 4);
    const w = f.widthOfTextAtSize(text, size);
    const x = (PW - w) / 2;
    page.drawText(text, { x, y: y - LH + 3, size, font: f });
    if (underline) page.drawLine({ start: { x, y: y - LH + 1 }, end: { x: x + w, y: y - LH + 1 }, thickness: 0.8 });
    y -= LH + after;
  };

  // ── Clause 1 + identity table ──
  para('1.  This Wireless Internet Access/Lease/Installation Agreement ("this Agreement") is entered into this day', { after: 6 });

  const tW = [110, 200, 166], tH = [24, 40];
  const tX = M, tY = y;
  need(tH[0] + tH[1] + 14);
  // header + value rows
  const headers = ["DATE", "NAME", "ACCOUNT NO. (MMG)"];
  const d = new Date((data.installDate || "") + "T00:00:00");
  const dateStr = isNaN(d.getTime())
    ? data.installDate
    : `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
  const values = [dateStr, data.fullName, data.accountNumber];
  let cx = tX;
  for (let c = 0; c < 3; c++) {
    // header cell
    page.drawRectangle({ x: cx, y: tY - tH[0], width: tW[c], height: tH[0], borderColor: rgb(0, 0, 0), borderWidth: 0.9 });
    const hw = bold.widthOfTextAtSize(headers[c], 9.5);
    page.drawText(headers[c], { x: cx + (tW[c] - hw) / 2, y: tY - tH[0] + 8, size: 9.5, font: bold });
    // value cell
    const vy = tY - tH[0];
    if (c === 2) page.drawRectangle({ x: cx, y: vy - tH[1], width: tW[c], height: tH[1], color: rgb(1, 0.87, 0.42) });
    page.drawRectangle({ x: cx, y: vy - tH[1], width: tW[c], height: tH[1], borderColor: rgb(0, 0, 0), borderWidth: 0.9 });
    const vf = c === 2 ? helvBold : font;
    const vs = c === 2 ? 17 : 10.5;
    const vw = vf.widthOfTextAtSize(values[c], vs);
    page.drawText(values[c], { x: cx + (tW[c] - vw) / 2, y: vy - tH[1] + (tH[1] - vs) / 2 + 2, size: vs, font: vf });
    cx += tW[c];
  }
  y = tY - tH[0] - tH[1] - 14;

  // ── Clause 2 with region-aware tiers ──
  const tiers = FEE_TIERS[data.region] || FEE_TIERS.ecd;
  const opts = tiers
    .map((t) => `${Math.round(t) === Math.round(data.monthlyGyd) ? "[X]" : "[  ]"} ${gyd(t)}`)
    .join(",  ");
  para(
    `2.  ("Client"). EW shall provide Client with a wireless connection to the Internet (the "Connection") with a  ${data.baseMbps}  Mbps base bandwidth. In consideration for the Connection, Client shall pay EW the sum of ${opts} depending on their choice of Internet bandwidth each month during the term hereof.`,
    { after: 4 },
  );
  center("(YOU ARE NOT THE OWNER OF THE ANTENNA)", bold, 11, true, 12);

  // ── Clauses 3–27 ──
  CLAUSES.forEach((text, i) => para(`${i + 3}.  ${text}`));

  center("(YOU ARE NOT THE OWNER OF THE ANTENNA)", bold, 11, true, 12);

  // ── Client details (clause 13's "address written below") ──
  const addr = `${data.address}${data.village ? ", " + data.village : ""}`;
  para(`Client Address: ${addr}    •    Phone: ${data.phone}    •    Plan: ${data.baseMbps} Mbps — GYD ${Math.round(data.monthlyGyd).toLocaleString("en-US")} / month`, { after: 12 });

  // ── Signature ──
  need(110);
  page.drawText("Subscriber Signature", { x: M, y: y - 10, size: 9, font });
  y -= 14;
  if (data.signatureDataUrl?.startsWith("data:image/png;base64,")) {
    try {
      const png = await doc.embedPng(Buffer.from(data.signatureDataUrl.split(",")[1], "base64"));
      const sh = 52, sw = (png.width / png.height) * sh;
      need(sh + 6);
      page.drawImage(png, { x: M, y: y - sh, width: sw, height: sh });
      y -= sh + 4;
    } catch { /* fall through to blank line */ }
  } else {
    y -= 36;
  }
  page.drawText("…………………………………………….", { x: M, y: y - 10, size: 9, font });
  y -= 30;

  // ── WiFi + footer ──
  if (data.wifiName) { need(20); page.drawText(`WIFI NAME:   ${data.wifiName}`, { x: M, y: y - 12, size: 12, font: bold }); y -= 20; }
  if (data.wifiPassword) { need(20); page.drawText(`WIFI PASSWORD:   ${data.wifiPassword}`, { x: M, y: y - 12, size: 12, font: bold }); y -= 20; }
  need(20);
  y -= 6;
  page.drawText("Technical Support: 609-2487, Whatsapp, Facebook (Evolve Wireless Internet)", { x: M, y: y - 10, size: 9, font });

  return doc.save();
}
