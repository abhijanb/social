import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useVerifyEmailQuery } from '../features/auth/authApi'

// VerifyEmailPage – verifies email via token, or shows a "check your email"
// message when redirected here after registration.
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const registered = searchParams.get('registered') === 'true'
  const [showSuccess, setShowSuccess] = useState(false)

  const { data, isLoading, isError, error } = useVerifyEmailQuery(token, {
    skip: !token,
  })

  useEffect(() => {
    if (data?.success) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [data])

  if (!token && registered) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#16171d]">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Check your email</h1>
          <p className="mb-4 text-center text-sm text-gray-500 dark:text-zinc-400">We sent a verification link to your email address. Click it to verify your account.</p>
          <p className="text-center text-sm">
            <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
              Go to login
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#16171d]">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Invalid link</h1>
          <p className="mb-4 text-center text-sm text-gray-500 dark:text-zinc-400">No verification token provided.</p>
          <p className="text-center text-sm">
            <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
              Go to login
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#16171d]">
        <div className="text-center">
          <p className="text-lg text-gray-900 dark:text-white">Verifying your email...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    const message = (error as { data?: { message?: string } })?.data?.message ?? 'Verification failed'
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#16171d]">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Verification failed</h1>
          <p className="mb-4 text-center text-sm text-red-600 dark:text-red-400">{message}</p>
          <p className="text-center text-sm">
            <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
              Go to login
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#16171d]">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Email verified</h1>
        <p className="mb-4 text-center text-sm text-gray-500 dark:text-zinc-400">Your email has been verified successfully. Redirecting to home...</p>
      </div>
    </div>
  )
}
