"use client";

import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
} from "@heroui/react";
import {
  Bell,
  BellRing,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  Megaphone,
  Send,
  Sparkles,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface SearchedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export function BroadcastNotificationForm() {
  const [targetType, setTargetType] = useState<"ALL" | "ROLE" | "USER">("ALL");
  const [targetRole, setTargetRole] = useState("PATIENT");
  
  // User Search Auto-complete (Multi-Select)
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form Fields
  const [type, setType] = useState("SYSTEM");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [href, setHref] = useState("");

  // Channels
  const [channelInApp, setChannelInApp] = useState(true);
  const [channelWebPush, setChannelWebPush] = useState(true);
  const [channelEmail, setChannelEmail] = useState(false);

  // Submission State
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    targetCount: number;
    inAppCreated: number;
    webPushDelivered: number;
    emailDispatched: number;
  } | null>(null);

  // Add / Remove User from Multi-Select List
  const handleAddUser = (user: SearchedUser) => {
    if (!selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setUserQuery("");
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleAddRawEmail = () => {
    const trimmed = userQuery.trim();
    if (!trimmed) return;
    if (!selectedUsers.some((u) => u.email.toLowerCase() === trimmed.toLowerCase() || u.id === trimmed)) {
      setSelectedUsers((prev) => [
        ...prev,
        { id: trimmed, name: trimmed, email: trimmed, role: "CUSTOM" },
      ]);
    }
    setUserQuery("");
    setSearchResults([]);
  };

  // Search users API handler
  const handleSearchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.users || []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (targetType === "USER" && userQuery) {
        void handleSearchUsers(userQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery, targetType, handleSearchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please provide a notification title.");
      return;
    }
    if (!body.trim()) {
      toast.error("Please provide a message body.");
      return;
    }
    if (!channelInApp && !channelWebPush && !channelEmail) {
      toast.error("Select at least one delivery channel.");
      return;
    }
    if (targetType === "USER" && selectedUsers.length === 0 && !userQuery.trim()) {
      toast.error("Please search and select at least one target user.");
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      let targetValue: any = "ALL";
      if (targetType === "ROLE") {
        targetValue = targetRole;
      } else if (targetType === "USER") {
        const ids = selectedUsers.map((u) => u.id);
        if (userQuery.trim() && !ids.includes(userQuery.trim())) {
          ids.push(userQuery.trim());
        }
        targetValue = ids;
      }

      const response = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetValue,
          type,
          title: title.trim(),
          body: body.trim(),
          href: href.trim() || undefined,
          channels: {
            inApp: channelInApp,
            webPush: channelWebPush,
            email: channelEmail,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Broadcast delivery failed.");
      }

      toast.success(`Broadcast sent successfully to ${data.targetCount} recipient(s)!`);
      setLastResult(data);

      // Reset fields
      setTitle("");
      setBody("");
      setHref("");
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch notification broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1600px] mx-auto">
      {/* Broadcast Composer Form */}
      <Card className="lg:col-span-7 p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
        <div className="border-b border-border-custom pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              <span>Broadcast Notification Console</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Compose & dispatch targeted push notifications, bell alerts and emails.
            </p>
          </div>
          <Chip variant="soft" color="accent" className="text-[10px] font-mono font-bold uppercase">
            Admin Auth Active
          </Chip>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Target Audience Mode Tabs */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-text-primary">Target Audience Scope</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "ALL", label: "All Users", icon: Globe },
                { id: "ROLE", label: "By Role", icon: Users },
                { id: "USER", label: "Specific User", icon: User },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = targetType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTargetType(item.id as any);
                      setSelectedUsers([]);
                      setUserQuery("");
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-sm"
                        : "border-border-custom text-text-secondary hover:text-text-primary hover:bg-background-custom/40"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Parameter Conditionals */}
          {targetType === "ROLE" && (
            <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-border-custom bg-background-custom/30">
              <Label className="text-xs font-semibold text-text-primary">Target User Role</Label>
              <Select
                aria-label="Select target role"
                selectedKey={targetRole}
                onSelectionChange={(key) => setTargetRole(String(key))}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="PATIENT" textValue="Patients">
                      <Label>All Patients (PATIENT)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="DOCTOR" textValue="Doctors">
                      <Label>Verified & Pending Doctors (DOCTOR)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="HOSPITAL_ADMIN" textValue="Hospital Managers">
                      <Label>Hospital Administrators (HOSPITAL_ADMIN)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="LAB_ADMIN" textValue="Diagnostic Labs">
                      <Label>Lab Administrators (LAB_ADMIN)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="PHARMACY_ADMIN" textValue="Pharmacies">
                      <Label>Pharmacy Outlet Managers (PHARMACY_ADMIN)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="ADMIN" textValue="Platform Admins">
                      <Label>Platform Administrators (ADMIN / SUPER_ADMIN)</Label>
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          )}

          {targetType === "USER" && (
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-border-custom bg-background-custom/30">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-text-primary">
                  Target Specific Users ({selectedUsers.length} Selected)
                </Label>
                {selectedUsers.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => setSelectedUsers([])}
                    className="text-[11px] text-rose-400 hover:text-rose-300 h-6 px-2"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Selected User Cards List with Full Profile Details */}
              {selectedUsers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl border border-border-custom/80 bg-surface/50">
                  {selectedUsers.map((usr) => (
                    <div
                      key={usr.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-background-custom/60 border border-border-custom hover:border-primary/40 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar size="sm" className="w-8 h-8 shrink-0 relative overflow-hidden">
                          {usr.avatarUrl ? (
                            <img
                              src={usr.avatarUrl}
                              alt={usr.name}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Avatar.Fallback className="text-xs font-bold">
                              {usr.name.charAt(0).toUpperCase()}
                            </Avatar.Fallback>
                          )}
                        </Avatar>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-text-primary truncate">{usr.name}</span>
                            <Chip variant="soft" color="accent" className="text-[8px] font-mono shrink-0 px-1 py-0 h-4">
                              {usr.role}
                            </Chip>
                          </div>
                          <span className="text-[10px] font-mono text-text-secondary truncate">{usr.email}</span>
                          <span className="text-[9px] font-mono text-text-secondary/70 truncate">ID: {usr.id}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveUser(usr.id)}
                        className="text-text-secondary hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors ml-2 shrink-0"
                        aria-label={`Remove ${usr.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* User Search Input */}
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (searchResults.length > 0) {
                          handleAddUser(searchResults[0]);
                        } else if (userQuery.trim()) {
                          handleAddRawEmail();
                        }
                      }
                    }}
                    placeholder="Search name or email to add users..."
                    className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary w-full"
                  />
                  {isSearching && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary absolute right-3 top-3" />
                  )}

                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-custom rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {searchResults.map((usr) => {
                        const isAlreadySelected = selectedUsers.some((u) => u.id === usr.id);
                        return (
                          <button
                            key={usr.id}
                            type="button"
                            disabled={isAlreadySelected}
                            onClick={() => handleAddUser(usr)}
                            className={`w-full text-left p-3 hover:bg-primary/10 border-b border-border-custom/50 flex items-center justify-between transition-colors ${
                              isAlreadySelected ? "opacity-40 cursor-not-allowed bg-background-custom/30" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar size="sm" className="w-8 h-8 shrink-0 relative overflow-hidden">
                                {usr.avatarUrl ? (
                                  <img
                                    src={usr.avatarUrl}
                                    alt={usr.name}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <Avatar.Fallback className="text-xs font-bold">
                                    {usr.name.charAt(0).toUpperCase()}
                                  </Avatar.Fallback>
                                )}
                              </Avatar>
                              <div className="min-w-0">
                                <span className="font-semibold text-xs text-text-primary block truncate">{usr.name}</span>
                                <span className="text-[11px] text-text-secondary font-mono truncate">{usr.email}</span>
                              </div>
                            </div>

                            <Chip variant="soft" color={isAlreadySelected ? "success" : "default"} className="text-[9px] font-mono shrink-0 ml-2">
                              {isAlreadySelected ? "Selected" : usr.role}
                            </Chip>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {userQuery.trim() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => handleAddRawEmail()}
                    className="text-xs font-semibold px-3 shrink-0 h-9"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-primary" />
                    <span>Add</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Delivery Channels Selector */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-text-primary">Delivery Multi-Channels</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setChannelInApp((prev) => !prev)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  channelInApp
                    ? "bg-primary/10 border-primary/40 text-primary shadow-xs"
                    : "bg-background-custom/30 border-border-custom text-text-secondary hover:bg-background-custom/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-text-primary">In-App Bell</span>
                </div>
                <Switch
                  isSelected={channelInApp}
                  onChange={() => setChannelInApp((prev) => !prev)}
                />
              </div>

              <div
                onClick={() => setChannelWebPush((prev) => !prev)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  channelWebPush
                    ? "bg-primary/10 border-primary/40 text-primary shadow-xs"
                    : "bg-background-custom/30 border-border-custom text-text-secondary hover:bg-background-custom/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-text-primary">Web Push</span>
                </div>
                <Switch
                  isSelected={channelWebPush}
                  onChange={() => setChannelWebPush((prev) => !prev)}
                />
              </div>

              <div
                onClick={() => setChannelEmail((prev) => !prev)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  channelEmail
                    ? "bg-primary/10 border-primary/40 text-primary shadow-xs"
                    : "bg-background-custom/30 border-border-custom text-text-secondary hover:bg-background-custom/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-text-primary">Email Alert</span>
                </div>
                <Switch
                  isSelected={channelEmail}
                  onChange={() => setChannelEmail((prev) => !prev)}
                />
              </div>
            </div>
          </div>

          {/* Category & Destination Href */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-text-primary">Notification Category</Label>
              <Select
                aria-label="Select category"
                selectedKey={type}
                onSelectionChange={(key) => setType(String(key))}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="SYSTEM" textValue="System Alert">
                      <Label>System Alert (SYSTEM)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="APPOINTMENT" textValue="Appointment">
                      <Label>Appointment (APPOINTMENT)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="VERIFICATION" textValue="Verification">
                      <Label>Verification Triage (VERIFICATION)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="MEDICINE" textValue="Medicine Tracker">
                      <Label>Medicine Tracker (MEDICINE)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="LAB" textValue="Lab Report">
                      <Label>Lab Report (LAB)</Label>
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-text-primary">Action Link Target (Optional href)</Label>
              <Input
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="e.g. /appointments or /doctor/profile"
                className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
              />
            </div>
          </div>

          {/* Title & Body */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-text-primary">Notification Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled System Maintenance Notice"
              className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-text-primary">Message Body</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Write clear, informative notification instructions or updates for recipients..."
              className="px-3 py-2 border border-border-custom rounded-xl text-xs text-text-primary bg-background-custom/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-between border-t border-border-custom">
            <span className="text-xs text-text-secondary font-mono">
              Target: {targetType === "ALL" ? "All Platform Users" : targetType === "ROLE" ? `Role ${targetRole}` : selectedUsers.length > 0 ? `${selectedUsers.length} Specific User(s)` : userQuery || "Selected User(s)"}
            </span>

            <Button
              variant="primary"
              type="submit"
              isDisabled={isSending}
              className="text-xs font-semibold px-6 shadow-md"
            >
              {isSending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Send Broadcast Notification</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Live Preview Panel & Metrics */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Results Banner */}
        {lastResult && (
          <Card className="p-5 border border-emerald-500/40 bg-emerald-500/10 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-sm">Broadcast Successfully Dispatched!</h4>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-lg bg-surface/50 border border-emerald-500/30">
                <span className="text-xs text-text-secondary block">In-App DB</span>
                <span className="font-bold text-sm text-emerald-400">{lastResult.inAppCreated}</span>
              </div>
              <div className="p-2 rounded-lg bg-surface/50 border border-emerald-500/30">
                <span className="text-xs text-text-secondary block">Web Push</span>
                <span className="font-bold text-sm text-emerald-400">{lastResult.webPushDelivered}</span>
              </div>
              <div className="p-2 rounded-lg bg-surface/50 border border-emerald-500/30">
                <span className="text-xs text-text-secondary block">Email Logs</span>
                <span className="font-bold text-sm text-emerald-400">{lastResult.emailDispatched}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Live Notification Preview Box */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4 shadow-lg">
          <div className="border-b border-border-custom pb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Live Notification Preview</span>
            </h3>
            <p className="text-[11px] text-text-secondary">How recipients will see this broadcast in their notification bell drawer.</p>
          </div>

          <div className="p-4 rounded-xl bg-background-custom border border-border-custom flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <BellRing className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-text-primary truncate">
                    {title.trim() || "Notification Title Placeholder"}
                  </span>
                  <span className="text-[10px] text-text-secondary font-mono shrink-0">Just now</span>
                </div>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-3">
                  {body.trim() || "This is a preview of the message content that targeted platform users will receive."}
                </p>

                {href.trim() && (
                  <span className="inline-block mt-2 text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Target Link: {href.trim()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
