import { Link } from 'react-router-dom'
import { useLogin } from '../features/auth/hooks/useLogin'

export default function Login() {
  const { register, handleSubmit, errors, onSubmit } = useLogin()

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#16171d]">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Welcome back
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-zinc-400">
          Sign in to your account
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              {...register('username')}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
            />
            {errors.username && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              {...register('password')}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
            />
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-[#aa3bff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9835e6] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:bg-violet-600 dark:hover:bg-violet-700 dark:focus:ring-offset-zinc-800"
          >
            Login
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-zinc-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
