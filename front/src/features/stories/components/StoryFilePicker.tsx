import { ACCEPT_STORY_MEDIA } from '../storiesApi'

// StoryFilePicker – dumb dashed dropzone for StoryComposer. No hooks here.
export default function StoryFilePicker({ onPick }: { onPick: (files: FileList | undefined) => void }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-10 text-center transition hover:border-violet-400 hover:bg-violet-50/50 dark:border-zinc-700 dark:hover:border-violet-500 dark:hover:bg-violet-500/5">
      <svg className="h-8 w-8 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      <span className="text-sm font-medium text-gray-600 dark:text-zinc-300">Pick a photo or video</span>
      <span className="text-xs text-gray-400 dark:text-zinc-500">Expires in 24h • friends-only</span>
      <input
        type="file"
        accept={ACCEPT_STORY_MEDIA}
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files ?? undefined)
          e.target.value = ''
        }}
      />
    </label>
  )
}
