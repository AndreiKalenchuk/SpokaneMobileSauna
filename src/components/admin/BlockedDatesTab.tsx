import { useEffect, useState, useCallback, useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import type { DayButtonProps } from 'react-day-picker'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2 } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { usePricingRules } from '@/hooks/usePricingRules'
import { getPriceForDate } from '@/lib/pricing'
import type { BlockedDate, Product, PricingRule } from '@/types'

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function createAdminDayButton(
  primaryProduct: Product | undefined,
  pricingRules: PricingRule[],
  bookedDates: Set<string>,
  blockedDateSet: Set<string>,
  today: Date,
) {
  return function AdminDayButton({
    day,
    modifiers,
    ...buttonProps
  }: DayButtonProps) {
    const date = day.date
    const dateStr = toDateStr(date)

    if (modifiers.outside) return <div />

    const past = startOfDay(date) < today
    const booked = bookedDates.has(dateStr)
    const blocked = blockedDateSet.has(dateStr)
    const available = !past && !booked && !blocked

    const price =
      primaryProduct && !past
        ? getPriceForDate(primaryProduct, date, pricingRules)
        : null

    let bg = ''
    let text = ''
    if (modifiers.selected) {
      bg = 'bg-primary'
      text = 'text-primary-foreground'
    } else if (past) {
      bg = 'bg-gray-50'
      text = 'text-gray-400'
    } else if (blocked) {
      bg = 'bg-red-50'
      text = 'text-red-700'
    } else if (booked) {
      bg = 'bg-amber-50'
      text = 'text-amber-800'
    } else if (available) {
      bg = 'bg-emerald-50'
      text = 'text-emerald-800'
    }

    return (
      <button
        {...buttonProps}
        className={`flex flex-col items-center justify-center rounded-lg w-full h-12 min-w-[2.75rem] transition-colors ${bg} ${text} ${
          !past && !modifiers.selected ? 'hover:ring-2 hover:ring-primary/30' : ''
        } ${modifiers.selected ? 'ring-2 ring-primary shadow-sm' : ''}`}
      >
        <span className="text-sm font-semibold leading-none">
          {date.getDate()}
        </span>
        {price != null && !past && (
          <span className="text-[10px] leading-tight mt-0.5 opacity-70">
            ${price}
          </span>
        )}
      </button>
    )
  }
}

export function BlockedDatesTab() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [month, setMonth] = useState(new Date())

  const { data: products } = useProducts()
  const { data: pricingRulesData } = usePricingRules()
  const primaryProduct = products?.find((p) => p.type === 'primary')
  const pricingRules = pricingRulesData ?? []

  const fetchData = useCallback(async (displayMonth: Date) => {
    const year = displayMonth.getFullYear()
    const m = displayMonth.getMonth()
    const startDate = toDateStr(new Date(year, m, 1))
    const endDate = toDateStr(new Date(year, m + 1, 0))

    const [blockedRes, bookingsRes] = await Promise.all([
      supabase
        .from('blocked_dates')
        .select('*')
        .order('date', { ascending: true }),
      supabase
        .from('bookings')
        .select('rental_date')
        .gte('rental_date', startDate)
        .lte('rental_date', endDate)
        .neq('status', 'cancelled'),
    ])

    setBlockedDates(blockedRes.data ?? [])
    setBookedDates(new Set((bookingsRes.data ?? []).map((b) => b.rental_date)))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData(month)
  }, [month, fetchData])

  const blockedDateSet = new Set(blockedDates.map((d) => d.date))
  const today = startOfDay(new Date())

  function isPast(date: Date) {
    return startOfDay(date) < today
  }

  function isBooked(date: Date) {
    return bookedDates.has(toDateStr(date))
  }

  function isBlocked(date: Date) {
    return blockedDateSet.has(toDateStr(date))
  }

  const AdminDayButton = useMemo(
    () => createAdminDayButton(primaryProduct, pricingRules, bookedDates, blockedDateSet, today),
    [primaryProduct, pricingRules, bookedDates, blockedDateSet, today],
  )

  async function handleBlock() {
    if (!selectedDate) return
    const dateStr = toDateStr(selectedDate)

    const existing = blockedDates.find((d) => d.date === dateStr)
    if (existing) {
      await handleUnblock(existing.id)
      return
    }

    setSaving(true)
    const { data } = await supabase
      .from('blocked_dates')
      .insert({ date: dateStr, reason: reason || null })
      .select()
      .single()

    if (data) {
      setBlockedDates((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
    }
    setSelectedDate(undefined)
    setReason('')
    setSaving(false)
  }

  async function handleUnblock(id: string) {
    await supabase.from('blocked_dates').delete().eq('id', id)
    setBlockedDates((prev) => prev.filter((d) => d.id !== id))
  }

  if (loading) {
    return (
      <div className="mt-4 space-y-4">
        <Skeleton className="h-64 w-full max-w-sm" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={month}
            onMonthChange={setMonth}
            components={{ DayButton: AdminDayButton }}
            classNames={{
              root: 'w-full',
              months: 'w-full',
              month: 'w-full',
              month_caption: 'flex items-center justify-center mb-4 relative',
              caption_label: 'text-base font-semibold',
              nav: 'flex items-center justify-between absolute inset-x-0 top-0 px-1',
              button_previous:
                'size-8 flex items-center justify-center rounded-lg border hover:bg-muted transition-colors',
              button_next:
                'size-8 flex items-center justify-center rounded-lg border hover:bg-muted transition-colors',
              weekdays: 'grid grid-cols-7 gap-2 mb-2',
              weekday:
                'text-xs font-semibold text-muted-foreground text-center py-1',
              weeks: 'grid gap-2',
              week: 'grid grid-cols-7 gap-2',
              day: 'relative',
              outside: 'invisible',
            }}
            className="admin-calendar"
          />

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-block size-3 rounded-sm bg-emerald-50 ring-1 ring-emerald-300" />
              Available
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-block size-3 rounded-sm bg-amber-50 ring-1 ring-amber-300" />
              Booked
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-block size-3 rounded-sm bg-red-50 ring-1 ring-red-300" />
              Blocked
            </div>
          </div>

          {selectedDate && !isPast(selectedDate) && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <p className="text-sm font-medium">
                {isBlocked(selectedDate)
                  ? `Unblock ${selectedDate.toLocaleDateString()}?`
                  : isBooked(selectedDate)
                    ? `${selectedDate.toLocaleDateString()} is booked`
                    : `Block ${selectedDate.toLocaleDateString()}`}
              </p>
              {!isBlocked(selectedDate) && !isBooked(selectedDate) && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Maintenance day"
                  />
                </div>
              )}
              {!isBooked(selectedDate) && (
                <Button onClick={handleBlock} disabled={saving} size="sm">
                  {isBlocked(selectedDate) ? 'Unblock Date' : 'Block Date'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blocked Dates</CardTitle>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocked dates.</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(d.date + 'T00:00:00').toLocaleDateString(
                        'en-US',
                        { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
                      )}
                    </p>
                    {d.reason && (
                      <p className="text-xs text-muted-foreground">
                        {d.reason}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleUnblock(d.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
