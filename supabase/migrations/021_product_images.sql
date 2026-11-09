-- Product photos.
-- The live product rows pointed at files that were never added to public/gallery/
-- (the SPA served index.html instead, so every product image was broken). Clear
-- them; admins now upload real photos (Admin → Settings → Products → edit).
UPDATE products
SET image_url = NULL, updated_at = now()
WHERE image_url IN (
  '/gallery/sauna-exterior.jpg',
  '/gallery/cold-plunge.jpg',
  '/gallery/firewood.jpg',
  '/gallery/aromatherapy.jpg',
  '/gallery/venik.jpg'
);

-- Public bucket: anyone can view a photo by its public URL (no SELECT policy needed).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Admins (any authenticated user, as for every other admin table) upload and
-- remove photos. remove() needs SELECT as well as DELETE on the object.
CREATE POLICY "Auth read: product-images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Auth upload: product-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Auth delete: product-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');
