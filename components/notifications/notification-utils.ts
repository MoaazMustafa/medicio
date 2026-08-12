import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  Building2,
  CalendarCheck,
  FlaskConical,
  Pill,
  ShieldCheck,
  UserRound,
} from "lucide-react";

/**
 * Presentation metadata for each notification type plus the small date
 * helpers shared by the bell panel and its items. Pure client utilities —
 * no data fetching here.
 */

export interface NotificationTypeMeta {
  icon: LucideIcon;
  label: string;
  /** Tinted icon tile classes (work in both themes). */
  iconClasses: string;
}

const TYPE_META: Record<string, NotificationTypeMeta> = {
  APPOINTMENT: {
    icon: CalendarCheck,
    label: "Appointment",
    iconClasses: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
  },
  VERIFICATION: {
    icon: ShieldCheck,
    label: "Verification",
    iconClasses: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  },
  AFFILIATION: {
    icon: Building2,
    label: "Affiliation",
    iconClasses: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
  },
  ACCOUNT: {
    icon: UserRound,
    label: "Account",
    iconClasses: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
  },
  MEDICINE: {
    icon: Pill,
    label: "Medicine",
    iconClasses: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  },
  LAB: {
    icon: FlaskConical,
    label: "Lab",
    iconClasses: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",
  },
  SYSTEM: {
    icon: BellRing,
    label: "System",
    iconClasses: "text-primary bg-primary/10",
  },
};

export function metaForType(type: string): NotificationTypeMeta {
  return TYPE_META[type] ?? TYPE_META.SYSTEM;
}

/** Compact relative time: "now", "5m", "3h", "2d", then a short date. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Full localized timestamp for the expanded view. */
export function fullTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type NotificationGroup = "Today" | "Yesterday" | "This week" | "Earlier";

const GROUP_ORDER: NotificationGroup[] = [
  "Today",
  "Yesterday",
  "This week",
  "Earlier",
];

export function groupForDate(iso: string): NotificationGroup {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Earlier";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOfWeekWindow = new Date(startOfToday);
  startOfWeekWindow.setDate(startOfWeekWindow.getDate() - 6);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeekWindow) return "This week";
  return "Earlier";
}

/** Groups items (already sorted newest-first) preserving group order. */
export function groupNotifications<T extends { createdAt: string }>(
  items: T[],
): Array<{ label: NotificationGroup; items: T[] }> {
  const buckets = new Map<NotificationGroup, T[]>();

  for (const item of items) {
    const label = groupForDate(item.createdAt);
    const bucket = buckets.get(label);
    if (bucket) bucket.push(item);
    else buckets.set(label, [item]);
  }

  return GROUP_ORDER.filter((label) => buckets.has(label)).map((label) => ({
    label,
    items: buckets.get(label) as T[],
  }));
}
