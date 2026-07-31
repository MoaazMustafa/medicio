"use client";

import {
  Button,
  Card,
  Chip,
  Dropdown,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Skeleton,
} from "@heroui/react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileSpreadsheet,
  Mail,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { downloadData } from "@/lib/export-helper";

interface SystemLogItem {
  id: string;
  action: string;
  actorRole: string;
  actorEmail: string;
  entityType: string;
  clientIp: string;
  timestamp: string;
}

interface EmailLogItem {
  id: string;
  recipient: string;
  subject: string;
  category: "OTP Verification" | "Password Reset" | "Appointment Reminder" | "Welcome Email" | "System Alert";
  status: "DELIVERED" | "PENDING" | "FAILED";
  provider: "Resend SMTP" | "AWS SES" | "SendGrid";
  sentAt: string;
  bodyPreview: string;
  smtpHeader: string;
}

export default function AdminLogsPage() {
  const router = useRouter();
  const [activeSubtab, setActiveSubtab] = useState<"system" | "email">("system");

  // System & Email Logs state from real PostgreSQL API
  const [realSystemLogs, setRealSystemLogs] = useState<SystemLogItem[]>([]);
  const [realEmailLogs, setRealEmailLogs] = useState<EmailLogItem[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<{
    totalSystemLogs: number;
    rbacUpdatesCount: number;
    securityFaultsCount: number;
    uptimeRate: string;
  } | null>(null);
  const [emailMetrics, setEmailMetrics] = useState<{
    totalEmails: number;
    deliveryRate: string;
    bouncedCount: number;
    pendingQueueCount: number;
  } | null>(null);

  const [systemSearch, setSystemSearch] = useState("");
  const [systemRoleFilter, setSystemRoleFilter] = useState("ALL");
  const [systemPage, setSystemPage] = useState(1);
  const systemPageSize = 10;

  // Email Logs state
  const [emailSearch, setEmailSearch] = useState("");
  const [emailStatusFilter, setEmailStatusFilter] = useState("ALL");
  const [emailCategoryFilter, setEmailCategoryFilter] = useState("ALL");
  const [emailPage, setEmailPage] = useState(1);
  const emailPageSize = 10;

  // Email Preview Drawer Modal state
  const [previewEmail, setPreviewEmail] = useState<EmailLogItem | null>(null);

  const [loading, setLoading] = useState(true);

  // Fetch real audit logs from PostgreSQL
  const fetchRealLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      const data = await res.json();
      if (res.ok && data.logs) {
        setRealSystemLogs(data.logs);
        if (data.emailLogs) setRealEmailLogs(data.emailLogs);
        if (data.systemMetrics) setSystemMetrics(data.systemMetrics);
        if (data.emailMetrics) setEmailMetrics(data.emailMetrics);
      } else {
        setRealSystemLogs([]);
        setRealEmailLogs([]);
      }
    } catch {
      setRealSystemLogs([]);
      setRealEmailLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealLogs();
  }, []);

  const handleRefresh = () => {
    fetchRealLogs();
    toast.success("Telemetry logs refreshed from database.");
  };

  const filteredSystemLogs = realSystemLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(systemSearch.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(systemSearch.toLowerCase()) ||
      log.clientIp.includes(systemSearch);
    const matchesRole = systemRoleFilter === "ALL" || log.actorRole === systemRoleFilter;
    return matchesSearch && matchesRole;
  });

  const totalSystemPages = Math.max(1, Math.ceil(filteredSystemLogs.length / systemPageSize));
  const paginatedSystemLogs = filteredSystemLogs.slice(
    (systemPage - 1) * systemPageSize,
    systemPage * systemPageSize,
  );

  const filteredEmailLogs = realEmailLogs.filter((email) => {
    const matchesSearch =
      email.recipient.toLowerCase().includes(emailSearch.toLowerCase()) ||
      email.subject.toLowerCase().includes(emailSearch.toLowerCase());
    const matchesStatus = emailStatusFilter === "ALL" || email.status === emailStatusFilter;
    const matchesCategory = emailCategoryFilter === "ALL" || email.category === emailCategoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalEmailPages = Math.max(1, Math.ceil(filteredEmailLogs.length / emailPageSize));
  const paginatedEmailLogs = filteredEmailLogs.slice(
    (emailPage - 1) * emailPageSize,
    emailPage * emailPageSize,
  );

  const handleExportSystem = (format: "csv" | "json" | "txt") => {
    downloadData(filteredSystemLogs, "medicio_system_audit_logs", format);
    toast.success(`Exported System Logs as ${format.toUpperCase()}`);
  };

  const handleExportEmail = (format: "csv" | "json" | "txt") => {
    downloadData(filteredEmailLogs, "medicio_email_delivery_logs", format);
    toast.success(`Exported Email Logs as ${format.toUpperCase()}`);
  };

  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto gap-6">
      {/* Page Header & Subtab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Audit Logs & Telemetry Hub</span>
            <Chip variant="soft" color="accent" className="text-xs font-mono">
              Module 12
            </Chip>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Super Admin auditable trails for system RBAC modifications and transactional email dispatches.
          </p>
        </div>

        {/* HeroUI Subtab Controls */}
        <div className="flex items-center gap-2 bg-surface/80 border border-border-custom p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveSubtab("system");
              router.push("/admin/logs");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubtab === "system"
                ? "bg-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>System Audit Logs</span>
          </button>
          <button
            onClick={() => {
              router.push("/admin/logs/email");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubtab === "email"
                ? "bg-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Dispatch Logs</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: SYSTEM LOGS */}
      {activeSubtab === "system" && (
        <div className="flex flex-col gap-6">
          {/* System Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium">Total System Audit Logs</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </div>
              {loading || !systemMetrics ? (
                <Skeleton className="h-8 w-24 rounded my-1" />
              ) : (
                <span className="text-3xl font-extrabold text-text-primary">
                  {systemMetrics.totalSystemLogs.toLocaleString()}
                </span>
              )}
              <p className="text-[11px] text-text-secondary">Logged database & security events</p>
            </Card>

            <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium">RBAC Privilege Updates</span>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              {loading || !systemMetrics ? (
                <Skeleton className="h-8 w-24 rounded my-1" />
              ) : (
                <span className="text-3xl font-extrabold text-text-primary">
                  {systemMetrics.rbacUpdatesCount.toLocaleString()}
                </span>
              )}
              <p className="text-[11px] text-text-secondary">Role & permission assignments</p>
            </Card>

            <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium">Security Faults</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              {loading || !systemMetrics ? (
                <Skeleton className="h-8 w-24 rounded my-1" />
              ) : (
                <span className="text-3xl font-extrabold text-text-primary">
                  {systemMetrics.securityFaultsCount.toLocaleString()}
                </span>
              )}
              <p className="text-[11px] text-text-secondary">Zero unauthorized access attempts</p>
            </Card>

            <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium">Platform Uptime Rate</span>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Database className="w-5 h-5" />
                </div>
              </div>
              {loading || !systemMetrics ? (
                <Skeleton className="h-8 w-24 rounded my-1" />
              ) : (
                <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                  {systemMetrics.uptimeRate}
                </span>
              )}
              <p className="text-[11px] text-text-secondary">Prisma ORM & PostgreSQL Health</p>
            </Card>
          </div>

          {/* System Logs Table Container */}
          <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-custom pb-4">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <div className="relative w-full max-w-sm">
                  <Input
                    placeholder="Search action, email or IP..."
                    value={systemSearch}
                    onChange={(e) => {
                      setSystemSearch(e.target.value);
                      setSystemPage(1);
                    }}
                    className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-xs text-text-primary w-full"
                  />
                </div>

                <Select
                  aria-label="Filter actor role"
                  className="w-48"
                  selectedKey={systemRoleFilter}
                  onSelectionChange={(key) => {
                    setSystemRoleFilter(String(key));
                    setSystemPage(1);
                  }}
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="ALL" textValue="All Actor Roles">
                        <Label>All Actor Roles</Label>
                      </ListBox.Item>
                      <ListBox.Item id="SUPER_ADMIN" textValue="Super Admin">
                        <Label>Super Admin</Label>
                      </ListBox.Item>
                      <ListBox.Item id="ADMIN" textValue="Admin">
                        <Label>Admin</Label>
                      </ListBox.Item>
                      <ListBox.Item id="SYSTEM" textValue="System Automated">
                        <Label>System Automated</Label>
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

                {/* Multi-Format Export Dropdown */}
                <Dropdown>
                  <Dropdown.Trigger>
                    <Button variant="outline" className="text-xs font-semibold px-3 text-text-primary flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-primary" />
                      Export Logs
                    </Button>
                  </Dropdown.Trigger>
                  <Dropdown.Popover placement="bottom end">
                    <Dropdown.Menu
                      onAction={(key) => handleExportSystem(key as any)}
                    >
                      <Dropdown.Item id="csv" textValue="Export CSV">
                        <Label>Export as CSV (.csv)</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="json" textValue="Export JSON">
                        <Label>Export as JSON (.json)</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="txt" textValue="Export TXT Log">
                        <Label>Export as TXT Archive (.txt)</Label>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </div>
            </div>

            {/* HeroUI Table */}
            <div className="w-full overflow-x-auto border border-border-custom rounded-lg bg-surface/30">
              <Table className="w-full text-left text-xs">
                <TableHeader className="bg-background-custom/60 text-text-secondary uppercase font-mono text-[10px] tracking-wider border-b border-border-custom">
                  <TableRow>
                    <TableColumn className="px-4 py-3.5">Action Code</TableColumn>
                    <TableColumn className="px-4 py-3.5">Acting User / Role</TableColumn>
                    <TableColumn className="px-4 py-3.5">Target Entity</TableColumn>
                    <TableColumn className="px-4 py-3.5">Client IP</TableColumn>
                    <TableColumn className="px-4 py-3.5 text-right">Timestamp</TableColumn>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border-custom/50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-4 py-4"><Skeleton className="h-4 w-48 rounded" /></TableCell>
                        <TableCell className="px-4 py-4"><Skeleton className="h-4 w-40 rounded" /></TableCell>
                        <TableCell className="px-4 py-4"><Skeleton className="h-4 w-28 rounded" /></TableCell>
                        <TableCell className="px-4 py-4"><Skeleton className="h-4 w-28 rounded" /></TableCell>
                        <TableCell className="px-4 py-4 text-right"><Skeleton className="h-4 w-28 rounded ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : paginatedSystemLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                        No system audit logs match your search filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSystemLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-surface/50 transition-colors text-text-primary">
                        <TableCell className="px-4 py-3.5 font-mono font-bold text-emerald-400">
                          {log.action}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-text-primary">{log.actorEmail}</span>
                            <span className="text-[10px] text-text-secondary font-mono">{log.actorRole}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <Chip variant="soft" className="text-[10px] font-mono">
                            {log.entityType}
                          </Chip>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-text-secondary font-mono text-xs">{log.clientIp}</TableCell>
                        <TableCell className="px-4 py-3.5 text-right text-text-secondary font-mono text-xs">{log.timestamp}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* System Logs Pagination Bar */}
            {filteredSystemLogs.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary pt-2">
                <span>
                  Showing page <strong className="text-text-primary">{systemPage}</strong> of{" "}
                  <strong className="text-text-primary">{totalSystemPages}</strong> ({filteredSystemLogs.length} total logs)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    isDisabled={systemPage <= 1 || loading}
                    onPress={() => setSystemPage((prev) => Math.max(1, prev - 1))}
                    className="text-xs font-semibold px-4 py-1.5 text-text-primary"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    isDisabled={systemPage >= totalSystemPages || loading}
                    onPress={() => setSystemPage((prev) => Math.min(totalSystemPages, prev + 1))}
                    className="text-xs font-semibold px-4 py-1.5 text-text-primary"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* SUBTAB 2: EMAIL LOGS WITH EXPANDABLE SIDE DRAWER PREVIEW */}
      {activeSubtab === "email" && (
        <div className="flex flex-col gap-6">
          {/* Email Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium">Total Emails Dispatched</span>
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
                <span className="text-xs text-text-secondary font-medium">Pending Queue</span>
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
              <p className="text-[11px] text-text-secondary">Dispatches currently in queue</p>
            </Card>
          </div>

          {/* Email Logs Table */}
          <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-custom pb-4">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <div className="relative w-full max-w-sm">
                  <Input
                    placeholder="Search recipient or subject..."
                    value={emailSearch}
                    onChange={(e) => {
                      setEmailSearch(e.target.value);
                      setEmailPage(1);
                    }}
                    className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-xs text-text-primary w-full"
                  />
                </div>

                <Select
                  aria-label="Filter email status"
                  className="w-40"
                  selectedKey={emailStatusFilter}
                  onSelectionChange={(key) => {
                    setEmailStatusFilter(String(key));
                    setEmailPage(1);
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
                  aria-label="Filter email category"
                  className="w-48"
                  selectedKey={emailCategoryFilter}
                  onSelectionChange={(key) => {
                    setEmailCategoryFilter(String(key));
                    setEmailPage(1);
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

                {/* Multi-Format Export Dropdown */}
                <Dropdown>
                  <Dropdown.Trigger>
                    <Button variant="outline" className="text-xs font-semibold px-3 text-text-primary flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-primary" />
                      Export Logs
                    </Button>
                  </Dropdown.Trigger>
                  <Dropdown.Popover placement="bottom end">
                    <Dropdown.Menu
                      onAction={(key) => handleExportEmail(key as any)}
                    >
                      <Dropdown.Item id="csv" textValue="Export CSV">
                        <Label>Export as CSV (.csv)</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="json" textValue="Export JSON">
                        <Label>Export as JSON (.json)</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="txt" textValue="Export TXT Log">
                        <Label>Export as TXT Archive (.txt)</Label>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </div>
            </div>

            {/* Email Logs Table - Row Click opens Preview Drawer */}
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
                  ) : paginatedEmailLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                        No email dispatches match your search filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEmailLogs.map((log) => (
                      <TableRow
                        key={log.id}
                        onClick={() => setPreviewEmail(log)}
                        className="hover:bg-surface/70 transition-colors text-text-primary cursor-pointer group"
                      >
                        <TableCell className="px-4 py-3.5 font-mono font-semibold text-primary flex items-center gap-2">
                          <Send className="w-3.5 h-3.5 text-text-secondary shrink-0 group-hover:text-primary transition-colors" />
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
                        <TableCell className="px-4 py-3.5 text-right text-text-secondary font-mono text-xs">{log.sentAt}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Email Logs Pagination Bar */}
            {filteredEmailLogs.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary pt-2">
                <span>
                  Showing page <strong className="text-text-primary">{emailPage}</strong> of{" "}
                  <strong className="text-text-primary">{totalEmailPages}</strong> ({filteredEmailLogs.length} total dispatches)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    isDisabled={emailPage <= 1 || loading}
                    onPress={() => setEmailPage((prev) => Math.max(1, prev - 1))}
                    className="text-xs font-semibold px-4 py-1.5 text-text-primary"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    isDisabled={emailPage >= totalEmailPages || loading}
                    onPress={() => setEmailPage((prev) => Math.min(totalEmailPages, prev + 1))}
                    className="text-xs font-semibold px-4 py-1.5 text-text-primary"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* EMAIL PREVIEW EXPANDABLE SIDE DRAWER MODAL */}
          {previewEmail && (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-xl h-full bg-surface border-l border-border-custom p-6 shadow-2xl flex flex-col gap-6 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border-custom pb-4">
                  <div>
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary" />
                      Email Dispatch Preview
                    </h3>
                    <span className="text-xs font-mono text-text-secondary">Log ID: {previewEmail.id}</span>
                  </div>

                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => setPreviewEmail(null)}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Metadata Details */}
                <div className="flex flex-col gap-3 bg-background-custom/40 p-4 rounded-xl border border-border-custom/50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Recipient:</span>
                    <strong className="text-primary font-mono">{previewEmail.recipient}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Subject:</span>
                    <strong className="text-text-primary">{previewEmail.subject}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Delivery Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                        previewEmail.status === "DELIVERED"
                          ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                          : previewEmail.status === "PENDING"
                            ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
                            : "text-rose-400 border-rose-500/40 bg-rose-500/10"
                      }`}
                    >
                      {previewEmail.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">SMTP Provider:</span>
                    <span className="font-mono text-text-primary">{previewEmail.provider}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Timestamp:</span>
                    <span className="font-mono text-text-primary">{previewEmail.sentAt}</span>
                  </div>
                </div>

                {/* Email Body Preview Content Box */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-text-primary">Email Content Body</span>
                  <div className="p-4 rounded-xl bg-background-custom/60 border border-border-custom text-xs text-text-primary font-sans leading-relaxed">
                    <p>{previewEmail.bodyPreview}</p>
                  </div>
                </div>

                {/* Technical SMTP Headers */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-text-primary">SMTP Headers & TLS Verification</span>
                  <div className="p-3 rounded-xl bg-background-custom/80 border border-border-custom text-[11px] font-mono text-text-secondary break-all">
                    {previewEmail.smtpHeader}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border-custom flex justify-end">
                  <Button
                    variant="outline"
                    onPress={() => setPreviewEmail(null)}
                    className="text-xs font-semibold px-4"
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
