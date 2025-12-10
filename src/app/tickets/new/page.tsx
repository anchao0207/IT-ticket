'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Admin {
    id: number;
    name: string;
}

export default function NewTicketPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        company: '',
        adminId: '',
        location: '',
        person: '',
        issue: '',
        startedTime: new Date().toISOString().slice(0, 16), // Default to now
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(true);

    useEffect(() => {
        // Fetch valid admins
        fetch('/api/admins')
            .then(res => res.json())
            .then(data => {
                setAdmins(data);
                setLoadingAdmins(false);
            })
            .catch(err => console.error('Failed to load admins', err));

        // Fetch current user to set default
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setFormData(prev => ({ ...prev, adminId: data.user.id.toString() }));
                }
            })
            .catch(err => console.error('Failed to load current user', err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to create ticket');

            router.push('/tickets');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Error submitting ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex min-h-screen flex-col items-center p-6 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-md dark:bg-gray-800">
                <h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">
                    New Ticket
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                Company
                            </label>
                            <input
                                type="text"
                                name="company"
                                required
                                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                value={formData.company}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                Contact Person
                            </label>
                            <input
                                type="text"
                                name="person"
                                required
                                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                value={formData.person}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                Admin (Taking Call)
                            </label>
                            <select
                                name="adminId"
                                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                value={formData.adminId}
                                onChange={handleChange}
                            >
                                <option value="">Select Admin</option>
                                {admins.map(admin => (
                                    <option key={admin.id} value={admin.id}>
                                        {admin.name}
                                    </option>
                                ))}
                            </select>
                            {loadingAdmins && <span className="text-xs text-gray-500">Loading admins...</span>}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                Location
                            </label>
                            <select
                                name="location"
                                required
                                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                value={formData.location}
                                onChange={handleChange}
                            >
                                {/* <option value="">Select Location</option> */}
                                <option value="remote">Remote</option>
                                <option value="on-site">On-Site</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Start Time
                        </label>
                        <input
                            type="datetime-local"
                            name="startedTime"
                            required
                            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                            value={formData.startedTime}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Issue Description
                        </label>
                        <textarea
                            name="issue"
                            required
                            rows={4}
                            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                            value={formData.issue}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Create Ticket'}
                        </button>
                        <Link
                            href="/"
                            className="rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
