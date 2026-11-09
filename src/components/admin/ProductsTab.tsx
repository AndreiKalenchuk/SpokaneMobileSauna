import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  PRODUCT_IMAGE_TYPES,
  deleteProductImages,
  productImagePath,
  uploadProductImage,
} from '@/lib/productImages'
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
import { ImageOff, Loader2, Pencil, Trash2, Upload } from 'lucide-react'
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
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null)
  // Files uploaded while this dialog is open — cleaned up if not kept
  const [pendingUploads, setPendingUploads] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setFormImageUrl(product.image_url)
    setPendingUploads([])
  }

  function closeEdit() {
    // Cancelled: photos uploaded in this session were never saved
    deleteProductImages(pendingUploads)
    setPendingUploads([])
    setEditing(null)
  }

  async function handleFile(file: File | undefined) {
    if (!editing || !file) return
    setUploading(true)
    try {
      const { path, url } = await uploadProductImage(editing.id, file)
      setPendingUploads((prev) => [...prev, path])
      setFormImageUrl(url)
    } catch (err) {
      toast.error(`Upload failed: ${err instanceof Error ? err.message : 'unknown error'}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)

    const { data, error } = await supabase
      .from('products')
      .update({
        name: formName,
        description: formDescription || null,
        base_price: parseFloat(formPrice),
        image_url: formImageUrl,
        is_active: formActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editing.id)
      .select()
      .single()

    setSaving(false)

    if (error || !data) {
      toast.error(`Could not save: ${error?.message ?? 'product not found'}`)
      return
    }

    // Delete stored photos that are no longer used: the replaced original and
    // any uploads from this session that weren't the final pick
    const keep = productImagePath(formImageUrl)
    const replaced = productImagePath(editing.image_url)
    await deleteProductImages(
      [...pendingUploads, ...(replaced ? [replaced] : [])].filter((p) => p !== keep),
    )

    setProducts((prev) => prev.map((p) => (p.id === data.id ? data : p)))
    setPendingUploads([])
    setEditing(null)
    toast.success('Product saved')
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
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt=""
                  className="size-10 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted"
                  title="No photo"
                >
                  <ImageOff className="size-4 text-muted-foreground" />
                </div>
              )}
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
              <Label>Photo</Label>
              <div className="flex items-center gap-4">
                {formImageUrl ? (
                  <img
                    src={formImageUrl}
                    alt={formName}
                    className="aspect-[4/3] w-36 shrink-0 rounded-lg border object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] w-36 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground">
                    <ImageOff className="size-5" />
                    No photo
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={PRODUCT_IMAGE_TYPES.join(',')}
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Upload className="mr-1.5 size-3.5" />
                    )}
                    {formImageUrl ? 'Replace photo' : 'Upload photo'}
                  </Button>
                  {formImageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={uploading}
                      onClick={() => setFormImageUrl(null)}
                    >
                      <Trash2 className="mr-1.5 size-3.5" />
                      Remove photo
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 5 MB</p>
                </div>
              </div>
            </div>
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
            <Button onClick={handleSave} disabled={saving || uploading || !formName || !formPrice}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
