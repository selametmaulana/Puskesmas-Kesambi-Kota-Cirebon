// Opsional: otomatis kirim pengingat setelah WhatsApp Business API disiapkan.
// Akses HANYA dengan secret API key Supabase pada header `apikey`.
// Verifikasi dilakukan @supabase/server; verify_jwt=false TIDAK berarti endpoint publik.
// Jangan menjalankan pengiriman menggunakan key publishable/browser.
import { withSupabase } from 'npm:@supabase/server@1'

const cfg = (name: string) => Deno.env.get(name)?.trim() || ''
const displayWIB = (value: string) => new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long',
  year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
}).format(new Date(value)) + ' WIB'

export default {
  fetch: withSupabase({ auth: 'secret' }, async (_req, ctx) => {
    // Nonaktif sampai persetujuan organisasi, nomor bisnis dan template selesai.
    if (cfg('WA_ENABLED') !== 'true') {
      return Response.json({ enabled: false, message: 'Pengiriman otomatis belum diaktifkan.' })
    }
    const accessToken = cfg('WA_ACCESS_TOKEN')
    const phoneNumberId = cfg('WA_PHONE_NUMBER_ID')
    const templateName = cfg('WA_TEMPLATE_NAME')
    const templateLang = cfg('WA_TEMPLATE_LANG') || 'id'
    const apiVersion = cfg('WA_GRAPH_VERSION') || 'v27.0'

    if (!accessToken || !phoneNumberId || !templateName || !/^v[0-9]+\.[0-9]+$/.test(apiVersion)) {
      return Response.json({ error: 'Konfigurasi Cloud API belum lengkap.' }, { status: 503 })
    }

    // Klaim jadwal secara atomik: dua worker tidak boleh memproses jadwal yang sama.
    const { data: queue, error: claimError } = await ctx.supabaseAdmin
      .rpc('claim_due_pengingat_obat', { batch_size: 15 })
    if (claimError) {
      console.error('Gagal mengambil antrean pengingat')
      return Response.json({ error: 'Gagal mengambil jadwal.' }, { status: 500 })
    }

    let submitted = 0
    let errors = 0
    for (const item of queue || []) {
      let status = 'perlu_tinjau'
      let messageId: string | null = null
      let detail = 'Status pengiriman belum pasti; cek Meta WhatsApp Manager'
      try {
        // Template Utility harus sudah disetujui Meta. Variabel 1 adalah tanggal WIB.
        // Jangan menyertakan nama obat, diagnosis, NIK atau informasi kesehatan lainnya.
        const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: item.no_wa,
            type: 'template',
            template: {
              name: templateName,
              language: { code: templateLang },
              components: [{ type: 'body', parameters: [
                { type: 'text', text: displayWIB(item.jadwal_ambil) }
              ] }]
            }
          }),
          signal: AbortSignal.timeout(15000)
        })
        const payload = await response.json().catch(() => ({}))
        if (response.ok && payload?.messages?.[0]?.id) {
          status = 'diajukan_api' // Diterima API, BUKAN terbukti delivered/read.
          messageId = payload.messages[0].id
          detail = ''
          submitted += 1
        } else if (response.status >= 400 && response.status < 500) {
          status = 'gagal'
          detail = `Meta menolak permintaan (HTTP ${response.status}, kode ${String(payload?.error?.code ?? '?').slice(0, 15)})`
          errors += 1
        } else {
          errors += 1
          detail = `Respon API tidak pasti (HTTP ${response.status})`
        }
      } catch {
        // Koneksi putus setelah request mungkin telah diterima Meta.
        // Jangan langsung retry otomatis agar tidak terkirim ganda.
        errors += 1
      }
      const { error: updateError } = await ctx.supabaseAdmin
        .from('pengingat_obat')
        .update({
          status,
          wa_message_id: messageId,
          diajukan_at: status === 'diajukan_api' ? new Date().toISOString() : null,
          last_error: detail || null
        })
        .eq('id', item.id).eq('status', 'diproses')
      if (updateError) console.error('Gagal mencatat status jadwal', item.id)
    }

    return Response.json({ processed: queue?.length || 0, submitted, errors })
  })
}
