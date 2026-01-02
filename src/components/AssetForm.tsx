"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar"; // Assuming we have shadcn calendar or similar, actually using Input type="date" for simplicity first or standard DatePicker if available
// Reverting to Input type="date" for simplicity and robustness as Calendar component might need Popover setup which is verbose.
import { Textarea } from "@/components/ui/textarea"; // If we add notes later
import Link from "next/link";

interface Client {
  id: number;
  name: string;
}

interface Asset {
  serialNumber: string;
  name: string;
  type: string;
  status: string;
  purchaseDate?: string | Date | null;
  clientId?: number | null;
  description?: string | null;
}

interface AssetFormProps {
  initialData?: Asset;
  clients: Client[];
  isEdit?: boolean;
}

export default function AssetForm({
  initialData,
  clients,
  isEdit = false,
}: AssetFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    serialNumber: initialData?.serialNumber || "",
    name: initialData?.name || "",
    type: initialData?.type || "Laptop",
    description: initialData?.description || "",
    status: initialData?.status || "In Storage",
    purchaseDate: initialData?.purchaseDate
      ? new Date(initialData.purchaseDate).toISOString().split("T")[0]
      : "",
    clientId: initialData?.clientId
      ? String(initialData.clientId)
      : "unassigned",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Decode serial for URL if editing
      const url = isEdit
        ? `/api/assets/${encodeURIComponent(initialData!.serialNumber)}`
        : "/api/assets";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          clientId:
            formData.clientId && formData.clientId !== "unassigned"
              ? parseInt(formData.clientId)
              : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save asset");
      }

      router.push("/assets");
      router.refresh(); // Refresh server components
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            value={formData.serialNumber}
            onChange={(e) =>
              setFormData({ ...formData, serialNumber: e.target.value })
            }
            disabled={isEdit}
            required
            placeholder="e.g., PF4VKCVK"
          />
          {isEdit && (
            <p className="text-xs text-gray-500">
              Serial number cannot be changed.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Asset Name/Model</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Dell XPS 15"
          />
        </div>

        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Additional details about the asset..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(val) => setFormData({ ...formData, type: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Laptop">Laptop</SelectItem>
              <SelectItem value="PC">PC</SelectItem>
              <SelectItem value="Server">Server</SelectItem>
              <SelectItem value="Monitor">Monitor</SelectItem>
              <SelectItem value="Printer">Printer</SelectItem>
              <SelectItem value="Network">Network</SelectItem>
              <SelectItem value="Software">Software</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(val) => setFormData({ ...formData, status: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="In Storage">In Storage</SelectItem>
              <SelectItem value="Deployed">Deployed</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) =>
              setFormData({ ...formData, purchaseDate: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">Assigned Client</Label>
          <Select
            value={formData.clientId}
            onValueChange={(val) => setFormData({ ...formData, clientId: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Client (Optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={String(client.id)}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-right">
            <Link href="/assets" className="text-blue-500 hover:underline">
              Manage Clients (TODO)
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update Asset" : "Create Asset"}
        </Button>
        <Link href="/assets">
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
