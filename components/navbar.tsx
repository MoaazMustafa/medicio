"use client";

import { Button } from "@heroui/react";
import NextLink from "next/link";
import { useState } from "react";
import { Logo } from "@/components/icons";
import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border-custom bg-background-custom/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <NextLink className="flex items-center gap-2" href="/">
            <Logo />
            <span className="font-bold text-xl tracking-tight text-primary">Medicio</span>
          </NextLink>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex gap-4">
            {siteConfig.navItems.map((item) => (
              <NextLink
                key={item.href}
                className="text-text-secondary hover:text-primary transition-colors text-sm font-medium"
                href={item.href}
              >
                {item.label}
              </NextLink>
            ))}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <ThemeSwitch />
          
          <NextLink href="#">
            <Button
              variant="outline"
              className="hidden sm:inline-flex text-sm font-semibold text-text-primary hover:text-primary"
            >
              Portal Login
            </Button>
          </NextLink>

          {/* Mobile menu toggle */}
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Toggle Menu"
            className="md:hidden"
            onPress={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-5 w-5 text-text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              ) : (
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              )}
            </svg>
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="border-t border-border-custom bg-background-custom/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-2 p-4">
            {siteConfig.navMenuItems.map((item, index) => (
              <NextLink
                key={`${item.label}-${index}`}
                className="w-full py-2 text-base text-text-primary block hover:text-primary"
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </NextLink>
            ))}
            <NextLink href="#">
              <Button
                variant="primary"
                className="w-full mt-2 font-semibold"
              >
                Portal Login
              </Button>
            </NextLink>
          </div>
        </div>
      )}
    </nav>
  );
};
