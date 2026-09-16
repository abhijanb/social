// ProfileFields – dumb display-name + bio inputs for EditProfileModal
// with char counters. No hooks here.
function Counter({ value, max, over }: { value: number; max: number; over: boolean }) {
  return (
    <p className={`mt-1 text-right text-[11px] tabular-nums ${over ? 'text-red-600' : 'text-gray-400'}`}>
      {value}/{max}
    </p>
  )
}

export default function ProfileFields({
  displayName,
  setDisplayName,
  nameOver,
  bio,
  setBio,
  bioOver,
}: {
  displayName: string
  setDisplayName: (v: string) => void
  nameOver: boolean
  bio: string
  setBio: (v: string) => void
  bioOver: boolean
}) {
  return (
    <>
      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-300">
        Display name
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
          placeholder="Your name"
          className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
      </label>
      <Counter value={displayName.trim().length} max={50} over={nameOver} />

      <label className="mt-2 block text-xs font-medium text-gray-600 dark:text-zinc-300">
        Bio
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={170}
          placeholder="Tell people about you…"
          className="mt-1 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
      </label>
      <Counter value={bio.trim().length} max={150} over={bioOver} />
    </>
  )
}
