import NextLink from "next/link";

import { Logo } from "@/components/icons";
import { siteConfig } from "@/config/site";

const FOOTER_COLUMNS = [
  {
    heading: "Platform",
    links: [
      { label: "Home", href: "/" },
      { label: "AI Symptom Checker", href: "/chatbot" },
      { label: "Create Account", href: "/register" },
      { label: "Sign In", href: "/login" },
    ],
  },
  {
    heading: "For Providers",
    links: [
      { label: "Doctor Portal", href: "/doctor/dashboard" },
      { label: "Hospital Portal", href: "/hospital/dashboard" },
      { label: "Lab Portal", href: "/lab/dashboard" },
      { label: "Pharmacy Portal", href: "/pharmacy/dashboard" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="w-full border-t border-border-custom bg-surface/40 backdrop-blur-lg mt-16">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <NextLink className="flex items-center gap-2 w-fit" href="/">
              <Logo />
              <span className="font-bold text-lg tracking-tight text-primary">
                {siteConfig.name}
              </span>
            </NextLink>
            <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
              {siteConfig.description}
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3">
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-text-secondary">
                {column.heading}
              </span>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <NextLink
                      className="text-xs text-text-secondary hover:text-primary transition-colors"
                      href={link.href}
                    >
                      {link.label}
                    </NextLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="border-t border-border-custom my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[11px] text-text-secondary">
            © {new Date().getFullYear()} Medicio Healthcare Solutions. All rights
            reserved.
          </p>
          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">
            AI guidance is advisory only — not a substitute for professional
            medical diagnosis.
          </p>
        </div>
      </div>
    </footer>
  );
}
