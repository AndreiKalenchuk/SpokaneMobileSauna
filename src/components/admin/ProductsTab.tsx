import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Pencil } from 'lucide-react'
import type { Product } from '@/types'

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formActive, setFormActive] = useState(true)

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  function openEdit(product: Product) {
    setEditing(product)
    setFormName(product.name)
    setFormDescription(product.description ?? '')
    setFormPrice(String(product.base_price))
    setFormActive(product.is_active)
  }

  function closeEdit() {
    setEditing(null)
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)

    const { data } = await supabase
      .from('products')
      .update({
        name: formName,
        description: formDescription || null,
        base_price: parseFloat(formPrice),
        is_active: formActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editing.id)
      .select()
      .single()

    if (data) {
      setProducts((prev) => prev.map((p) => (p.id === data.id ? data : p)))
    }

    setSaving(false)
    closeEdit()
  }

  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {products.map((product) => (
        <Card key={product.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">{product.name}</CardTitle>
              <Badge variant={product.is_active ? 'default' : 'secondary'}>
                {product.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">{product.type}</Badge>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(product)}>
              <Pencil className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>
                Base price: <span className="font-medium text-foreground">${product.base_price.toFixed(2)}</span>
              </span>
              {product.description && (
                <span className="line-clamp-1">{product.description}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prod-name">Name</Label>
              <Input
                id="prod-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-desc">Description</Label>
              <Textarea
                id="prod-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-price">Base Price ($)</Label>
              <Input
                id="prod-price"
                type="number"
                step="0.01"
                min="0"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="prod-active"
                checked={formActive}
                onCheckedChange={setFormActive}
              />
              <Label htmlFor="prod-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName || !formPrice}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
