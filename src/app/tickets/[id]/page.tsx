'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    // admin string field removed
    person: string;
    location: string;
    resolution?: string;
    comments?: string;
    adminId?: number;
    admin?: Admin;
    timeEnd?: string;
    totalTime?: number;
}

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<Admin | null>(null);
    const [admins, setAdmins] = useState<Admin[]>([]);

    // Form States
    const [status, setStatus] = useState('');
    const [resolution, setResolution] = useState('');
    const [comments, setComments] = useState('');
    const [company, setCompany] = useState('');
    const [person, setPerson] = useState('');
    const [location, setLocation] = useState('');
    const [issue, setIssue] = useState('');
    const [startedTime, setStartedTime] = useState('');
    const [timeEnd, setTimeEnd] = useState('');
    const [totalTime, setTotalTime] = useState<number | null>(null);
    const [selectedAdminId, setSelectedAdminId] = useState<string>('');

    useEffect(() => {
        // Fetch Session & Admins
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setCurrentUser(data.user));

        fetch('/api/admins')
            .then(res => res.json())
            .then(setAdmins);
    }, []);

    // Fetch Ticket
    useEffect(() => {
        if (!id) return;
        fetch(`/api/tickets?id=${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then((t: Ticket) => {
                setTicket(t);
                setStatus(t.status);
                setResolution(t.resolution || '');
                setComments(t.comments || '');

                // Init status/admin
                setSelectedAdminId(t.adminId ? t.adminId.toString() : '');

                // Init editable fields
                setCompany(t.company);
                setPerson(t.person);
                setLocation(t.location);
                setIssue(t.issue);

                // Format DateTimes
                const start = new Date(t.startedTime);
                start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
                setStartedTime(start.toISOString().slice(0, 16));

                if (t.timeEnd) {
                    const end = new Date(t.timeEnd);
                    end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
                    setTimeEnd(end.toISOString().slice(0, 16));
                }

                if (t.totalTime) {
                    setTotalTime(t.totalTime);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        if (newStatus === 'Unassigned') {
            setSelectedAdminId(''); // Clear admin if unassigned
        }
    };

    const handleAdminChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newAdminId = e.target.value;
        setSelectedAdminId(newAdminId);

        // Auto-update status if assigning an admin
        if (newAdminId && status === 'Unassigned') {
            setStatus('Assigned');
        }

        //Auto-update status if unassigning an admin
        if (!newAdminId && status === 'Assigned') {
            setStatus('Unassigned');
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/tickets', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    status,
                    adminId: selectedAdminId || null, // Send null if empty
                    resolution,
                    comments,
                    company,
                    person,
                    location,
                    issue,
                    startedTime,
                    timeEnd
                }),
            });
            if (res.ok) {
                alert('Ticket Updated');
                window.location.reload();
            } else {
                alert('Failed to update ticket');
            }
        } catch (e) {
            alert('Error updating');
        }
    };

    // Derived Logic
    const isUnassigned = status === 'Unassigned' || !ticket?.adminId;
    // Use loose equality to handle potential string/number mismatch
    const isOwner = currentUser && ticket?.adminId == currentUser.id;
    const canEdit = isUnassigned || isOwner;

    if (loading) return <div className="p-8">Loading...</div>;
    if (!ticket) return <div className="p-8">Ticket not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
            <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow dark:bg-gray-800">


                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Ticket #{ticket.id}</h1>
                    <Link href="/tickets" className="text-blue-600 hover:underline">Back to List</Link>
                </div>

                {!canEdit && (
                    <div className="mb-4 rounded-md bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                        Viewing Mode (Assigned to {ticket.admin?.name})
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Editable Details Column */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Ticket Details</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Started Time</label>
                                <input
                                    type="datetime-local"
                                    value={startedTime}
                                    onChange={(e) => setStartedTime(e.target.value)}
                                    disabled={!canEdit}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-900 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                                <input
                                    type="datetime-local"
                                    value={timeEnd}
                                    onChange={(e) => setTimeEnd(e.target.value)}
                                    disabled={!canEdit}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-900 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                            </div>
                        </div>

                        {totalTime !== null && (
                            <div className="rounded-md bg-blue-50 p-3 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <span className="font-bold">Total Duration:</span> {totalTime} hours
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                            <input
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                disabled={!canEdit}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-900 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person</label>
                            <input
                                type="text"
                                value={person}
                                onChange={(e) => setPerson(e.target.value)}
                                disabled={!canEdit}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-900 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                disabled={!canEdit}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-900 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                            >
                                <option value="remote">Remote</option>
                                <option value="on-site">On-Site</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue</label>
                            <textarea
                                value={issue}
                                onChange={(e) => setIssue(e.target.value)}
                                rows={4}
                                disabled={!canEdit}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-900 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                        </div>
                    </div>

                    {/* Status & Work Column */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Status & Work</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                            <select
                                value={status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={!canEdit}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-900 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                            >
                                <option value="Unassigned">Unassigned</option>
                                <option value="Assigned">Assigned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Admin</label>
                            <select
                                value={selectedAdminId}
                                onChange={handleAdminChange}
                                disabled={!canEdit} // or enable if we want them to reassign even if they can't edit other fields? No, restricted.
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-900 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                            >
                                <option value="">-- Unassigned --</option>
                                {admins.map(admin => (
                                    <option key={admin.id} value={admin.id}>
                                        {admin.name} ({admin.username})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resolution / Notes</label>
                            <textarea
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                rows={3}
                                disabled={!canEdit}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-900 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Private Comments</label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                rows={2}
                                disabled={!canEdit}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-900 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                        </div>

                        {canEdit && (
                            <div className="pt-4 flex flex-col gap-2">
                                <button
                                    onClick={handleSave}
                                    className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
                                        try {
                                            const res = await fetch(`/api/tickets?id=${id}`, { method: 'DELETE' });
                                            if (res.ok) {
                                                router.push('/tickets');
                                                router.refresh();
                                            } else {
                                                alert('Failed to delete ticket');
                                            }
                                        } catch (e) {
                                            alert('Error deleting ticket');
                                        }
                                    }}
                                    className="w-full rounded-md border border-red-500 px-4 py-2 font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    Delete Ticket
                                </button>
                            </div>
                        )}

                        {status === 'Completed' && !canEdit && (
                            <p className="mt-2 text-center text-xs text-gray-500">
                                Ticket completed.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
