import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6 dark:bg-gray-900">
      <main className="w-full max-w-4xl text-center">
        <h1 className="mb-8 text-4xl font-bold text-gray-800 dark:text-gray-100">
          IT Ticketing System
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {/* Ticket Management Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Tickets
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Submit new issues, view active tickets, and manage assignments.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/tickets/new"
                className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                New Ticket
              </Link>
              <Link
                href="/tickets"
                className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                View All Tickets
              </Link>
            </div>
          </div>

          {/* Time Logging Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Time Logs
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Track your daily work hours, clock in/out, and manage breaks.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/time-logs"
                className="rounded-md bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
              >
                Clock In / Out
              </Link>
              <Link
                href="/time-logs"
                className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                View Logs
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
