// Terima webhook status WhatsApp resmi Meta dan simpan HANYA status pesan.
// Endpoint publik untuk Meta: semua POST diverifikasi HMAC-SHA256 App Secret.
// Tidak melog nomor WA, isi pesan, atau payload mentah.
import { createClient } from 'npm:@supabase/supabase-js@2'

const env = (key: string) => Deno.env.get(key)?.trim() ?? ''

async function validSignature(body: Uint8Array, header: string | null, secret: string) {
  if (!secret || !header?.startsWith('sha256=')) return false
  const hex = header.slice(7)
  if (!/^[a-fA-F0-9]{64}$/.test(hex)) return false
  const macKey = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signed = new Uint8Array(await crypto.subtle.sign('HMAC', macKey, body))
  const supplied = Uint8Array.from(hex.match(/.{2}/g)!, value => parseInt(value, 16))
  let mismatch = 0
  for (let i=0; i<signed.length; i++) mismatch |= signed[i] ^ supplied[i]
  return mismatch === 0
}

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')
      const expectedToken = env('WA_WEBHOOK_VERIFY_TOKEN')
      if (expectedToken && mode === 'subscribe' && token === expectedToken && challenge) {
        return new Response(challenge, { status: 200, headers: { 'Content-Type':'text/plain' } })
      }
      return new Response('Forbidden', { status: 403 })
    }
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    const body = new Uint8Array(await req.arrayBuffer())
    if (body.length > 512_000) return new Response('Too large', { status: 413 })
    if (!await validSignature(body, req.headers.get('x-hub-signature-256'), env('WA_META_APP_SECRET'))) {
      return new Response('Unauthorized', { status: 401 })
    }

    let data: any
    try { data = JSON.parse(new TextDecoder().decode(body)) }
    catch { return new Response('Bad JSON', { status: 400 }) }

    const keyMap = env('SUPABASE_SECRET_KEYS')
    const secretKey = keyMap ? JSON.parse(keyMap)?.default : env('SUPABASE_SERVICE_ROLE_KEY')
    if (!env('SUPABASE_URL') || !secretKey) {
      console.error('Supabase server credentials missing')
      return new Response('Internal error', { status: 500 })
    }
    const db = createClient(env('SUPABASE_URL'), secretKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    // Abaikan inbound messages, contacts, metadata, dan informasi pribadi lainnya.
    let processed = 0
    for (const entry of data?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        for (const event of change?.value?.statuses ?? []) {
          if (typeof event?.id !== 'string') continue
          if (!['sent','delivered','read','failed'].includes(event.status)) continue
          const { error } = await db.rpc('record_wa_delivery_status', {
            p_message_id: event.id,
            p_stage: event.status
          })
          if (error) {
            console.error('Failed to record WhatsApp status')
            return new Response('Retry later', { status: 500 })
          }
          processed++
        }
      }
    }
    return Response.json({ ok: true, processed })
  }
}
