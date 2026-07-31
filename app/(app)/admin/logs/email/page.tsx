"use client";

import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EmailLogItem {
  id: string;
  recipient: string;
  subject: string;
  category: "OTP Verification" | "Password Reset" | "Appointment Reminder" | "Welcome Email" | "System Alert";
  status: "DELIVERED" | "PENDING" | "FAILED";
  provider: "Resend SMTP" | "AWS SES" | "SendGrid";
  sentAt: string;
}

export default function AdminEmailLogsPage() {
  const router = useRouter();
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [emailMetrics, setEmailMetrics] = useState<{
    totalEmails: number;
    deliveryRate: string;
    bouncedCount: number;
    pendingQueueCount: number;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      const data = await res.json();
      if (res.ok && data.emailLogs) {
        setEmailLogs(data.emailLogs);
        if (data.emailMetrics) setEmailMetrics(data.emailMetrics);
      } else {
        setEmailLogs([]);
      }
    } catch {
      setEmailLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
    toast.success("Email delivery telemetry refreshed.");
  };

  const filteredLogs = emailLogs.filter((item) => {
    const matchesSearch =
      item.recipient.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto gap-6">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Email Dispatch Telemetry Logs</span>
            <Chip variant="soft" color="accent" className="text-xs font-mono">
              Transactional SMTP
            </Chip>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Real-time delivery confirmation, bounce tracking & header inspection for outbound emails.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface/80 border border-border-custom p-1 rounded-xl">
          <button
            onClick={() => router.push("/admin/logs")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all text-text-secondary hover:text-text-primary"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>System Audit Logs</span>
          </button>
          <button
            onClick={() => router.push("/admin/logs/email")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all bg-primary text-white shadow-xs"
          >
            <Mail className="w-4 h-4" />
            <span>Email Dispatch Logs</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Total Emails Sent</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          {loading || !emailMetrics ? (
            <Skeleton className="h-8 w-24 rounded my-1" />
          ) : (
            <span className="text-3xl font-extrabold text-text-primary">
              {emailMetrics.totalEmails.toLocaleString()}
            </span>
          )}
          <p className="text-[11px] text-text-secondary">Transactional & OTP email dispatches</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Delivery Success Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          {loading || !emailMetrics ? (
            <Skeleton className="h-8 w-24 rounded my-1" />
          ) : (
            <span className="text-3xl font-extrabold text-emerald-400">
              {emailMetrics.deliveryRate}
            </span>
          )}
          <p className="text-[11px] text-text-secondary">Successful Inbox Delivery</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Bounced / Failed</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          {loading || !emailMetrics ? (
            <Skeleton className="h-8 w-24 rounded my-1" />
          ) : (
            <span className="text-3xl font-extrabold text-text-primary">
              {emailMetrics.bouncedCount.toLocaleString()}
            </span>
          )}
          <p className="text-[11px] text-text-secondary">Invalid addresses or bounce events</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Pending Dispatches</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          {loading || !emailMetrics ? (
            <Skeleton className="h-8 w-24 rounded my-1" />
          ) : (
            <span className="text-3xl font-extrabold text-text-primary">
              {emailMetrics.pendingQueueCount.toLocaleString()}
            </span>
          )}
          <p className="text-[11px] text-text-secondary">Emails currently in queue</p>
        </Card>
      </div>

      {/* Main Table Container */}
      <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-custom pb-4">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="relative w-full max-w-sm">
              <Input
                placeholder="Search by email address or subject..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-xs text-text-primary w-full"
              />
            </div>

            <Select
              aria-label="Filter status"
              className="w-40"
              selectedKey={statusFilter}
              onSelectionChange={(key) => {
                setStatusFilter(String(key));
                setPage(1);
              }}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="ALL" textValue="All Statuses">
                    <Label>All Statuses</Label>
                  </ListBox.Item>
                  <ListBox.Item id="DELIVERED" textValue="Delivered">
                    <Label>Delivered</Label>
                  </ListBox.Item>
                  <ListBox.Item id="PENDING" textValue="Pending">
                    <Label>Pending</Label>
                  </ListBox.Item>
                  <ListBox.Item id="FAILED" textValue="Failed">
                    <Label>Failed</Label>
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              aria-label="Filter category"
              className="w-48"
              selectedKey={categoryFilter}
              onSelectionChange={(key) => {
                setCategoryFilter(String(key));
                setPage(1);
              }}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="ALL" textValue="All Categories">
                    <Label>All Categories</Label>
                  </ListBox.Item>
                  <ListBox.Item id="OTP Verification" textValue="OTP Verification">
                    <Label>OTP Verification</Label>
                  </ListBox.Item>
                  <ListBox.Item id="Password Reset" textValue="Password Reset">
                    <Label>Password Reset</Label>
                  </ListBox.Item>
                  <ListBox.Item id="Appointment Reminder" textValue="Appointment Reminder">
                    <Label>Appointment Reminder</Label>
                  </ListBox.Item>
                  <ListBox.Item id="Welcome Email" textValue="Welcome Email">
                    <Label>Welcome Email</Label>
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onPress={handleRefresh}
              className="text-xs font-semibold px-3 text-text-primary flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* HeroUI Email Logs Table */}
        <div className="w-full overflow-x-auto border border-border-custom rounded-lg bg-surface/30">
          <Table className="w-full text-left text-xs">
            <TableHeader className="bg-background-custom/60 text-text-secondary uppercase font-mono text-[10px] tracking-wider border-b border-border-custom">
              <TableRow>
                <TableColumn className="px-4 py-3.5">Recipient Email</TableColumn>
                <TableColumn className="px-4 py-3.5">Subject & Category</TableColumn>
                <TableColumn className="px-4 py-3.5">Status</TableColumn>
                <TableColumn className="px-4 py-3.5">Email Provider</TableColumn>
                <TableColumn className="px-4 py-3.5 text-right">Timestamp</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border-custom/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-4 py-4"><Skeleton className="h-4 w-48 rounded" /></TableCell>
                    <TableCell className="px-4 py-4"><Skeleton className="h-4 w-56 rounded" /></TableCell>
                    <TableCell className="px-4 py-4"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                    <TableCell className="px-4 py-4 text-right"><Skeleton className="h-4 w-28 rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    No email dispatches matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-surface/50 transition-colors text-text-primary">
                    <TableCell className="px-4 py-3.5 font-mono font-semibold text-primary flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                      <span>{log.recipient}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">{log.subject}</span>
                        <span className="text-[10px] text-text-secondary font-mono">{log.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          log.status === "DELIVERED"
                            ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                            : log.status === "PENDING"
                              ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
                              : "text-rose-400 border-rose-500/40 bg-rose-500/10"
                        }`}
                      >
                        {log.status === "DELIVERED" && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === "PENDING" && <Clock className="w-3 h-3" />}
                        {log.status === "FAILED" && <AlertCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-text-secondary font-mono text-xs">{log.provider}</TableCell>
                    <TableCell className="px-4 py-3.5 text-right text-text-secondary font-mono text-xs">
                      {new Date(log.sentAt).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {filteredLogs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary pt-2">
            <span>
              Showing page <strong className="text-text-primary">{page}</strong> of{" "}
              <strong className="text-text-primary">{totalPages}</strong> ({filteredLogs.length} total dispatches)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                isDisabled={page <= 1 || loading}
                onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                className="text-xs font-semibold px-4 py-1.5 text-text-primary"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                isDisabled={page >= totalPages || loading}
                onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="text-xs font-semibold px-4 py-1.5 text-text-primary"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
