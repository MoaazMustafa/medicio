"use client";

import { Button, Card, Chip } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Mail,
  Megaphone,
  ScrollText,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { TableToolbar, TableFooter } from "@/components/ui/table-toolbar";

export interface BroadcastLogRecord {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: any;
  createdAt: string;
  senderName?: string;
  senderEmail?: string;
  senderRole?: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientRole?: string | null;
}

export function BroadcastHistoryTable({ logs }: { logs: BroadcastLogRecord[] }) {
  const [selectedLog, setSelectedLog] = useState<BroadcastLogRecord | null>(null);
  const [filterAction, setFilterAction] = useState<"ALL" | "BROADCAST" | "EMAIL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);

  const filteredLogs = logs.filter((log) => {
    if (filterAction === "BROADCAST" && log.action !== "ADMIN_NOTIFICATION_BROADCAST") return false;
    if (filterAction === "EMAIL" && log.action !== "EMAIL_NOTIFICATION_DISPATCH") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const meta = log.metadata || {};
      const title = (meta.title || meta.subject || "").toLowerCase();
      const body = (meta.body || "").toLowerCase();
      const sender = `${log.senderName || ""} ${log.senderEmail || ""}`.toLowerCase();
      const recipient = `${log.recipientName || ""} ${log.recipientEmail || ""} ${meta.recipientEmail || ""}`.toLowerCase();

      return title.includes(q) || body.includes(q) || sender.includes(q) || recipient.includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Table Controls & Filter Bar */}
      {/* Top Control Toolbar (Filters & Search) */}
      <TableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search sender, recipient, or subject..."
        hasActiveFilters={Boolean(searchQuery || filterAction !== "ALL")}
        onClearFilters={() => {
          setSearchQuery("");
          setFilterAction("ALL");
        }}
      >
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background-custom/60 border border-border-custom/80">
          {[
            { id: "ALL", label: `All (${logs.length})` },
            { id: "BROADCAST", label: "Broadcast Alerts" },
            { id: "EMAIL", label: "Email Dispatches" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterAction(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterAction === tab.id
                  ? "bg-primary text-white font-bold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </TableToolbar>

      {/* History Table Card */}
      <Card className="p-0 border border-border-custom bg-surface/50 backdrop-blur-md overflow-hidden shadow-lg rounded-2xl">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center gap-2">
            <ScrollText className="w-10 h-10 text-text-secondary/40" />
            <p className="text-sm font-semibold text-text-primary">No Broadcast Activity Logs Found</p>
            <p className="text-xs text-text-secondary">Dispatched broadcasts and email alerts will log here with full sender and recipient details.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-custom bg-background-custom/80 font-mono text-text-secondary uppercase text-[10px] tracking-wider">
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Who Sent (Sender)</th>
                  <th className="p-4">Who Received (Recipient/Target)</th>
                  <th className="p-4">Title / Subject</th>
                  <th className="p-4">Channels</th>
                  <th className="p-4">Dispatched At</th>
                  <th className="p-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50">
                {filteredLogs.slice(0, pageSize).map((log) => {
                  const meta = log.metadata || {};
                  const isBroadcast = log.action === "ADMIN_NOTIFICATION_BROADCAST";
                  const channels = meta.channels || {};

                  // Sender info
                  const senderName = log.senderName || meta.senderName || "System Admin";
                  const senderEmail = log.senderEmail || meta.senderEmail || "admin@medicio.app";
                  const senderRole = log.senderRole || meta.senderRole || log.actorRole || "ADMIN";

                  // Recipient info
                  const recipientName = log.recipientName || meta.recipientName || null;
                  const recipientEmail = log.recipientEmail || meta.recipientEmail || null;
                  const recipientRole = log.recipientRole || meta.recipientRole || null;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-primary/5 transition-colors cursor-pointer group"
                    >
                      {/* Event Type */}
                      <td className="p-4 font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isBroadcast ? "bg-primary/15 text-primary" : "bg-indigo-500/15 text-indigo-400"
                          }`}>
                            {isBroadcast ? <Megaphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">{isBroadcast ? "Broadcast Alert" : "Email Dispatch"}</span>
                            <span className="text-[10px] font-mono text-text-secondary">Audit Event</span>
                          </div>
                        </div>
                      </td>

                      {/* Who Sent */}
                      <td className="p-4">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-text-primary truncate">{senderName}</span>
                            <Chip variant="soft" color="accent" className="text-[8px] font-mono shrink-0 px-1 py-0 h-4">
                              {senderRole}
                            </Chip>
                          </div>
                          <span className="text-[10px] font-mono text-text-secondary truncate">{senderEmail}</span>
                        </div>
                      </td>

                      {/* Who Received */}
                      <td className="p-4">
                        {(meta.targetType === "USER" || !isBroadcast) && (recipientEmail || recipientName) ? (
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-text-primary truncate">{recipientName || recipientEmail}</span>
                              {recipientRole && (
                                <Chip variant="soft" color="default" className="text-[8px] font-mono shrink-0 px-1 py-0 h-4">
                                  {recipientRole}
                                </Chip>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-text-secondary truncate">{recipientEmail}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Chip variant="soft" color="default" className="text-[10px] font-mono">
                              {meta.targetType === "ROLE"
                                ? `Role: ${meta.targetValue}`
                                : meta.targetType === "USER"
                                  ? `${Array.isArray(meta.targetValue) ? meta.targetValue.length : 1} Specific User(s)`
                                  : "All Platform Users"}
                            </Chip>
                            {meta.recipientsCount && (
                              <span className="text-[10px] font-mono text-text-secondary">({meta.recipientsCount} Reached)</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Title / Subject */}
                      <td className="p-4 max-w-xs truncate font-medium text-text-primary">
                        <span className="block truncate font-semibold text-xs">{meta.title || meta.subject || "N/A"}</span>
                        {meta.body && (
                          <span className="text-[10px] text-text-secondary truncate block">{meta.body.slice(0, 50)}...</span>
                        )}
                      </td>

                      {/* Channels */}
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {(channels.inApp ?? true) && (
                            <Chip variant="soft" color="accent" className="text-[8px] font-mono px-1">
                              In-App
                            </Chip>
                          )}
                          {(channels.webPush ?? true) && (
                            <Chip variant="soft" color="default" className="text-[8px] font-mono px-1">
                              Push
                            </Chip>
                          )}
                          {(channels.email || !isBroadcast) && (
                            <Chip variant="soft" color="warning" className="text-[8px] font-mono px-1">
                              Email
                            </Chip>
                          )}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="p-4 font-mono text-text-secondary text-[11px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          className="text-text-secondary group-hover:text-primary"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Bottom Control Footer */}
      <TableFooter
        showingCount={Math.min(filteredLogs.length, pageSize)}
        totalCount={logs.length}
        entityLabel="dispatches"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Detailed Inspection Modal Drawer */}
      <AnimatePresence>
        {selectedLog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg h-full bg-surface border-l border-border-custom p-6 shadow-2xl flex flex-col gap-6 overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border-custom pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                    <ScrollText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">Dispatch Audit Inspector</h3>
                    <span className="text-xs font-mono text-text-secondary">Log ID: {selectedLog.id.slice(0, 16)}</span>
                  </div>
                </div>

                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => setSelectedLog(null)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Payload Breakdown Cards */}
              <div className="flex flex-col gap-4 text-xs">
                {/* Sender Details (Who Sent) */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    Who Sent This Broadcast (Sender Information)
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-text-primary">
                        {selectedLog.senderName || selectedLog.metadata?.senderName || "System Admin"}
                      </span>
                      <span className="text-xs font-mono text-text-secondary">
                        {selectedLog.senderEmail || selectedLog.metadata?.senderEmail || "admin@medicio.app"}
                      </span>
                    </div>
                    <Chip variant="soft" color="accent" className="text-xs font-mono font-bold">
                      {selectedLog.senderRole || selectedLog.metadata?.senderRole || selectedLog.actorRole || "ADMIN"}
                    </Chip>
                  </div>
                </div>

                {/* Recipient Details (Who Received) */}
                <div className="p-4 rounded-xl bg-background-custom/50 border border-border-custom flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Who Received This Notification (Target / Audience Scope)
                  </span>

                  {selectedLog.recipientEmail || selectedLog.recipientName ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface/70 border border-border-custom/60 mt-1">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-text-primary">
                          {selectedLog.recipientName || selectedLog.recipientEmail}
                        </span>
                        <span className="text-[11px] font-mono text-text-secondary">
                          {selectedLog.recipientEmail}
                        </span>
                      </div>
                      {selectedLog.recipientRole && (
                        <Chip variant="soft" color="default" className="text-[10px] font-mono">
                          {selectedLog.recipientRole}
                        </Chip>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary font-mono">Target Type:</span>
                        <span className="font-bold">{selectedLog.metadata?.targetType || "ALL"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary font-mono">Target Scope:</span>
                        <span className="font-mono font-bold">
                          {selectedLog.metadata?.targetType === "ROLE"
                            ? `Role: ${selectedLog.metadata?.targetValue}`
                            : selectedLog.metadata?.targetType === "USER"
                              ? `${Array.isArray(selectedLog.metadata?.targetValue) ? selectedLog.metadata?.targetValue.length : 1} Specific User(s)`
                              : "All Active Platform Users"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Specific Target User List Breakdown only when targetType is USER */}
                  {selectedLog.metadata?.targetType === "USER" && Array.isArray(selectedLog.metadata?.recipients) && selectedLog.metadata.recipients.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                        Specific Target User Details ({selectedLog.metadata.recipients.length} Users):
                      </span>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {selectedLog.metadata.recipients.map((rec: any) => (
                          <div key={rec.id || rec.email} className="flex items-center justify-between p-2.5 rounded-xl bg-surface/80 border border-border-custom/60 text-xs">
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-text-primary truncate">{rec.name}</span>
                                <Chip variant="soft" color="accent" className="text-[8px] font-mono shrink-0 px-1 py-0 h-4">
                                  {rec.role}
                                </Chip>
                              </div>
                              <span className="text-[10px] text-text-secondary font-mono truncate">{rec.email}</span>
                              {rec.id && (
                                <span className="text-[9px] text-text-secondary/70 font-mono truncate">ID: {rec.id}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Headline & Body Message */}
                <div className="p-4 rounded-xl bg-background-custom/50 border border-border-custom flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                    Headline & Notification Message Body
                  </span>
                  <h4 className="font-bold text-sm text-text-primary">
                    {selectedLog.metadata?.title || selectedLog.metadata?.subject || "N/A"}
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line bg-surface/60 p-3 rounded-lg border border-border-custom/50">
                    {selectedLog.metadata?.body || "No message body recorded."}
                  </p>

                  {selectedLog.metadata?.href && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-text-secondary font-mono text-[11px]">Action Link Target:</span>
                      <code className="text-primary font-mono text-xs bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        {selectedLog.metadata.href}
                      </code>
                    </div>
                  )}
                </div>

                {/* Delivery Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-background-custom/50 border border-border-custom text-center">
                    <span className="text-[10px] font-mono text-text-secondary block">In-App Created</span>
                    <span className="font-bold text-base text-primary">
                      {selectedLog.metadata?.inAppCreated ?? (selectedLog.action === "ADMIN_NOTIFICATION_BROADCAST" ? "Yes" : "N/A")}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-background-custom/50 border border-border-custom text-center">
                    <span className="text-[10px] font-mono text-text-secondary block">Web Push</span>
                    <span className="font-bold text-base text-sky-400">
                      {selectedLog.metadata?.webPushDelivered ?? "N/A"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-background-custom/50 border border-border-custom text-center">
                    <span className="text-[10px] font-mono text-text-secondary block">Emails Sent</span>
                    <span className="font-bold text-base text-amber-400">
                      {selectedLog.metadata?.emailDispatched ?? (selectedLog.metadata?.delivered ? "1" : "0")}
                    </span>
                  </div>
                </div>

                {/* Dispatched Date */}
                <div className="flex justify-between items-center p-3 rounded-xl bg-background-custom/50 border border-border-custom text-text-secondary text-[11px] font-mono">
                  <span>Dispatched Timestamp:</span>
                  <span className="text-text-primary font-semibold">{new Date(selectedLog.createdAt).toUTCString()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
