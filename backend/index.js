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

// Sunucuyu 3000 portunda dinlemeye başlıyoruz
app.listen(port, () => {
    console.log(` Sunucu http://localhost:${port} adresinde çalışıyor.`);
});