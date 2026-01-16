-- DİKKAT: Bu işlem mevcut siparişleri ve ürünleri temizler, taze bir başlangıç yapar.

-- Tabloları temizle
truncate table order_items cascade;
truncate table orders cascade;
truncate table products cascade;

-- Masalar kalsın (veya emin olmak için resetle)
update tables set status = 'empty';

-- Ürünleri YEREL (Local) Resimlerle Yeniden Ekle
INSERT INTO products (name, category, price, description, image_url) VALUES
  -- Tatlılar
  ('San Sebastian Cheesecake', 'sweet', 180, 'Akışkan iç dokusu ve çikolata sosu ile.', '/images/sweet_san_sebastian_1768509545434.png'),
  ('Tiramisu', 'sweet', 160, 'Özel mascarpone peyniri ve espresso ile.', '/images/sweet_tiramisu_1768509558307.png'),
  ('Fıstıklı Baklava', 'sweet', 220, 'Gaziantep fıstığı ile, 4 dilim.', '/images/sweet_baklava_1768509572089.png'),

  -- İçecekler
  ('Iced Latte', 'drink', 95, 'Espresso ve soğuk süt.', '/images/drink_iced_latte_1768509597425.png'),
  ('Demleme Çay', 'drink', 35, 'Geleneksel ince belli bardakta.', '/images/drink_turkish_tea_1768509611274.png'),
  ('Orman Meyveli Smoothie', 'drink', 130, 'Yaban mersini, frambuaz ve yoğurt ile.', '/images/drink_berry_smoothie_1768509625361.png'),

  -- Yemekler
  ('Izgara Tavuk Salata', 'food', 240, 'Avokado, cherry domates ve balzamik sos ile.', '/images/food_salad_1768509643220.png'),
  ('Gurme Burger', 'food', 320, '180g dana köfte, karamelize soğan ve patates kızartması.', '/images/food_burger_1768509658030.png'),
  ('Pizza Margherita', 'food', 260, 'Taze mozzarella, fesleğen ve özel domates sos.', '/images/food_pizza_1768509673209.png');
