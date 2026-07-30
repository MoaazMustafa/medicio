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
  CheckCircle2,
  Download,
  Globe,
  KeyRound,
  Lock,
  Moon,
  Shield,
  ShieldAlert,
  Smartphone,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  // Active Subtab state
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "notifications" | "appearance" | "account"
  >("profile");

  // Profile Form States
  const [name, setName] = useState("Moaaz Mustafa");
  const [email] = useState("moaazmustafa@gmail.com");
  const [phone, setPhone] = useState("+92 300 1234567");
  const [bio, setBio] = useState("Healthcare Platform Engineer & Administrator");
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

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile information updated successfully!");
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    toast.success("Security password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(
      {
        user: { name, email, phone, bio },
        settings: { notifyAppointments, notifySecurity, language, timezone },
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medicio_account_export_${Date.now()}.json`;
    a.click();
    toast.success("Account data exported successfully!");
  };

  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto gap-6">
      {/* Settings Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <span>Account Settings & Preferences</span>
            <Chip variant="soft" color="accent" className="text-xs font-mono">
              Production Standard
            </Chip>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Manage your personal profile, security credentials, notification dispatches & regional localization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onPress={() => toast.info("Changes discarded")}
            className="text-xs font-semibold px-4 text-text-secondary hover:text-text-primary"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={() => toast.success("All settings saved successfully!")}
            className="text-xs font-semibold px-5"
          >
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Subtabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-border-custom overflow-x-auto pb-1">
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
            <p className="text-xs text-text-secondary">Update your photo, contact info, and public display details.</p>
          </div>

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
                    value={email}
                    disabled
                    className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-secondary bg-background-custom/40 w-full"
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-text-primary">Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-text-primary">Professional Title / Specialty</Label>
                <Input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="px-3 py-2 border border-border-custom rounded-lg text-sm text-text-primary"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button variant="primary" type="submit" className="text-xs font-semibold px-5 w-fit">
                Save Profile Details
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === "security" && (
        <div className="flex flex-col gap-6">
          <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
            <div className="border-b border-border-custom pb-3">
              <h3 className="text-base font-bold text-text-primary">Change Password</h3>
              <p className="text-xs text-text-secondary">Ensure your account uses a strong, unique password.</p>
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

              <Button variant="primary" type="submit" className="text-xs font-semibold px-5 w-fit">
                Update Password
              </Button>
            </form>
          </Card>

          {/* 2FA & Active Sessions */}
          <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-border-custom pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">Two-Factor Authentication (2FA)</h3>
                <p className="text-xs text-text-secondary">Add an extra layer of security to your account with TOTP authenticator.</p>
              </div>
              <Switch
                isSelected={is2FAEnabled}
                onChange={(val: boolean) => {
                  setIs2FAEnabled(val);
                  toast.success(val ? "2FA Authentication Enabled" : "2FA Disabled");
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
              <Label className="text-xs font-semibold text-text-primary">Interface Language</Label>
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
              <Label className="text-xs font-semibold text-text-primary">Local Timezone</Label>
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
                <span>Export Account Data</span>
              </h3>
              <p className="text-xs text-text-secondary">Download a full JSON archive of your profile, settings & records per GDPR standards.</p>
            </div>

            <Button
              variant="outline"
              onPress={handleExportData}
              className="text-xs font-semibold px-4 text-text-primary w-fit flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Account Data (JSON)
            </Button>
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
