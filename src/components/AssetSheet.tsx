"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface Client {
  id: number;
  name: string;
}

interface Asset {
  serialNumber: string;
  name: string;
  type: string;
  description: string;
  status: string;
  purchaseDate: string;
  clientId: number;
}

interface AssetSheetProps {
  serialNumber: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetUpdated: () => void;
}

export function AssetSheet({
  serialNumber,
  open,
  onOpenChange,
  onAssetUpdated,
}: AssetSheetProps) {
  const [loading, setLoading] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    type: "Laptop",
    description: "",
    status: "In Storage",
    purchaseDate: "",
    clientId: "unassigned",
  });

  useEffect(() => {
    if (open) {
      // Fetch Clients
      fetch("/api/clients")
        .then((res) => res.json())
        .then((data) => setClients(data))
        .catch((err) => console.error("Failed to load clients", err));

      if (serialNumber) {
        setLoading(true);
        fetch(`/api/assets/${encodeURIComponent(serialNumber)}`)
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch asset");
            return res.json();
          })
          .then((data) => {
            setAsset(data);
            setFormData({
              name: data.name || "",
              type: data.type || "Laptop",
              description: data.description || "",
              status: data.status || "In Storage",
              purchaseDate: data.purchaseDate
                ? new Date(data.purchaseDate).toISOString().split("T")[0]
                : "",
              clientId: data.clientId ? String(data.clientId) : "unassigned",
            });
            setError("");
            setLoading(false);
          })
          .catch((err) => {
            setError(err.message);
            setLoading(false);
          });
      }
    }
  }, [open, serialNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/assets/${encodeURIComponent(asset.serialNumber)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            clientId:
              formData.clientId && formData.clientId !== "unassigned"
                ? parseInt(formData.clientId)
                : null,
            purchaseDate: formData.purchaseDate
              ? new Date(formData.purchaseDate).toISOString()
              : null,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update asset");
      }

      onAssetUpdated();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!asset) return;
    if (
      !confirm(
        "Are you sure you want to delete this asset? This cannot be undone."
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/assets/${encodeURIComponent(asset.serialNumber)}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to delete asset");

      onAssetUpdated();
      onOpenChange(false);
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <SheetHeader>
          <SheetTitle>
            {loading ? "Loading..." : `Edit Asset - ${serialNumber}`}
          </SheetTitle>
          <SheetDescription>View and edit asset details.</SheetDescription>
        </SheetHeader>

        {loading && !asset ? (
          <div className="p-8 text-center text-gray-500">
            Loading details...
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : !asset ? (
          <div className="p-4 text-gray-500">Asset not found.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <div className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  {asset.serialNumber}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Asset Name/Model</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
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
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) =>
                    setFormData({ ...formData, type: val })
                  }
                >
                  <SelectTrigger className="w-full">
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
                  onValueChange={(val) =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger className="w-full">
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
                  onValueChange={(val) =>
                    setFormData({ ...formData, clientId: val })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Client" />
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
              </div>
            </div>

            <div className="flex gap-4 pt-6 px-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-900/20"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Asset
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
