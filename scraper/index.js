const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

// Tambahkan stealth plugin ke playwright
chromium.use(stealth);

const app = express();
app.use(cors());

// Konstanta Konfigurasi
const PORT = process.env.PORT || 3000;

// Endpoint Ekstraksi Stream
app.get('/api/get-stream/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    const season = req.query.s;
    const episode = req.query.e;

    // Membangun URL sumber iframe
    let targetUrl = '';
    if (type === 'tv') {
        // vidsrc biasanya lebih handal untuk ekstensi TV jika tidak ada S & E
        targetUrl = `https://vidsrc.me/embed/tv?tmdb=${id}`;
        if (season && episode) {
            targetUrl = `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`;
        }
    } else {
        // vidlink biasanya lebih cepat dan stabil untuk Film
        targetUrl = `https://vidlink.pro/movie/${id}`;
    }

    console.log(`[Scraper] Memulai ekstraksi untuk: ${targetUrl}`);

    let browser = null;
    try {
        // Meluncurkan browser headless
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        const page = await context.newPage();
        let m3u8Url = null;

        // Mendengarkan semua request network untuk mencegat file m3u8
        page.on('request', request => {
            const url = request.url();
            // Provider sering menggunakan .m3u8 untuk HLS stream
            if (url.includes('.m3u8') || url.includes('master.m3u8') || url.includes('index.m3u8')) {
                if (!m3u8Url) {
                    m3u8Url = url;
                    console.log(`[Scraper] Ditemukan m3u8: ${m3u8Url}`);
                }
            }
        });

        // Kunjungi target URL dan tunggu hingga network idle
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

        // Klik tombol play jika ada (provider sering menyembunyikan m3u8 sebelum tombol ditekan)
        try {
            // Mencoba mengeklik area tengah layar / tombol play yang umum
            await page.mouse.click(500, 300);
            await page.waitForTimeout(3000); // Tunggu beberapa detik agar request m3u8 terpicu
        } catch (e) {
            console.log("[Scraper] Gagal mengeklik tombol play otomatis.");
        }

        await browser.close();

        if (m3u8Url) {
            res.json({ success: true, streamUrl: m3u8Url, source: targetUrl });
        } else {
            res.status(404).json({ success: false, error: 'Gagal mengekstrak aliran m3u8 dari sumber.' });
        }

    } catch (error) {
        console.error(`[Scraper] Error: ${error.message}`);
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: 'Terjadi kesalahan pada mesin scraper.' });
    }
});

app.listen(PORT, () => {
    console.log(`[Scraper] Layanan berjalan di http://localhost:${PORT}`);
    console.log(`[Scraper] Endpoint: GET /api/get-stream/:type/:tmdbId`);
});
