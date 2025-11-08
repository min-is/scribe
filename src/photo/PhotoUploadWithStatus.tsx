// Stub component for photo upload
// TODO: Remove when admin upload is cleaned up

export default function PhotoUploadWithStatus({
  inputId,
  shouldResize,
  onLastUpload,
  showStatusText,
}: {
  inputId?: string
  shouldResize?: boolean
  onLastUpload?: () => Promise<void>
  showStatusText?: boolean
}) {
  return null;
}
