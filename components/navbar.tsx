"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu as MenuIcon, X } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/icons";
import { ThemeSwitch } from "@/components/theme-switch";
import { dashboardForRole } from "@/config/roles";
import { siteConfig } from "@/config/site";

export const Navbar = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error("Error fetching session: ", err));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const ctaHref = user ? dashboardForRole(user.role) : "/login";
  const ctaLabel = user ? "Dashboard" : "Sign in";

  return (
    <header className="fixed top-0 z-50 w-full px-3 pt-3 sm:px-4">
      <div
        className={`glass mx-auto max-w-5xl rounded-2xl transition-shadow duration-300 ${
          scrolled ? "shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]" : "shadow-none"
        }`}
      >
        <nav aria-label="Main" className="flex h-14 items-center gap-4 px-4 sm:px-5">
          {/* Brand */}
          <NextLink className="flex items-center gap-2" href="/">
            <Logo className="text-primary" size={30} />
            <span className="text-lg font-bold tracking-tight text-text-primary">
              Medicio
            </span>
          </NextLink>

          {/* Desktop links */}
          <div className="mx-auto hidden items-center gap-1 md:flex">
            {siteConfig.navItems.map((item) => (
              <NextLink
                key={item.href}
                className="rounded-full px-3.5 py-2 text-[13px] font-medium text-text-secondary transition-colors duration-200 hover:bg-primary/10 hover:text-text-primary"
                href={item.href}
              >
                {item.label}
              </NextLink>
            ))}
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <ThemeSwitch />
            <NextLink
              className="group hidden h-9 items-center gap-1.5 rounded-full bg-primary px-4.5 text-[13px] font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-[0.97] sm:inline-flex dark:text-slate-950"
              href={ctaHref}
            >
              {ctaLabel}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </NextLink>

            {/* Mobile menu toggle */}
            <button
              aria-controls="mobile-menu"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-primary/10 md:hidden"
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden md:hidden"
              exit={{ height: 0, opacity: 0 }}
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-col gap-1 border-t border-border-custom px-4 pb-4 pt-3">
                {siteConfig.navMenuItems.map((item) => (
                  <NextLink
                    key={item.href}
                    className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-primary/10 hover:text-text-primary"
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </NextLink>
                ))}
                <NextLink
                  className="mt-2 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-white dark:text-slate-950"
                  href={ctaHref}
                  onClick={() => setMenuOpen(false)}
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </NextLink>
                {user ? (
                  <p className="mt-2 px-1 text-center text-[11px] text-text-secondary">
                    Signed in as <span className="font-semibold">{user.name}</span>
                  </p>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
};
