"use client";

export type TrackType =
  | 'whatsapp_click'
  | 'call_click'
  | 'web_click'
  | 'tienda_click'
  | 'instagram_click'
  | 'search'

type Payload = {
  sucursalId?: string
  query?: string
  localidad?: string
  resultsCount?: number
}

/** Registra un evento anónimo (fire-and-forget). Nunca rompe la UI. */
export function track(type: TrackType, payload: Payload = {}): void {
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...payload }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* noop */
  }
}
