import * as React from 'react'
import type { ToastProps } from './toast'

export type ToastItem = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
}

type Listener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()
let count = 0

function emit() {
  listeners.forEach((l) => l(toasts))
}

export function toast(input: Omit<ToastItem, 'id'>) {
  const id = String(++count)
  const item: ToastItem = {
    ...input,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismiss(id)
    },
  }
  toasts = [item, ...toasts].slice(0, 3)
  emit()
  return id
}

export function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function useToast() {
  const [state, setState] = React.useState<ToastItem[]>(toasts)
  React.useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])
  return { toasts: state, toast, dismiss }
}
