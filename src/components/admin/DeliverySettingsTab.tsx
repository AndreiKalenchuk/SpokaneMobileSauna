import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, MapPin, Truck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DELIVERY_SETTINGS_QUERY_KEY, isMissingTableError } from '@/hooks/useDeliverySettings'
import {
  DEFAULT_DELIVERY_SETTINGS,
  MILE_ROUNDING_OPTIONS,
  calculateDeliveryFee,
  fillDeliveryTokens,
  formatMiles,
  normalizeDeliverySettings,
} from '@/lib/delivery'
import type { DeliverySettings, MileRounding } from '@/lib/delivery'

// Inputs edit strings; lists are one item per line
type FormState = {
  [K in keyof DeliverySettings]: DeliverySettings[K] extends boolean
    ? boolean
    : K extends 'delivery_mile_rounding'
      ? MileRounding
      : string
}

type TextKey = {
  [K in keyof FormState]: FormState[K] extends string ? K : never
}[keyof FormState]

const MONEY_FIELDS = ['delivery_base_fee', 'delivery_rate_per_extra_mile', 'pickup_fee'] as const
const MILE_FIELDS = ['delivery_included_miles', 'delivery_max_miles'] as const
type ListKey = 'delivery_points' | 'delivery_instructions' | 'pickup_points' | 'pickup_instructions'

const TOKENS = [
  'delivery_fee',
  'included_miles',
  'extra_mile_rate',
  'max_miles',
  'pickup_price',
  'pickup_exit',
  'pickup_street',
  'pickup_area',
]

function toForm(s: DeliverySettings): FormState {
  return {
    ...s,
    delivery_base_fee: String(s.delivery_base_fee),
    delivery_included_miles: String(s.delivery_included_miles),
    delivery_rate_per_extra_mile: String(s.delivery_rate_per_extra_mile),
    delivery_max_miles: String(s.delivery_max_miles),
    pickup_fee: String(s.pickup_fee),
    delivery_points: s.delivery_points.join('\n'),
    delivery_instructions: s.delivery_instructions.join('\n'),
    pickup_points: s.pickup_points.join('\n'),
    pickup_instructions: s.pickup_instructions.join('\n'),
  }
}

function fromForm(f: FormState): DeliverySettings {
  const lines = (v: string) => v.split('\n').map((l) => l.trim()).filter(Boolean)
  return {
    ...f,
    delivery_base_fee: Number(f.delivery_base_fee),
    delivery_included_miles: Number(f.delivery_included_miles),
    delivery_rate_per_extra_mile: Number(f.delivery_rate_per_extra_mile),
    delivery_max_miles: Number(f.delivery_max_miles),
    pickup_fee: Number(f.pickup_fee),
    delivery_note: f.delivery_note.trim(),
    pickup_exit: f.pickup_exit.trim(),
    pickup_street: f.pickup_street.trim(),
    pickup_area: f.pickup_area.trim(),
    pickup_note: f.pickup_note.trim(),
    delivery_points: lines(f.delivery_points),
    delivery_instructions: lines(f.delivery_instructions),
    pickup_points: lines(f.pickup_points),
    pickup_instructions: lines(f.pickup_instructions),
  }
}

