"use client";

import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
} from "@heroui/react";
import {
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
    patch: { role?: string; isActive?: boolean },
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

      const updateDetail =
        patch.role !== undefined
          ? `role changed to ${patch.role.replace(/_/g, " ")}`
          : patch.isActive !== undefined
            ? patch.isActive
              ? "account activated"
              : "account deactivated"
            : "account updated";

      toast.success(`User "${userName}" updated successfully (${updateDetail}).`);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status.");
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
    toast.info("All search filters reset");
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

  return (
    <Card className="w-full p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <span>User Directory & Permissions</span>
            {data && (
              <Chip variant="soft" className="text-xs font-mono px-2 py-0.5">
                {data.total} total accounts
              </Chip>
            )}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Search accounts, reassign RBAC roles, toggle access states, and filter user verification.
          </p>
        </div>

        {(query || roleFilter || statusFilter || verifiedFilter) && (
          <Button
            variant="outline"
            onPress={handleResetFilters}
            className="text-xs font-semibold px-3 text-text-secondary hover:text-text-primary w-fit flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </Button>
        )}
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
                  <span>User Info</span>
                  {renderSortIndicator("name")}
                </div>
              </th>
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
              <th className="px-4 py-3.5 text-right select-none">Action Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-custom/50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center gap-2">
                    <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Loading accounts directory...</span>
                  </div>
                </td>
              </tr>
            ) : !data || data.users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-text-secondary">
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
                  {/* User info */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-text-primary">{user.name}</span>
                      <span className="text-xs text-text-secondary font-mono">{user.email}</span>
                    </div>
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
                  </td>

                  {/* Joined Date */}
                  <td className="px-4 py-3.5 text-text-secondary font-mono text-xs">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      variant="outline"
                      isDisabled={savingId === user.id}
                      onPress={() =>
                        updateUser(user.id, user.name, { isActive: !user.isActive })
                      }
                      className={`text-xs font-semibold px-3 py-1 ${
                        user.isActive
                          ? "text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                          : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      }`}
                    >
                      {savingId === user.id
                        ? "Updating..."
                        : user.isActive
                          ? "Deactivate"
                          : "Activate"}
                    </Button>
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
    </Card>
  );
}
