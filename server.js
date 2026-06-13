const express = require('express');
const axios = require('axios');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');
const cheerio = require('cheerio'); // Masih kita simpan untuk mengekstrak script

const app = express();

// Sajikan folder public secara statis
app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 3000;

// In-memory cache
let cache = {
    data: null,
    lastFetch: 0
};
const CACHE_DURATION = 60 * 60 * 1000; // 1 Jam

app.get('/api/trending', async (req, res) => {
    // 1. Cek apakah cache masih valid
    if (cache.data && (Date.now() - cache.lastFetch < CACHE_DURATION)) {
        console.log("Menyajikan data dari CACHE (super cepat!)");
        return res.json(cache.data);
    }

    try {
        console.log("Cache kosong/kadaluarsa. Memulai request ringan via Axios...");
        
        const axiosConfig = {
            timeout: 15000, // 15 detik
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        };

        if (process.env.PROXY_SERVER) {
            console.log(`Menggunakan proxy: ${process.env.PROXY_SERVER}`);
            // axios butuh httpsProxyAgent untuk traffic https walau proxy-nya http
            axiosConfig.httpsAgent = new HttpsProxyAgent(process.env.PROXY_SERVER);
            // proxy default axios dinonaktifkan agar tidak bentrok
            axiosConfig.proxy = false; 
        }

        const response = await axios.get('https://cineby.at', axiosConfig);
        console.log("Halaman berhasil diunduh. Mengekstrak JSON mentah...");

        // Ekstrak state Next.js murni tanpa rendering!
        const $ = cheerio.load(response.data);
        const nextDataScript = $('#__NEXT_DATA__').html();
        
        if (!nextDataScript) {
            throw new Error("Tidak menemukan blok data __NEXT_DATA__ dari Next.js!");
        }

        const nextData = JSON.parse(nextDataScript);
        
        let rawCategories = [];
        const pageProps = nextData.props?.pageProps;
        
        // Kumpulkan semua kategori
        if (pageProps?.trendingSections) {
            pageProps.trendingSections.forEach(section => {
                rawCategories.push({ name: section.name || "Trending", movies: section.movies || [] });
            });
        }
        if (pageProps?.defaultSections) {
            pageProps.defaultSections.forEach(section => {
                rawCategories.push({ name: section.name || "More", movies: section.movies || [] });
            });
        }
        if (pageProps?.initialGenreMovies && pageProps.initialGenreMovies.length > 0) {
            rawCategories.push({ name: "Recommended For You", movies: pageProps.initialGenreMovies });
        }

        let finalCategories = [];
        
        rawCategories.forEach(cat => {
            let cleanedMovies = [];
            cat.movies.forEach(m => {
                if (m.title && m.slug && m.poster) {
                    // Hindari duplikasi dalam 1 kategori
                    if (!cleanedMovies.some(existing => existing.title === m.title)) {
                        cleanedMovies.push({
                            id: m.id,
                            title: m.title.replace(/Top\d+/, '').split('·')[0].trim(),
                            link: `https://cineby.at${m.slug}`,
                            poster: m.poster,
                            background: m.background || m.image || null,
                            description: m.description || "",
                            rating: m.rating || null,
                            release_date: m.release_date || null
                        });
                    }
                }
            });

            if (cleanedMovies.length > 0) {
                // Perbaiki nama kategori agar lebih estetik
                let catName = cat.name;
                if (catName === 'popularMovies') catName = 'Popular Movies';
                if (catName === 'popularShowTV') catName = 'Popular TV Shows';
                if (catName === 'trending') catName = 'Trending Now';
                
                finalCategories.push({
                    name: catName,
                    movies: cleanedMovies
                });
            }
        });
        
        const responseData = {
            success: true,
            categories: finalCategories
        };

        // 2. Simpan ke Cache jika berhasil dapat data
        if (finalCategories.length > 0) {
            cache.data = responseData;
            cache.lastFetch = Date.now();
            console.log(`Berhasil menyimpan ${finalCategories.length} kategori ke dalam CACHE.`);
        }
        
        return res.json(responseData);
        
    } catch (error) {
        console.error("Scraping error (Axios):", error.message);
        
        // 3. Fallback: Jika scraping gagal, tapi ada cache lama, berikan cache lama
        if (cache.data) {
            console.log("Scraping gagal, namun menyajikan data CACHE lama sebagai fallback.");
            return res.json(cache.data);
        }

        return res.status(500).json({
            success: false,
            message: "Gagal memproses permintaan data.",
            error: error.message
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cineby Scraper (Vercel-Ready) API running on port ${PORT}`);
});
