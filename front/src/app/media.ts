// Shared upload-media limits + helpers – single source of truth for posts
// and stories (were duplicated across postsApi/storiesApi with STORY_ names).
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024
export const ACCEPT_MEDIA = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm'

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

export function fileTooBig(file: File): boolean {
  return isVideoFile(file) ? file.size > MAX_VIDEO_BYTES : file.size > MAX_IMAGE_BYTES
}
