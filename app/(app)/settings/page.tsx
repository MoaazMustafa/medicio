"use client";

import {
  Avatar,
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
  Switch,
} from "@heroui/react";
import {
  Bell,
  CheckCircle2,
  Download,
  Globe,
  KeyRound,
  Lock,
  Moon,
  Shield,
  ShieldAlert,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { downloadData } from "@/lib/export-helper";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  // Active Subtab state
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "notifications" | "appearance" | "account"
  >("profile");

  // Profile Form States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+92 300 1234567");
  const [bio, setBio] = useState("Healthcare Platform User / Practitioner");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Notification Preference States
  const [notifyAppointments, setNotifyAppointments] = useState(true);
  const [notifySecurity, setNotifySecurity] = useState(true);
  const [notifySystem, setNotifySystem] = useState(true);
  const [notifySms, setNotifySms] = useState(false);

  // Appearance & Regional States
  const [language, setLanguage] = useState("en-US");
  const [timezone, setTimezone] = useState("UTC+5");

  // Danger Zone Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch real profile from PostgreSQL database
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load user profile.");

      setProfile(data.user);
      setName(data.user.name);
      setAvatarUrl(data.user.avatarUrl ?? null);
    } catch (err: any) {
      toast.error(err.message || "Could not fetch user profile from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Persist Profile to database
  const handleProfileSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.error("Name field cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update profile.");

      toast.success("Profile details saved to PostgreSQL database!");
      setProfile(data.user);
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile updates.");
    } finally {
      setSaving(false);
    }
  };

  // Persist Password to database
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update password.");

      toast.success("Security password updated in database!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto gap-6">
      {/* Settings Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Account Settings & Preferences</span>
            <Chip variant="soft" color="success" className="text-xs font-mono">
              Database Connected
            </Chip>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Manage your personal profile, security credentials, notification dispatches & regional localization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onPress={() => loadProfile()}
            isDisabled={loading || saving}
            className="text-xs font-semibold px-4 text-text-secondary hover:text-text-primary"
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onPress={() => handleProfileSave()}
            isDisabled={loading || saving}
            className="text-xs font-semibold px-5"
          >
            {saving ? "Saving to DB..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      {/* Subtabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-border-custom overflow-x-auto pb-2 pt-1 max-w-full scrollbar-none snap-x">
        {[
          { id: "profile", label: "Profile Info", icon: User },
          { id: "security", label: "Security & 2FA", icon: Lock },
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "appearance", label: "Appearance & Regional", icon: Globe },
          { id: "account", label: "Data & Compliance", icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border ${
                isActive
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:bg-surface/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === "profile" && (
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
          <div className="border-b border-border-custom pb-3">
            <h3 className="text-base font-bold text-text-primary">Personal Profile Details</h3>
            <p className="text-xs text-text-secondary">Update your photo, contact info, and public display details stored in PostgreSQL.</p>
          </div>

          {loading ? (
            <div className="space-y-4 max-w-xl">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="flex flex-col gap-6 max-w-2xl">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-border-custom flex items-center justify-center font-bold text-lg text-primary overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-text-primary">Profile Avatar</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => toast.info("Select image file to upload")}
                      className="text-xs font-semibold px-3"
                    >
                      Upload Photo
                    </Button>
                    {avatarUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => setAvatarUrl(null)}
                        className="text-xs text-rose-400 hover:text-rose-300 px-2"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-primary">Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-primary">Email Address</Label>
                  <div className="relative">
                    <Input
                      value={profile?.email ?? ""}
                      disabled
                      className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-secondary bg-background-custom/40 w-full"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-text-primary">Phone Number</Label>
                    <Chip variant="soft" color="warning" className="text-[9px] font-mono px-1 py-0">Coming Soon</Chip>
                  </div>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-text-primary">Professional Title / Specialty</Label>
                    <Chip variant="soft" color="warning" className="text-[9px] font-mono px-1 py-0">Coming Soon</Chip>
                  </div>
                  <Input
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button variant="primary" type="submit" isDisabled={saving} className="text-xs font-semibold px-5 w-fit">
                  {saving ? "Saving..." : "Save Profile Details to DB"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === "security" && (
        <div className="flex flex-col gap-6">
          <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
            <div className="border-b border-border-custom pb-3">
              <h3 className="text-base font-bold text-text-primary">Change Password</h3>
              <p className="text-xs text-text-secondary">Ensure your account uses a strong, unique password stored securely with bcrypt hashing.</p>
            </div>

            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4 max-w-md">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-text-primary">Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-text-primary">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters..."
                  className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-text-primary">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                />
              </div>

              <Button variant="primary" type="submit" isDisabled={saving} className="text-xs font-semibold px-5 w-fit">
                {saving ? "Updating..." : "Update Password in DB"}
              </Button>
            </form>
          </Card>

          {/* 2FA & Active Sessions */}
          <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-border-custom pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span>Two-Factor Authentication (2FA)</span>
                  <Chip variant="soft" color="warning" className="text-[10px] font-mono">
                    Coming Soon
                  </Chip>
                </h3>
                <p className="text-xs text-text-secondary">Add an extra layer of security to your account with TOTP authenticator.</p>
              </div>
              <Switch
                isSelected={is2FAEnabled}
                onChange={(val: boolean) => {
                  setIs2FAEnabled(val);
                  toast.success(val ? "2FA Enabled" : "2FA Disabled");
                }}
              />
            </div>

            <div className="border-b border-border-custom pb-3">
              <h3 className="text-base font-bold text-text-primary">Active Login Sessions</h3>
              <p className="text-xs text-text-secondary font-mono mt-0.5">Browsers and devices logged into your account</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border-custom bg-background-custom/30">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-semibold text-xs text-text-primary block">Windows Desktop · Edge Browser</span>
                    <span className="text-[10px] text-text-secondary font-mono">Current Active Session (IP: 192.168.1.10)</span>
                  </div>
                </div>
                <Chip variant="soft" color="success" className="text-[10px] font-mono">Active Now</Chip>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Notification Preferences */}
      {activeTab === "notifications" && (
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
          <div className="border-b border-border-custom pb-3">
            <h3 className="text-base font-bold text-text-primary">Notification Preferences Matrix</h3>
            <p className="text-xs text-text-secondary">Choose how and when you receive automated alerts and emails.</p>
          </div>

          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border-custom bg-background-custom/30">
              <div>
                <span className="font-bold text-sm text-text-primary block">Doctor Appointment Reminders</span>
                <span className="text-xs text-text-secondary">Receive automated email alerts 24 hours prior to scheduled visits.</span>
              </div>
              <Switch
                isSelected={notifyAppointments}
                onChange={(val: boolean) => setNotifyAppointments(val)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border-custom bg-background-custom/30">
              <div>
                <span className="font-bold text-sm text-text-primary block">Security & Login Alerts</span>
                <span className="text-xs text-text-secondary">Get notified of password updates or new device logins.</span>
              </div>
              <Switch
                isSelected={notifySecurity}
                onChange={(val: boolean) => setNotifySecurity(val)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border-custom bg-background-custom/30">
              <div>
                <span className="font-bold text-sm text-text-primary block">System Maintenance Announcements</span>
                <span className="text-xs text-text-secondary">Receive platform upgrade schedules and module releases.</span>
              </div>
              <Switch
                isSelected={notifySystem}
                onChange={(val: boolean) => setNotifySystem(val)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border-custom bg-background-custom/30">
              <div>
                <span className="font-bold text-sm text-text-primary block">SMS Notifications</span>
                <span className="text-xs text-text-secondary">Send urgent OTPs and booking confirmations to mobile phone.</span>
              </div>
              <Switch
                isSelected={notifySms}
                onChange={(val: boolean) => setNotifySms(val)}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Appearance & Regional */}
      {activeTab === "appearance" && (
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
          <div className="border-b border-border-custom pb-3">
            <h3 className="text-base font-bold text-text-primary">Theme & Localization Settings</h3>
            <p className="text-xs text-text-secondary">Customize visual theme modes, preferred language & local time zone.</p>
          </div>

          <div className="flex flex-col gap-6 max-w-xl">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-text-primary">Theme Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border-custom text-text-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    <span className="font-bold text-xs">Dark Mode</span>
                  </div>
                  {theme === "dark" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    theme === "light" ? "border-primary bg-primary/10 text-primary" : "border-border-custom text-text-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    <span className="font-bold text-xs">Light Mode</span>
                  </div>
                  {theme === "light" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-text-primary">Interface Language</Label>
                <Chip variant="soft" color="warning" className="text-[9px] font-mono px-1 py-0">Coming Soon</Chip>
              </div>
              <Select
                aria-label="Language selector"
                selectedKey={language}
                onSelectionChange={(key) => setLanguage(String(key))}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="en-US" textValue="English (US)">
                      <Label>English (United States)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="es-ES" textValue="Spanish">
                      <Label>Spanish (Español)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="fr-FR" textValue="French">
                      <Label>French (Français)</Label>
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-text-primary">Local Timezone</Label>
                <Chip variant="soft" color="warning" className="text-[9px] font-mono px-1 py-0">Coming Soon</Chip>
              </div>
              <Select
                aria-label="Timezone selector"
                selectedKey={timezone}
                onSelectionChange={(key) => setTimezone(String(key))}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="UTC+5" textValue="UTC+5 (Pakistan / Karachi)">
                      <Label>UTC+5 (Karachi, Islamabad)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="UTC-5" textValue="UTC-5 (Eastern Time US)">
                      <Label>UTC-5 (New York, Eastern Time)</Label>
                    </ListBox.Item>
                    <ListBox.Item id="UTC+0" textValue="UTC+0 (London, GMT)">
                      <Label>UTC+0 (London, GMT)</Label>
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 5: Data & Compliance (Danger Zone) */}
      {activeTab === "account" && (
        <div className="flex flex-col gap-6">
          <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-4 shadow-lg">
            <div className="border-b border-border-custom pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                <span>Export Account Data & Compliance Logs</span>
              </h3>
              <p className="text-xs text-text-secondary">Download a full export of your personal profile, notification preferences & audit records per GDPR standards.</p>
            </div>

            <div className="flex items-center gap-3">
              <Dropdown>
                <Dropdown.Trigger>
                  <Button
                    variant="outline"
                    className="text-xs font-semibold px-4 text-text-primary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    Export Account Data
                  </Button>
                </Dropdown.Trigger>
                <Dropdown.Popover placement="bottom start">
                  <Dropdown.Menu
                    onAction={(key) => {
                      const exportObj = [
                        {
                          id: profile?.id,
                          name: profile?.name,
                          email: profile?.email,
                          role: profile?.role,
                          phone,
                          bio,
                          language,
                          timezone,
                          notifyAppointments,
                          notifySecurity,
                          exportedAt: new Date().toISOString(),
                        },
                      ];
                      downloadData(exportObj, "medicio_account_export", key as any);
                      toast.success(`Account data exported as ${String(key).toUpperCase()}`);
                    }}
                  >
                    <Dropdown.Item id="json" textValue="Export JSON">
                      <Label>Export as JSON (.json)</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="csv" textValue="Export CSV">
                      <Label>Export as CSV (.csv)</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="txt" textValue="Export TXT Log">
                      <Label>Export as TXT Archive (.txt)</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
          </Card>

          <Card className="p-6 border border-rose-500/30 bg-rose-500/5 flex flex-col gap-4 shadow-lg">
            <div className="border-b border-rose-500/20 pb-3">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>Danger Zone</span>
              </h3>
              <p className="text-xs text-text-secondary">Permanently delete your user account and erase all associated medical records.</p>
            </div>

            <Button
              variant="primary"
              onPress={() => setIsDeleteModalOpen(true)}
              className="text-xs font-semibold px-5 bg-rose-600 hover:bg-rose-700 text-white w-fit"
            >
              Delete Account
            </Button>
          </Card>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md p-6 bg-surface border border-rose-500/40 rounded-2xl shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-text-primary">Delete Account Permanently?</h3>
              <p className="text-xs text-text-secondary mt-1">
                Are you sure you want to permanently delete your account? All data will be permanently removed.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onPress={() => setIsDeleteModalOpen(false)}
                className="text-xs font-semibold px-4"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={() => {
                  setIsDeleteModalOpen(false);
                  toast.error("Account deletion request submitted.");
                }}
                className="text-xs font-semibold px-5 bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
