'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<{ name: string } | null>(null);

    useEffect(() => {
        // Check session
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.user) {
                    setUser(data.user);
                }
            });
    }, [pathname]); // Re-check on navigation

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/login');
        router.refresh();
    };

    if (pathname === '/login') return null; // Don't show header on login page

    return (
        <header className="bg-white shadow dark:bg-gray-800">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        IT Ticketing
                    </Link>
                    {user && (
                        <nav className="hidden md:flex gap-4">
                            <Link href="/tickets" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Tickets</Link>
                            <Link href="/time-logs" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Time Logs</Link>
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Hi, {user.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        // Should verify via middleware normally, but nice fallback
                        <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
                    )}
                </div>
            </div>
        </header>
    );
}
