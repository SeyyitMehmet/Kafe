-- Mevcut verileri temizle (İsteğe bağlı, ID çakışmasını önlemek için)
-- truncate table products cascade; 
-- truncate table tables cascade;
-- truncate table orders cascade;

-- Masalar (Eğer yoksa ekle)
INSERT INTO tables (id, name, status) VALUES
  (1, 'Masa 1', 'empty'),
  (2, 'Masa 2', 'empty'),
  (3, 'Masa 3', 'empty')
ON CONFLICT (id) DO NOTHING;

-- Ürünler
INSERT INTO products (name, category, price, description, image_url) VALUES
  -- Tatlılar
  ('San Sebastian Cheesecake', 'sweet', 180, 'Belçika çikolatası ile servis edilir', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000'),
  ('Tiramisu', 'sweet', 160, 'Orijinal italyan mascarpone ile', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=1000'),
  ('Magnolia', 'sweet', 140, 'Mevsim meyveleri ile', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=1000'),

  -- Kahveler
  ('Latte', 'coffee', 90, 'Yumuşak içim espresso ve süt', 'https://images.unsplash.com/photo-1570968995847-d33f9f218791?q=80&w=1000'),
  ('Americano', 'coffee', 80, 'Double shot espresso ve sıcak su', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000'),
  ('Türk Kahvesi', 'coffee', 70, 'Geleneksel lezzet, lokum ile', 'https://images.unsplash.com/photo-1596919017684-2131976a47a7?q=80&w=1000'),

  -- Ana Yemekler
  ('Izgara Tavuk', 'food', 220, 'Közlenmiş sebzeler ve pilav ile', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=1000'),
  ('Hamburger', 'food', 250, '180gr dana köfte, karamelize soğan', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000'),
  ('Pizza Margherita', 'food', 240, 'Mozzarella, domates sosu ve fesleğen', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1000');
