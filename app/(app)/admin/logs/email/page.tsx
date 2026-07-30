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
} from "@heroui/react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
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

const MOCK_EMAIL_LOGS: EmailLogItem[] = [
  { id: "em-101", recipient: "moaazmustafa@gmail.com", subject: "Verify your Medicio account OTP", category: "OTP Verification", status: "DELIVERED", provider: "Resend SMTP", sentAt: "2026-07-30 22:10:15" },
  { id: "em-102", recipient: "doctor.sarah@medicio.com", subject: "Doctor Credential Approval Confirmation", category: "System Alert", status: "DELIVERED", provider: "Resend SMTP", sentAt: "2026-07-30 21:45:00" },
  { id: "em-103", recipient: "patient.john@gmail.com", subject: "Upcoming Doctor Appointment Reminder", category: "Appointment Reminder", status: "DELIVERED", provider: "AWS SES", sentAt: "2026-07-30 20:30:12" },
  { id: "em-104", recipient: "admin@medicio.com", subject: "Security Alert: Password Reset Requested", category: "Password Reset", status: "DELIVERED", provider: "Resend SMTP", sentAt: "2026-07-30 19:15:40" },
  { id: "em-105", recipient: "unverified.user@hotmail.com", subject: "Verify your Medicio account OTP", category: "OTP Verification", status: "FAILED", provider: "SendGrid", sentAt: "2026-07-30 18:50:00" },
  { id: "em-106", recipient: "new.member@yahoo.com", subject: "Welcome to Medicio Healthcare Platform", category: "Welcome Email", status: "DELIVERED", provider: "Resend SMTP", sentAt: "2026-07-30 17:22:11" },
  { id: "em-107", recipient: "pharmacy.manager@medicio.com", subject: "Monthly Inventory Audit Summary", category: "System Alert", status: "PENDING", provider: "AWS SES", sentAt: "2026-07-30 16:05:00" },
];

export default function AdminEmailLogsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Email delivery log stream refreshed.");
    }, 400);
  };

  const filteredLogs = MOCK_EMAIL_LOGS.filter((item) => {
    const matchesSearch =
      item.recipient.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto gap-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Total Emails Sent</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-text-primary">1,480</span>
          <p className="text-[11px] text-text-secondary">Transactional & OTP email dispatches</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Delivery Success Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-emerald-400">98.6%</span>
          <p className="text-[11px] text-text-secondary">Successful Inbox Delivery</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Bounced / Failed</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-text-primary">18</span>
          <p className="text-[11px] text-text-secondary">Invalid addresses or bounce events</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Pending Dispatches</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-text-primary">4</span>
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
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-xs text-text-primary w-full"
              />
            </div>

            <Select
              aria-label="Filter status"
              className="w-40"
              selectedKey={statusFilter}
              onSelectionChange={(key) => setStatusFilter(String(key))}
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
              onSelectionChange={(key) => setCategoryFilter(String(key))}
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
            <Button
              variant="outline"
              onPress={() => toast.success("Exporting Email Logs CSV...")}
              className="text-xs font-semibold px-3 text-text-primary flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Email Logs Table */}
        <div className="w-full overflow-x-auto border border-border-custom rounded-lg bg-surface/30">
          <table className="w-full text-left text-xs">
            <thead className="bg-background-custom/60 text-text-secondary uppercase font-mono text-[10px] tracking-wider border-b border-border-custom">
              <tr>
                <th className="px-4 py-3.5">Recipient Email</th>
                <th className="px-4 py-3.5">Subject & Category</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Email Provider</th>
                <th className="px-4 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-48 rounded" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-56 rounded" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-28 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    No email dispatches matching filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface/50 transition-colors text-text-primary">
                    <td className="px-4 py-3.5 font-mono font-semibold text-primary flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                      <span>{log.recipient}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">{log.subject}</span>
                        <span className="text-[10px] text-text-secondary font-mono">{log.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
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
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary font-mono text-xs">{log.provider}</td>
                    <td className="px-4 py-3.5 text-right text-text-secondary font-mono text-xs">{log.sentAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
