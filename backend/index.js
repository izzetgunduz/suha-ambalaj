// Gerekli paketleri çağırıyoruz
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

// Sunucuyu başlatıyoruz
const app = express();
const port = 3000;

// Güvenlik ve JSON veri okuma ayarları
app.use(cors());
app.use(express.json());

// PostgreSQL Veritabanı Bağlantı Ayarları
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

// Veritabanı bağlantımızı test ediyoruz
pool.connect()
    .then(() => console.log("✅ PostgreSQL Veritabanına başarıyla bağlanıldı!"))
    .catch(err => console.error("❌ Veritabanı bağlantı hatası:", err.stack));

// Mobil uygulama veya web sitesi sunucuya girdiğinde verilecek ilk cevap
app.get('/', (req, res) => {
    res.send('Suha Ambalaj B2B API Sorunsuz Çalışıyor!');
});

// TÜM KULLANICILARI (MÜŞTERİLERİ) GETİREN API UCU
app.get('/api/kullanicilar', async (req, res) => {
    try {
        // Veritabanından tüm kullanıcıları çek
        const tumKullanicilar = await pool.query("SELECT id, dukkan_adi, telefon, rol, onay_durumu FROM kullanicilar");
        
        // Gelen veriyi JSON formatında (mobil uygulamanın anlayacağı dilde) gönder
        res.json(tumKullanicilar.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ hata: "Sunucu hatası oluştu" });
    }
});

// YENİ MÜŞTERİ KAYDI OLUŞTURMA (Register)
app.post('/api/kayit', async (req, res) => {
    try {
        // Mobil uygulamadan gönderilecek verileri karşılıyoruz
        const { dukkan_adi, telefon, sifre } = req.body;

        // Veritabanına yeni müşteriyi ekliyoruz (Şifreyi ileride şifreleyeceğiz, şimdilik düz metin)
        const yeniKullanici = await pool.query(
            "INSERT INTO kullanicilar (dukkan_adi, telefon, sifre) VALUES ($1, $2, $3) RETURNING id, dukkan_adi, telefon, rol, onay_durumu",
            [dukkan_adi, telefon, sifre]
        );

        // Sisteme başarıyla eklendiğini gösteren cevabı (201 Created) geri dönüyoruz
        res.status(201).json(yeniKullanici.rows[0]);
    } catch (err) {
        console.error(err.message);
        // Eğer aynı telefon numarasıyla ikinci kez kayıt olunmaya çalışılırsa hata verecek
        res.status(500).json({ hata: "Kayıt başarısız! Bu telefon numarası zaten sistemde kayıtlı olabilir." });
    }
});


// MÜŞTERİ ONAYLAMA İŞLEMİ (Sadece Admin İçin)
app.put('/api/kullanici-onayla/:id', async (req, res) => {
    try {
        // Linkin sonundaki ID numarasını alıyoruz (Örn: /api/kullanici-onayla/1)
        const { id } = req.params;

        // Veritabanında o ID'ye sahip müşterinin durumunu 'onaylandi' olarak değiştiriyoruz
        const guncellenenKullanici = await pool.query(
            "UPDATE kullanicilar SET onay_durumu = 'onaylandi' WHERE id = $1 RETURNING id, dukkan_adi, onay_durumu",
            [id]
        );

        // Eğer öyle bir müşteri yoksa hata ver
        if (guncellenenKullanici.rows.length === 0) {
            return res.status(404).json({ hata: "Kullanıcı bulunamadı!" });
        }

        // Başarılı olursa güncel durumu geri gönder
        res.json({ 
            mesaj: "Müşteri başarıyla onaylandı!", 
            musteri: guncellenenKullanici.rows[0] 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ hata: "Sunucu hatası oluştu" });
    }
});


// YENİ KATEGORİ EKLEME
app.post('/api/kategori-ekle', async (req, res) => {
    try {
        const { kategori_adi } = req.body;
        const yeniKategori = await pool.query(
            "INSERT INTO kategoriler (kategori_adi) VALUES ($1) RETURNING *",
            [kategori_adi]
        );
        res.status(201).json(yeniKategori.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ hata: "Kategori eklenirken hata oluştu" });
    }
});

// YENİ ÜRÜN EKLEME (Senin İstediğin Dinamik Birim ve Fotoğraf Yapısıyla)
app.post('/api/urun-ekle', async (req, res) => {
    try {
        const { kategori_id, urun_adi, marka, satis_birimi, birim_detayi, taban_fiyati, fotograflar } = req.body;
        
        const yeniUrun = await pool.query(
            "INSERT INTO urunler (kategori_id, urun_adi, marka, satis_birimi, birim_detayi, taban_fiyati, fotograflar) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [kategori_id, urun_adi, marka, satis_birimi, birim_detayi, taban_fiyati, fotograflar]
        );
        res.status(201).json(yeniUrun.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ hata: "Ürün eklenirken hata oluştu" });
    }
});

// YENİ SİPARİŞ OLUŞTURMA (Sepeti Onaylama)
app.post('/api/siparis-olustur', async (req, res) => {
    // Müşteri ID'si, sepetin genel toplamı ve sepetteki ürünler listesi (array) mobil uygulamadan gelecek
    const { musteri_id, toplam_tutar, sepet_urunleri } = req.body;

    try {
        // 1. Önce "siparisler" tablosuna ana fişi (üst kısmı) kesiyoruz
        const yeniSiparis = await pool.query(
            "INSERT INTO siparisler (musteri_id, toplam_tutar) VALUES ($1, $2) RETURNING id",
            [musteri_id, toplam_tutar]
        );
        
        // Veritabanının oluşturduğu o yeni Sipariş Numarasını (ID) alıyoruz
        const siparis_id = yeniSiparis.rows[0].id; 

        // 2. Şimdi sepetteki HER BİR ürünü "siparis_detaylari" tablosuna o Sipariş Numarasıyla ekliyoruz
        for (let urun of sepet_urunleri) {
            await pool.query(
                "INSERT INTO siparis_detaylari (siparis_id, urun_id, miktar, birim_fiyati, ara_toplam) VALUES ($1, $2, $3, $4, $5)",
                [siparis_id, urun.urun_id, urun.miktar, urun.birim_fiyati, urun.ara_toplam]
            );
        }

        // 3. İşlem başarılıysa Android uygulamamıza "Sipariş Alındı" mesajı dönüyoruz
        res.status(201).json({ 
            mesaj: "Sipariş başarıyla oluşturuldu!", 
            siparis_no: siparis_id 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ hata: "Sipariş oluşturulurken bir hata meydana geldi." });
    }
});


// Sunucuyu 3000 portunda dinlemeye başlıyoruz
app.listen(port, () => {
    console.log(` Sunucu http://localhost:${port} adresinde çalışıyor.`);
});