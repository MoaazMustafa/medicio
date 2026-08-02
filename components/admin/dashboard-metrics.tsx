"use client";

import { Button, Card, Chip, Skeleton } from "@heroui/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
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
  sparklines?: {
    users: number[];
    doctors: number[];
    auditLogs: number[];
    scraped: number[];
  };
  growth?: {
    users: string;
    doctors: string;
    auditLogs: string;
    scraped: string;
  };
  recentAuditLogs: {
    id: string;
    action: string;
    actorRole: string;
    entityType?: string | null;
    createdAt: string;
    metadata?: any;
  }[];
}

/**
 * Custom SVG Sparkline Mini Graph Component matching user's reference design
 */
function Sparkline({
  data,
  color = "blue",
}: {
  data: number[];
  color?: "blue" | "emerald" | "amber" | "rose";
}) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 140;
  const height = 48;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 12) - 6;
    return { x, y };
  });

  // Generate smooth cubic bezier curve
  let dPath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    dPath += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaPath = `${dPath} L ${width} ${height} L 0 ${height} Z`;

  const colorMap = {
    blue: { stroke: "#3b82f6", stop: "#3b82f6" },
    emerald: { stroke: "#10b981", stop: "#10b981" },
    amber: { stroke: "#f59e0b", stop: "#f59e0b" },
    rose: { stroke: "#f43f5e", stop: "#f43f5e" },
  };

  const selectedColor = colorMap[color] || colorMap.blue;
  const gradientId = `sparkline-gradient-${color}-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-28 sm:w-36 h-12 overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={selectedColor.stop} stopOpacity="0.35" />
          <stop offset="100%" stopColor={selectedColor.stop} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={dPath}
        fill="none"
        stroke={selectedColor.stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashboardMetrics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ month: string; count: number; x: number; y: number } | null>(null);

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

  // Main Registration Curve Area Graph Render
  const renderUserTrendChart = () => {
    if (!stats || !stats.monthlyRegistrations || stats.monthlyRegistrations.length === 0) {
      return null;
    }

    const counts = stats.monthlyRegistrations.map((m) => m.count);
    const maxVal = Math.max(...counts, 1);
    const minVal = Math.min(...counts, 0);
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 220;
    const padding = 30;

    const points = stats.monthlyRegistrations.map((item, idx) => {
      const x = padding + (idx / (stats.monthlyRegistrations.length - 1)) * (width - 2 * padding);
      const normalizedY = (item.count - minVal) / range;
      const y = height - padding - normalizedY * (height - 2 * padding);
      return { x, y, month: item.month, count: item.count };
    });

    let dPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      dPath += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaPath = `${dPath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

    return (
      <div className="w-full relative flex flex-col justify-end pt-2 min-w-0 overflow-hidden">
        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none px-3 py-1.5 rounded-lg bg-surface border border-primary/40 shadow-xl text-xs flex flex-col gap-0.5 transition-all duration-150"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 60}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <span className="text-[10px] font-mono text-text-secondary">{hoveredPoint.month}</span>
            <span className="font-bold text-primary text-sm">{hoveredPoint.count} Registrations</span>
          </div>
        )}

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mainAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="mainLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="50%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1="40" x2={width - padding} y2="40" stroke="var(--border-custom)" strokeDasharray="4" opacity="0.35" />
          <line x1={padding} y1="95" x2={width - padding} y2="95" stroke="var(--border-custom)" strokeDasharray="4" opacity="0.35" />
          <line x1={padding} y1="150" x2={width - padding} y2="150" stroke="var(--border-custom)" strokeDasharray="4" opacity="0.35" />

          {/* Area Fill */}
          <path d={areaPath} fill="url(#mainAreaGradient)" />

          {/* Line Path */}
          <path d={dPath} fill="none" stroke="url(#mainLineGradient)" strokeWidth="3.5" strokeLinecap="round" />

          {/* Interactive Data Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="6"
                fill="var(--primary)"
                stroke="var(--surface)"
                strokeWidth="2.5"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="transition-transform duration-200 hover:scale-150 cursor-pointer"
              />
            </g>
          ))}
        </svg>

        {/* Dynamic Month Labels */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-text-secondary font-mono pt-3 border-t border-border-custom/40 overflow-x-auto gap-2">
          {stats.monthlyRegistrations.map((m, i) => (
            <div key={i} className="flex flex-col items-center min-w-0">
              <span className="truncate">{m.month}</span>
              <span className="text-[10px] sm:text-xs text-primary font-bold">{m.count} users</span>
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

  // Real 6-month historical sparkline arrays calculated directly from PostgreSQL
  const regSparkline = stats?.sparklines?.users ?? [0, 0, 0, 0, 0, stats?.totalUsers ?? 0];
  const docSparkline = stats?.sparklines?.doctors ?? [0, 0, 0, 0, 0, stats?.verifiedDoctors ?? 0];
  const scraperSparkline = stats?.sparklines?.scraped ?? [0, 0, 0, 0, 0, stats?.scrapedRecords ?? 0];
  const auditSparkline = stats?.sparklines?.auditLogs ?? [0, 0, 0, 0, 0, stats?.auditLogsCount ?? 0];

  return (
    <div className="w-full flex flex-col gap-6 px-4 md:px-8 py-6 max-w-[1600px] mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Platform Overview & Telemetry</span>
            <Chip variant="soft" color="accent" className="text-xs font-mono">
              Live Database Telemetry
            </Chip>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Real-time accounts, user registration trends, role distribution & system audit logs.
          </p>
        </div>

        <Button
          variant="outline"
          onPress={handleRefresh}
          isDisabled={isRefreshing || loading}
          className="text-xs font-semibold px-4 text-text-primary flex items-center gap-2 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Telemetry"}
        </Button>
      </div>

      {/* Metric Cards Row with Inline Right-Aligned Sparkline Graphs (Calculated Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Accounts */}
        <Card className="p-5 border border-border-custom bg-surface/60 backdrop-blur-md flex items-center justify-between shadow-sm hover:border-primary/40 transition-all">
          <div className="flex flex-col justify-between gap-3 min-w-0">
            <span className="text-xs text-text-secondary font-medium truncate">Total Registered Accounts</span>
            {loading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.totalUsers.toLocaleString()}
              </span>
            )}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              <span>{stats?.growth?.users ?? "+0%"} MoM Growth</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-end pl-2">
            <Sparkline data={regSparkline} color="blue" />
          </div>
        </Card>

        {/* Card 2: Verified Doctors */}
        <Card className="p-5 border border-border-custom bg-surface/60 backdrop-blur-md flex items-center justify-between shadow-sm hover:border-amber-500/40 transition-all">
          <div className="flex flex-col justify-between gap-3 min-w-0">
            <span className="text-xs text-text-secondary font-medium truncate">Verified Practitioners</span>
            {loading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.verifiedDoctors.toLocaleString()}
              </span>
            )}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              <span>{stats?.growth?.doctors ?? "+0%"} MoM Growth</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-end pl-2">
            <Sparkline data={docSparkline} color="amber" />
          </div>
        </Card>

        {/* Card 3: Directory Scraper Cache */}
        <Card className="p-5 border border-border-custom bg-surface/60 backdrop-blur-md flex items-center justify-between shadow-sm hover:border-rose-500/40 transition-all">
          <div className="flex flex-col justify-between gap-3 min-w-0">
            <span className="text-xs text-text-secondary font-medium truncate">Scraped Directory Records</span>
            {loading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.scrapedRecords.toLocaleString()}
              </span>
            )}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
              <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
              <span>{stats?.growth?.scraped ?? "+0%"} MoM Growth</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-end pl-2">
            <Sparkline data={scraperSparkline} color="rose" />
          </div>
        </Card>

        {/* Card 4: System Audit Events */}
        <Card className="p-5 border border-border-custom bg-surface/60 backdrop-blur-md flex items-center justify-between shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex flex-col justify-between gap-3 min-w-0">
            <span className="text-xs text-text-secondary font-medium truncate">Audit Events Tracked</span>
            {loading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.auditLogsCount.toLocaleString()}
              </span>
            )}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              <span>{stats?.growth?.auditLogs ?? "+0%"} MoM Growth</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-end pl-2">
            <Sparkline data={auditSparkline} color="emerald" />
          </div>
        </Card>
      </div>

      {/* Analytics Graphs & Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph 1: Monthly Registration & Activity Curve */}
        <Card className="lg:col-span-2 p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4 shadow-md">
          <div className="flex items-center justify-between border-b border-border-custom pb-3">
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>User Registration Trend Curve</span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Calculated from actual database account creations (Hover over data nodes to inspect counts)
              </p>
            </div>
            <Chip variant="soft" color="accent" className="text-[10px] font-mono">
              Real Database Data
            </Chip>
          </div>

          {loading ? (
            <div className="w-full h-64 flex flex-col gap-4 py-6">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
          ) : (
            renderUserTrendChart()
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
