import type { Livestream } from '../livestreamApi'

// LivestreamPicker – dumb mobile stream-picker <select> for /live: streams + value + onChange only.
export default function LivestreamPicker({
  streams,
  activeId,
  onChange,
}: {
  streams: Livestream[]
  activeId: string | null
  onChange: (id: string | null) => void
}) {
  return (
    <div className="sm:hidden mb-2">
      <select
        value={activeId ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
      >
        <option value="">Select a live stream</option>
        {streams.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title} — {s.host.username}
          </option>
        ))}
      </select>
    </div>
  )
}
