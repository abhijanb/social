import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-gray-50 px-4 py-16 dark:bg-[#16171d]">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Welcome to <span className="text-[#aa3bff] dark:text-violet-400">Social App</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-zinc-400">
          Your social platform starts here. Connect, share, and discover.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="w-full rounded-lg bg-[#aa3bff] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9835e6] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:bg-violet-600 dark:hover:bg-violet-700 sm:w-auto"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 sm:w-auto"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
