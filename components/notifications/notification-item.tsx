"use client";

import { Button } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown, Trash2 } from "lucide-react";

import {
  fullTimestamp,
  metaForType,
  timeAgo,
} from "@/components/notifications/notification-utils";
import type { NotificationRecord } from "@/components/notifications/use-notifications";

export interface NotificationItemProps {
  notification: NotificationRecord;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onRemove: (id: string) => void;
  /** Navigate to the notification's target (marks read + closes the panel). */
  onOpen: (notification: NotificationRecord) => void;
}

/**
 * One expandable row in the notification center. The whole row toggles
 * expansion (and marks unread items as read); explicit actions live in the
 * expanded footer so a stray click never navigates away.
 */
export function NotificationItem({
  notification,
  isExpanded,
  onToggleExpand,
  onMarkRead,
  onMarkUnread,
  onRemove,
  onOpen,
}: NotificationItemProps) {
  const meta = metaForType(notification.type);
  const Icon = meta.icon;

  const handleRowActivate = () => {
    if (!notification.isRead) onMarkRead(notification.id);
    onToggleExpand(notification.id);
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group relative"
    >
      <div
        aria-expanded={isExpanded}
        aria-label={`${notification.isRead ? "" : "Unread notification: "}${notification.title}`}
        className={`w-full text-left rounded-xl border transition-colors cursor-pointer px-3 py-2.5 ${
          notification.isRead
            ? "border-transparent hover:bg-border-custom/30"
            : "bg-primary/5 border-primary/15 hover:bg-primary/10"
        }`}
        role="button"
        tabIndex={0}
        onClick={handleRowActivate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleRowActivate();
          }
        }}
      >
        <div className="flex items-start gap-3">
          {/* Type icon tile */}
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.iconClasses}`}
          >
            <Icon className="h-4.5 w-4.5" />
          </span>

          {/* Copy */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`text-sm leading-5 text-text-primary ${
                  notification.isRead ? "font-medium" : "font-semibold"
                } ${isExpanded ? "" : "line-clamp-1"}`}
              >
                {notification.title}
              </p>

              <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wide text-text-secondary">
                  {timeAgo(notification.createdAt)}
                </span>

                {/* Read-state dot / toggle */}
                <Button
                  isIconOnly
                  aria-label={notification.isRead ? "Mark as unread" : "Mark as read"}
                  className="flex h-4 w-4 shrink-0 min-w-0 p-0 items-center justify-center rounded-full outline-none"
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    if (notification.isRead) onMarkUnread(notification.id);
                    else onMarkRead(notification.id);
                  }}
                >
                  <span
                    className={`block rounded-full transition-all ${
                      notification.isRead
                        ? "h-1.5 w-1.5 bg-border-custom group-hover:bg-text-secondary/40"
                        : "h-2 w-2 bg-primary shadow-[0_0_6px] shadow-primary/60"
                    }`}
                  />
                </Button>
              </span>
            </div>

            <p
              className={`mt-0.5 text-xs leading-relaxed text-text-secondary ${
                isExpanded ? "" : "line-clamp-2"
              }`}
            >
              {notification.body}
            </p>

            {/* Expanded detail + actions */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="details"
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border-custom/60 pt-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">
                      {meta.label} · {fullTimestamp(notification.createdAt)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {notification.href && (
                      <Button
                        className="h-7 rounded-lg px-2.5 text-xs font-semibold"
                        size="sm"
                        variant="primary"
                        onPress={() => onOpen(notification)}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        View
                      </Button>
                    )}

                    <Button
                      className="h-7 rounded-lg px-2.5 text-xs text-text-secondary"
                      size="sm"
                      variant="ghost"
                      onPress={() => {
                        if (notification.isRead) onMarkUnread(notification.id);
                        else onMarkRead(notification.id);
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {notification.isRead ? "Mark unread" : "Mark read"}
                    </Button>

                    <Button
                      className="h-7 rounded-lg px-2.5 text-xs text-danger"
                      size="sm"
                      variant="ghost"
                      onPress={() => onRemove(notification.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expand chevron */}
          <ChevronDown
            className={`mt-1 h-4 w-4 shrink-0 text-text-secondary/70 transition-transform duration-200 ${
              isExpanded ? "rotate-180 text-primary" : ""
            }`}
          />
        </div>
      </div>

      {/* Hover-reveal quick delete (collapsed rows, pointer devices) */}
      {!isExpanded && (
        <Button
          isIconOnly
          aria-label="Remove notification"
          className="absolute -right-1 -top-1 hidden h-5 w-5 min-w-0 p-0 items-center justify-center rounded-full border border-border-custom bg-surface text-text-secondary opacity-0 shadow-sm transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100 md:flex"
          size="sm"
          variant="ghost"
          onPress={() => onRemove(notification.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </motion.div>
  );
}
