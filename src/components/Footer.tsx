import Link from "next/link";
import { Logo } from "./Logo";
import { waLink } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About Us" },
  { href: "/#services", label: "Our Services" },
  { href: "/coverage", label: "Coverage Areas" },
  { href: "/plans", label: "Internet Packages" },
  { href: "/contact", label: "Contact Us" },
];

const SERVICES = [
  "Home Internet",
  "Business Internet",
  "Remote Installations",
  "Tower Projects",
  "Managed WiFi",
  "Starlink Support",
];

const SUPPORT = [
  { href: "/contact", label: "Report an Outage" },
  { href: "/contact", label: "Billing Help" },
  { href: "/contact", label: "Request Installation" },
  { href: "/plans", label: "View Packages" },
  { href: "/contact", label: "Business Inquiries" },
];

export default function Footer() {
  return (
    <footer className="bg-card2 border-t border-divider pt-16 pb-8">
      <div className="container-ew">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-divider">
          {/* Brand */}
          <div>
            <Link href="/">
              <Logo className="h-[42px] w-auto" />
            </Link>
            <p className="text-[0.88rem] text-text2 leading-[1.75] mt-4 max-w-[280px]">
              Connecting Guyana&apos;s homes and businesses with fast, reliable
              wireless internet. East Coast Demerara, Region 1, Port Kaituma,
              and growing.
            </p>
            <div className="flex gap-2.5 mt-5">
              <SocialBtn href="#" label="Facebook">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </SocialBtn>
              <SocialBtn href="#" label="Instagram">
                <rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" strokeWidth="2" />
              </SocialBtn>
              <SocialBtn href={waLink()} label="WhatsApp">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a3.04 3.04 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
              </SocialBtn>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-[0.8rem] font-bold uppercase tracking-[0.12em] text-text2 mb-5">
              Quick Links
            </h5>
            <ul className="flex flex-col gap-3 list-none">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[0.88rem] text-text3 hover:text-text transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h5 className="text-[0.8rem] font-bold uppercase tracking-[0.12em] text-text2 mb-5">
              Services
            </h5>
            <ul className="flex flex-col gap-3 list-none">
              {SERVICES.map((s) => (
                <li key={s}>
                  <Link href="/#services" className="text-[0.88rem] text-text3 hover:text-text transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h5 className="text-[0.8rem] font-bold uppercase tracking-[0.12em] text-text2 mb-5">
              Support
            </h5>
            <ul className="flex flex-col gap-3 list-none">
              {SUPPORT.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className="text-[0.88rem] text-text3 hover:text-text transition-colors">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-6 flex-wrap gap-3">
          <p className="text-[0.82rem] text-text3">
            &copy; {new Date().getFullYear()} Evolve Wireless Internet. All
            rights reserved.
          </p>
          <div className="flex gap-5">
            <Link href="#" className="text-text3 hover:text-cyan text-[0.82rem] transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-text3 hover:text-cyan text-[0.82rem] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialBtn({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-[9px] bg-card border border-divider flex items-center justify-center hover:border-cyan hover:bg-cyan/8 transition-all"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-text2 hover:text-cyan" fill="currentColor">
        {children}
      </svg>
    </a>
  );
}
