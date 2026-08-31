"use client";

import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Skeleton,
  Tooltip,
} from "@heroui/react";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  KeyRound,
  Lock,
  Mail,
  Pencil,
  Search,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  TableToolbar,
  TableFooter,
} from "@/components/ui/table";

function GoogleLogoIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.2.01 10.04.01 12s.46 3.8 1.28 5.42l3.99-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

const ROLES = [
  { key: "PATIENT", label: "Patient (User)" },
  { key: "DOCTOR", label: "Doctor" },
  { key: "HOSPITAL_ADMIN", label: "Hospital Admin" },
  { key: "LAB_ADMIN", label: "Lab Admin" },
  { key: "PHARMACY_ADMIN", label: "Pharmacy Admin" },
  { key: "ADMIN", label: "Admin" },
  { key: "SUPER_ADMIN", label: "Super Admin" },
] as const;

const ALL_ROLES_KEY = "ALL";
const ALL_STATUS_KEY = "ALL_STATUS";
const ALL_VERIFIED_KEY = "ALL_VERIFIED";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  authProvider?: "EMAIL" | "OAUTH" | "BOTH";
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

export function UsersManager() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Modal States
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("PATIENT");
  const [createWarning, setCreateWarning] = useState<string | null>(null);

  const [editUserTarget, setEditUserTarget] = useState<AdminUser | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserRole, setEditUserRole] = useState("");

  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });

      if (query) params.set("search", query);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (verifiedFilter) params.set("isVerified", verifiedFilter);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load users.");
      }

      setData(payload);
    } catch (err: any) {
      toast.error(err.message || "Could not fetch users list");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query, roleFilter, statusFilter, verifiedFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateUser = async (
    userId: string,
    userName: string,
    patch: { role?: string; isActive?: boolean; isVerified?: boolean; name?: string },
  ) => {
    setSavingId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to update user.");
      }

      toast.success(`User "${userName}" updated successfully.`);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user.");
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateWarning(null);

    if (!createName || !createEmail || !createPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
          role: createRole,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setCreateWarning(payload.error);
        } else {
          throw new Error(payload.error || "Failed to create account.");
        }
        return;
      }

      toast.success(`Account created for "${createEmail}".`);
      setIsCreateUserModalOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Could not provision user.");
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${passwordTarget.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || "Failed to change password.");
      }

      toast.success(`Password for "${passwordTarget.name}" changed successfully.`);
      setPasswordTarget(null);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password.");
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    setSavingId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete user.");
      }

      toast.success(`User "${userName}" was permanently deleted.`);
      setDeleteUserTarget(null);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  const handleResetFilters = () => {
    setSearch("");
    setQuery("");
    setRoleFilter("");
    setStatusFilter("");
    setVerifiedFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
    toast.info("Filters reset");
  };

  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) {
      return <ArrowDownUp className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary" />
    );
  };

  const renderAuthProviderIcon = (provider?: string) => {
    if (provider === "OAUTH") {
      return (
        <Tooltip delay={100}>
          <Tooltip.Trigger>
            <div className="w-8 h-8 rounded-lg bg-background-custom border border-border-custom flex items-center justify-center shadow-xs">
              <GoogleLogoIcon className="w-4 h-4" />
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content placement="top" className="text-xs font-mono px-2 py-1">
            Google OAuth Sign-In
          </Tooltip.Content>
        </Tooltip>
      );
    }
    if (provider === "BOTH") {
      return (
        <Tooltip delay={100}>
          <Tooltip.Trigger>
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-background-custom border border-border-custom flex items-center justify-center shadow-xs">
                <GoogleLogoIcon className="w-3.5 h-3.5" />
              </div>
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content placement="top" className="text-xs font-mono px-2 py-1">
            Email & Password + Google OAuth Linked
          </Tooltip.Content>
        </Tooltip>
      );
    }
    return (
      <Tooltip delay={100}>
        <Tooltip.Trigger>
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
            <KeyRound className="w-4 h-4" />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Content placement="top" className="text-xs font-mono px-2 py-1">
          Email & Password Auth
        </Tooltip.Content>
      </Tooltip>
    );
  };

  return (
    <Card className="w-full p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg flex flex-col gap-6">
      {/* Header with Create User Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-custom pb-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <span>User Directory & Role Governance</span>
            {data && (
              <Chip variant="soft" className="text-xs font-mono px-2 py-0.5">
                {data.total} total accounts
              </Chip>
            )}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Manage user accounts, assign roles, activate/deactivate access, and provision accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            onPress={() => setIsCreateUserModalOpen(true)}
            className="text-xs font-semibold px-4 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Provision New User
          </Button>
        </div>
      </div>

      {/* Control Toolbar (Top Filters & Refresh) */}
      <TableToolbar
        onRefresh={loadUsers}
        isRefreshing={loading}
        hasActiveFilters={Boolean(query || roleFilter || statusFilter || verifiedFilter)}
        onClearFilters={handleResetFilters}
      />

      {/* Toolbar / Filters */}
      <form
        onSubmit={handleSearchSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        {/* Search */}
        <div className="lg:col-span-2 flex items-center gap-2">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
          />
          <Button type="submit" variant="primary" className="font-semibold px-4 text-xs shrink-0 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            Search
          </Button>
        </div>

        {/* Role Filter */}
        <Select
          aria-label="Filter by role"
          className="w-full"
          selectedKey={roleFilter || ALL_ROLES_KEY}
          onSelectionChange={(key) => {
            setPage(1);
            setRoleFilter(key === ALL_ROLES_KEY ? "" : String(key ?? ""));
          }}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id={ALL_ROLES_KEY} textValue="All roles">
                <Label>All roles</Label>
              </ListBox.Item>
              {ROLES.map((role) => (
                <ListBox.Item key={role.key} id={role.key} textValue={role.label}>
                  <Label>{role.label}</Label>
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {/* Status Filter */}
        <Select
          aria-label="Filter by status"
          className="w-full"
          selectedKey={statusFilter || ALL_STATUS_KEY}
          onSelectionChange={(key) => {
            setPage(1);
            setStatusFilter(key === ALL_STATUS_KEY ? "" : String(key ?? ""));
          }}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id={ALL_STATUS_KEY} textValue="All statuses">
                <Label>All status</Label>
              </ListBox.Item>
              <ListBox.Item id="active" textValue="Active">
                <Label>Active accounts</Label>
              </ListBox.Item>
              <ListBox.Item id="deactivated" textValue="Deactivated">
                <Label>Deactivated accounts</Label>
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>

        {/* Verification Filter */}
        <Select
          aria-label="Filter by verification"
          className="w-full"
          selectedKey={verifiedFilter || ALL_VERIFIED_KEY}
          onSelectionChange={(key) => {
            setPage(1);
            setVerifiedFilter(key === ALL_VERIFIED_KEY ? "" : String(key ?? ""));
          }}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id={ALL_VERIFIED_KEY} textValue="All verification">
                <Label>All verification</Label>
              </ListBox.Item>
              <ListBox.Item id="true" textValue="Verified">
                <Label>Verified only</Label>
              </ListBox.Item>
              <ListBox.Item id="false" textValue="Unverified">
                <Label>Unverified only</Label>
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </form>

      {/* HeroUI Table Container - Edge-to-Edge full width */}
      <div className="w-full overflow-x-auto border border-border-custom rounded-lg bg-surface/30">
        <Table className="w-full text-left text-xs min-w-[800px]">
          <TableHeader className="bg-background-custom/60 text-text-secondary uppercase font-mono text-[10px] tracking-wider border-b border-border-custom">
            <TableRow>
              <TableColumn
                onClick={() => handleSortToggle("name")}
                className="px-4 py-3.5 cursor-pointer hover:text-text-primary transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>User & Avatar</span>
                  {renderSortIndicator("name")}
                </div>
              </TableColumn>
              <TableColumn className="px-4 py-3.5 select-none">Auth Method</TableColumn>
              <TableColumn
                onClick={() => handleSortToggle("role")}
                className="px-4 py-3.5 cursor-pointer hover:text-text-primary transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Assigned Role</span>
                  {renderSortIndicator("role")}
                </div>
              </TableColumn>
              <TableColumn
                onClick={() => handleSortToggle("isActive")}
                className="px-4 py-3.5 cursor-pointer hover:text-text-primary transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status & Verif</span>
                  {renderSortIndicator("isActive")}
                </div>
              </TableColumn>
              <TableColumn
                onClick={() => handleSortToggle("createdAt")}
                className="px-4 py-3.5 cursor-pointer hover:text-text-primary transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Joined Date</span>
                  {renderSortIndicator("createdAt")}
                </div>
              </TableColumn>
              <TableColumn className="px-4 py-3.5 text-right select-none">Actions</TableColumn>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border-custom/50">
            {/* Standardized HeroUI Skeleton Loading Rows */}
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                      <div className="flex flex-col gap-1.5 w-40">
                        <Skeleton className="h-3.5 w-32 rounded" />
                        <Skeleton className="h-2.5 w-24 rounded" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-8 w-44 rounded-lg" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-3 w-20 rounded" />
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : !data || data.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                    <ShieldAlert className="w-8 h-8 text-text-secondary/50" />
                    <span className="font-semibold text-text-primary">No matching users found</span>
                    <span className="text-xs">
                      Try resetting search keywords or adjusting your role/status dropdown filters.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.users.map((user) => (
                <TableRow
                  key={user.id}
                  className="text-text-primary hover:bg-surface/50 transition-colors"
                >
                  {/* User & Avatar */}
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-border-custom flex items-center justify-center font-bold text-xs text-primary shrink-0 overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-text-primary">{user.name}</span>
                        <span className="text-xs text-text-secondary font-mono">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Auth Provider */}
                  <TableCell className="px-4 py-3.5">
                    {renderAuthProviderIcon(user.authProvider)}
                  </TableCell>

                  {/* Role Selection Dropdown (Instant Role Change) */}
                  <TableCell className="px-4 py-3.5">
                    <Select
                      aria-label={`Role for ${user.email}`}
                      className="w-48"
                      isDisabled={savingId === user.id}
                      selectedKey={user.role}
                      onSelectionChange={(key) => {
                        if (key && String(key) !== user.role) {
                          updateUser(user.id, user.name, { role: String(key) });
                        }
                      }}
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {ROLES.map((r) => (
                            <ListBox.Item key={r.key} id={r.key} textValue={r.label}>
                              <Label>{r.label}</Label>
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </TableCell>

                  {/* Status badges */}
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          user.isActive
                            ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                            : "text-rose-400 border-rose-500/40 bg-rose-500/10"
                        }`}
                      >
                        {user.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {user.isActive ? "Active" : "Deactivated"}
                      </span>

                      {!user.isVerified && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border text-amber-400 border-amber-500/40 bg-amber-500/10">
                          Unverified
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Joined Date */}
                  <TableCell className="px-4 py-3.5 text-text-secondary font-mono text-xs">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>

                  {/* Action controls */}
                  <TableCell className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Change Password Modal Trigger */}
                      <Tooltip delay={100}>
                        <Tooltip.Trigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="outline"
                            isDisabled={savingId === user.id}
                            onPress={() => {
                              setPasswordTarget(user);
                              setNewPassword("");
                            }}
                            className="text-text-secondary hover:text-text-primary border-border-custom"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content placement="top" className="text-xs font-mono px-2 py-1">
                          Change Password
                        </Tooltip.Content>
                      </Tooltip>

                      {/* Edit Details Modal Trigger */}
                      <Tooltip delay={100}>
                        <Tooltip.Trigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="outline"
                            isDisabled={savingId === user.id}
                            onPress={() => {
                              setEditUserTarget(user);
                              setEditUserName(user.name);
                              setEditUserRole(user.role);
                            }}
                            className="text-text-secondary hover:text-text-primary border-border-custom"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content placement="top" className="text-xs font-mono px-2 py-1">
                          Edit User Details
                        </Tooltip.Content>
                      </Tooltip>

                      {/* Delete Modal Trigger */}
                      <Tooltip delay={100}>
                        <Tooltip.Trigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="outline"
                            isDisabled={savingId === user.id}
                            onPress={() => setDeleteUserTarget(user)}
                            className="text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content placement="top" className="text-xs font-mono px-2 py-1">
                          Delete User
                        </Tooltip.Content>
                      </Tooltip>

                      {/* Doctor Verification Icon Toggle Control */}
                      {user.role === "DOCTOR" && (
                        <Tooltip delay={100}>
                          <Tooltip.Trigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="outline"
                              isDisabled={savingId === user.id}
                              onPress={() =>
                                updateUser(user.id, user.name, { isVerified: !user.isVerified })
                              }
                              className={`border-border-custom ${
                                user.isVerified
                                  ? "text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
                                  : "text-emerald-400 hover:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                              }`}
                            >
                              {user.isVerified ? (
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </Button>
                          </Tooltip.Trigger>
                          <Tooltip.Content placement="top" className="text-xs font-mono px-2 py-1">
                            {user.isVerified ? "Revoke Verification (Unverify Doctor)" : "Verify Doctor Credentials"}
                          </Tooltip.Content>
                        </Tooltip>
                      )}

                      {/* Deactivate/Activate Toggle */}
                      <Button
                        variant="outline"
                        isDisabled={savingId === user.id}
                        onPress={() =>
                          updateUser(user.id, user.name, { isActive: !user.isActive })
                        }
                        className={`text-xs font-semibold px-2.5 py-1 ${
                          user.isActive
                            ? "text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                            : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        }`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Bottom Control Footer */}
      <TableFooter
        showingCount={data?.users.length || 0}
        totalCount={data?.total || 0}
        entityLabel="users"
        pageSize={pageSize}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        page={data?.page || page}
        totalPages={data?.totalPages || 1}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Create New User Modal */}
      {isCreateUserModalOpen && (
        <Modal.Root isOpen={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
          <Modal.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 outline-none animate-in fade-in">
            <Modal.Dialog className="w-full max-w-lg h-fit max-h-[90vh] overflow-y-auto p-6 bg-surface border border-border-custom rounded-2xl shadow-2xl flex flex-col gap-4 outline-none pointer-events-auto">
              <form onSubmit={handleCreateUserSubmit} className="flex flex-col gap-4">
                <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    Provision New User Account
                  </h3>
                  <Modal.CloseTrigger className="text-text-secondary hover:text-text-primary p-1">
                    <X className="w-4 h-4" />
                  </Modal.CloseTrigger>
                </Modal.Header>

                <Modal.Body className="flex flex-col gap-3 py-2">
                  {createWarning && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                      {createWarning}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Full Name</Label>
                    <Input
                      placeholder="e.g. Dr. Alexander Fleming"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="e.g. alexander@medicio.com"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Initial Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Assign Platform Role</Label>
                    <Select
                      aria-label="Assign role for new user"
                      selectedKey={createRole}
                      onSelectionChange={(key) => setCreateRole(String(key))}
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {ROLES.map((r) => (
                            <ListBox.Item key={r.key} id={r.key} textValue={r.label}>
                              <Label>{r.label}</Label>
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                </Modal.Body>

                <Modal.Footer className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
                  <Button
                    variant="outline"
                    type="button"
                    onPress={() => setIsCreateUserModalOpen(false)}
                    className="text-xs font-semibold px-4"
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" className="text-xs font-semibold px-5">
                    Provision User
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}

      {/* Admin Password Change Modal */}
      {passwordTarget && (
        <Modal.Root isOpen={!!passwordTarget} onOpenChange={() => setPasswordTarget(null)}>
          <Modal.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 outline-none animate-in fade-in">
            <Modal.Dialog className="w-full max-w-md h-fit max-h-[90vh] overflow-y-auto p-6 bg-surface border border-border-custom rounded-2xl shadow-2xl flex flex-col gap-4 outline-none pointer-events-auto">
              <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-4">
                <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500" />
                    Change User Password
                  </h3>
                  <Modal.CloseTrigger className="text-text-secondary hover:text-text-primary p-1">
                    <X className="w-4 h-4" />
                  </Modal.CloseTrigger>
                </Modal.Header>

                <Modal.Body className="flex flex-col gap-3 py-2">
                  <p className="text-xs text-text-secondary">
                    Set a new password for <strong className="text-text-primary">{passwordTarget.name}</strong> ({passwordTarget.email}).
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">New Password</Label>
                    <Input
                      type="password"
                      placeholder="At least 6 characters..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                    />
                  </div>
                </Modal.Body>

                <Modal.Footer className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
                  <Button
                    variant="outline"
                    type="button"
                    onPress={() => setPasswordTarget(null)}
                    className="text-xs font-semibold px-4"
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" className="text-xs font-semibold px-5">
                    Update Password
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserTarget && (
        <Modal.Root isOpen={!!deleteUserTarget} onOpenChange={() => setDeleteUserTarget(null)}>
          <Modal.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 outline-none animate-in fade-in">
            <Modal.Dialog className="w-full max-w-md h-fit max-h-[90vh] overflow-y-auto p-6 bg-surface border border-border-custom rounded-2xl shadow-2xl flex flex-col gap-4 outline-none pointer-events-auto">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Confirm User Deletion
                </h3>
                <Modal.CloseTrigger className="text-text-secondary hover:text-text-primary p-1">
                  <X className="w-4 h-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-3 py-2 text-xs text-text-secondary">
                <p>
                  Are you sure you want to permanently delete <strong className="text-text-primary">{deleteUserTarget.name}</strong> ({deleteUserTarget.email})?
                </p>
                <p className="text-rose-400 font-semibold">
                  This action cannot be undone. All linked profile data and appointments will be permanently removed.
                </p>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
                <Button
                  variant="outline"
                  onPress={() => setDeleteUserTarget(null)}
                  className="text-xs font-semibold px-4"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onPress={() => deleteUser(deleteUserTarget.id, deleteUserTarget.name)}
                  className="text-xs font-semibold px-5 bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Permanently Delete
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}

      {/* Edit User Modal */}
      {editUserTarget && (
        <Modal.Root isOpen={!!editUserTarget} onOpenChange={() => setEditUserTarget(null)}>
          <Modal.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 outline-none animate-in fade-in">
            <Modal.Dialog className="w-full max-w-md h-fit max-h-[90vh] overflow-y-auto p-6 bg-surface border border-border-custom rounded-2xl shadow-2xl flex flex-col gap-4 outline-none pointer-events-auto">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="text-base font-bold text-text-primary">Edit User Details</h3>
                <Modal.CloseTrigger className="text-text-secondary hover:text-text-primary p-1">
                  <X className="w-4 h-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-3 py-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-primary">Full Name</Label>
                  <Input
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-primary">Assigned Role</Label>
                  <Select
                    aria-label="Edit assigned role"
                    selectedKey={editUserRole}
                    onSelectionChange={(key) => setEditUserRole(String(key))}
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {ROLES.map((r) => (
                          <ListBox.Item key={r.key} id={r.key} textValue={r.label}>
                            <Label>{r.label}</Label>
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
                <Button
                  variant="outline"
                  onPress={() => setEditUserTarget(null)}
                  className="text-xs font-semibold px-4"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onPress={async () => {
                    await updateUser(editUserTarget.id, editUserName, {
                      name: editUserName,
                      role: editUserRole,
                    });
                    setEditUserTarget(null);
                  }}
                  className="text-xs font-semibold px-5"
                >
                  Save Changes
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}
    </Card>
  );
}
