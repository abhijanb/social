import { useEffect, useRef, useState } from 'react'
import { fileTooBig } from '../../../app/media'
import { MAX_POST_IMAGES, useCreatePostMutation } from '../postsApi'

export const MAX_LENGTH = 2200

// usePostComposer – all composer logic for writing a post, no JSX: text,
// media attach with room-capping + oversize filtering, blob-URL previews,
// post + reset. Needs text, at least one attachment, or both.
export function usePostComposer({ onCreated }: { onCreated?: () => void }) {
  const [text, setText] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [pickError, setPickError] = useState<string | null>(null)
  const [createPost, { isLoading, error }] = useCreatePostMutation()
  const previewsRef = useRef<string[]>([])

  // Keep the ref current so the unmount cleanup below revokes live URLs
  // without calling setState on an unmounted component.
  useEffect(() => {
    previewsRef.current = previews
  })

  // Revoke preview blob URLs on unmount so navigating away mid-compose
  // leaves no dangling URLs (remove/clear/post revoke eagerly already).
  useEffect(() => {
    return () => {
      for (const url of previewsRef.current) URL.revokeObjectURL(url)
    }
  }, [])

  const trimmed = text.trim()
  const overLimit = text.length > MAX_LENGTH
  const canPost = (!!trimmed || images.length > 0) && !overLimit && !isLoading

  const handlePick = (files: FileList | undefined) => {
    if (!files) return
    const picked = Array.from(files)
    if (picked.length === 0) return
    const room = MAX_POST_IMAGES - images.length
    const withinRoom = picked.slice(0, Math.max(0, room))
    const accepted = withinRoom.filter((f) => !fileTooBig(f))
    const rejected = withinRoom.length - accepted.length
    setPickError(
      rejected > 0
        ? 'Some files were skipped (images max 5MB each, videos max 50MB each)'
        : picked.length > withinRoom.length
          ? `Max ${MAX_POST_IMAGES} attachments per post`
          : null,
    )
    if (accepted.length === 0) return
    setImages((prev) => [...prev, ...accepted])
    setPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))])
  }

  const handleRemoveAt = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => {
      const url = prev[index]
      if (url) URL.revokeObjectURL(url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleClearImages = () => {
    setImages([])
    setPickError(null)
    setPreviews((prev) => {
      for (const url of prev) URL.revokeObjectURL(url)
      return []
    })
  }

  const handlePost = async () => {
    if (!canPost) return
    try {
      await createPost({ text: trimmed, images }).unwrap()
      setText('')
      handleClearImages()
      onCreated?.()
    } catch {
      // error surfaces via `error` below
    }
  }

  return {
    text,
    setText,
    images,
    previews,
    pickError,
    isLoading,
    error,
    overLimit,
    canPost,
    handlePick,
    handleRemoveAt,
    handlePost,
  }
}
