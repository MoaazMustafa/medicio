"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Client state for the notification center: paginated fetching, unread badge
 * count, optimistic mutations, and three freshness channels —
 *   1. polling while the tab is visible,
 *   2. refetch on window focus / visibility change,
 *   3. instant refetch when the service worker relays a push message.
 */

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export type NotificationFilter = "all" | "unread";

interface ListResponse {
  notifications: NotificationRecord[];
  nextCursor: string | null;
  unreadCount: number;
}

export interface UseNotificationsOptions {
  /** Called for each brand-new unread notification detected on a refresh. */
  onIncoming?: (notification: NotificationRecord) => void;
  /** Poll interval while the tab is visible. Default 30s. */
  pollIntervalMs?: number;
  pageSize?: number;
}

async function fetchPage(
  filter: NotificationFilter,
  cursor: string | null,
  limit: number,
): Promise<ListResponse | null> {
  try {
    const params = new URLSearchParams({ filter, limit: String(limit) });
    if (cursor) params.set("cursor", cursor);

    const response = await fetch(`/api/notifications?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;

    return (await response.json()) as ListResponse;
  } catch {
    return null;
  }
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { onIncoming, pollIntervalMs = 30_000, pageSize = 20 } = options;

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilterState] = useState<NotificationFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Refs so timers and SW listeners always see the latest state without
  // re-subscribing on every render.
  const filterRef = useRef<NotificationFilter>(filter);
  const latestIdRef = useRef<string | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const fetchSeqRef = useRef(0);
  const onIncomingRef = useRef(onIncoming);

  onIncomingRef.current = onIncoming;
  filterRef.current = filter;

  const applyFirstPage = useCallback(
    (data: ListResponse, detectNew: boolean) => {
      const previousLatestId = latestIdRef.current;

      setNotifications(data.notifications);
      setNextCursor(data.nextCursor);
      setUnreadCount(data.unreadCount);

      knownIdsRef.current = new Set(data.notifications.map((item) => item.id));

      const newestId = data.notifications[0]?.id ?? null;

      if (detectNew && onIncomingRef.current) {
        for (const item of data.notifications) {
          if (item.id === previousLatestId) break;
          if (!item.isRead) onIncomingRef.current(item);
        }
      }

      if (newestId) latestIdRef.current = newestId;
    },
    [],
  );

  /** Reloads page one. Quiet refreshes skip the loading skeleton. */
  const refresh = useCallback(
    async (mode: "initial" | "quiet" = "quiet") => {
      const seq = ++fetchSeqRef.current;
      if (mode === "initial") setIsLoading(true);

      const data = await fetchPage(filterRef.current, null, pageSize);

      if (seq !== fetchSeqRef.current) return; // A newer request superseded this one.

      if (data) applyFirstPage(data, mode === "quiet");
      if (mode === "initial") setIsLoading(false);
    },
    [applyFirstPage, pageSize],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    const data = await fetchPage(filterRef.current, nextCursor, pageSize);

    if (data) {
      setNotifications((current) => {
        const merged = [...current];
        for (const item of data.notifications) {
          if (!knownIdsRef.current.has(item.id)) {
            knownIdsRef.current.add(item.id);
            merged.push(item);
          }
        }
        return merged;
      });
      setNextCursor(data.nextCursor);
      setUnreadCount(data.unreadCount);
    }
    setIsLoadingMore(false);
  }, [nextCursor, isLoadingMore, pageSize]);

  const setFilter = useCallback(
    (next: NotificationFilter) => {
      if (next === filterRef.current) return;
      filterRef.current = next;
      setFilterState(next);
      setNotifications([]);
      setNextCursor(null);
      void refresh("initial");
    },
    [refresh],
  );

  /* ---------------- Mutations (optimistic, server-confirmed) -------- */

  const setReadState = useCallback(async (id: string, isRead: boolean) => {
    let changed = false;

    setNotifications((current) =>
      current.map((item) => {
        if (item.id !== id || item.isRead === isRead) return item;
        changed = true;
        return { ...item, isRead, readAt: isRead ? new Date().toISOString() : null };
      }),
    );

    if (changed) setUnreadCount((count) => Math.max(0, count + (isRead ? -1 : 1)));

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      });
      if (response.ok) {
        const data = (await response.json()) as { unreadCount?: number };
        if (typeof data.unreadCount === "number") setUnreadCount(data.unreadCount);
      } else {
        void refresh("quiet");
      }
    } catch {
      void refresh("quiet");
    }
  }, [refresh]);

  const markRead = useCallback((id: string) => setReadState(id, true), [setReadState]);
  const markUnread = useCallback((id: string) => setReadState(id, false), [setReadState]);

  const markAllRead = useCallback(async () => {
    setNotifications((current) =>
      current.map((item) =>
        item.isRead ? item : { ...item, isRead: true, readAt: new Date().toISOString() },
      ),
    );
    setUnreadCount(0);

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
    } catch {
      void refresh("quiet");
    }
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    let removedUnread = false;

    setNotifications((current) => {
      const target = current.find((item) => item.id === id);
      removedUnread = Boolean(target && !target.isRead);
      return current.filter((item) => item.id !== id);
    });
    knownIdsRef.current.delete(id);
    if (removedUnread) setUnreadCount((count) => Math.max(0, count - 1));

    try {
      const response = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (response.ok) {
        const data = (await response.json()) as { unreadCount?: number };
        if (typeof data.unreadCount === "number") setUnreadCount(data.unreadCount);
      }
    } catch {
      void refresh("quiet");
    }
  }, [refresh]);

  const clearRead = useCallback(async () => {
    setNotifications((current) => current.filter((item) => !item.isRead));

    try {
      await fetch("/api/notifications", { method: "DELETE" });
    } finally {
      void refresh("quiet");
    }
  }, [refresh]);

  /* ---------------- Freshness channels ------------------------------ */

  // Initial load.
  useEffect(() => {
    void refresh("initial");
  }, [refresh]);

  // Poll while visible + refetch when the tab regains focus.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh("quiet");
    }, pollIntervalMs);

    const handleVisible = () => {
      if (document.visibilityState === "visible") void refresh("quiet");
    };

    window.addEventListener("focus", handleVisible);
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleVisible);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [refresh, pollIntervalMs]);

  // Instant refresh when the service worker receives a push for this user.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "medicio:notification") void refresh("quiet");
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    filter,
    isLoading,
    isLoadingMore,
    hasMore: Boolean(nextCursor),
    setFilter,
    refresh,
    loadMore,
    markRead,
    markUnread,
    markAllRead,
    remove,
    clearRead,
  };
}
