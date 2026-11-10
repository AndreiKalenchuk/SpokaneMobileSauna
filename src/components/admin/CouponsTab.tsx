import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  COUPON_CODE_MAX_LENGTH,
  describeCoupon,
  generateCouponCode,
  isValidCouponCode,
  normalizeCouponCode,
} from '@/lib/coupons'
import type { CouponUnavailableReason, DiscountType } from '@/lib/coupons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Copy, Pencil, Plus, RefreshCw, Shuffle } from 'lucide-react'
import type { Coupon } from '@/types'

/** Row plus the database's verdict (computed column, Pacific-time expiry). */
type AdminCoupon = Coupon & { unavailable_reason: CouponUnavailableReason | null }

const COUPONS_QUERY_KEY = ['admin-coupons']

const STATUS: Record<CouponUnavailableReason | 'live', { label: string; className: string }> = {
  live: { label: 'Live', className: 'bg-green-100 text-green-800' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-700' },
  used_up: { label: 'Used up', className: 'bg-yellow-100 text-yellow-800' },
  not_found: { label: 'Off', className: 'bg-gray-100 text-gray-700' },
}

interface FormState {
  code: string
  discountType: DiscountType
  discountValue: string
  expiresOn: string
  quantity: string
  isActive: boolean
}

/** Today in the business's timezone, as YYYY-MM-DD (en-CA formats ISO-style). */
function todayInPacific(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date())
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function validate(form: FormState, editing: AdminCoupon | null): string | null {
  const code = normalizeCouponCode(form.code)
  if (!isValidCouponCode(code)) {
    return `Code must be 4–${COUPON_CODE_MAX_LENGTH} letters and numbers (dashes allowed between them).`
  }
  const value = Number(form.discountValue)
  if (!form.discountValue || !(value > 0)) return 'Enter a discount greater than 0.'
  if (form.discountType === 'percent' && value >= 100) {
    return 'Percent discounts must be below 100% — a $0 order can’t be paid online.'
  }
  if (!form.expiresOn) return 'Pick an expiration date.'
  if (!editing && form.expiresOn < todayInPacific()) return 'The expiration date is in the past.'
  const quantity = Number(form.quantity)
  if (!Number.isInteger(quantity) || quantity < 1) return 'Quantity must be a whole number of at least 1.'
  if (editing && quantity < editing.current_uses) {
    return `Quantity can’t be below the ${editing.current_uses} already used.`
  }
  return null
}

export function CouponsTab() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<AdminCoupon | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Uses change whenever a customer checks out, so refetch on every visit/focus
  const { data: coupons, isLoading, isFetching, refetch } = useQuery({
    queryKey: COUPONS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*, unavailable_reason:coupon_unavailable_reason')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as AdminCoupon[]
    },
    staleTime: 0,
  })

  function openNew() {
    setEditing(null)
    setIsNew(true)
    setConfirmDelete(false)
    setForm({
      code: generateCouponCode(),
      discountType: 'percent',
      discountValue: '',
      expiresOn: '',
      quantity: '',
      isActive: true,
    })
  }

  function openEdit(coupon: AdminCoupon) {
    setEditing(coupon)
    setIsNew(false)
    setConfirmDelete(false)
    setForm({
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: String(coupon.discount_value),
      expiresOn: coupon.expires_on ?? '',
      quantity: coupon.max_uses === null ? '' : String(coupon.max_uses),
      isActive: coupon.is_active,
    })
  }

  function closeDialog() {
    setEditing(null)
    setIsNew(false)
    setForm(null)
  }

  function update(patch: Partial<FormState>) {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    toast.success(`Copied ${code}`)
  }

  async function handleSave() {
    if (!form) return
    const problem = validate(form, editing)
    if (problem) {
      toast.error(problem)
      return
    }

    setSaving(true)
    const payload = {
      code: normalizeCouponCode(form.code),
      discount_type: form.discountType,
      discount_value: Number(form.discountValue),
      expires_on: form.expiresOn,
      max_uses: Number(form.quantity),
      is_active: form.isActive,
    }
    const { error } = editing
      ? await supabase.from('coupons').update(payload).eq('id', editing.id)
      : await supabase.from('coupons').insert(payload)
    setSaving(false)

    if (error) {
      toast.error(
        error.code === '23505'
          ? `${payload.code} already exists — pick another code.`
          : `Could not save: ${error.message}`,
      )
      return
    }
    toast.success(editing ? 'Coupon saved' : `Coupon ${payload.code} created`)
    queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY })
    closeDialog()
  }

  async function toggleActive(coupon: AdminCoupon, isActive: boolean) {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: isActive })
      .eq('id', coupon.id)
    if (error) toast.error(`Could not update: ${error.message}`)
    queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY })
  }

  async function handleDelete() {
    if (!editing) return
    setSaving(true)
    const { error } = await supabase.from('coupons').delete().eq('id', editing.id)
    setSaving(false)
    if (error) {
      toast.error(
        error.code === '23503'
          ? 'This code is on existing bookings, so it can’t be deleted — switch it off instead.'
          : `Could not delete: ${error.message}`,
      )
      return
    }
    toast.success(`Coupon ${editing.code} deleted`)
    queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY })
    closeDialog()
  }

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          A use is counted when a customer starts paying with a code, and given back if
          that booking is cancelled.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh"
          >
            <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-1.5 size-4" />
            New Coupon
          </Button>
        </div>
      </div>

      {!coupons?.length ? (
        <p className="py-12 text-center text-muted-foreground">No coupons yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Left</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>On</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => {
                const status = STATUS[coupon.unavailable_reason ?? 'live']
                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-medium">{coupon.code}</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Copy ${coupon.code}`}
                          onClick={() => copyCode(coupon.code)}
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{describeCoupon(coupon)}</TableCell>
                    <TableCell>
                      {coupon.expires_on ? formatDate(coupon.expires_on) : 'Never'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {coupon.current_uses}
                      {coupon.max_uses !== null && (
                        <span className="text-muted-foreground"> / {coupon.max_uses}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {coupon.max_uses === null
                        ? '∞'
                        : Math.max(coupon.max_uses - coupon.current_uses, 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={(checked) => toggleActive(coupon, checked)}
                        aria-label={`${coupon.code} on`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${coupon.code}`}
                        onClick={() => openEdit(coupon)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? 'New Coupon' : `Edit ${editing?.code}`}</DialogTitle>
            <DialogDescription>
              Customers enter the code at checkout. It works through the end of the
              expiration day (Pacific time) until all uses are taken.
            </DialogDescription>
          </DialogHeader>

          {form && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon-code"
                    value={form.code}
                    maxLength={COUPON_CODE_MAX_LENGTH}
                    onChange={(e) => update({ code: e.target.value.toUpperCase() })}
                    className="font-mono uppercase"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => update({ code: generateCouponCode() })}
                  >
                    <Shuffle className="mr-1.5 size-4" />
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Letters and numbers, 4–{COUPON_CODE_MAX_LENGTH} characters. Random codes
                  can’t be guessed; short words like SAUNA10 can.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Discount type</Label>
                  <Select
                    value={form.discountType}
                    onValueChange={(v) => update({ discountType: v as DiscountType })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent off</SelectItem>
                      <SelectItem value="fixed">Dollar amount off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-value">
                    {form.discountType === 'percent' ? 'Percent (%)' : 'Amount ($)'}
                  </Label>
                  <Input
                    id="coupon-value"
                    type="number"
                    min="0"
                    step={form.discountType === 'percent' ? '1' : '0.01'}
                    value={form.discountValue}
                    onChange={(e) => update({ discountValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="coupon-expires">Expires on</Label>
                  <Input
                    id="coupon-expires"
                    type="date"
                    min={isNew ? todayInPacific() : undefined}
                    value={form.expiresOn}
                    onChange={(e) => update({ expiresOn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-quantity">Number of coupons</Label>
                  <Input
                    id="coupon-quantity"
                    type="number"
                    min={Math.max(editing?.current_uses ?? 0, 1)}
                    step="1"
                    value={form.quantity}
                    onChange={(e) => update({ quantity: e.target.value })}
                  />
                  {editing && (
                    <p className="text-xs text-muted-foreground">
                      {editing.current_uses} used so far
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <Label htmlFor="coupon-active" className="font-normal">
                  On — customers can use this code
                </Label>
                <Switch
                  id="coupon-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) => update({ isActive: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            {editing ? (
              <Button
                variant={confirmDelete ? 'destructive' : 'ghost'}
                className={confirmDelete ? '' : 'text-destructive'}
                disabled={saving}
                onClick={() => (confirmDelete ? handleDelete() : setConfirmDelete(true))}
              >
                {confirmDelete ? 'Confirm delete' : 'Delete'}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : isNew ? 'Create Coupon' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
