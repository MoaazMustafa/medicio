"use client";

import { Button, Card, Chip } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Check, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getExistingPushSubscription,
  getNotificationPermission,
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
} from "@/lib/push-client";

export const PUSH_DONT_ASK_KEY = "medicio_push_dont_ask";
export const PUSH_SESSION_DISMISSED_KEY = "medicio_push_prompt_dismissed";

export function PushPromptDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontAsk, setDontAsk] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkPromptEligibility = async () => {
      // 1. Check feature support
      if (!isPushSupported()) return;

      // 2. Check persistent "Don't ask me again" preference
      const isDontAskSaved = localStorage.getItem(PUSH_DONT_ASK_KEY) === "true";
      if (isDontAskSaved) return;

      // 3. Check current session dismissal
      const isSessionDismissed = sessionStorage.getItem(PUSH_SESSION_DISMISSED_KEY) === "true";
      if (isSessionDismissed) return;

      // 4. Ensure service worker is registered & check permission state
      await registerServiceWorker();
      const permission = getNotificationPermission();

      if (permission !== "default") return;

      // 5. Check if subscription already exists
      const existingSub = await getExistingPushSubscription();
      if (existingSub) return;

      // Eligible to prompt user after slight delay for visual stability
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);

      return () => clearTimeout(timer);
    };

    void checkPromptEligibility();
  }, [mounted]);

  const handleDismiss = (dontAskChecked: boolean) => {
    setIsOpen(false);
    sessionStorage.setItem(PUSH_SESSION_DISMISSED_KEY, "true");
    if (dontAskChecked) {
      localStorage.setItem(PUSH_DONT_ASK_KEY, "true");
      toast.info("Push notification prompt disabled", {
        description: "You can enable browser notifications anytime in Account Settings.",
      });
    }
  };

  const handleEnablePush = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await subscribeToPush();

      if (result.ok) {
        setIsOpen(false);
        if (dontAsk) {
          localStorage.setItem(PUSH_DONT_ASK_KEY, "true");
        }
        toast.success("Browser notifications enabled!", {
          description: "You will receive immediate alerts for appointments and health updates.",
        });
      } else if (result.reason === "denied") {
        setIsOpen(false);
        toast.error("Notifications blocked by browser", {
          description: "To receive push notifications, please allow permissions in browser settings.",
        });
      } else if (result.reason === "not-configured") {
        toast.error("Push service unavailable", {
          description: "VAPID key configuration missing on server.",
        });
      } else {
        toast.error("Could not activate browser push notifications");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 bg-surface border border-border-custom shadow-2xl rounded-2xl flex flex-col gap-5 relative overflow-hidden">
            {/* Background Glow Motif */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <BellRing className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text-primary">Enable Push Alerts</h3>
                    <Chip variant="soft" color="accent" className="text-[10px] font-mono font-bold uppercase">
                      Recommended
                    </Chip>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">Stay updated on clinical activity</p>
                </div>
              </div>

              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => handleDismiss(dontAsk)}
                className="text-text-secondary hover:text-text-primary"
                aria-label="Close dialogue"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content List */}
            <div className="space-y-2.5 p-3 rounded-xl bg-background-custom/50 border border-border-custom/80 text-xs">
              <div className="flex items-center gap-2 text-text-primary">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Instant doctor appointment status and confirmation updates</span>
              </div>
              <div className="flex items-center gap-2 text-text-primary">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Lab result ready notifications & clinical record releases</span>
              </div>
              <div className="flex items-center gap-2 text-text-primary">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Doctor verification status & hospital affiliation alerts</span>
              </div>
            </div>

            {/* "Don't ask me again" Checkbox Option */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none py-1 px-1"
              onClick={() => setDontAsk(!dontAsk)}
            >
              <div
                className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                  dontAsk
                    ? "bg-primary border-primary text-white"
                    : "border-border-custom bg-background-custom hover:border-text-secondary"
                }`}
              >
                {dontAsk && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs text-text-secondary font-medium hover:text-text-primary">
                Don't ask me again on login
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border-custom/60">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => handleDismiss(true)}
                className="text-[11px] font-medium text-text-secondary hover:text-danger px-2 text-left w-full sm:w-auto"
              >
                Never Ask Again
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => handleDismiss(dontAsk)}
                  className="text-xs font-semibold text-text-secondary hover:text-text-primary px-3"
                >
                  Maybe Later
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  isDisabled={isSubmitting}
                  onPress={() => void handleEnablePush()}
                  className="text-xs font-semibold px-4 shadow-sm"
                >
                  {isSubmitting ? "Enabling..." : "Enable Notifications"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
