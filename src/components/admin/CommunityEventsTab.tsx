import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { CommunityEvent, CommunityEventSeries } from '@/types'

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_SERIES: Omit<CommunityEventSeries, 'id' | 'created_at' | 'updated_at'> = {
  day_of_week: 4,
  start_time: '16:30',
  end_time: '20:00',
  slot_minutes: 60,
  location: '1921 W 10th Ave, Spokane, WA 99204',
  capacity_per_slot: 10,
  starts_on: new Date().toISOString().split('T')[0],
  ends_on: null,
  is_active: true,
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 || 12
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function CommunityEventsTab() {
  const [series, setSeries] = useState<CommunityEventSeries | null>(null)
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSeries, setSavingSeries] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null)
  const [savingEvent, setSavingEvent] = useState(false)

  const [seriesForm, setSeriesForm] = useState(DEFAULT_SERIES)

  const [eventForm, setEventForm] = useState({
    start_time: '16:30',
    end_time: '20:00',
    slot_minutes: 60,
    capacity_per_slot: 10,
    location: '1921 W 10th Ave, Spokane, WA 99204',
    is_active: true,
  })

  const fetchData = useCallback(async () => {
    const today = toDateStr(new Date())

    const [seriesRes, eventsRes] = await Promise.all([
      supabase
        .from('community_event_series')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('community_events')
        .select('*')
        .gte('event_date', today)
        .order('event_date', { ascending: true }),
    ])

    if (seriesRes.data) {
      setSeries(seriesRes.data)
      setSeriesForm({
        day_of_week: seriesRes.data.day_of_week,
        start_time: seriesRes.data.start_time.slice(0, 5),
        end_time: seriesRes.data.end_time.slice(0, 5),
        slot_minutes: seriesRes.data.slot_minutes,
        location: seriesRes.data.location,
        capacity_per_slot: seriesRes.data.capacity_per_slot,
        starts_on: seriesRes.data.starts_on,
        ends_on: seriesRes.data.ends_on,
        is_active: seriesRes.data.is_active,
      })
    }

    setEvents(eventsRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSaveSeries() {
    setSavingSeries(true)
    try {
      if (series) {
        const { data } = await supabase
          .from('community_event_series')
          .update({
            ...seriesForm,
            updated_at: new Date().toISOString(),
          })
          .eq('id', series.id)
          .select()
          .single()
        if (data) setSeries(data)
      } else {
        const { data } = await supabase
          .from('community_event_series')
          .insert(seriesForm)
          .select()
          .single()
        if (data) setSeries(data)
      }
      toast.success('Recurring schedule saved')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save schedule')
    } finally {
      setSavingSeries(false)
    }
  }

  async function handleRegenerate() {
    if (!series) {
      toast.error('Save the recurring schedule first')
      return
    }

    setRegenerating(true)
    try {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const rows: Array<Omit<CommunityEvent, 'id' | 'created_at' | 'updated_at'>> = []

      for (let i = 0; i < 84; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        if (d.getDay() !== series.day_of_week) continue

        const dateStr = toDateStr(d)
        if (series.ends_on && dateStr > series.ends_on) break
        if (dateStr < series.starts_on) continue

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

      if (rows.length > 0) {
        const { error } = await supabase
          .from('community_events')
          .upsert(rows, { onConflict: 'event_date', ignoreDuplicates: true })
        if (error) throw error
      }

      toast.success(`Generated ${rows.length} upcoming events`)
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to regenerate events')
    } finally {
      setRegenerating(false)
    }
  }

  function openEditEvent(event: CommunityEvent) {
    setEditingEvent(event)
    setEventForm({
      start_time: event.start_time.slice(0, 5),
      end_time: event.end_time.slice(0, 5),
      slot_minutes: event.slot_minutes,
      capacity_per_slot: event.capacity_per_slot,
      location: event.location,
      is_active: event.is_active,
    })
  }

  async function handleSaveEvent() {
    if (!editingEvent) return
    setSavingEvent(true)
    try {
      const { data } = await supabase
        .from('community_events')
        .update({
          ...eventForm,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingEvent.id)
        .select()
        .single()
      if (data) {
        setEvents((prev) => prev.map((e) => (e.id === data.id ? data : e)))
      }
      setEditingEvent(null)
      toast.success('Event updated')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update event')
    } finally {
      setSavingEvent(false)
    }
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm('Delete this event? Existing bookings will remain but the date will no longer be bookable.')) return
    const { error } = await supabase.from('community_events').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete event')
      return
    }
    setEvents((prev) => prev.filter((e) => e.id !== id))
    toast.success('Event deleted')
  }

  async function handleToggleEvent(event: CommunityEvent) {
    const { data } = await supabase
      .from('community_events')
      .update({ is_active: !event.is_active, updated_at: new Date().toISOString() })
      .eq('id', event.id)
      .select()
      .single()
    if (data) {
      setEvents((prev) => prev.map((e) => (e.id === data.id ? data : e)))
    }
  }

  if (loading) {
    return (
      <div className="mt-4 space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[420px_1fr]">
      {/* Recurring schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recurring Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Day of week</Label>
            <Select
              value={String(seriesForm.day_of_week)}
              onValueChange={(v) =>
                setSeriesForm({ ...seriesForm, day_of_week: Number(v) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_LABELS.map((label, idx) => (
                  <SelectItem key={idx} value={String(idx)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="series-start">Start time</Label>
              <Input
                id="series-start"
                type="time"
                value={seriesForm.start_time}
                onChange={(e) =>
                  setSeriesForm({ ...seriesForm, start_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-end">End time</Label>
              <Input
                id="series-end"
                type="time"
                value={seriesForm.end_time}
                onChange={(e) =>
                  setSeriesForm({ ...seriesForm, end_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="series-slot">Slot length (min)</Label>
              <Select
                value={String(seriesForm.slot_minutes)}
                onValueChange={(v) =>
                  setSeriesForm({ ...seriesForm, slot_minutes: Number(v) })
                }
              >
                <SelectTrigger id="series-slot">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-cap">Capacity / slot</Label>
              <Input
                id="series-cap"
                type="number"
                min={1}
                value={seriesForm.capacity_per_slot}
                onChange={(e) =>
                  setSeriesForm({
                    ...seriesForm,
                    capacity_per_slot: Number(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="series-loc">Location</Label>
            <Input
              id="series-loc"
              value={seriesForm.location}
              onChange={(e) =>
                setSeriesForm({ ...seriesForm, location: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="series-starts">Starts on</Label>
              <Input
                id="series-starts"
                type="date"
                value={seriesForm.starts_on}
                onChange={(e) =>
                  setSeriesForm({ ...seriesForm, starts_on: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-ends">Ends on (optional)</Label>
              <Input
                id="series-ends"
                type="date"
                value={seriesForm.ends_on ?? ''}
                onChange={(e) =>
                  setSeriesForm({
                    ...seriesForm,
                    ends_on: e.target.value || null,
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="series-active"
              checked={seriesForm.is_active}
              onCheckedChange={(checked) =>
                setSeriesForm({ ...seriesForm, is_active: checked })
              }
            />
            <Label htmlFor="series-active">Active</Label>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleSaveSeries} disabled={savingSeries}>
              {savingSeries ? 'Saving…' : series ? 'Update Schedule' : 'Create Schedule'}
            </Button>
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={regenerating || !series}
            >
              <RefreshCw className="mr-2 size-4" />
              {regenerating ? 'Generating…' : 'Regenerate next 12 weeks'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Community Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No upcoming events. Save a recurring schedule and click "Regenerate" to populate.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {formatDate(event.event_date)}
                      </p>
                      <Badge variant={event.is_active ? 'default' : 'secondary'}>
                        {event.is_active ? 'Active' : 'Off'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTime(event.start_time.slice(0, 5))} –{' '}
                      {formatTime(event.end_time.slice(0, 5))} ·{' '}
                      {event.slot_minutes}-min slots · {event.capacity_per_slot}/slot
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={event.is_active}
                      onCheckedChange={() => handleToggleEvent(event)}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditEvent(event)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit single event */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Event{editingEvent ? ` – ${formatDate(editingEvent.event_date)}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="event-start">Start time</Label>
                <Input
                  id="event-start"
                  type="time"
                  value={eventForm.start_time}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end">End time</Label>
                <Input
                  id="event-end"
                  type="time"
                  value={eventForm.end_time}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, end_time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="event-slot">Slot length (min)</Label>
                <Select
                  value={String(eventForm.slot_minutes)}
                  onValueChange={(v) =>
                    setEventForm({ ...eventForm, slot_minutes: Number(v) })
                  }
                >
                  <SelectTrigger id="event-slot">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-cap">Capacity / slot</Label>
                <Input
                  id="event-cap"
                  type="number"
                  min={1}
                  value={eventForm.capacity_per_slot}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      capacity_per_slot: Number(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-loc">Location</Label>
              <Input
                id="event-loc"
                value={eventForm.location}
                onChange={(e) =>
                  setEventForm({ ...eventForm, location: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="event-active"
                checked={eventForm.is_active}
                onCheckedChange={(checked) =>
                  setEventForm({ ...eventForm, is_active: checked })
                }
              />
              <Label htmlFor="event-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvent} disabled={savingEvent}>
              {savingEvent ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
