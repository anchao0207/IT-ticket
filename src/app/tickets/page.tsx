"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TicketSheet } from "@/components/TicketSheet";
import { NewTicketDialog } from "@/components/NewTicketDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

interface Ticket {
  id: number;
  company: string;
  issue: string;
  status: string;
  date: string;
  startedTime: string;
  admin?: { id: number; name: string };
  person: string;
}

interface Admin {
  id: number;
  name: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  // Filter States
  const [user, setUser] = useState<{ id: number } | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All"); // 'All', 'Me', or admin ID as string

  // Sort State
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState("date"); // 'id', 'company', 'issue', 'assignee', 'status', 'date'

  // Sheet State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // New Ticket Dialog State
  const [newTicketDialogOpen, setNewTicketDialogOpen] = useState(false);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    // Fetch User
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      });

    // Fetch Admins for filter dropdown
    fetch("/api/admins")
      .then((res) => res.json())
      .then((data) => {
        setAdmins(data);
      })
      .catch((err) => console.error("Failed to fetch admins", err));
  }, []);

  const fetchTickets = (page: number) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      search: debouncedSearch,
      sort: sortOrder,
      sortBy,
    });

    if (statusFilter !== "All") params.append("status", statusFilter);

    if (assigneeFilter === "Me" && user) {
      params.append("adminId", user.id.toString());
    } else if (assigneeFilter !== "All") {
      // assigneeFilter is a specific admin ID
      params.append("adminId", assigneeFilter);
    }

    fetch(`/api/tickets?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setTickets(data.tickets);
        setTotalPages(data.metadata.totalPages);
        setTotalTickets(data.metadata.total);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tickets", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, assigneeFilter, sortOrder, sortBy]);

  useEffect(() => {
    fetchTickets(currentPage);
  }, [
    currentPage,
    debouncedSearch,
    statusFilter,
    assigneeFilter,
    user,
    sortOrder,
    sortBy,
  ]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleOpenTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setSheetOpen(true);
  };

  const handleTicketUpdated = () => {
    fetchTickets(currentPage);
  };

  // if (loading) return <div className="p-8 text-center">Loading tickets...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Active Tickets
          </h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => setNewTicketDialogOpen(true)}>
              + New Ticket
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-6 grid gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800 md:grid-cols-4">
          <div className="md:col-span-1">
            <InputGroup>
              <InputGroupInput
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets..."
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="flex gap-2 md:col-span-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Assignees</SelectItem>
                {user && <SelectItem value="Me">My Tickets</SelectItem>}
                {admins
                  .filter((admin) => admin.id !== user?.id)
                  .map((admin) => (
                    <SelectItem key={admin.id} value={admin.id.toString()}>
                      {admin.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* {loading ? <div className="p-8 text-center">Loading tickets...</div> : (
                    <> */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Table className="table-fixed">
            <TableHeader className="bg-gray-50 dark:bg-gray-700">
              <TableRow>
                <TableHead
                  className="w-[60px] cursor-pointer hover:text-gray-700 dark:hover:text-gray-100"
                  onClick={() => toggleSort("id")}
                >
                  <span className="flex items-center gap-1">
                    ID
                    {sortBy === "id" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </TableHead>
                <TableHead
                  className="w-[180px] cursor-pointer hover:text-gray-700 dark:hover:text-gray-100"
                  onClick={() => toggleSort("date")}
                >
                  <span className="flex items-center gap-1">
                    Date/Time
                    {sortBy === "date" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </TableHead>
                <TableHead
                  className="w-[150px] cursor-pointer hover:text-gray-700 dark:hover:text-gray-100"
                  onClick={() => toggleSort("company")}
                >
                  <span className="flex items-center gap-1">
                    Company
                    {sortBy === "company" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-100"
                  onClick={() => toggleSort("issue")}
                >
                  <span className="flex items-center gap-1">
                    Issue
                    {sortBy === "issue" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </TableHead>
                <TableHead
                  className="w-[120px] cursor-pointer hover:text-gray-700 dark:hover:text-gray-100"
                  onClick={() => toggleSort("assignee")}
                >
                  <span className="flex items-center gap-1">
                    Assignee
                    {sortBy === "assignee" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </TableHead>
                <TableHead
                  className="w-[100px] cursor-pointer hover:text-gray-700 dark:hover:text-gray-100"
                  onClick={() => toggleSort("status")}
                >
                  <span className="flex items-center gap-1">
                    Status
                    {sortBy === "status" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </TableHead>
                <TableHead className="w-[90px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No tickets found.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="cursor-pointer">
                    <TableCell className="text-blue-600 dark:text-blue-400">
                      <button
                        onClick={() => handleOpenTicket(ticket.id)}
                        className="hover:underline"
                      >
                        #{ticket.id}
                      </button>
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      {new Date(ticket.startedTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>{ticket.company}</div>
                      <div className="text-xs text-gray-500">
                        {ticket.person}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400 whitespace-normal">
                      {ticket.issue}
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      {ticket.admin?.name || "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          ticket.status === "Unassigned"
                            ? "bg-yellow-100 text-yellow-800"
                            : ticket.status === "Completed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleOpenTicket(ticket.id)}
                        className="font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit / View
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing{" "}
            <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(currentPage * 10, totalTickets)}
            </span>{" "}
            of <span className="font-medium">{totalTickets}</span> results
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>

            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <TicketSheet
        ticketId={selectedTicketId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onTicketUpdated={handleTicketUpdated}
      />

      <NewTicketDialog
        open={newTicketDialogOpen}
        onOpenChange={setNewTicketDialogOpen}
        onTicketCreated={handleTicketUpdated}
      />
    </div>
  );
}
