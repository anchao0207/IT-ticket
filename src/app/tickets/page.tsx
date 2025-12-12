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
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  className="item-center flex cursor-pointer gap-1 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={() => toggleSort("id")}
                >
                  ID
                  {sortBy === "id" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
                <th
                  className="cursor-pointer gap-1 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={() => toggleSort("date")}
                >
                  Date/Time
                  {sortBy === "date" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="cursor-pointer gap-1 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={() => toggleSort("company")}
                >
                  Company
                  {sortBy === "company" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="cursor-pointer gap-1 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={() => toggleSort("issue")}
                >
                  Issue
                  {sortBy === "issue" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="cursor-pointer gap-1 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={() => toggleSort("assignee")}
                >
                  Assignee
                  {sortBy === "assignee" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="cursor-pointer gap-1 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={() => toggleSort("status")}
                >
                  Status
                  {sortBy === "status" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {tickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-blue-600 dark:text-blue-400">
                      <button
                        onClick={() => handleOpenTicket(ticket.id)}
                        className="hover:underline"
                      >
                        #{ticket.id}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ticket.startedTime).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      <div>{ticket.company}</div>
                      <div className="text-xs text-gray-500">
                        {ticket.person}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {ticket.issue}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {ticket.admin?.name || "Unassigned"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
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
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => handleOpenTicket(ticket.id)}
                        className="font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit / View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
