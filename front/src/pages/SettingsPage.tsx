import { SettingsError, SettingsLoading } from '../features/users/components/SettingsLoadingError'
import VisibilityToggle from '../features/users/components/VisibilityToggle'
import { useSettings } from '../features/users/hooks/useSettings'
import { isUnauthorizedError } from '../app/apiError'

// SettingsPage – thin shell for /settings: states + toggle card.
// Auth is gated by ProtectedLayout; stale sessions log out via useSettings.
export default function SettingsPage() {
  const { isLoading, error, isPublic, isSaving, saveError, handleToggle } = useSettings()

  if (isLoading) return <SettingsLoading />
  if (error && !isUnauthorizedError(error)) return <SettingsError />

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
        <VisibilityToggle isPublic={isPublic} isSaving={isSaving} saveError={saveError} onToggle={handleToggle} />
      </div>
    </div>
  )
}
