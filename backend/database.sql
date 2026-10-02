CREATE TABLE kullanicilar (
    id SERIAL PRIMARY KEY,
    dukkan_adi VARCHAR(150) NOT NULL,
    telefon VARCHAR(20) UNIQUE NOT NULL,
    sifre VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'musteri', 
    onay_durumu VARCHAR(20) DEFAULT 'bekliyor', 
    guncel_bakiye DECIMAL(10, 2) DEFAULT 0.00,
    kayit_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kategoriler (
    id SERIAL PRIMARY KEY,
    kategori_adi VARCHAR(100) NOT NULL
);

CREATE TABLE urunler (
    id SERIAL PRIMARY KEY,
    kategori_id INT REFERENCES kategoriler(id), 
    urun_adi VARCHAR(150) NOT NULL,
    marka VARCHAR(100),
    satis_birimi VARCHAR(50) NOT NULL, 
    birim_detayi VARCHAR(255),
    stokta_var_mi BOOLEAN DEFAULT TRUE, 
    fotograflar TEXT[], 
    taban_fiyati DECIMAL(10, 2) NOT NULL,
    eklenme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE siparisler (
    id SERIAL PRIMARY KEY,
    musteri_id INT REFERENCES kullanicilar(id), 
    siparis_durumu VARCHAR(50) DEFAULT 'bekliyor', 
    toplam_tutar DECIMAL(10, 2) DEFAULT 0.00, 
    siparis_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE siparis_detaylari (
    id SERIAL PRIMARY KEY,
    siparis_id INT REFERENCES siparisler(id) ON DELETE CASCADE, 
    urun_id INT REFERENCES urunler(id),
    miktar DECIMAL(10, 2) NOT NULL,
    birim_fiyati DECIMAL(10, 2) NOT NULL,
    ara_toplam DECIMAL(10, 2) NOT NULL 
);