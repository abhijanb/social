import { useEffect, useState } from 'react'
import { useAppDispatch } from '../../../app/hooks'
import { setAvatarUrl } from '../../auth/authSlice'
import { resolveImageUrl } from '../../posts/resolvePostImage'
import { useUpdateUserMutation } from '../usersApi'

export const ACCEPT_AVATAR = 'image/jpeg,image/png,image/webp,image/gif'
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024

// useEditProfile – all form + avatar logic for the edit-profile modal, no
// JSX: bio/display name state, avatar pick with object-URL preview, remove
// + undo, validation, JSON vs multipart save with instant avatar persist.
// Avatar changes go as multipart FormData (file under "avatar" or
// removeAvatar=true); bio-only edits stay JSON.
export function useEditProfile({
  initialBio,
  initialDisplayName,
  initialAvatarUrl,
  onClose,
}: {
  initialBio: string
  initialDisplayName: string | null
  initialAvatarUrl: string | null
  onClose: () => void
}) {
  const [bio, setBio] = useState(initialBio ?? '')
  const [displayName, setDisplayName] = useState(initialDisplayName ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [pickError, setPickError] = useState<string | null>(null)
  const [updateUser, { isLoading, error }] = useUpdateUserMutation()
  const dispatch = useAppDispatch()

  // Revoke the preview object URL when it is replaced and on unmount,
  // so closing the modal without saving leaves no dangling blob URL.
  // (Double-revoke with the explicit calls in handlePick/handleRemove is a no-op.)
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const bioOver = bio.trim().length > 150
  const nameOver = displayName.trim().length > 50
  const canSave = !bioOver && !nameOver && !isLoading
  const avatarTouched = file !== null || removeAvatar
  const previewSrc = preview ?? resolveImageUrl(initialAvatarUrl)

  const handlePick = (files: FileList | undefined) => {
    if (!files || files.length === 0) return
    const picked = files[0]
    if (!picked.type.startsWith('image/')) {
      setPickError('Only JPEG, PNG, WebP, GIF images are allowed')
      return
    }
    if (picked.size > MAX_AVATAR_BYTES) {
      setPickError('Avatar too large (max 5MB)')
      return
    }
    setPickError(null)
    if (preview) URL.revokeObjectURL(preview)
    setFile(picked)
    setPreview(URL.createObjectURL(picked))
    setRemoveAvatar(false)
  }

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setRemoveAvatar(true)
  }

  const handleUndoRemove = () => setRemoveAvatar(false)

  const handleSave = async () => {
    if (!canSave) return
    try {
      if (!avatarTouched) {
        await updateUser({
          patch: {
            bio: bio.trim(),
            displayName: displayName.trim() ? displayName.trim() : null,
          },
        }).unwrap()
      } else {
        const form = new FormData()
        form.set('bio', bio.trim())
        form.set('displayName', displayName.trim())
        if (file) form.set('avatar', file)
        else if (removeAvatar) form.set('removeAvatar', 'true')
        const saved = await updateUser({ form, hasAvatarChange: true }).unwrap()
        // Persist instantly so the avatar survives reloads before getMe refetches.
        dispatch(setAvatarUrl(saved.avatarUrl ?? null))
      }
      if (preview) URL.revokeObjectURL(preview)
      onClose()
    } catch {
      // surfaces via `error` below
    }
  }

  return {
    bio,
    setBio,
    displayName,
    setDisplayName,
    preview,
    previewSrc,
    removeAvatar,
    pickError,
    isLoading,
    error,
    bioOver,
    nameOver,
    canSave,
    handlePick,
    handleRemove,
    handleUndoRemove,
    handleSave,
  }
}
