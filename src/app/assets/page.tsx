"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Layers, Monitor, Server, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Asset {
  serialNumber: string;
  name: string;
  type: string;
  status: string;
  client?: {
    name: string;
  };
}

import { NewAssetDialog } from "@/components/NewAssetDialog";
import { AssetSheet } from "@/components/AssetSheet";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [newAssetDialogOpen, setNewAssetDialogOpen] = useState(false);
  const [assetSheetOpen, setAssetSheetOpen] = useState(false);
  const [selectedAssetSerial, setSelectedAssetSerial] = useState<string | null>(
    null
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  async function fetchAssets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);

      const res = await fetch(`/api/assets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAssetCreated = () => {
    fetchAssets();
  };

  const handleAssetUpdated = () => {
    fetchAssets();
  };

  const handleOpenAsset = (serial: string) => {
    setSelectedAssetSerial(serial);
    setAssetSheetOpen(true);
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "laptop":
      case "pc":
      case "desktop":
        return <Monitor className="h-4 w-4" />;
      case "server":
        return <Server className="h-4 w-4" />;
      case "software":
        return <Layers className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Assets
          </h1>
          <p className="text-gray-500">Manage your inventory and devices.</p>
        </div>
        <Button onClick={() => setNewAssetDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Asset
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search assets..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Asset Name</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Client / Location</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  Loading assets...
                </TableCell>
              </TableRow>
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No assets found.
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow
                  key={asset.serialNumber}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <TableCell>{getIcon(asset.type)}</TableCell>
                  <TableCell className="font-medium">
                    <span className="hover:underline">{asset.name}</span>
                  </TableCell>
                  <TableCell>{asset.serialNumber}</TableCell>
                  <TableCell>{asset.type}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        asset.status === "Deployed"
                          ? "bg-green-100 text-green-800"
                          : asset.status === "In Storage"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {asset.status}
                    </span>
                  </TableCell>
                  <TableCell>{asset.client?.name || "Unassigned"}</TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAsset(asset.serialNumber);
                      }}
                      className="font-medium p-0 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View / Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <NewAssetDialog
        open={newAssetDialogOpen}
        onOpenChange={setNewAssetDialogOpen}
        onAssetCreated={handleAssetCreated}
      />

      <AssetSheet
        serialNumber={selectedAssetSerial}
        open={assetSheetOpen}
        onOpenChange={setAssetSheetOpen}
        onAssetUpdated={handleAssetUpdated}
      />
    </div>
  );
}
