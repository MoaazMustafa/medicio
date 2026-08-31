"use client";

import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  Modal,
  Select,
  ListBox,
} from "@heroui/react";
import {
  AlertCircle,
  Bell,
  BellRing,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Pill,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { TableToolbar, TableFooter } from "@/components/ui/table-toolbar";
import { cn } from "@/lib/utils";

interface MedicineEntry {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  reminderTimes?: string | null;
  isReminderEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "As needed (PRN)",
  "Once weekly",
  "Twice weekly",
] as const;

const COMMON_DOSE_TIMES = ["08:00", "12:00", "16:00", "20:00", "22:00"];

function isActive(entry: MedicineEntry): boolean {
  if (!entry.endDate) return true;
  return new Date(entry.endDate) >= new Date();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface MedicineFormState {
  medicineName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  reminderTimes: string[];
  isReminderEnabled: boolean;
}

const EMPTY_FORM: MedicineFormState = {
  medicineName: "",
  dosage: "",
  frequency: "Once daily",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  reminderTimes: ["08:00", "20:00"],
  isReminderEnabled: true,
};

export function PatientMedicines() {
  const [entries, setEntries] = useState<MedicineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MedicineEntry | null>(null);
  const [form, setForm] = useState<MedicineFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/medicine-tracker");
      const data = await res.json();
      if (res.ok && data.entries) {
        setEntries(data.entries);
      }
    } catch (err) {
      console.error("Failed to fetch medicine entries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const openAddModal = () => {
    setEditingEntry(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (entry: MedicineEntry) => {
    setEditingEntry(entry);
    let parsedTimes: string[] = ["08:00", "20:00"];
    if (entry.reminderTimes) {
      try {
        parsedTimes = JSON.parse(entry.reminderTimes);
      } catch {
        parsedTimes = ["08:00", "20:00"];
      }
    }

    setForm({
      medicineName: entry.medicineName,
      dosage: entry.dosage,
      frequency: entry.frequency,
      startDate: entry.startDate.split("T")[0],
      endDate: entry.endDate ? entry.endDate.split("T")[0] : "",
      reminderTimes: parsedTimes,
      isReminderEnabled: entry.isReminderEnabled ?? true,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.medicineName.trim() || !form.dosage.trim() || !form.frequency || !form.startDate) {
      setFormError("Medicine name, dosage, frequency, and start date are required.");
      return;
    }
    setIsSaving(true);
    setFormError("");

    try {
      const payload = {
        medicineName: form.medicineName.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || null,
        reminderTimes: form.reminderTimes,
        isReminderEnabled: form.isReminderEnabled,
      };

      let res: Response;
      if (editingEntry) {
        res = await fetch(`/api/medicine-tracker/${editingEntry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/medicine-tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || "Failed to save entry.");
        return;
      }

      setIsModalOpen(false);
      await fetchEntries();
      toast.success(editingEntry ? "Prescription updated." : "Prescription logged.");
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const testReminder = async (entry: MedicineEntry) => {
    try {
      const res = await fetch("/api/medicine-tracker/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: entry.id,
          doseTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }),
      });

      if (res.ok) {
        toast.success(`Dose alert triggered for ${entry.medicineName}! Check notifications.`);
      } else {
        toast.error("Failed to send reminder alert.");
      }
    } catch {
      toast.error("Network error triggering reminder.");
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/medicine-tracker/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirmId(null);
        await fetchEntries();
        toast.success("Medicine removed.");
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const safeEntries = Array.isArray(entries) ? entries : [];

  const filtered = safeEntries.filter((e) => {
    const q = searchQuery.toLowerCase();
    const name = (e.medicineName || "").toLowerCase();
    const dosage = (e.dosage || "").toLowerCase();
    const frequency = (e.frequency || "").toLowerCase();
    const matchesSearch = !q || name.includes(q) || dosage.includes(q) || frequency.includes(q);

    const active = isActive(e);
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && active) ||
      (filterStatus === "COMPLETED" && !active);

    return matchesSearch && matchesStatus;
  });

  const activeCount = safeEntries.filter(isActive).length;
  const endingSoonCount = safeEntries.filter((e) => {
    const days = daysRemaining(e.endDate);
    return days !== null && days >= 0 && days <= 7;
  }).length;
  const completedCount = safeEntries.filter((e) => !isActive(e)).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Medicine Tracker</h1>
            <p className="text-xs text-text-secondary">
              Log and track your current medications — synced with your AI symptom checker intake.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button className="text-xs font-semibold" size="sm" variant="secondary" onPress={fetchEntries}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button className="text-xs font-semibold" size="sm" variant="primary" onPress={openAddModal}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Medicine
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-bold text-text-primary">{activeCount}</span>
          <span className="text-text-secondary">active</span>
        </div>
        {endingSoonCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-bold text-amber-500">{endingSoonCount}</span>
            <span className="text-text-secondary">ending within 7 days</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
          <Clock className="h-3.5 w-3.5 text-text-secondary" />
          <span className="font-bold text-text-primary">{completedCount}</span>
          <span className="text-text-secondary">completed</span>
        </div>
      </div>
      {/* Top Control Toolbar (Filters & Refresh) */}
      <TableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search medicine name, dosage, or frequency..."
        onRefresh={fetchEntries}
        isRefreshing={loading}
        hasActiveFilters={Boolean(searchQuery || filterStatus !== "ALL")}
        onClearFilters={() => {
          setSearchQuery("");
          setFilterStatus("ALL");
        }}
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {(["ALL", "ACTIVE", "COMPLETED"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? "primary" : "ghost"}
              className="text-[11px] capitalize font-semibold h-8 px-2.5"
              onPress={() => setFilterStatus(s)}
            >
              {s.toLowerCase()}
            </Button>
          ))}
        </div>
      </TableToolbar>

      {/* Medicine list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-border-custom bg-surface/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border border-border-custom bg-surface/30 p-12 text-center">
          <div className="rounded-2xl border border-border-custom bg-surface/80 p-4 text-text-secondary">
            <Pill className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">No medicines found</h3>
          <p className="max-w-sm text-xs text-text-secondary">
            {searchQuery || filterStatus !== "ALL"
              ? "No medicines match your current filter."
              : "You haven't logged any medicines yet. Add your first medication to get started."}
          </p>
          <Button className="mt-2 text-xs font-semibold" size="sm" variant="primary" onPress={openAddModal}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Medicine
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.slice(0, pageSize).map((entry) => {
            const active = isActive(entry);
            const days = daysRemaining(entry.endDate);
            const isEndingSoon = days !== null && days >= 0 && days <= 7;

            return (
              <Card
                key={entry.id}
                className={cn(
                  "flex flex-col gap-3 border bg-surface/70 p-4 shadow-xs transition-all sm:flex-row sm:items-center",
                  isEndingSoon ? "border-amber-500/30" : "border-border-custom hover:border-primary/40",
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    active
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                      : "border-border-custom bg-surface/80 text-text-secondary",
                  )}
                >
                  <Pill className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-text-primary">{entry.medicineName}</h3>
                    <Chip
                      className="text-[9px] font-mono font-bold uppercase"
                      color={active ? "success" : "default"}
                      size="sm"
                      variant="soft"
                    >
                      {active ? "Active" : "Completed"}
                    </Chip>
                    {isEndingSoon && (
                      <Chip className="text-[9px] font-mono font-bold uppercase" color="warning" size="sm" variant="soft">
                        Ends in {days}d
                      </Chip>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-primary" />
                      {entry.dosage}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      {entry.frequency}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 text-primary" />
                      {formatDate(entry.startDate)}
                      {entry.endDate && ` → ${formatDate(entry.endDate)}`}
                    </span>
                    {entry.isReminderEnabled && entry.reminderTimes && (
                      <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-primary">
                        <BellRing className="h-3 w-3 animate-pulse text-primary" />
                        {(() => {
                          try {
                            const times = JSON.parse(entry.reminderTimes);
                            return Array.isArray(times) ? times.join(", ") : String(entry.reminderTimes);
                          } catch {
                            return String(entry.reminderTimes);
                          }
                        })()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {entry.isReminderEnabled && (
                    <Button
                      aria-label="Test dose reminder"
                      className="h-8 rounded-xl border border-primary/20 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20"
                      size="sm"
                      variant="secondary"
                      onPress={() => testReminder(entry)}
                    >
                      <Bell className="mr-1 h-3.5 w-3.5" /> Test Alert
                    </Button>
                  )}
                  <Button
                    isIconOnly
                    aria-label="Edit"
                    className="h-8 w-8 min-w-8 rounded-xl border border-border-custom bg-transparent text-text-secondary hover:border-primary/40 hover:text-primary"
                    size="sm"
                    variant="secondary"
                    onPress={() => openEditModal(entry)}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    isIconOnly
                    aria-label="Delete"
                    className="h-8 w-8 min-w-8 rounded-xl border border-border-custom bg-transparent text-text-secondary hover:border-red-500/40 hover:text-red-500"
                    size="sm"
                    variant="secondary"
                    onPress={() => setDeleteConfirmId(entry.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bottom Control Footer */}
      <TableFooter
        showingCount={Math.min(filtered.length, pageSize)}
        totalCount={safeEntries.length}
        entityLabel="medications"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal.Root isOpen={isModalOpen} onOpenChange={() => setIsModalOpen(false)}>
          <Modal.Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md outline-none animate-in fade-in">
            <Modal.Dialog className="pointer-events-auto flex h-fit max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl outline-none">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <Pill className="h-4 w-4 text-primary" />
                  {editingEntry ? "Edit Medicine" : "Add Medicine"}
                </h3>
                <Modal.CloseTrigger className="p-1 text-text-secondary hover:text-text-primary">
                  <X className="h-4 w-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-4 py-2">
                {formError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Medicine Name *</Label>
                  <Input
                    placeholder="e.g. Paracetamol, Metformin"
                    value={form.medicineName}
                    onChange={(e) => setForm((f) => ({ ...f, medicineName: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Dosage *</Label>
                  <Input
                    placeholder="e.g. 500mg, 1 tablet, 10ml"
                    value={form.dosage}
                    onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Frequency *</Label>
                  <Select
                    aria-label="Frequency"
                    className="w-full"
                    selectedKey={form.frequency}
                    onSelectionChange={(key: React.Key | null) => {
                      if (key) setForm((f) => ({ ...f, frequency: String(key) }));
                    }}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <ListBox.Item key={opt} id={opt} textValue={opt}>
                            <Label>{opt}</Label>
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-secondary">Start Date *</Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-secondary">End Date (optional)</Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Scheduled Dose Push Reminders */}
                <div className="flex flex-col gap-2.5 rounded-xl border border-border-custom bg-surface/40 p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-primary" />
                      <div>
                        <Label className="text-xs font-bold text-text-primary">Daily Dose Reminders</Label>
                        <p className="text-[11px] text-text-secondary">Receive in-app and browser Web Push alerts</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={form.isReminderEnabled ? "primary" : "secondary"}
                      className="h-7 text-xs font-semibold"
                      onPress={() => setForm((f) => ({ ...f, isReminderEnabled: !f.isReminderEnabled }))}
                    >
                      {form.isReminderEnabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  {form.isReminderEnabled && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-border-custom">
                      <Label className="text-[11px] font-semibold text-text-secondary">Dose Times ({form.reminderTimes.length} configured)</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_DOSE_TIMES.map((time) => {
                          const isSelected = form.reminderTimes.includes(time);
                          return (
                            <Button
                              key={time}
                              size="sm"
                              variant={isSelected ? "primary" : "ghost"}
                              className={cn(
                                "h-7 text-[11px] font-mono rounded-lg border",
                                isSelected ? "border-primary" : "border-border-custom text-text-secondary"
                              )}
                              onPress={() => {
                                setForm((f) => ({
                                  ...f,
                                  reminderTimes: isSelected
                                    ? f.reminderTimes.filter((t) => t !== time)
                                    : [...f.reminderTimes, time].sort(),
                                }));
                              }}
                            >
                              {time}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3 border-t border-border-custom pt-4">
                <Button size="sm" variant="secondary" onPress={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button isDisabled={isSaving} size="sm" variant="primary" onPress={handleSave}>
                  {isSaving ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : editingEntry ? (
                    "Save Changes"
                  ) : (
                    "Add Medicine"
                  )}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Modal.Root isOpen={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <Modal.Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md outline-none animate-in fade-in">
            <Modal.Dialog className="pointer-events-auto flex h-fit w-full max-w-sm flex-col gap-4 rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl outline-none">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-red-500">
                  <Trash2 className="h-4 w-4" /> Remove Medicine
                </h3>
                <Modal.CloseTrigger className="p-1 text-text-secondary hover:text-text-primary">
                  <X className="h-4 w-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="py-2 text-xs text-text-secondary">
                Are you sure you want to remove this medicine entry? This action cannot be undone.
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3 border-t border-border-custom pt-4">
                <Button size="sm" variant="secondary" onPress={() => setDeleteConfirmId(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-red-500 text-white hover:bg-red-600"
                  isDisabled={isDeleting}
                  size="sm"
                  variant="primary"
                  onPress={() => handleDelete(deleteConfirmId!)}
                >
                  {isDeleting ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    "Remove"
                  )}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}
    </div>
  );
}
