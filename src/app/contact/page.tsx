import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import LeadForm from "@/components/LeadForm";

export default function ContactPage() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5926092487";

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 76 }}>
        <section className="section" style={{ background: "var(--navy)" }}>
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="section-label justify-center">Contact Us</div>
              <h1
                className="font-['Syne'] font-extrabold mt-4"
                style={{ fontSize: "var(--fs-display)", lineHeight: 1.1 }}
              >
                Let&apos;s Get You <span style={{ color: "var(--cyan)" }}>Connected</span>
              </h1>
              <p className="section-sub mx-auto text-center mt-4">
                Whether you&apos;re ready to sign up or just have questions —
                we&apos;re here to help.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="flex flex-col gap-6">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-5 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1"
                  style={{ background: "var(--card)", border: "1px solid var(--divider)" }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                    style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)" }}
                  >
                    💬
                  </div>
                  <div>
                    <h3 className="font-['Syne'] font-bold text-base mb-0.5">WhatsApp (Preferred)</h3>
                    <p className="text-sm text-[var(--cyan)]">+592 609-2487</p>
                    <p className="text-xs text-[var(--text3)] mt-1">Fastest way to reach us — usually under 1 hour</p>
                  </div>
                </a>

                {/* Phone */}
                <div
                  className="flex items-center gap-5 rounded-2xl p-7"
                  style={{ background: "var(--card)", border: "1px solid var(--divider)" }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                    style={{ background: "rgba(0,87,255,0.1)", border: "1px solid rgba(0,87,255,0.25)" }}
                  >
                    📞
                  </div>
                  <div>
                    <h3 className="font-['Syne'] font-bold text-base mb-0.5">Phone</h3>
                    <p className="text-sm text-[var(--cyan)]">+592 609-2487</p>
                    <p className="text-xs text-[var(--text3)] mt-1">Mon–Sat, 8:00 AM – 6:00 PM</p>
                  </div>
                </div>

                {/* Email */}
                <a
                  href="mailto:info@evolvewireless.gy"
                  className="flex items-center gap-5 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1"
                  style={{ background: "var(--card)", border: "1px solid var(--divider)" }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                    style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}
                  >
                    ✉️
                  </div>
                  <div>
                    <h3 className="font-['Syne'] font-bold text-base mb-0.5">Email</h3>
                    <p className="text-sm text-[var(--cyan)]">info@evolvewireless.gy</p>
                    <p className="text-xs text-[var(--text3)] mt-1">We respond within 24 hours</p>
                  </div>
                </a>

                {/* Location */}
                <div
                  className="flex items-center gap-5 rounded-2xl p-7"
                  style={{ background: "var(--card)", border: "1px solid var(--divider)" }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                    style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)" }}
                  >
                    📍
                  </div>
                  <div>
                    <h3 className="font-['Syne'] font-bold text-base mb-0.5">Service Area</h3>
                    <p className="text-sm text-[var(--text2)]">East Coast Demerara, Region 1 &amp; Port Kaituma</p>
                    <p className="text-xs text-[var(--text3)] mt-1">Georgetown &amp; surrounding communities</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div
                className="rounded-2xl p-9"
                style={{ background: "var(--card)", border: "1px solid var(--divider)" }}
              >
                <h3 className="font-['Syne'] text-xl font-bold mb-2">Send Us a Message</h3>
                <p className="text-sm text-[var(--text2)] mb-6">
                  Fill out the form and our team will get back to you — typically
                  within 1–2 business hours.
                </p>
                <LeadForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
