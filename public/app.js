document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const trendingContainer = document.getElementById('trending-container');
    const heroSection = document.getElementById('hero');
    const heroTitle = document.getElementById('hero-title');

    // Transisi Navbar saat di-scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mengambil data dari API
    async function fetchMovies() {
        try {
            const response = await fetch('/api/trending');
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                renderMovies(result.data);
            } else {
                showError("Tidak ada film ditemukan. Silakan cek koneksi atau proxy.");
            }
        } catch (error) {
            console.error("Error fetching movies:", error);
            showError("Gagal mengambil data dari server.");
        }
    }

    function renderMovies(movies) {
        trendingContainer.innerHTML = ''; // Hapus skeleton

        // Setel Hero Background dengan film pertama yang memiliki gambar beresolusi tinggi (atau poster)
        const validMovies = movies.filter(m => m.poster && m.title !== 'Cineby');
        if (validMovies.length > 0) {
            const heroMovie = validMovies[Math.floor(Math.random() * Math.min(5, validMovies.length))];
            
            // Coba membersihkan judul dari tag tambahan jika ada
            let cleanTitle = heroMovie.title.replace(/Top\d+/, '').split('·')[0].trim();
            heroTitle.textContent = cleanTitle;
            
            // Pasang gambar latar. Karena kita hanya punya poster, kita gunakan itu. 
            // Di produksi nyata, kita butuh 'backdrop' horizontal.
            heroSection.style.backgroundImage = `url('${heroMovie.poster}')`;
        }

        // Render Kartu Film
        validMovies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            
            // Tangani klik untuk membuka link Cineby (opsional)
            card.addEventListener('click', () => {
                window.open(movie.link, '_blank');
            });

            // Bersihkan teks judul untuk UI
            let cleanTitle = movie.title.replace(/Top\d+/, '').split('·')[0].trim();

            card.innerHTML = `
                <img src="${movie.poster}" alt="${cleanTitle}" loading="lazy">
                <div class="card-info">
                    <div class="card-title">${cleanTitle}</div>
                    <div class="card-actions">
                        <div class="play-circle">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    </div>
                </div>
            `;
            trendingContainer.appendChild(card);
        });
    }

    function showError(message) {
        trendingContainer.innerHTML = `<div style="color: white; padding: 20px;">${message}</div>`;
        heroTitle.textContent = "Oops!";
    }

    // Mulai penarikan data
    fetchMovies();
});
