import { getInitials } from '../../../components/Avatar'

// LivestreamVideoAvatar – gradient initials fallback for video tiles with camera off. No hooks here.
export default function LivestreamVideoAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-[#aa3bff]">
      <span className="text-2xl font-semibold text-white">{getInitials(name)}</span>
    </div>
  )
}
