import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Pencil, Plus } from 'lucide-react'
import type { PricingRule, Product } from '@/types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const RULE_TYPE_LABELS: Record<PricingRule['rule_type'], string> = {
  weekday: 'Weekday',
  weekend: 'Weekend',
  holiday: 'Holiday',
  custom: 'Custom',
}

export function PricingRulesTab() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PricingRule | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formProductId, setFormProductId] = useState('')
  const [formRuleType, setFormRuleType] = useState<PricingRule['rule_type']>('weekday')
  const [formPrice, setFormPrice] = useState('')
  const [formDayOfWeek, setFormDayOfWeek] = useState<number[]>([])
  const [formSpecificDates, setFormSpecificDates] = useState('')
  const [formLabel, setFormLabel] = useState('')

  async function fetchData() {
    const [rulesRes, productsRes] = await Promise.all([
      supabase.from('pricing_rules').select('*').order('priority', { ascending: true }),
      supabase.from('products').select('*').order('sort_order', { ascending: true }),
    ])
    setRules(rulesRes.data ?? [])
    setProducts(productsRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  function openEdit(rule: PricingRule) {
    setEditing(rule)
    setIsNew(false)
    setFormProductId(rule.product_id)
    setFormRuleType(rule.rule_type)
    setFormPrice(String(rule.price))
    setFormDayOfWeek(rule.day_of_week ?? [])
    setFormSpecificDates(rule.specific_dates?.join(', ') ?? '')
    setFormLabel(rule.label ?? '')
  }

  function openNew() {
    setEditing(null)
    setIsNew(true)
    setFormProductId(products[0]?.id ?? '')
    setFormRuleType('weekday')
    setFormPrice('')
    setFormDayOfWeek([])
    setFormSpecificDates('')
    setFormLabel('')
  }

  function closeDialog() {
    setEditing(null)
    setIsNew(false)
  }

  function toggleDay(day: number) {
    setFormDayOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      product_id: formProductId,
      rule_type: formRuleType,
      price: parseFloat(formPrice),
      day_of_week: formDayOfWeek.length > 0 ? formDayOfWeek : null,
      specific_dates:
        formSpecificDates.trim()
          ? formSpecificDates.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
      label: formLabel || null,
    }

    if (isNew) {
      const { data } = await supabase
        .from('pricing_rules')
        .insert({ ...payload, priority: rules.length + 1, is_active: true })
        .select()
        .single()
      if (data) {
        setRules((prev) => [...prev, data])
      }
    } else if (editing) {
      const { data } = await supabase
        .from('pricing_rules')
        .update(payload)
        .eq('id', editing.id)
        .select()
        .single()
      if (data) {
        setRules((prev) => prev.map((r) => (r.id === data.id ? data : r)))
      }
    }

    setSaving(false)
    closeDialog()
  }

  function getProductName(productId: string) {
    return products.find((p) => p.id === productId)?.name ?? 'Unknown'
  }

  const grouped = products
    .map((product) => ({
      product,
      rules: rules.filter((r) => r.product_id === product.id),
    }))
    .filter((g) => g.rules.length > 0)

  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1.5 size-4" />
          Add Rule
        </Button>
      </div>

      {grouped.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No pricing rules defined.
        </p>
      ) : (
        grouped.map(({ product, rules: productRules }) => (
          <div key={product.id} className="space-y-2">
            <h4 className="text-sm font-semibold">{product.name}</h4>
            <div className="space-y-2">
              {productRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {RULE_TYPE_LABELS[rule.rule_type]}
                      </Badge>
                      {rule.label && (
                        <span className="text-sm text-muted-foreground">
                          {rule.label}
                        </span>
                      )}
                      {!rule.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        ${rule.price.toFixed(2)}
                      </span>
                      {rule.day_of_week && rule.day_of_week.length > 0 && (
                        <span>
                          {rule.day_of_week.map((d) => DAY_NAMES[d]).join(', ')}
                        </span>
                      )}
                      {rule.specific_dates && rule.specific_dates.length > 0 && (
                        <span>{rule.specific_dates.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(rule)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog open={isNew || !!editing} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isNew ? 'Add Pricing Rule' : 'Edit Pricing Rule'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={formProductId} onValueChange={setFormProductId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select
                value={formRuleType}
                onValueChange={(v) => setFormRuleType(v as PricingRule['rule_type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekday">Weekday</SelectItem>
                  <SelectItem value="weekend">Weekend</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-price">Price ($)</Label>
              <Input
                id="rule-price"
                type="number"
                step="0.01"
                min="0"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="flex flex-wrap gap-1.5">
                {DAY_NAMES.map((name, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant={formDayOfWeek.includes(idx) ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => toggleDay(idx)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-dates">
                Specific Dates (comma-separated, YYYY-MM-DD)
              </Label>
              <Input
                id="rule-dates"
                value={formSpecificDates}
                onChange={(e) => setFormSpecificDates(e.target.value)}
                placeholder="2025-12-25, 2025-01-01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-label">Label (optional)</Label>
              <Input
                id="rule-label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="e.g. Holiday pricing"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formPrice || !formProductId}>
              {saving ? 'Saving…' : isNew ? 'Add Rule' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
