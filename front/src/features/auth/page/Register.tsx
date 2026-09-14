import { Link } from 'react-router-dom'
import { useRegister } from '../hooks/useRegister'

export default function Register() {
  const { register, handleSubmit, errors, onSubmit, isLoading, error, errorMessage, suggestions, selectSuggestion } =
    useRegister()

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-[#16171d]">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Create account
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-zinc-400">
          Join our social platform
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
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
              placeholder="Choose a password"
              {...register('password')}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
            />
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>
          {error && errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              <p>{errorMessage}</p>
              {suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="mb-1.5 text-xs font-medium text-red-700 dark:text-red-300">Try one of these:</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        className="rounded-full border border-violet-300 bg-white px-3 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-700 dark:bg-zinc-900 dark:text-violet-300 dark:hover:bg-zinc-800"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#aa3bff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9835e6] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-violet-600 dark:hover:bg-violet-700 dark:focus:ring-offset-zinc-800"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