function validate(f: FormState): string[] {
  const errors: string[] = []
  for (const key of [...MONEY_FIELDS, ...MILE_FIELDS]) {
    const n = Number(f[key])
    if (f[key].trim() === '' || !Number.isFinite(n) || n < 0) {
      errors.push(`${key.replace(/_/g, ' ')} must be a number ≥ 0`)
    }
  }
  if (Number(f.delivery_max_miles) <= 0) errors.push('Delivery range must be greater than 0')
  if (!f.delivery_enabled && !f.pickup_enabled) {
    errors.push('Keep at least one of delivery or pickup enabled')
  }
  if (!f.pickup_exit.trim() || !f.pickup_street.trim()) {
    errors.push('Pickup exit and street are required')
  }
  return errors
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function DeliverySettingsTab() {
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState<FormState | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [tableMissing, setTableMissing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (isMissingTableError(error)) {
        setTableMissing(true)
      } else if (error) {
        toast.error(`Could not load delivery settings: ${error.message}`)
      }
      const initial = toForm(error ? DEFAULT_DELIVERY_SETTINGS : normalizeDeliverySettings(data))
      setSaved(initial)
      setForm(initial)
    }

    fetchSettings()
  }, [])

  const errors = useMemo(() => (form ? validate(form) : []), [form])
  const isDirty = !!form && JSON.stringify(form) !== JSON.stringify(saved)

  const preview = useMemo(() => {
    if (!form || errors.length) return null
    const s = fromForm(form)
    const included = s.delivery_included_miles
    const distances = [
      Math.max(1, Math.round(included / 2)),
      included,
      Math.round((included + 3.4) * 10) / 10,
      Math.round((included + (s.delivery_max_miles - included) / 2) * 10) / 10,
      s.delivery_max_miles,
    ].filter((m, i, all) => m > 0 && all.indexOf(m) === i)
    return {
      settings: s,
      rows: distances.map((miles) => ({
        miles,
        ...calculateDeliveryFee(miles, s),
        inRange: miles <= s.delivery_max_miles,
      })),
    }
  }, [form, errors])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSave() {
    if (!form || errors.length) return
    setSaving(true)

    const { data, error } = await supabase
      .from('delivery_settings')
      .update({ ...fromForm(form), updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single()

    setSaving(false)

    if (error || !data) {
      toast.error(`Could not save: ${error?.message ?? 'no settings row found'}`)
      return
    }

    const next = toForm(normalizeDeliverySettings(data))
    setSaved(next)
    setForm(next)
    queryClient.invalidateQueries({ queryKey: DELIVERY_SETTINGS_QUERY_KEY })
    toast.success('Delivery & pickup settings saved — the site updates immediately')
  }

  if (!form) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  const textInput = (key: TextKey, props: React.ComponentProps<typeof Input> = {}) => (
    <Input
      id={`ds-${key}`}
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
      {...props}
    />
  )

  const numberInput = (key: TextKey, step: string) =>
    textInput(key, { type: 'number', step, min: '0', inputMode: 'decimal' })

  const listInput = (key: ListKey, rows = 3) => (
    <Textarea
      id={`ds-${key}`}
      rows={rows}
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
    />
  )

  return (
    <div className="mt-4 space-y-6">
      {tableMissing && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>
            The <code>delivery_settings</code> table was not found — apply migration{' '}
            <code>019_delivery_settings.sql</code> to enable editing. The site is using the
            default values shown below.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Prices apply to new quotes and checkouts as soon as you save. The base location
          used to measure driving distance is a server secret and is not shown here.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setForm(saved)} disabled={!isDirty || saving}>
            Discard
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || saving || errors.length > 0 || tableMissing}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="list-inside list-disc rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Delivery */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-4" />
              Delivery
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="ds-delivery_enabled" className="text-sm text-muted-foreground">
                Offered
              </Label>
              <Switch
                id="ds-delivery_enabled"
                checked={form.delivery_enabled}
                onCheckedChange={(v) => set('delivery_enabled', v)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ds-delivery_base_fee" label="Base fee ($)" hint="Covers the free radius">
                {numberInput('delivery_base_fee', '0.01')}
              </Field>
              <Field id="ds-delivery_included_miles" label="Free radius (miles)" hint="Driving miles included in the base fee">
                {numberInput('delivery_included_miles', '0.1')}
              </Field>
              <Field id="ds-delivery_rate_per_extra_mile" label="Price per extra mile ($)">
                {numberInput('delivery_rate_per_extra_mile', '0.01')}
              </Field>
              <Field id="ds-delivery_max_miles" label="Delivery range (miles)" hint="Farther addresses can't book delivery">
                {numberInput('delivery_max_miles', '0.1')}
              </Field>
            </div>
            <Field id="ds-delivery_mile_rounding" label="Extra-mile rounding">
              <Select
                value={form.delivery_mile_rounding}
                onValueChange={(v) => set('delivery_mile_rounding', v as MileRounding)}
              >
                <SelectTrigger id="ds-delivery_mile_rounding" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MILE_ROUNDING_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="ds-delivery_note" label="Booking page note" hint="Shown under the delivery price on /book">
              {textInput('delivery_note')}
            </Field>
            <Field id="ds-delivery_points" label="Home page bullets" hint="One per line">
              {listInput('delivery_points')}
            </Field>
            <Field
              id="ds-delivery_instructions"
              label="After-booking instructions"
              hint="One per line — confirmation page and confirmation email"
            >
              {listInput('delivery_instructions', 4)}
            </Field>
          </CardContent>
        </Card>

        {/* Pickup */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4" />
              Pickup
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="ds-pickup_enabled" className="text-sm text-muted-foreground">
                Offered
              </Label>
              <Switch
                id="ds-pickup_enabled"
                checked={form.pickup_enabled}
                onCheckedChange={(v) => set('pickup_enabled', v)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ds-pickup_exit" label="Exit" hint='e.g. "I-90 Exit 280A"'>
                {textInput('pickup_exit')}
              </Field>
              <Field id="ds-pickup_street" label="Street" hint='e.g. "Maple St"'>
                {textInput('pickup_street')}
              </Field>
              <Field id="ds-pickup_area" label="City / area" hint="Used in calendar invites">
                {textInput('pickup_area')}
              </Field>
              <Field id="ds-pickup_fee" label="Pickup fee ($)" hint="0 shows as “Free”">
                {numberInput('pickup_fee', '0.01')}
              </Field>
            </div>
            <Field id="ds-pickup_note" label="Booking page note" hint="Shown when a customer picks Pickup on /book">
              <Textarea
                id="ds-pickup_note"
                rows={2}
                value={form.pickup_note}
                onChange={(e) => set('pickup_note', e.target.value)}
              />
            </Field>
            <Field id="ds-pickup_points" label="Home page bullets" hint="One per line">
              {listInput('pickup_points')}
            </Field>
            <Field
              id="ds-pickup_instructions"
              label="After-booking instructions"
              hint="One per line — confirmation page and confirmation email"
            >
              {listInput('pickup_instructions', 4)}
            </Field>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Delivery fee by driving distance
              </p>
              {preview.settings.delivery_enabled ? (
                <table className="w-full text-sm">
                  <tbody>
                    {preview.rows.map((r) => (
                      <tr key={r.miles} className="border-b last:border-0">
                        <td className="py-1.5">{formatMiles(r.miles)} mi</td>
                        <td className="py-1.5 text-muted-foreground">
                          {r.extraMiles > 0 ? `${formatMiles(r.extraMiles)} extra mi` : 'within free radius'}
                        </td>
                        <td className="py-1.5 text-right font-medium">${r.fee.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-1.5">
                        &gt; {formatMiles(preview.settings.delivery_max_miles)} mi
                      </td>
                      <td className="py-1.5 text-muted-foreground" colSpan={2}>
                        outside delivery range
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">Delivery is turned off.</p>
              )}
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Placeholders
              </p>
              <p className="text-muted-foreground">
                Use these in any text above (and in FAQ answers) so it stays in sync with your
                prices:
              </p>
              <ul className="space-y-1">
                {TOKENS.map((t) => (
                  <li key={t} className="flex justify-between gap-4">
                    <code className="text-xs">{`{${t}}`}</code>
                    <span className="text-muted-foreground">
                      {fillDeliveryTokens(`{${t}}`, preview.settings)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
