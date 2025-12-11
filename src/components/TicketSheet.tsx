"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Admin {
  id: number;
  name: string;
  username: string;
}

interface Ticket {
  id: number;
  company: string;
  issue: string;
  status: string;
  date: string;
  startedTime: string;
  person: string;
  location: string;
  resolution?: string;
  comments?: string;
  adminId?: number;
  admin?: Admin;
  timeEnd?: string;
  totalTime?: number;
}

interface TicketSheetProps {
  ticketId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdated: () => void;
}

export function TicketSheet({
  ticketId,
  open,
  onOpenChange,
  onTicketUpdated,
}: TicketSheetProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Admin | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);

  // Form States
  const [status, setStatus] = useState("");
  const [resolution, setResolution] = useState("");
  const [comments, setComments] = useState("");
  const [company, setCompany] = useState("");
  const [person, setPerson] = useState("");
  const [location, setLocation] = useState("");
  const [issue, setIssue] = useState("");
  const [startedTime, setStartedTime] = useState<Date | undefined>(undefined);
  const [timeEnd, setTimeEnd] = useState<Date | undefined>(undefined);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");

  useEffect(() => {
    // Fetch Session & Admins
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user));

    fetch("/api/admins")
      .then((res) => res.json())
      .then(setAdmins);
  }, []);

  // Fetch Ticket when ticketId changes
  useEffect(() => {
    if (!ticketId || !open) return;

    setLoading(true);
    fetch(`/api/tickets?id=${ticketId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((t: Ticket) => {
        setTicket(t);
        setStatus(t.status);
        setResolution(t.resolution || "");
        setComments(t.comments || "");
        setSelectedAdminId(t.adminId ? t.adminId.toString() : "unassigned");
        setCompany(t.company);
        setPerson(t.person);
        setLocation(t.location);
        setIssue(t.issue);

        // Parse DateTimes
        setStartedTime(new Date(t.startedTime));

        if (t.timeEnd) {
          setTimeEnd(new Date(t.timeEnd));
        } else {
          setTimeEnd(undefined);
        }

        if (t.totalTime) {
          setTotalTime(t.totalTime);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [ticketId, open]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (newStatus === "Unassigned") {
      setSelectedAdminId("unassigned"); // Set to 'unassigned'
    }
  };

  const handleAdminChange = (newAdminId: string) => {
    // Convert 'unassigned' to empty string for the API
    const adminId = newAdminId === "unassigned" ? "" : newAdminId;
    setSelectedAdminId(newAdminId); // Keep 'unassigned' in state for UI

    if (adminId && status === "Unassigned") {
      setStatus("Assigned");
    }

    if (!adminId && status === "Assigned") {
      setStatus("Unassigned");
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ticketId,
          status,
          adminId: selectedAdminId === "unassigned" ? null : selectedAdminId,
          resolution,
          comments,
          company,
          person,
          location,
          issue,
          startedTime: startedTime?.toISOString(),
          timeEnd: timeEnd?.toISOString(),
        }),
      });
      if (res.ok) {
        alert("Ticket Updated");
        onTicketUpdated();
        onOpenChange(false);
      } else {
        alert("Failed to update ticket");
      }
    } catch (e) {
      alert("Error updating");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this ticket? This action cannot be undone."
      )
    )
      return;
    try {
      const res = await fetch(`/api/tickets?id=${ticketId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onTicketUpdated();
        onOpenChange(false);
      } else {
        alert("Failed to delete ticket");
      }
    } catch (e) {
      alert("Error deleting ticket");
    }
  };

  const isUnassigned = status === "Unassigned" || !ticket?.adminId;
  const isOwner = currentUser && ticket?.adminId == currentUser.id;
  const canEdit = isUnassigned || isOwner;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {loading
              ? "Loading..."
              : !ticket
              ? "Ticket not found"
              : `Ticket #${ticket.id}`}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="p-8">Loading...</div>
        ) : !ticket ? (
          <div className="p-4">Ticket not found</div>
        ) : (
          <>
            {!canEdit && (
              <div className="mt-4 mb-4 rounded-md bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                Viewing Mode (Assigned to {ticket.admin?.name})
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 px-4">
              {/* Editable Details Column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                  Ticket Details
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Started Time
                  </label>
                  <DateTimePicker
                    value={startedTime}
                    onChange={setStartedTime}
                    disabled={!canEdit}
                    datePlaceholder="Pick start date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <DateTimePicker
                    value={timeEnd}
                    onChange={setTimeEnd}
                    disabled={!canEdit}
                    datePlaceholder="Pick end date"
                  />
                </div>

                {totalTime !== null && (
                  <div className="rounded-md bg-blue-50 p-3 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <span className="font-bold">Total Duration:</span>{" "}
                    {totalTime} hours
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={!canEdit}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    disabled={!canEdit}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={!canEdit}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="remote">Remote</option>
                    <option value="on-site">On-Site</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Issue
                  </label>
                  <textarea
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    rows={4}
                    disabled={!canEdit}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Status & Work Column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                  Status & Work
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <Select
                    value={status}
                    onValueChange={handleStatusChange}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                      <SelectItem value="Assigned">Assigned</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assigned Admin
                  </label>
                  <Select
                    value={selectedAdminId || "unassigned"}
                    onValueChange={handleAdminChange}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Unassigned --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        -- Unassigned --
                      </SelectItem>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id.toString()}>
                          {admin.name} ({admin.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Resolution / Notes
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={3}
                    disabled={!canEdit}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Private Comments
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={2}
                    disabled={!canEdit}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>

                {canEdit && (
                  <div className="flex flex-col gap-2 pt-4">
                    <Button onClick={handleSave} className="w-full">
                      Save Changes
                    </Button>
                    <Button
                      onClick={handleDelete}
                      variant="outline"
                      className="w-full border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete Ticket
                    </Button>
                  </div>
                )}

                {status === "Completed" && !canEdit && (
                  <p className="mt-2 text-center text-xs text-gray-500">
                    Ticket completed.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
