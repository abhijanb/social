// SettingsStates – dumb loading / error states for /settings. No hooks here.
export function SettingsLoading() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 dark:bg-[#16171d]">
      <p className="text-sm text-gray-500 dark:text-zinc-400">Loading settings...</p>
    </div>
  )
}

export function SettingsError() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 dark:bg-[#16171d]">
      <p className="text-sm text-red-600 dark:text-red-400">Failed to load settings</p>
    </div>
  )
}
