import type { MutableRefObject } from 'react'

export type ScrollChapter = 'portraits' | 'dissolve' | 'reverie'

export interface ScrollState {
  progress: number
  smoothProgress: number
  velocity: number
  chapter: ScrollChapter
}

export function createScrollState(): ScrollState {
  return {
    progress: 0,
    smoothProgress: 0,
    velocity: 0,
    chapter: 'portraits',
  }
}

export function chapterFromProgress(progress: number): ScrollChapter {
  if (progress < 0.32) return 'portraits'
  if (progress < 0.52) return 'dissolve'
  return 'reverie'
}

export const CHAPTER_LABELS: Record<ScrollChapter, string> = {
  portraits: '01 · Portraits',
  dissolve: '02 · Dissolve',
  reverie: '03 · Reverie',
}

export type ScrollRef = MutableRefObject<ScrollState>

export const scrollRef: ScrollRef = {
  current: createScrollState(),
}

const listeners = new Set<() => void>()

export function subscribeScroll(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitScrollUpdate() {
  listeners.forEach((fn) => fn())
}

export function getScrollSnapshot(): ScrollState {
  return scrollRef.current
}
