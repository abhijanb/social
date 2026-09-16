import { useEffect, useRef, useState } from 'react'
import {
  MAX_STORY_BYTES_IMAGE,
  MAX_STORY_BYTES_VIDEO,
  isStoryVideoFile,
  useCreateStoryMutation,
} from '../storiesApi'

export const MAX_CAPTION = 220

export function fileTooBig(file: File): boolean {
  return isStoryVideoFile(file) ? file.size > MAX_STORY_BYTES_VIDEO : file.size > MAX_STORY_BYTES_IMAGE
}

// useStoryComposer – all composer logic for posting a story, no JSX: file,
// blob-URL preview, caption, pick/post handlers. Single media only.
export function useStoryComposer({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [pickError, setPickError] = useState<string | null>(null)
  const [createStory, { isLoading, error }] = useCreateStoryMutation()
  const previewRef = useRef<string | null>(null)

  useEffect(() => {
    previewRef.current = preview
  })

  // Revoke the preview blob URL on unmount so closing mid-compose
  // leaves no dangling URL (pick/post/clear revoke eagerly already).
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  const canShare = !!file && !isLoading

  const handlePick = (files: FileList | undefined) => {
    if (!files || files.length === 0) return
    const picked = files[0]
    if (fileTooBig(picked)) {
      setPickError('File too large (images max 5MB, videos max 50MB)')
      return
    }
    setPickError(null)
    if (preview) URL.revokeObjectURL(preview)
    setFile(picked)
    setPreview(URL.createObjectURL(picked))
  }

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
  }

  const handlePost = async () => {
    if (!file || isLoading) return
    try {
      await createStory({ text: text.trim(), media: file }).unwrap()
      if (preview) URL.revokeObjectURL(preview)
      onCreated?.()
      onClose()
    } catch {
      // surfaces via `error` below
    }
  }

  return {
    file,
    preview,
    text,
    setText,
    pickError,
    isLoading,
    error,
    canShare,
    handlePick,
    handleClear,
    handlePost,
  }
}
