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
  Activity,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SystemLogItem {
  id: string;
  action: string;
  actorRole: string;
  actorEmail: string;
  entityType: string;
  clientIp: string;
  timestamp: string;
}

const MOCK_SYSTEM_LOGS: SystemLogItem[] = [
  { id: "log-001", action: "ADMIN_USER_PROVISIONED", actorRole: "SUPER_ADMIN", actorEmail: "admin@medicio.com", entityType: "USER", clientIp: "192.168.1.10", timestamp: "2026-07-30 22:15:02" },
  { id: "log-002", action: "RBAC_ROLE_UPDATED", actorRole: "SUPER_ADMIN", actorEmail: "admin@medicio.com", entityType: "ROLE_PERMISSIONS", clientIp: "192.168.1.10", timestamp: "2026-07-30 21:40:18" },
  { id: "log-003", action: "DOCTOR_VERIFICATION_ISSUED", actorRole: "ADMIN", actorEmail: "reviewer@medicio.com", entityType: "DOCTOR", clientIp: "172.16.0.4", timestamp: "2026-07-30 20:12:44" },
  { id: "log-004", action: "USER_PASSWORD_CHANGED", actorRole: "ADMIN", actorEmail: "admin@medicio.com", entityType: "USER", clientIp: "192.168.1.10", timestamp: "2026-07-30 19:05:30" },
  { id: "log-005", action: "SCRAPER_CRAWL_JOB_TRIGGERED", actorRole: "SUPER_ADMIN", actorEmail: "admin@medicio.com", entityType: "SCRAPER", clientIp: "10.0.0.1", timestamp: "2026-07-30 18:30:00" },
  { id: "log-006", action: "RATE_LIMIT_IP_EXCEEDED", actorRole: "SYSTEM", actorEmail: "guest@anonymous.net", entityType: "RATE_LIMIT", clientIp: "45.33.21.90", timestamp: "2026-07-30 17:14:22" },
];

export default function AdminLogsPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("System audit log stream refreshed.");
    }, 400);
  };

  const filteredLogs = MOCK_SYSTEM_LOGS.filter((item) => {
    const matchesSearch =
      item.action.toLowerCase().includes(search.toLowerCase()) ||
      item.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
      item.clientIp.includes(search);
    const matchesRole = roleFilter === "ALL" || item.actorRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto gap-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Total System Audit Logs</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-text-primary">4,820</span>
          <p className="text-[11px] text-text-secondary">Logged database & security events</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">RBAC Privilege Updates</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-text-primary">342</span>
          <p className="text-[11px] text-text-secondary">Role & permission assignments</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Security Faults</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-text-primary">0</span>
          <p className="text-[11px] text-text-secondary">Zero unauthorized access attempts</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Platform Uptime Rate</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-cyan-400 font-mono">99.98%</span>
          <p className="text-[11px] text-text-secondary">Prisma ORM & PostgreSQL Health</p>
        </Card>
      </div>

      {/* Main Table Container */}
      <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-custom pb-4">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="relative w-full max-w-sm">
              <Input
                placeholder="Search action, actor email or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-xs text-text-primary w-full"
              />
            </div>

            <Select
              aria-label="Filter actor role"
              className="w-48"
              selectedKey={roleFilter}
              onSelectionChange={(key) => setRoleFilter(String(key))}
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
            <Button
              variant="outline"
              onPress={() => toast.success("Exporting Audit Logs CSV...")}
              className="text-xs font-semibold px-3 text-text-primary flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* System Logs Table */}
        <div className="w-full overflow-x-auto border border-border-custom rounded-lg bg-surface/30">
          <table className="w-full text-left text-xs">
            <thead className="bg-background-custom/60 text-text-secondary uppercase font-mono text-[10px] tracking-wider border-b border-border-custom">
              <tr>
                <th className="px-4 py-3.5">Action Code</th>
                <th className="px-4 py-3.5">Acting User / Role</th>
                <th className="px-4 py-3.5">Target Entity</th>
                <th className="px-4 py-3.5">Client IP Address</th>
                <th className="px-4 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-48 rounded" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-40 rounded" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-28 rounded" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-28 rounded" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-28 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    No system audit logs matching search filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface/50 transition-colors text-text-primary">
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">
                      {log.action}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">{log.actorEmail}</span>
                        <span className="text-[10px] text-text-secondary font-mono">{log.actorRole}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Chip variant="soft" className="text-[10px] font-mono">
                        {log.entityType}
                      </Chip>
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary font-mono text-xs">{log.clientIp}</td>
                    <td className="px-4 py-3.5 text-right text-text-secondary font-mono text-xs">{log.timestamp}</td>
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
