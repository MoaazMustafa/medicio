"use client";

import { Button, Drawer } from "@heroui/react";
import { Menu as MenuIcon, X } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/icons";
import { ThemeSwitch } from "@/components/theme-switch";
import { dashboardForRole } from "@/config/roles";
import { siteConfig } from "@/config/site";

export const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.reload();
    } catch (err) {
      console.error("Logout error: ", err);
    }
  };

  const handleNavigate = (href: string) => {
    setIsDrawerOpen(false);
    router.push(href);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border-custom bg-background-custom/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
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
        <div className="flex items-center gap-3">
          <ThemeSwitch />

          {user ? (
            <NextLink href={dashboardForRole(user.role)}>
              <Button variant="primary" className="text-xs font-semibold px-3 py-1.5 h-auto">
                Dashboard
              </Button>
            </NextLink>
          ) : (
            <NextLink href="/login">
              <Button
                variant="outline"
                className="text-xs sm:text-sm font-semibold text-text-primary hover:text-primary px-3 py-1.5 h-auto"
              >
                Login
              </Button>
            </NextLink>
          )}

          {/* Mobile Drawer Navigation (HeroUI Drawer) */}
          <div className="md:hidden">
            <Drawer.Root isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <Drawer.Trigger>
                <Button isIconOnly variant="ghost" aria-label="Toggle Navigation Menu">
                  <MenuIcon className="h-5 w-5 text-text-primary" />
                </Button>
              </Drawer.Trigger>

              <Drawer.Backdrop isDismissable>
                <Drawer.Content placement="right" className="w-[280px] sm:w-[320px] max-w-[85vw] h-full bg-surface border-l border-border-custom">
                  <Drawer.Dialog className="flex flex-col h-full outline-none">
                    <Drawer.Header className="flex items-center justify-between p-4 border-b border-border-custom">
                      <NextLink
                        className="flex items-center gap-2"
                        href="/"
                        onClick={() => setIsDrawerOpen(false)}
                      >
                        <Logo />
                        <span className="font-bold text-lg tracking-tight text-primary">Medicio</span>
                      </NextLink>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label="Close navigation"
                        onPress={() => setIsDrawerOpen(false)}
                        className="p-1 rounded-lg text-text-secondary hover:text-text-primary focus:outline-none"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </Drawer.Header>

                    <Drawer.Body className="flex-1 overflow-y-auto p-4 space-y-2">
                      {siteConfig.navMenuItems.map((item, index) => (
                        <Button
                          key={`${item.label}-${index}`}
                          variant="ghost"
                          onPress={() => handleNavigate(item.href)}
                          className="w-full flex items-center justify-start py-2.5 px-3 rounded-lg text-sm text-text-primary hover:bg-surface/50 hover:text-primary transition-colors font-medium h-auto"
                        >
                          {item.label}
                        </Button>
                      ))}
                    </Drawer.Body>

                    {user && (
                      <div className="p-4 border-t border-border-custom flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="font-semibold text-text-primary truncate">{user.name}</span>
                          <span className="font-mono text-text-secondary uppercase text-[10px]">{user.role}</span>
                        </div>
                        <Button
                          variant="outline"
                          onPress={() => {
                            setIsDrawerOpen(false);
                            handleLogout();
                          }}
                          className="w-full mt-1 font-semibold text-danger text-xs py-2 border border-danger/30 rounded-lg hover:bg-danger/10 text-center"
                        >
                          Logout
                        </Button>
                      </div>
                    )}
                  </Drawer.Dialog>
                </Drawer.Content>
              </Drawer.Backdrop>
            </Drawer.Root>
          </div>
        </div>
      </div>
    </nav>
  );
};
