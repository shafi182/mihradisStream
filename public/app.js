document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const categoriesContainer = document.getElementById('categories-container');
    const heroSection = document.getElementById('hero');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.querySelector('.hero-description');

    // Transisi Navbar saat di-scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    const playerPage = document.getElementById('player-page');
    const closePlayer = document.getElementById('close-player');
    const iframeContainer = document.getElementById('iframe-container');

    // Menutup player page
    closePlayer.addEventListener('click', () => {
        playerPage.classList.remove('active');
        iframeContainer.innerHTML = ''; // Hentikan video
        document.body.style.overflow = 'auto'; // Kembalikan scroll beranda
    });

    let currentPlayerMediaType = '';
    let currentPlayerId = '';

    window.changeServer = function(btn, serverName, useSandbox = false) {
        if (btn) {
            document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        
        let iframeUrl = '';
        const id = currentPlayerId;
        
        if (currentPlayerMediaType === 'tv') {
            if (serverName === 'vidsrc.me') iframeUrl = `https://vidsrc.me/embed/tv?tmdb=${id}`;
            else if (serverName === 'vidsrc.pro') iframeUrl = `https://vidsrc.pro/embed/tv/${id}`;
            else if (serverName === 'vidsrc.cc') iframeUrl = `https://vidsrc.cc/v2/embed/tv/${id}`;
            else if (serverName === 'superembed') iframeUrl = `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`;
        } else {
            if (serverName === 'vidlink') iframeUrl = `https://vidlink.pro/movie/${id}?primaryColor=e50914&autoplay=1`;
            else if (serverName === 'embed.su') iframeUrl = `https://embed.su/embed/movie/${id}`;
            else if (serverName === 'vidsrc.me') iframeUrl = `https://vidsrc.me/embed/movie?tmdb=${id}`;
            else if (serverName === 'superembed') iframeUrl = `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`;
        }
        
        const sandboxAttr = useSandbox ? 'sandbox="allow-same-origin allow-scripts allow-forms"' : '';
        
        iframeContainer.innerHTML = `
            <iframe 
                src="${iframeUrl}" 
                allowfullscreen 
                ${sandboxAttr}
            ></iframe>
        `;
    };

    function playVideo(mediaType, id) {
        currentPlayerMediaType = mediaType;
        currentPlayerId = id;
        
        const serverSelector = document.getElementById('server-selector');
        
        if (mediaType === 'tv') {
            serverSelector.innerHTML = `
                <button class="server-btn active" onclick="changeServer(this, 'vidsrc.me', false)">Server 1 (Lancar)</button>
                <button class="server-btn" onclick="changeServer(this, 'vidsrc.cc', true)">Server 2 (Tanpa Iklan)</button>
                <button class="server-btn" onclick="changeServer(this, 'superembed', true)">Server 3 (Tanpa Iklan)</button>
                <button class="server-btn" onclick="changeServer(this, 'vidsrc.pro', false)">Server 4 (Alternatif)</button>
            `;
            changeServer(null, 'vidsrc.me', false);
        } else {
            serverSelector.innerHTML = `
                <button class="server-btn active" onclick="changeServer(this, 'vidlink', false)">Server 1 (Lancar HD)</button>
                <button class="server-btn" onclick="changeServer(this, 'embed.su', true)">Server 2 (Tanpa Iklan)</button>
                <button class="server-btn" onclick="changeServer(this, 'superembed', true)">Server 3 (Tanpa Iklan)</button>
                <button class="server-btn" onclick="changeServer(this, 'vidsrc.me', false)">Server 4 (Alternatif)</button>
            `;
            changeServer(null, 'vidlink', false);
        }

        playerPage.classList.add('active');
        document.body.style.overflow = 'hidden'; 
        
        const firstBtn = serverSelector.querySelector('.server-btn');
        if (firstBtn) firstBtn.classList.add('active');
    }

    function optimizeImage(url) {
        if (!url) return '';
        if (url.includes('/_next/image?url=')) {
            return url.replace(/w=\d+/, 'w=384').replace(/q=\d+/, 'q=60');
        }
        if (url.includes('image.tmdb.org') || url.includes('tmdb.org')) {
            return url.replace('/original/', '/w500/');
        }
        return url;
    }

    async function fetchMovies() {
        try {
            const response = await fetch('/api/trending');
            const result = await response.json();

            if (result.success && result.categories.length > 0) {
                renderCategories(result.categories);
            } else {
                showError("Tidak ada film ditemukan. Silakan cek koneksi atau proxy.");
            }
        } catch (error) {
            console.error("Error fetching movies:", error);
            showError("Gagal mengambil data dari server.");
        }
    }

    function renderCategories(categories) {
        categoriesContainer.innerHTML = ''; 

        let allMoviesWithBg = [];
        categories.forEach(cat => {
            cat.movies.forEach(m => {
                if (m.background) allMoviesWithBg.push(m);
            });
        });

        if (allMoviesWithBg.length > 0) {
            const heroMovie = allMoviesWithBg[Math.floor(Math.random() * Math.min(10, allMoviesWithBg.length))];
            
            heroTitle.textContent = heroMovie.title;
            if (heroMovie.description) {
                heroDesc.textContent = heroMovie.description.substring(0, 150) + "...";
            }
            
            heroSection.style.backgroundImage = `url('${heroMovie.background}')`;

            const heroPlayBtn = document.querySelector('.btn-play');
            if (heroPlayBtn) {
                heroPlayBtn.onclick = () => playVideo(heroMovie.mediaType, heroMovie.id);
            }
        }

        categories.forEach(category => {
            if (category.movies.length === 0) return;

            const section = document.createElement('section');
            section.className = 'slider-section';
            
            const title = document.createElement('h2');
            title.className = 'slider-title';
            title.textContent = category.name;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'slider-wrapper';

            const leftArrow = document.createElement('div');
            leftArrow.className = 'slider-arrow left';
            leftArrow.innerHTML = '&#10094;';

            const rightArrow = document.createElement('div');
            rightArrow.className = 'slider-arrow right';
            rightArrow.innerHTML = '&#10095;';

            const container = document.createElement('div');
            container.className = 'slider-container';

            let currentTranslate = 0;
            const cardWidth = 170; 

            leftArrow.addEventListener('click', () => {
                currentTranslate += cardWidth * 4;
                if (currentTranslate > 0) currentTranslate = 0;
                container.style.transform = `translateX(${currentTranslate}px)`;
            });

            rightArrow.addEventListener('click', () => {
                // BUG FIX: Gunakan scrollWidth asli container dikurangi lebar area yang terlihat
                // agar slider tidak melewati batas akhir dan menyebabkan ruang kosong hitam.
                const maxTranslate = -(container.scrollWidth - container.clientWidth);
                currentTranslate -= cardWidth * 4;
                if (currentTranslate < maxTranslate) currentTranslate = maxTranslate;
                container.style.transform = `translateX(${currentTranslate}px)`;
            });

            category.movies.forEach(movie => {
                const card = document.createElement('div');
                card.className = 'movie-card';
                
                card.addEventListener('click', () => {
                    playVideo(movie.mediaType, movie.id);
                });

                let yearHTML = movie.release_date ? `<span class="year">${movie.release_date.substring(0,4)}</span>` : '';
                let ratingHTML = movie.rating ? `<span>⭐ ${movie.rating}</span>` : '';
                
                // Gunakan Poster vertikal (bukan background) agar judul film terbaca jelas di gambar!
                const rawThumbnail = movie.poster;
                const thumbnail = optimizeImage(rawThumbnail);

                card.innerHTML = `
                    <div class="card-image-wrapper">
                        <img src="${thumbnail}" loading="lazy" alt="${movie.title}">
                    </div>
                    <div class="card-info">
                        <div class="card-title">${movie.title}</div>
                        <div class="card-metadata">
                            ${ratingHTML}
                            ${yearHTML}
                        </div>
                        <div class="card-actions">
                            <div class="play-circle">
                                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

            wrapper.appendChild(leftArrow);
            wrapper.appendChild(container);
            wrapper.appendChild(rightArrow);
            
            section.appendChild(title);
            section.appendChild(wrapper);

            categoriesContainer.appendChild(section);
        });
    }

    function showError(message) {
        categoriesContainer.innerHTML = `<div style="color: white; padding: 20px;">${message}</div>`;
        heroTitle.textContent = "Oops!";
    }

    fetchMovies();
});
