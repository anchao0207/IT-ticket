"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface Admin {
  id: number;
  name: string;
}

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketCreated: () => void;
}

export function NewTicketDialog({
  open,
  onOpenChange,
  onTicketCreated,
}: NewTicketDialogProps) {
  const [company, setCompany] = useState("");
  const [person, setPerson] = useState("");
  const [adminId, setAdminId] = useState("");
  const [location, setLocation] = useState("remote");
  const [startedTime, setStartedTime] = useState<Date>(new Date());
  const [issue, setIssue] = useState("");

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Fetch valid admins
    fetch("/api/admins")
      .then((res) => res.json())
      .then((data) => {
        setAdmins(data);
        setLoadingAdmins(false);
      })
      .catch((err) => console.error("Failed to load admins", err));

    // Fetch current user to set default admin
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setAdminId(data.user.id.toString());
        }
      })
      .catch((err) => console.error("Failed to load current user", err));
  }, [open]);

  const resetForm = () => {
    setCompany("");
    setPerson("");
    setAdminId("");
    setLocation("remote");
    setStartedTime(new Date());
    setIssue("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = {
        company,
        person,
        adminId,
        location,
        startedTime: startedTime.toISOString(),
        issue,
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create ticket");

      resetForm();
      onOpenChange(false);
      onTicketCreated();
    } catch (error) {
      console.error(error);
      alert("Error creating ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl overflow-y-auto max-h-[90vh] bg-gray-50 dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new support ticket.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <Input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Person
              </label>
              <Input
                type="text"
                required
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="Enter contact person"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin (Taking Call)
              </label>
              <Select value={adminId} onValueChange={setAdminId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Admin" />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id.toString()}>
                      {admin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingAdmins && (
                <span className="text-xs text-gray-500">Loading admins...</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="on-site">On-Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <DateTimePicker
                value={startedTime}
                onChange={(date) => setStartedTime(date || new Date())}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Issue Description
            </label>
            <Textarea
              required
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Creating..." : "Create Ticket"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
