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
import { useCallback, useEffect, useState } from "react";

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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });

      if (query) params.set("search", query);
      if (roleFilter) params.set("role", roleFilter);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load users.");
      }

      setData(payload);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, query, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateUser = async (
    userId: string,
    patch: { role?: string; isActive?: boolean },
  ) => {
    setSavingId(userId);
    setError(null);

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

      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  return (
    <Card className="w-full p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg">
      <div className="flex flex-col gap-1 mb-5">
        <h2 className="text-lg font-bold text-text-primary">User Administration</h2>
        <p className="text-xs text-text-secondary">
          Search accounts, change roles, and activate or deactivate access. Every
          change is written to the audit trail.
        </p>
      </div>

      {/* Toolbar */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col sm:flex-row gap-3 mb-5"
      >
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full sm:max-w-xs"
        />
        <Select
          aria-label="Filter by role"
          className="w-full sm:w-52"
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
        <Button type="submit" variant="primary" className="font-semibold px-5 text-xs">
          Search
        </Button>
      </form>

      {error && (
        <Chip
          color="danger"
          className="w-full text-xs font-semibold py-2 px-3 mb-4 text-center"
        >
          {error}
        </Chip>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-border-custom rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-background-custom/30 text-text-secondary uppercase font-mono text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-custom/50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-text-secondary">
                  <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </td>
              </tr>
            ) : !data || data.users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-text-secondary">
                  No users match the current filters.
                </td>
              </tr>
            ) : (
              data.users.map((user) => (
                <tr key={user.id} className="text-text-primary">
                  <td className="px-4 py-3">
                    <span className="font-semibold block">{user.name}</span>
                    <span className="text-text-secondary">{user.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      aria-label={`Role for ${user.email}`}
                      className="w-44"
                      isDisabled={savingId === user.id}
                      selectedKey={user.role}
                      onSelectionChange={(key) => {
                        if (key && String(key) !== user.role) {
                          updateUser(user.id, { role: String(key) });
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
                  <td className="px-4 py-3">
                    <span className="flex flex-col gap-1">
                      <span
                        className={`w-fit text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                          user.isActive
                            ? "text-success border-success/40 bg-success/10"
                            : "text-danger border-danger/40 bg-danger/10"
                        }`}
                      >
                        {user.isActive ? "Active" : "Deactivated"}
                      </span>
                      {!user.isVerified && (
                        <span className="w-fit text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border text-warning border-warning/40 bg-warning/10">
                          Unverified
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      isDisabled={savingId === user.id}
                      onPress={() =>
                        updateUser(user.id, { isActive: !user.isActive })
                      }
                      className={`text-[11px] font-semibold px-3 ${
                        user.isActive ? "text-danger" : "text-success"
                      }`}
                    >
                      {savingId === user.id
                        ? "Saving..."
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
        <div className="flex items-center justify-between mt-4 text-xs text-text-secondary">
          <span>
            Page {data.page} of {data.totalPages} · {data.total} accounts
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              isDisabled={page <= 1 || loading}
              onPress={() => setPage((current) => current - 1)}
              className="text-xs font-semibold px-3 text-text-primary"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              isDisabled={page >= data.totalPages || loading}
              onPress={() => setPage((current) => current + 1)}
              className="text-xs font-semibold px-3 text-text-primary"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
