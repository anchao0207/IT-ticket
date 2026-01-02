"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Admin {
  id: number;
  name: string;
}

interface TimeLog {
  id?: number;
  date: string;
  timeIn: string;
  timeOut?: string;
  lunchStart?: string;
  lunchEnd?: string;
  mileage?: string;
}

type SortConfig = {
  key: keyof TimeLog | "total" | null;
  direction: "asc" | "desc";
};

export default function TimeLogsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<Admin | null>(null);

  // Period State
  // We track the starting date of the "Month" we are viewing, and which part
  const [viewDate, setViewDate] = useState(new Date()); // Tracks Year/Month
  const [viewPart, setViewPart] = useState<"first" | "second">("first");

  // Derived Date Range
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // UI State
  const [dbLogs, setDbLogs] = useState<TimeLog[]>([]); // Source of truth from DB
  const [editableLogs, setEditableLogs] = useState<TimeLog[]>([]); // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "date",
    direction: "asc",
  });

  // Init: Set Default Period based on today
  useEffect(() => {
    // Load Admins & User
    fetch("/api/admins")
      .then((r) => r.json())
      .then(setAdmins);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          setSelectedAdminId(data.user.id.toString());
        }
      });

    // Set initial period
    const now = new Date();
    if (now.getDate() > 15) {
      setViewPart("second");
    } else {
      setViewPart("first");
    }
    setViewDate(now);
  }, []);

  // Calculate start/end string whenever viewDate or viewPart changes
  useEffect(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    let startDay = 1;
    let endDay = 15;

    if (viewPart === "second") {
      startDay = 16;
      // Last day of month
      endDay = new Date(year, month + 1, 0).getDate();
    }

    const fmt = (d: number) =>
      `${year}-${(month + 1).toString().padStart(2, "0")}-${d
        .toString()
        .padStart(2, "0")}`;
    setDateRange({ start: fmt(startDay), end: fmt(endDay) });
  }, [viewDate, viewPart]);

  const handlePrevPeriod = () => {
    if (viewPart === "second") {
      // Go to first half of same month
      setViewPart("first");
    } else {
      // Go to second half of previous month
      setViewPart("second");
      const newDate = new Date(viewDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setViewDate(newDate);
    }
  };

  const handleNextPeriod = () => {
    if (viewPart === "first") {
      // Go to second half of same month
      setViewPart("second");
    } else {
      // Go to first half of next month
      setViewPart("first");
      const newDate = new Date(viewDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setViewDate(newDate);
    }
  };

  const isLatestPeriod = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentPart = now.getDate() <= 15 ? "first" : "second";

    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();

    // If viewing a future year, valid (but shouldn't happen if blocked)
    if (viewYear > currentYear) return true;
    if (viewYear < currentYear) return false;

    // Same year
    if (viewMonth > currentMonth) return true;
    if (viewMonth < currentMonth) return false;

    // Same month
    if (viewPart === "second" && currentPart === "first") return true;
    if (viewPart === currentPart) return true;

    return false;
  };

  const getPeriodLabel = () => {
    const monthName = viewDate.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    return `${monthName} (${
      viewPart === "first" ? "1st - 15th" : "16th - End"
    })`;
  };

  // 2. Fetch Data & Build Table State
  useEffect(() => {
    if (!selectedAdminId || !dateRange.start) return;

    fetch(
      `/api/time-logs?technicianId=${selectedAdminId}&from=${dateRange.start}&to=${dateRange.end}`
    )
      .then((res) => res.json())
      .then((data: TimeLog[]) => {
        setDbLogs(data);
        // Create placeholders for all days
        const days = getDaysArray();
        const merged = days.map((date) => {
          const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
          const existing = data.find(
            (l) => new Date(l.date).toISOString().slice(0, 10) === dateStr
          );

          const formatTime = (iso?: string) =>
            iso
              ? new Date(iso).toLocaleTimeString([], {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

          return {
            id: existing?.id,
            date: dateStr, // Keep local date string for UI
            timeIn: formatTime(existing?.timeIn),
            timeOut: formatTime(existing?.timeOut),
            lunchStart: formatTime(existing?.lunchStart),
            lunchEnd: formatTime(existing?.lunchEnd),
            mileage:
              existing?.mileage !== undefined && existing.mileage !== null
                ? existing.mileage.toString()
                : "0.0",
          };
        });
        setEditableLogs(merged);
      });
  }, [selectedAdminId, dateRange]);

  const getDaysArray = () => {
    const arr = [];
    if (!dateRange.start) return [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      arr.push(new Date(d));
    }
    return arr;
  };

  // 3. UI Helpers
  const handleInputChange = (
    dateStr: string,
    field: keyof TimeLog,
    value: string
  ) => {
    setEditableLogs((prev) =>
      prev.map((log) =>
        log.date === dateStr ? { ...log, [field]: value } : log
      )
    );
  };

  const handleTimeBlur = (
    dateStr: string,
    field: keyof TimeLog,
    value: string
  ) => {
    if (!value) return;

    // Remove non-digit characters to check raw input
    const clean = value.replace(/\D/g, "");
    let formatted = value;

    // Logic to auto-format "930" -> "09:30", "9" -> "09:00", etc.
    if (clean.length > 0 && clean.length <= 4) {
      const num = parseInt(clean, 10);
      if (!isNaN(num)) {
        if (clean.length <= 2) {
          // e.g. "9" -> "09:00", "14" -> "14:00"
          formatted = `${clean.padStart(2, "0")}:00`;
        } else if (clean.length === 3) {
          // e.g. "930" -> "09:30"
          const h = clean.slice(0, 1);
          const m = clean.slice(1);
          formatted = `${h.padStart(2, "0")}:${m}`;
        } else if (clean.length === 4) {
          // e.g. "1430" -> "14:30"
          const h = clean.slice(0, 2);
          const m = clean.slice(2);
          formatted = `${h}:${m}`;
        }
      }
    }

    // Basic validation to ensure it looks like time, otherwise revert or keep?
    // For now, if we formatted it, update it.
    if (formatted !== value) {
      handleInputChange(dateStr, field, formatted);
    }
  };

  const calculateDailyTotal = (log: TimeLog) => {
    if (!log.timeIn || !log.timeOut) return 0;

    const parseTime = (t: string) => {
      // Robust parsing: if it doesn't look like HH:MM, return 0 or try to parse
      if (!t || !t.includes(":")) return 0;
      const [h, m] = t.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return 0;
      return h * 60 + m; // minutes
    };

    const start = parseTime(log.timeIn);
    const end = parseTime(log.timeOut);

    // Handle overnight? Assuming same day for now.
    // If end < start, maybe error or overnight. Simple subtraction for now.
    let totalMins = end - start;

    if (log.lunchStart && log.lunchEnd) {
      totalMins -= parseTime(log.lunchEnd) - parseTime(log.lunchStart);
    }
    return Math.max(0, totalMins / 60);
  };

  const totalPeriodHours = editableLogs.reduce(
    (acc, log) => acc + calculateDailyTotal(log),
    0
  );

  const totalPeriodMileage = editableLogs.reduce(
    (acc, log) => acc + (parseFloat(log.mileage || "0") || 0),
    0
  );

  // Sorting Logic
  const handleSort = (key: keyof TimeLog | "total") => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedLogs = useMemo(() => {
    let sortableItems = [...editableLogs];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === "total") {
          aValue = calculateDailyTotal(a);
          bValue = calculateDailyTotal(b);
        } else {
          // @ts-ignore
          aValue = a[sortConfig.key];
          // @ts-ignore
          bValue = b[sortConfig.key];
        }

        if (aValue === undefined || aValue === null) aValue = "";
        if (bValue === undefined || bValue === null) bValue = "";

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [editableLogs, sortConfig]);

  // 4. Save Logic
  const handleSave = async () => {
    setIsSaving(true);
    const promises = editableLogs.map(async (log) => {
      // Skip empty rows
      if (!log.timeIn && !log.id) return;

      // Convert HH:MM back to ISO
      const toISO = (timeStr?: string) =>
        timeStr ? `${log.date}T${timeStr}:00` : null;

      const payload = {
        date: log.date,
        timeIn: toISO(log.timeIn),
        timeOut: toISO(log.timeOut),
        lunchStart: toISO(log.lunchStart),
        lunchEnd: toISO(log.lunchEnd),
        mileage: log.mileage,
      };

      if (log.id) {
        // Update
        await fetch("/api/time-logs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: log.id, ...payload }),
        });
      } else if (log.timeIn) {
        // Create new (only if Time In is present)
        await fetch("/api/time-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminId: selectedAdminId,
            ...payload,
            date: log.date,
          }),
        });
      }
    });

    await Promise.all(promises);

    // Reload
    setIsEditing(false);
    setIsSaving(false);
    window.location.reload();
  };

  const isOwnLog =
    currentUser &&
    selectedAdminId &&
    currentUser.id.toString() === selectedAdminId.toString();

  // Sorting Indicator Helper
  const renderHeader = (label: string, key: keyof TimeLog | "total") => (
    <TableHead
      className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-100"
      onClick={() => handleSort(key)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortConfig?.key === key && (
          <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
    </TableHead>
  );

  return (
    <div className=" bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Time Logs
          </h1>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} disabled={!isOwnLog}>
                  Edit Mode
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>

            <Select
              value={selectedAdminId}
              onValueChange={(value) => setSelectedAdminId(value)}
            >
              <SelectTrigger className="rounded-md border p-2 dark:bg-gray-700">
                <SelectValue placeholder="Select Admin" />
              </SelectTrigger>
              <SelectContent>
                {admins.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 rounded-md border bg-gray-100 p-1 dark:bg-gray-700">
              <button
                onClick={handlePrevPeriod}
                className="rounded px-2 py-1 hover:bg-white dark:hover:bg-gray-600"
                title="Previous Period"
              >
                &lt;
              </button>
              <span className="min-w-[200px] text-center text-sm font-medium">
                {getPeriodLabel()}
              </span>
              <button
                onClick={handleNextPeriod}
                disabled={isLatestPeriod()}
                className="rounded px-2 py-1 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-600"
                title="Next Period"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-700">
              <TableRow>
                {renderHeader("Date", "date")}
                {renderHeader("Start Time", "timeIn")}
                {renderHeader("Lunch Start", "lunchStart")}
                {renderHeader("Lunch End", "lunchEnd")}
                {renderHeader("End Time", "timeOut")}
                {renderHeader("Mileage", "mileage")}
                {renderHeader("Total (Hrs)", "total")}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLogs.map((log) => {
                // Display Date
                const displayDate = new Date(
                  log.date + "T00:00:00"
                ).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <TableRow
                    key={log.date}
                    className={`${isEditing ? "bg-blue-50/50" : ""}`}
                  >
                    <TableCell className="font-medium">{displayDate}</TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        className="h-8 w-full min-w-[80px] disabled:opacity-100 disabled:cursor-default disabled:border-transparent"
                        placeholder="HH:MM"
                        value={log.timeIn || ""}
                        onChange={(e) =>
                          handleInputChange(log.date, "timeIn", e.target.value)
                        }
                        onBlur={(e) =>
                          handleTimeBlur(log.date, "timeIn", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        className="h-8 w-full min-w-[80px] disabled:opacity-100 disabled:cursor-default disabled:border-transparent"
                        placeholder="HH:MM"
                        value={log.lunchStart || ""}
                        onChange={(e) =>
                          handleInputChange(
                            log.date,
                            "lunchStart",
                            e.target.value
                          )
                        }
                        onBlur={(e) =>
                          handleTimeBlur(log.date, "lunchStart", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        className="h-8 w-full min-w-[80px] disabled:opacity-100 disabled:cursor-default disabled:border-transparent"
                        placeholder="HH:MM"
                        value={log.lunchEnd || ""}
                        onChange={(e) =>
                          handleInputChange(
                            log.date,
                            "lunchEnd",
                            e.target.value
                          )
                        }
                        onBlur={(e) =>
                          handleTimeBlur(log.date, "lunchEnd", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        className="h-8 w-full min-w-[80px] disabled:opacity-100 disabled:cursor-default disabled:border-transparent"
                        placeholder="HH:MM"
                        value={log.timeOut || ""}
                        onChange={(e) =>
                          handleInputChange(log.date, "timeOut", e.target.value)
                        }
                        onBlur={(e) =>
                          handleTimeBlur(log.date, "timeOut", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.1"
                        className="h-8 w-full min-w-[80px] disabled:opacity-100 disabled:cursor-default disabled:border-transparent"
                        value={log.mileage || ""}
                        onChange={(e) =>
                          handleInputChange(log.date, "mileage", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </TableCell>
                    <TableCell className="font-bold">
                      {calculateDailyTotal(log).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="text-right font-bold">
                  Period Total:
                </TableCell>
                <TableCell className="font-bold text-blue-600 dark:text-blue-400">
                  {totalPeriodMileage.toFixed(1)}
                </TableCell>
                <TableCell className="font-bold text-blue-600 dark:text-blue-400">
                  {totalPeriodHours.toFixed(2)} Hrs
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
}
