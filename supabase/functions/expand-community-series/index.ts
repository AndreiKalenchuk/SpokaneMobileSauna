import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  series_id?: string
  weeks?: number
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body: RequestBody = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const weeks = Math.min(52, Math.max(1, body.weeks ?? 12))

    let seriesQuery = supabase
      .from('community_event_series')
      .select('*')
      .eq('is_active', true)

    if (body.series_id) seriesQuery = seriesQuery.eq('id', body.series_id)

    const { data: seriesList, error: seriesError } = await seriesQuery
    if (seriesError) throw seriesError

    if (!seriesList || seriesList.length === 0) {
      return new Response(
        JSON.stringify({ inserted: 0, message: 'No active series' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const horizon = new Date(start)
    horizon.setDate(start.getDate() + weeks * 7)

    const rows: Array<{
      event_date: string
      start_time: string
      end_time: string
      slot_minutes: number
      location: string
      capacity_per_slot: number
      is_active: boolean
    }> = []

    for (const series of seriesList) {
      for (let d = new Date(start); d < horizon; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== series.day_of_week) continue
        const dateStr = toDateStr(d)
        if (dateStr < series.starts_on) continue
        if (series.ends_on && dateStr > series.ends_on) continue

        rows.push({
          event_date: dateStr,
          start_time: series.start_time,
          end_time: series.end_time,
          slot_minutes: series.slot_minutes,
          location: series.location,
          capacity_per_slot: series.capacity_per_slot,
          is_active: series.is_active,
        })
      }
    }

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ inserted: 0, message: 'No dates to generate' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { error: upsertError, count } = await supabase
      .from('community_events')
      .upsert(rows, { onConflict: 'event_date', ignoreDuplicates: true, count: 'exact' })

    if (upsertError) throw upsertError

    return new Response(
      JSON.stringify({ inserted: count ?? rows.length, generated: rows.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('expand-community-series error:', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
