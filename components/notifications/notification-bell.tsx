"use client";

import { Button, Chip, ScrollShadow, Separator, Switch } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellOff,
  BellRing,
  CheckCheck,
  Inbox,
  Loader2,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { NotificationItem } from "@/components/notifications/notification-item";
import { groupNotifications } from "@/components/notifications/notification-utils";
import type {
  NotificationFilter,
  NotificationRecord,
} from "@/components/notifications/use-notifications";
import { useNotifications } from "@/components/notifications/use-notifications";
import {
  getNotificationPermission,
  isPushSupported,
  registerServiceWorker,
  getExistingPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

type PushState = "loading" | "unsupported" | "denied" | "off" | "on";

/**
 * Notification center: bell trigger with a live unread badge + a right-side
 * drawer holding the expandable notification list, filters, bulk actions and
 * the browser-push opt-in. Mounted once in the authenticated app header.
 */
export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pushState, setPushState] = useState<PushState>("loading");
  const [isPushBusy, setIsPushBusy] = useState(false);
  const [isTestBusy, setIsTestBusy] = useState(false);
  const isOpenRef = useRef(isOpen);

  isOpenRef.current = isOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---------------- Incoming toast (panel closed) ------------------- */

  const handleIncoming = useCallback(
    (notification: NotificationRecord) => {
      if (isOpenRef.current) return;

      toast(notification.title, {
        description:
          notification.body.length > 120
            ? `${notification.body.slice(0, 117)}…`
            : notification.body,
        action: notification.href
          ? {
              label: "View",
              onClick: () => router.push(notification.href as string),
            }
          : undefined,
      });
    },
    [router],
  );

  const {
    notifications,
    unreadCount,
    filter,
    isLoading,
    isLoadingMore,
    hasMore,
    setFilter,
    refresh,
    loadMore,
    markRead,
    markUnread,
    markAllRead,
    remove,
    clearRead,
  } = useNotifications({ onIncoming: handleIncoming });

  /* ---------------- Service worker + push state --------------------- */

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!isPushSupported()) {
        setPushState("unsupported");
        return;
      }

      await registerServiceWorker();
      if (cancelled) return;

      const permission = getNotificationPermission();
      if (permission === "denied") {
        setPushState("denied");
        return;
      }

      const subscription = await getExistingPushSubscription();
      if (cancelled) return;

      setPushState(subscription && permission === "granted" ? "on" : "off");
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePushToggle = useCallback(async () => {
    if (isPushBusy) return;
    setIsPushBusy(true);

    try {
      if (pushState === "on") {
        await unsubscribeFromPush();
        setPushState("off");
        toast.success("Browser notifications turned off");
      } else {
        const result = await subscribeToPush();

        if (result.ok) {
          setPushState("on");
          toast.success("Browser notifications enabled", {
            description: "You'll now get notified even when Medicio is closed.",
          });
        } else if (result.reason === "denied") {
          setPushState(getNotificationPermission() === "denied" ? "denied" : "off");
          toast.error("Notifications are blocked", {
            description: "Allow notifications for this site in your browser settings.",
          });
        } else if (result.reason === "not-configured") {
          toast.error("Push is not configured", {
            description: "VAPID keys are missing on the server.",
          });
        } else {
          toast.error("Could not enable browser notifications");
        }
      }
    } finally {
      setIsPushBusy(false);
    }
  }, [isPushBusy, pushState]);

  const handleSendTest = useCallback(async () => {
    if (isTestBusy) return;
    setIsTestBusy(true);

    try {
      const response = await fetch("/api/notifications/test", { method: "POST" });
      if (response.ok) {
        toast.success("Test notification sent");
        void refresh("quiet");
      } else {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(data?.error || "Failed to send test notification");
      }
    } finally {
      setIsTestBusy(false);
    }
  }, [isTestBusy, refresh]);

  /* ---------------- Panel behaviour ---------------------------------- */

  // Fresh data every time the panel opens.
  useEffect(() => {
    if (isOpen) void refresh("quiet");
  }, [isOpen, refresh]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  }, []);

  const handleOpenNotification = useCallback(
    (notification: NotificationRecord) => {
      setIsOpen(false);
      if (notification.href) router.push(notification.href);
    },
    [router],
  );

  const grouped = groupNotifications(notifications);
  const hasRead = notifications.some((item) => item.isRead);
  const badgeText = unreadCount > 9 ? "9+" : String(unreadCount);

  const drawerPortal = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm sm:max-w-[360px] md:max-w-[380px] h-full bg-surface border-l border-border-custom p-6 shadow-2xl flex flex-col gap-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header matching System Audit Log inspector header */}
            <div className="flex items-center justify-between border-b border-border-custom pb-4 shrink-0">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-text-primary">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <Chip color="accent" variant="soft" className="text-[10px] font-mono font-bold uppercase">
                      {unreadCount} new
                    </Chip>
                  )}
                </div>
                <span className="text-xs font-mono text-text-secondary">
                  Realtime Patient & System Alerts
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  isDisabled={unreadCount === 0}
                  onPress={() => void markAllRead()}
                  className="text-text-secondary hover:text-text-primary disabled:opacity-40"
                  aria-label="Mark all read"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>

                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  isDisabled={!hasRead}
                  onPress={() => void clearRead()}
                  className="text-text-secondary hover:text-danger disabled:opacity-40"
                  aria-label="Clear read"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => setIsOpen(false)}
                  className="text-text-secondary hover:text-text-primary"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Subtab Filter Switcher Bar */}
            <div className="p-1 rounded-xl bg-background-custom/60 border border-border-custom/80 flex items-center gap-1 shrink-0">
              {(["all", "unread"] as NotificationFilter[]).map((value) => {
                const isActive = filter === value;

                return (
                  <Button
                    key={value}
                    size="sm"
                    variant={isActive ? "primary" : "ghost"}
                    className={`flex-1 h-7 text-xs font-semibold capitalize rounded-lg transition-all ${
                      isActive
                        ? "bg-primary text-white font-bold shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    onPress={() => setFilter(value)}
                  >
                    {value === "all"
                      ? "All"
                      : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
                  </Button>
                );
              })}
            </div>

            {/* Notification Items List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {isLoading ? (
                <div className="space-y-3 pt-1">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="flex animate-pulse items-start gap-3 px-2 py-2">
                      <div className="h-9 w-9 shrink-0 rounded-lg bg-border-custom/60" />
                      <div className="flex-1 space-y-2 pt-0.5">
                        <div className="h-3 w-3/4 rounded bg-border-custom/60" />
                        <div className="h-2.5 w-full rounded bg-border-custom/40" />
                        <div className="h-2.5 w-1/2 rounded bg-border-custom/40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 px-4 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {filter === "unread" ? (
                      <CheckCheck className="h-5 w-5" />
                    ) : (
                      <Inbox className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {filter === "unread" ? "No unread notifications" : "You're all caught up"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                      {filter === "unread"
                        ? "Everything has been read. Switch to All to browse history."
                        : "Appointment updates, verification decisions and alerts will appear here."}
                    </p>
                  </div>
                  {filter === "unread" && (
                    <Button
                      className="h-7 rounded-lg px-3 text-xs"
                      size="sm"
                      variant="primary"
                      onPress={() => setFilter("all")}
                    >
                      View all notifications
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {grouped.map((group) => (
                    <div key={group.label}>
                      <p className="px-1 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                        {group.label}
                      </p>
                      <div className="space-y-1">
                        <AnimatePresence initial={false}>
                          {group.items.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              isExpanded={expandedId === notification.id}
                              notification={notification}
                              onMarkRead={markRead}
                              onMarkUnread={markUnread}
                              onOpen={handleOpenNotification}
                              onRemove={remove}
                              onToggleExpand={handleToggleExpand}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}

                  {hasMore && (
                    <Button
                      className="h-8 w-full rounded-lg text-xs text-text-secondary"
                      isDisabled={isLoadingMore}
                      size="sm"
                      variant="ghost"
                      onPress={() => void loadMore()}
                    >
                      {isLoadingMore ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Load older notifications"
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Footer Banner matching Metadata Summary Banner in admin logs */}
            <div className="p-4 rounded-xl bg-background-custom/40 border border-border-custom/80 flex flex-col gap-3 text-xs shrink-0">
              <div
                className={`flex items-center justify-between gap-3 ${
                  pushState === "denied" || isPushBusy
                    ? ""
                    : "cursor-pointer"
                }`}
                onClick={
                  pushState !== "denied" && !isPushBusy
                    ? () => void handlePushToggle()
                    : undefined
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      pushState === "on"
                        ? "bg-primary/15 text-primary"
                        : "bg-border-custom/50 text-text-secondary"
                    }`}
                  >
                    {pushState === "denied" ? (
                      <BellOff className="h-4 w-4" />
                    ) : (
                      <BellRing className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-text-primary block">
                      Browser Notifications
                    </span>
                    <span className="text-[11px] text-text-secondary font-mono truncate block">
                      {pushState === "denied"
                        ? "Blocked in browser settings"
                        : pushState === "on"
                          ? "Active (background push)"
                          : "Get notified when closed"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPushBusy && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  )}
                  <button
                    type="button"
                    role="switch"
                    aria-label="Toggle browser notifications"
                    aria-checked={pushState === "on"}
                    disabled={pushState === "denied" || isPushBusy}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      pushState === "on" ? "bg-primary" : "bg-border-custom"
                    } ${pushState === "denied" || isPushBusy ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handlePushToggle();
                    }}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        pushState === "on" ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setIsOpen(false);
                    router.push("/settings?tab=notifications");
                  }}
                  className="h-7 flex-1 text-[11px] font-semibold text-text-secondary hover:text-text-primary flex items-center justify-center gap-1.5 border border-border-custom/80"
                >
                  <Settings className="h-3 w-3 text-primary" />
                  Manage Settings
                </Button>

                {process.env.NODE_ENV === "development" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={isTestBusy}
                    onPress={() => void handleSendTest()}
                    className="h-7 text-[11px] text-text-secondary font-mono flex items-center justify-center gap-1.5 border border-border-custom/60 px-2.5"
                  >
                    <Sparkles className="h-3 w-3 text-primary" />
                    Test
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Button
        isIconOnly
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className="relative overflow-visible text-text-secondary hover:text-text-primary"
        variant="ghost"
        onPress={() => setIsOpen(true)}
      >
        <Bell className="h-5 w-5" />

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key={badgeText}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-background-custom"
              exit={{ scale: 0.4, opacity: 0 }}
              initial={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
            >
              {badgeText}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {mounted && createPortal(drawerPortal, document.body)}
    </>
  );
}
