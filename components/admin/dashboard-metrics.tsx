"use client";

import { Button, Card, Chip, Skeleton } from "@heroui/react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Globe,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface StatsResponse {
  totalUsers: number;
  verifiedDoctors: number;
  scrapedRecords: number;
  auditLogsCount: number;
  roleCounts: Record<string, number>;
  monthlyRegistrations: { month: string; count: number }[];
  recentAuditLogs: {
    id: string;
    action: string;
    actorRole: string;
    entityType?: string | null;
    createdAt: string;
    metadata?: any;
  }[];
}

export function DashboardMetrics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load stats.");
      setStats(data);
    } catch (err: any) {
      toast.error(err.message || "Error loading telemetry analytics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
    toast.success("Telemetry stats refreshed from database");
  };

  // Helper to construct dynamic SVG path points from real monthly registration data
  const renderSvgGraph = () => {
    if (!stats || !stats.monthlyRegistrations || stats.monthlyRegistrations.length === 0) {
      return null;
    }

    const counts = stats.monthlyRegistrations.map((m) => m.count);
    const maxVal = Math.max(...counts, 1);
    const minVal = Math.min(...counts, 0);

    const width = 600;
    const height = 160;
    const padding = 20;

    const points = counts.map((val, idx) => {
      const x = (idx / (counts.length - 1)) * width;
      const normalizedY = maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal || 1);
      const y = height - padding - normalizedY * (height - 2 * padding);
      return { x, y, val };
    });

    const dPath = points.reduce((acc, point, i) => {
      return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, "");

    const areaPath = `${dPath} L ${width} ${height} L 0 ${height} Z`;

    return (
      <div className="w-full h-64 relative flex flex-col justify-end pt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          <line x1="0" y1="30" x2={width} y2="30" stroke="var(--border-custom)" strokeDasharray="4" opacity="0.4" />
          <line x1="0" y1="80" x2={width} y2="80" stroke="var(--border-custom)" strokeDasharray="4" opacity="0.4" />
          <line x1="0" y1="130" x2={width} y2="130" stroke="var(--border-custom)" strokeDasharray="4" opacity="0.4" />

          {/* Area Fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Line Path */}
          <path d={dPath} fill="none" stroke="url(#lineGradient)" strokeWidth="3.5" strokeLinecap="round" />

          {/* Data Points with Hover Values */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill="var(--primary)"
                stroke="var(--surface)"
                strokeWidth="2"
                className="transition-transform hover:scale-150 cursor-pointer"
              />
            </g>
          ))}
        </svg>

        {/* Dynamic Month Labels */}
        <div className="flex items-center justify-between text-[11px] text-text-secondary font-mono pt-3 border-t border-border-custom/40">
          {stats.monthlyRegistrations.map((m, i) => (
            <div key={i} className="flex flex-col items-center">
              <span>{m.month}</span>
              <span className="text-[10px] text-primary font-bold">{m.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const totalUsersCount = stats?.totalUsers ?? 0;
  const roleCountsDict = stats?.roleCounts ?? {};

  const rolesList = [
    { key: "PATIENT", label: "Patient (User)", color: "bg-primary" },
    { key: "DOCTOR", label: "Doctor", color: "bg-amber-500" },
    { key: "HOSPITAL_ADMIN", label: "Hospital Admin", color: "bg-cyan-500" },
    { key: "PHARMACY_ADMIN", label: "Pharmacy Admin", color: "bg-emerald-500" },
    { key: "LAB_ADMIN", label: "Lab Admin", color: "bg-purple-500" },
    { key: "ADMIN", label: "Admin", color: "bg-indigo-500" },
    { key: "SUPER_ADMIN", label: "Super Admin", color: "bg-rose-500" },
  ];

  return (
    <div className="w-full flex flex-col gap-6 px-4 md:px-8 py-6 max-w-[1600px] mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Platform Overview & Analytics</span>
            <Chip variant="soft" color="accent" className="text-xs font-mono">
              Live Database Telemetry
            </Chip>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Real-time counts, database user registration trends, role distribution & system audit logs.
          </p>
        </div>

        <Button
          variant="outline"
          onPress={handleRefresh}
          isDisabled={isRefreshing || loading}
          className="text-xs font-semibold px-4 text-text-primary flex items-center gap-2 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Analytics"}
        </Button>
      </div>

      {/* Metric Cards Row (HeroUI Skeleton supported) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Accounts */}
        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Registered Accounts</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                  {stats?.totalUsers.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center">
                  Live <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-text-secondary">Real count of users across all 7 platform roles</p>
        </Card>

        {/* Card 2: Verified Doctors */}
        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Verified Practitioners</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                  {stats?.verifiedDoctors.toLocaleString()}
                </span>
                <Chip variant="soft" color="warning" className="text-[10px] font-mono">
                  M4 Queue
                </Chip>
              </>
            )}
          </div>
          <p className="text-[11px] text-text-secondary">Credentialed doctors with verified licenses</p>
        </Card>

        {/* Card 3: Scraped Records (Coming Soon Dependent Feature) */}
        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Scraped Directory Records</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                  {stats?.scrapedRecords.toLocaleString()}
                </span>
                <Chip variant="soft" color="accent" className="text-[10px] font-mono">
                  Coming Soon
                </Chip>
              </>
            )}
          </div>
          <p className="text-[11px] text-text-secondary">M11 Scraper engine crawler cache records</p>
        </Card>

        {/* Card 4: Audit Logs */}
        <Card className="p-5 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 shadow-sm hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Audit Events Tracked</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                  {stats?.auditLogsCount.toLocaleString()}
                </span>
                <Chip variant="soft" color="success" className="text-[10px] font-mono">
                  Active
                </Chip>
              </>
            )}
          </div>
          <p className="text-[11px] text-text-secondary">Total security & RBAC audit actions logged</p>
        </Card>
      </div>

      {/* Analytics Graphs & Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph 1: Monthly Registration & Activity Trend */}
        <Card className="lg:col-span-2 p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4 shadow-md">
          <div className="flex items-center justify-between border-b border-border-custom pb-3">
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Original Database Registration Trend Curve</span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Computed from actual account creation timestamps over the past 6 months
              </p>
            </div>
            <Chip variant="soft" color="accent" className="text-[10px] font-mono">
              Prisma Query
            </Chip>
          </div>

          {loading ? (
            <div className="w-full h-64 flex flex-col gap-4 py-6">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
          ) : (
            renderSvgGraph()
          )}
        </Card>

        {/* Graph 2: Role Allocation Breakdown Chart */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4 shadow-md">
          <div className="border-b border-border-custom pb-3">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Real Role Distribution</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Live proportion of accounts by assigned RBAC role
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-32 rounded" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-2">
              {rolesList.map((item) => {
                const count = roleCountsDict[item.key] ?? 0;
                const percent = totalUsersCount > 0 ? Math.round((count / totalUsersCount) * 100) : 0;

                return (
                  <div key={item.key} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-medium text-text-primary">
                      <span>{item.label}</span>
                      <span className="font-mono text-text-secondary">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-background-custom overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Row: System Audit Activity Stream */}
      <Card className="w-full p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-custom pb-3">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Real Database Audit Action Stream</span>
          </h3>
          <Chip variant="soft" color="success" className="text-[10px] font-mono">
            AuditLog Stream
          </Chip>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !stats?.recentAuditLogs || stats.recentAuditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-secondary">
            No audit logs written yet. Every role change and account action will stream here.
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-background-custom/30 border border-border-custom/40"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[11px] text-text-primary">{log.action}</span>
                    <span className="text-[10px] font-mono text-text-secondary">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    Actor Role: <strong className="text-text-primary">{log.actorRole}</strong> · Target Entity:{" "}
                    {log.entityType ?? "SYSTEM"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
