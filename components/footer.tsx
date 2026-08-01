import { Mail } from "lucide-react";
import NextLink from "next/link";

import { DiscordIcon, GithubIcon, Logo, TwitterIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "AI Symptom Checker", href: "/chatbot" },
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#workflow" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Medicio", href: "/#product" },
      { label: "Testimonials", href: "/#testimonials" },
      { label: "Create Account", href: "/register" },
      { label: "Sign In", href: "/login" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Doctor Portal", href: "/doctor/dashboard" },
      { label: "Hospital Portal", href: "/hospital/dashboard" },
      { label: "Lab Portal", href: "/lab/dashboard" },
      { label: "Pharmacy Portal", href: "/pharmacy/dashboard" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/#faq" },
      { label: "Terms of Service", href: "/#faq" },
      { label: "Medical Disclaimer", href: "/#faq" },
    ],
  },
] as const;

const SOCIALS = [
  { label: "Twitter", href: "#", icon: TwitterIcon },
  { label: "GitHub", href: "#", icon: GithubIcon },
  { label: "Discord", href: "#", icon: DiscordIcon },
] as const;

export function Footer() {
  return (
    <footer className="w-full border-t border-border-custom bg-surface/40 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-4">
            <NextLink className="flex w-fit items-center gap-2" href="/">
              <Logo className="text-primary" size={32} />
              <span className="text-lg font-bold tracking-tight text-text-primary">
                {siteConfig.name}
              </span>
            </NextLink>
            <p className="max-w-xs text-[13px] leading-relaxed text-text-secondary">
              {siteConfig.description}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-custom text-text-secondary transition-all duration-300 hover:border-primary/40 hover:text-primary"
                  href={social.href}
                >
                  <social.icon size={16} />
                </a>
              ))}
              <a
                aria-label="Email us"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border-custom text-text-secondary transition-all duration-300 hover:border-primary/40 hover:text-primary"
                href="mailto:hello@medicio.health"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                {column.heading}
              </span>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <NextLink
                      className="text-[13px] text-text-secondary transition-colors hover:text-primary"
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

        <hr className="my-10 border-t border-border-custom" />

        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} Medicio Healthcare Solutions. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </span>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary/70">
              AI guidance is advisory only
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
