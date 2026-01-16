-- DİKKAT: Bu işlem mevcut siparişleri ve ürünleri temizler, taze bir başlangıç yapar.

-- Tabloları temizle
truncate table order_items cascade;
truncate table orders cascade;
truncate table products cascade;

-- Masalar kalsın (veya emin olmak için resetle)
update tables set status = 'empty';

-- Ürünleri YENİ GÜVENİLİR URL'lerle Yeniden Ekle
INSERT INTO products (name, category, price, description, image_url) VALUES
  -- Tatlılar
  ('San Sebastian Cheesecake', 'sweet', 180, 'Akışkan iç dokusu ve çikolata sosu ile.', 'https://upload.wikimedia.org/wikipedia/commons/b/bd/San_Sebastian_Cheesecake.jpg'),
  ('Tiramisu', 'sweet', 160, 'Özel mascarpone peyniri ve espresso ile.', 'https://upload.wikimedia.org/wikipedia/commons/5/58/Tiramisu_-_Raffaele_Diomede.jpg'),
  ('Fıstıklı Baklava', 'sweet', 220, 'Gaziantep fıstığı ile, 4 dilim.', 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Pistachio_Baklava_%2823102093965%29.jpg'),

  -- İçecekler
  ('Iced Latte', 'drink', 95, 'Espresso ve soğuk süt.', 'https://upload.wikimedia.org/wikipedia/commons/9/95/Iced_Latte.jpg'),
  ('Demleme Çay', 'drink', 35, 'Geleneksel ince belli bardakta.', 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Turkish_tea_glass.jpg'),
  ('Orman Meyveli Smoothie', 'drink', 130, 'Yaban mersini, frambuaz ve yoğurt ile.', 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Red_berry_smoothie_in_a_jar_%2823698836144%29.jpg'),

  -- Yemekler
  ('Izgara Tavuk Salata', 'food', 240, 'Avokado, cherry domates ve balzamik sos ile.', 'https://upload.wikimedia.org/wikipedia/commons/2/21/Grilled_Chicken_Vegetable_Salad.jpg'),
  ('Gurme Burger', 'food', 320, '180g dana köfte, karamelize soğan ve patates kızartması.', 'https://upload.wikimedia.org/wikipedia/commons/7/77/Gourmet_Hamburger_%28Unsplash%29.jpg'),
  ('Pizza Margherita', 'food', 260, 'Taze mozzarella, fesleğen ve özel domates sos.', 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Pizza_Margherita_stu_spivack.jpg');
