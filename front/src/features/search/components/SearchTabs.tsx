export type SearchTab = 'people' | 'tags'

// SearchTabs – People/Tags pill switcher for /search. Dumb: tab + onChange only.
export default function SearchTabs({ tab, onChange }: { tab: SearchTab; onChange: (t: SearchTab) => void }) {
  return (
    <div className="mt-4 flex gap-2">
      {(['people', 'tags'] as const).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
            tab === t
              ? 'bg-violet-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
