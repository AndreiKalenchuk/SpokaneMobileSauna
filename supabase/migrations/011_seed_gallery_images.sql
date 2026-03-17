-- Add real gallery images from public/gallery (exterior + interior + video frames)
-- Removes old placeholder URLs and inserts actual images for existing databases.

DELETE FROM gallery_images WHERE url IN (
  '/gallery/sauna-exterior.jpg', '/gallery/sauna-interior.jpg', '/gallery/sauna-stove.jpg',
  '/gallery/cold-plunge.jpg', '/gallery/backyard-setup.jpg', '/gallery/winter-session.jpg',
  '/gallery/group-event.jpg', '/gallery/sunset-sauna.jpg', '/gallery/aromatherapy.jpg',
  '/gallery/venik.jpg', '/gallery/firewood.jpg', '/gallery/delivery-trailer.jpg'
);

INSERT INTO gallery_images (url, alt_text, caption, category, sort_order) VALUES
  ('/gallery/exterior/exterior-1.jpg', 'Mobile sauna exterior view', 'Our cedar mobile sauna ready for delivery', 'exterior', 1),
  ('/gallery/exterior/exterior-2.jpg', 'Sauna exterior at golden hour', 'Beautiful cedar exterior', 'exterior', 2),
  ('/gallery/exterior/exterior-3.jpg', 'Mobile sauna setup', 'Ready for your backyard', 'exterior', 3),
  ('/gallery/exterior/exterior-4.jpg', 'Sauna exterior view', 'Premium wood-fired mobile sauna', 'exterior', 4),
  ('/gallery/exterior/exterior-5.jpg', 'Cedar sauna exterior', 'Handcrafted mobile sauna', 'exterior', 5),
  ('/gallery/interior/interior-1.jpg', 'Sauna interior with benches', 'Handcrafted cedar benches seat up to 6', 'interior', 6),
  ('/gallery/interior/interior-2.jpg', 'Sauna interior warm glow', 'Authentic wood-fired heat', 'interior', 7),
  ('/gallery/interior/interior-3.jpg', 'Cedar interior detail', 'Premium cedar interior', 'interior', 8),
  ('/gallery/interior/interior-4.jpg', 'Sauna benches and stove', 'The real sauna experience', 'interior', 9),
  ('/gallery/interior/interior-5.jpg', 'Cozy sauna interior', 'Relax and unwind', 'interior', 10),
  ('/gallery/interior/video-frame-01.jpg', 'Sauna in action', 'Our mobile sauna in use', 'interior', 11),
  ('/gallery/interior/video-frame-02.jpg', 'Sauna session', 'Enjoy the heat', 'interior', 12),
  ('/gallery/interior/video-frame-03.jpg', 'Sauna warmth', 'Wood-fired authenticity', 'interior', 13),
  ('/gallery/interior/video-frame-04.jpg', 'Sauna experience', 'Pure relaxation', 'interior', 14),
  ('/gallery/interior/video-frame-05.jpg', 'Mobile sauna session', 'Delivered to your door', 'interior', 15);
