# PROJE RAPORU VE TANITIM MATERYALLERİ

## 1. PROJE RAPORU: SiparişGo

### **Proje Özeti**
**SiparişGo**, kafeler ve restoranlar için geliştirilmiş, **SaaS (Software as a Service)** tabanlı modern bir sipariş yönetim sistemidir. İşletmelerin kağıt menü maliyetlerini ortadan kaldırmasını, sipariş takibini dijitalleştirmesini ve müşteri deneyimini hızlandırmasını sağlar. QR kod teknolojisi ile müşteriler masalarından saniyeler içinde sipariş verebilirken, işletme sahipleri tek bir panel üzerinden tüm süreci yönetebilir.

---

### **Teknik Altyapı ve Teknoloji Yığını**
*   **Frontend End Framework:** React (Vite) - Yüksek performanslı ve modern kullanıcı arayüzü.
*   **Veritabanı & Backend:** Supabase (PostgreSQL) - Gerçek zamanlı veri akışı ve güvenli depolama.
*   **Realtime Sistem:** Supabase Realtime - Mutfak ve müşteri ekranı arasında anlık senkronizasyon (Sipariş düştüğü an bildirim).
*   **Styling:** CSS Modules / Vanilla CSS - Özelleştirilebilir, hızlı ve duyarlı (Responsive) tasarım.
*   **Diğer Kütüphaneler:** 
    *   `qrcode.react`: Dinamik masa karekodları oluşturma.
    *   `lucide-react`: Modern ikon seti.
    *   `react-router-dom`: Sayfa yönlendirmeleri.

---

### **Temel Modüller ve Özellikler**

#### **1. Müşteri Arayüzü (Mobil Uyumlu)**
*   **QR ile Giriş:** Her masaya özel QR kod ile menüye doğrudan erişim.
*   **Dinamik Menü:** Kategorize edilmiş, görsel destekli ürün listesi.
*   **Sepet Yönetimi:** Ürün ekleme, çıkarma ve miktar güncelleme.
*   **Sipariş Takibi:** "Hazırlanıyor", "Teslim Edildi" gibi durumların canlı takibi.
*   **Hızlı Etkileşim:** Garson çağırma veya ekstra istek modülleri (Gelecek planı).

#### **2. Kafe Yönetim Paneli (Admin Dashboard)**
*   **Canlı Sipariş Ekranı:** Masalardan gelen siparişlerin anlık olarak listelenmesi. "Hazırla" ve "Teslim Et" butonları ile iş akışı yönetimi. Sesli bildirim sistemi.
*   **Masa Yönetimi:** Masaların doluluk durumu, hesap özeti ve ödeme alarak masa kapatma.
*   **Ürün Yönetimi:** Ürün ekleme, fiyat güncelleme, stok durumu (Aktif/Pasif) ve sürükle-bırak fotoğraf yükleme.
*   **QR Oluşturucu:** Her masa için cihazdan bağımsız, indirilebilir özel QR kod üretimi.
*   **Geçmiş Siparişler:** Günlük ve haftalık ciro takibi için sipariş geçmişi.

#### **3. Süper Yönetici Paneli (SaaS Yönetimi)**
*   **Çoklu Kiracı (Multi-Tenancy):** Tek bir sistem üzerinden sınırsız sayıda kafe/restoran barındırma.
*   **Abonelik Sistemi:** Deneme sürümü, Aylık, Yıllık ve Ömür Boyu lisanslama seçenekleri.
*   **Gelir Takibi:** Platform üzerinden geçen toplam ciro analizi.
*   **Hesap Yönetimi:** Kafe dondurma, süre uzatma, pasife alma veya silme işlemleri.
*   **Bildirim Merkezi:** Aboneliği biten kafeler için otomatik uyarı sistemi.

---

### **Güvenlik Vurgusu**
*   **RLS (Row Level Security):** Veritabanı seviyesinde güvenlik politikaları.
*   **Güvenli Giriş:** Özel yetkilendirme sistemi ve rol tabanlı erişim kontrolü (RBAC).

---
---

## 2. REKLAM VE TANITIM YAZISI

### **Başlık:** Kağıt Menülere Veda Edin, Hızınıza Hız Katın: Tanıştıralım, **SiparişGo!** 🚀

**İşletmenizi Dijital Çağa Taşıyın!**
Müşterileriniz sipariş vermek için garson beklemekten sıkıldı mı? Ya da kağıt menü bastırmaktan, fiyat değiştirmek için etiket yapıştırmaktan yoruldunuz mu? **SiparişGo** ile kafe ve restoran yönetimini cebinize sığdırıyoruz.

#### **Neden SiparişGo?**

📱 **QR Kod ile Temassız Menü:** 
Müşterileriniz sadece masadaki kodu okutur, menü anında ceplerinde! Uygulama indirmeye gerek yok.

⚡ **Siparişler Saniyeler İçinde Mutfakta:** 
Müşteri "Gönder" dediği an, sipariş yönetim panelinize sesli bildirimle düşer. Yanlış anlaşılma yok, beklemek yok.

🎨 **Menünüzü Özgürce Yönetin:** 
Fiyat mı değişti? Ürün mü bitti? Yönetim panelinden tek tıkla güncelleyin, anında herkesin ekranına yansısın. Fotoğrafları sürükle-bırak ile yükleyin.

📊 **Patron Sizsiniz:** 
Hangi masa ne kadar harcadı? Bugün ciro ne kadar? Geçmiş siparişler neydi? Hepsi rapor ekranında elinizin altında.

🌍 **Her İşletmeye Uygun:** 
İster butik bir kahve dükkanı, ister büyük bir restoran zinciri olun. Esnek altyapımızla **SiparişGo** tam size göre.

#### **Özel Lansman Fırsatı!**
Şimdi üye olun, **7 Gün Ücretsiz Deneme** ile dijital dönüşümü riske girmeden deneyimleyin! 

👉 **Hemen Başlayın:** [Web Sitenizin Linki Buraya]
📞 **İletişim:** [Telefon Numaranız]

**SiparişGo - Lezzete Giden En Hızlı Yol.**
