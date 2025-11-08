// Stub module for photo types
// TODO: Remove when admin photo code is cleaned up

export interface Photo {
  id: string
  title?: string
  caption?: string
  tags?: string[]
  takenAt?: Date
  make?: string
  model?: string
  url?: string
  [key: string]: unknown
}
