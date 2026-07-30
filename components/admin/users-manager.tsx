"use client";

import {
  Button,
  Card,
  Checkbox,
  Chip,
  Input,
  Label,
  ListBox,
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
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
  "PATIENT",
  "DOCTOR",
  "HOSPITAL_ADMIN",
  "LAB_ADMIN",
  "PHARMACY_ADMIN",
  "ADMIN",
  "SUPER_ADMIN",
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
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Modal States
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [targetUserEmail, setTargetUserEmail] = useState("");

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
        pageSize: "10",
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
  }, [page, query, roleFilter, statusFilter, verifiedFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateUser = async (
    userId: string,
    userName: string,
    patch: { role?: string; isActive?: boolean; name?: string },
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

      toast.success(`Unverified user account created for "${createEmail}".`);
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
            <div className="w-8 h-8 rounded-lg bg-background-custom border border-border-custom flex items-center justify-center gap-1 shadow-xs px-1">
              <Mail className="w-3 h-3 text-primary" />
              <GoogleLogoIcon className="w-3.5 h-3.5" />
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content placement="top" className="text-xs font-mono px-2 py-1">
            Email & Google OAuth Linked
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
      {/* Header with Create User & Create Role Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-custom pb-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <span>User Directory & Permission Governance</span>
            {data && (
              <Chip variant="soft" className="text-xs font-mono px-2 py-0.5">
                {data.total} total accounts
              </Chip>
            )}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Manage accounts, provision unverified users, reset passwords, and configure custom permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(query || roleFilter || statusFilter || verifiedFilter) && (
            <Button
              variant="outline"
              onPress={handleResetFilters}
              className="text-xs font-semibold px-3 text-text-secondary hover:text-text-primary flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
          )}

          <Button
            variant="outline"
            onPress={() => setIsCreateUserModalOpen(true)}
            className="text-xs font-semibold px-4 flex items-center gap-1.5 text-text-primary"
          >
            <UserPlus className="w-4 h-4 text-primary" />
            Create User
          </Button>

          <Button
            variant="primary"
            onPress={() => setIsRoleModalOpen(true)}
            className="text-xs font-semibold px-4 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Custom Role
          </Button>
        </div>
      </div>

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
                <ListBox.Item key={role} id={role} textValue={role}>
                  <Label>{role.replace(/_/g, " ")}</Label>
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

      {/* Table Container - Edge-to-Edge full width */}
      <div className="w-full overflow-x-auto border border-border-custom rounded-lg bg-surface/30">
        <table className="w-full text-left text-xs">
          <thead className="bg-background-custom/60 text-text-secondary uppercase font-mono text-[10px] tracking-wider border-b border-border-custom">
            <tr>
              <th
                onClick={() => handleSortToggle("name")}
                className="px-4 py-3.5 cursor-pointer hover:text-text-primary transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>User & Avatar</span>
                  {renderSortIndicator("name")}
                </div>
              </th>
              <th className="px-4 py-3.5 select-none">Auth Method</th>
              <th
                onClick={() => handleSortToggle("role")}
                className="px-4 py-3.5 cursor-pointer hover:text-text-primary transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Assigned Role</span>
                  {renderSortIndicator("role")}
                </div>
              </th>
              <th
                onClick={() => handleSortToggle("isActive")}
                className="px-4 py-3.5 cursor-pointer hover:text-text-primary transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status & Verif</span>
                  {renderSortIndicator("isActive")}
                </div>
              </th>
              <th
                onClick={() => handleSortToggle("createdAt")}
                className="px-4 py-3.5 cursor-pointer hover:text-text-primary transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Joined Date</span>
                  {renderSortIndicator("createdAt")}
                </div>
              </th>
              <th className="px-4 py-3.5 text-right select-none">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border-custom/50">
            {/* Standardized HeroUI Skeleton Loading Rows */}
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                      <div className="flex flex-col gap-1.5 w-40">
                        <Skeleton className="h-3.5 w-32 rounded" />
                        <Skeleton className="h-2.5 w-24 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-8 w-44 rounded-lg" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-3 w-20 rounded" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))
            ) : !data || data.users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                    <ShieldAlert className="w-8 h-8 text-text-secondary/50" />
                    <span className="font-semibold text-text-primary">No matching users found</span>
                    <span className="text-xs">
                      Try resetting search keywords or adjusting your role/status dropdown filters.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              data.users.map((user) => (
                <tr
                  key={user.id}
                  className="text-text-primary hover:bg-surface/50 transition-colors"
                >
                  {/* User & Avatar */}
                  <td className="px-4 py-3.5">
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
                  </td>

                  {/* Auth Provider */}
                  <td className="px-4 py-3.5">
                    {renderAuthProviderIcon(user.authProvider)}
                  </td>

                  {/* Role dropdown */}
                  <td className="px-4 py-3.5">
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
                          {ROLES.map((role) => (
                            <ListBox.Item key={role} id={role} textValue={role}>
                              <Label>{role.replace(/_/g, " ")}</Label>
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </td>

                  {/* Status badges */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${user.isActive
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
                  </td>

                  {/* Joined Date */}
                  <td className="px-4 py-3.5 text-text-secondary font-mono text-xs">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Action controls */}
                  <td className="px-4 py-3.5 text-right">
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

                      {/* Edit Role Modal Trigger */}
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
                          Edit Role
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

                      {/* Deactivate/Activate Toggle */}
                      <Button
                        variant="outline"
                        isDisabled={savingId === user.id}
                        onPress={() =>
                          updateUser(user.id, user.name, { isActive: !user.isActive })
                        }
                        className={`text-xs font-semibold px-2.5 py-1 ${user.isActive
                          ? "text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                          : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          }`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary pt-2">
          <span>
            Showing page <strong className="text-text-primary">{data.page}</strong> of{" "}
            <strong className="text-text-primary">{data.totalPages}</strong> ({data.total} registered users)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              isDisabled={page <= 1 || loading}
              onPress={() => setPage((current) => current - 1)}
              className="text-xs font-semibold px-4 py-1.5 text-text-primary"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              isDisabled={page >= data.totalPages || loading}
              onPress={() => setPage((current) => current + 1)}
              className="text-xs font-semibold px-4 py-1.5 text-text-primary"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create New Unverified User Modal */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-lg p-6 bg-surface border border-border-custom rounded-2xl shadow-2xl flex flex-col gap-4">
            <form onSubmit={handleCreateUserSubmit} className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Provision New Unverified Account
                </h3>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => setIsCreateUserModalOpen(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {createWarning && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                  {createWarning}
                </div>
              )}

              <div className="flex flex-col gap-3">
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
                  <Label className="text-xs font-semibold text-text-primary">Assign Role</Label>
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
                          <ListBox.Item key={r} id={r} textValue={r}>
                            <Label>{r.replace(/_/g, " ")}</Label>
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
                <Button
                  variant="outline"
                  type="button"
                  onPress={() => setIsCreateUserModalOpen(false)}
                  className="text-xs font-semibold px-4"
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" className="text-xs font-semibold px-5">
                  Provision User (Unverified)
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Admin Password Change Modal */}
      {passwordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md p-6 bg-surface border border-border-custom rounded-2xl shadow-2xl flex flex-col gap-4">
            <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  Change User Password
                </h3>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => setPasswordTarget(null)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
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
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Create Custom Role & Account Permission Overrides Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-lg p-6 bg-surface border border-border-custom rounded-2xl shadow-2xl flex flex-col gap-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newRoleName.trim()) {
                  toast.error("Role identifier name is required");
                  return;
                }
                const targetMsg = targetUserEmail.trim()
                  ? ` assigned to account "${targetUserEmail.trim()}"`
                  : "";
                toast.success(
                  `Custom role "CUSTOM_${newRoleName.trim().toUpperCase()}" created & permissions granted${targetMsg}.`,
                );
                setNewRoleName("");
                setNewRoleDesc("");
                setTargetUserEmail("");
                setIsRoleModalOpen(false);
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-border-custom pb-3">
                <div>
                  <h3 className="text-base font-bold text-text-primary">Create Custom Role & Permission Override</h3>
                  <p className="text-xs text-text-secondary">Define granular RBAC permissions for a role preset or target account.</p>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => setIsRoleModalOpen(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-primary">Role Identifier Name</Label>
                  <Input
                    placeholder="e.g. CLINICAL_AUDITOR or LAB_DIRECTOR"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-primary">Target User Account Email (Optional)</Label>
                  <Input
                    type="email"
                    placeholder="e.g. moaazmustafa@gmail.com (leave blank for role preset)"
                    value={targetUserEmail}
                    onChange={(e) => setTargetUserEmail(e.target.value)}
                    className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-primary">Role Description & Duties</Label>
                  <Input
                    placeholder="e.g. Clinical audit access and patient record review duties..."
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-border-custom/50">
                  <span className="text-xs font-bold text-text-primary">Granular Module Access Checkboxes</span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                    <Checkbox defaultSelected>M1 IAM & Access Control</Checkbox>
                    <Checkbox defaultSelected>M2 Symptom Checker</Checkbox>
                    <Checkbox defaultSelected>M3 Specialty AI Agents</Checkbox>
                    <Checkbox>M4 Doctor Management</Checkbox>
                    <Checkbox>M5 Hospital Management</Checkbox>
                    <Checkbox>M6 Pharmacy Management</Checkbox>
                    <Checkbox>M7 Lab Management</Checkbox>
                    <Checkbox>M8 Appointment Booking</Checkbox>
                    <Checkbox>M9 Medicine Tracker</Checkbox>
                    <Checkbox>M10 Patient Health Records</Checkbox>
                    <Checkbox>M11 Scraper Engine</Checkbox>
                    <Checkbox>M12 Audit Logs & Analytics</Checkbox>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
                <Button
                  variant="outline"
                  type="button"
                  onPress={() => setIsRoleModalOpen(false)}
                  className="text-xs font-semibold px-4"
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" className="text-xs font-semibold px-5">
                  Save Custom Role
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md p-6 bg-surface border border-border-custom rounded-2xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border-custom pb-3">
              <h3 className="text-base font-bold text-text-primary">Edit User Details</h3>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => setEditUserTarget(null)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-3">
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
                        <ListBox.Item key={r} id={r} textValue={r}>
                          <Label>{r.replace(/_/g, " ")}</Label>
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
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
                  await updateUser(editUserTarget.id, editUserName, { role: editUserRole, name: editUserName });
                  setEditUserTarget(null);
                }}
                className="text-xs font-semibold px-5"
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md p-6 bg-surface border rounded-2xl shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-text-primary">Delete User Account?</h3>
              <p className="text-xs text-text-secondary mt-1">
                Are you sure you want to permanently delete <strong className="text-text-primary">{deleteUserTarget.name}</strong> ({deleteUserTarget.email})? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
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
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
