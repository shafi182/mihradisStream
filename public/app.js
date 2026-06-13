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

    function playVideo(mediaType, id) {
        let iframeUrl = '';
        if (mediaType === 'tv') {
            // Vidlink butuh parameter season & episode untuk TV Show.
            // Karena kita tidak punya data itu, kita pakai vidsrc.net yang punya UI pemilih episode bawaan!
            iframeUrl = `https://vidsrc.net/embed/tv?tmdb=${id}`;
        } else {
            // Untuk Film (Movie), vidlink.pro jauh lebih bersih.
            iframeUrl = `https://vidlink.pro/movie/${id}?primaryColor=e50914&autoplay=1`;
        }
        
        iframeContainer.innerHTML = `
            <iframe 
                src="${iframeUrl}" 
                allowfullscreen 
            ></iframe>
        `;
        playerPage.classList.add('active');
        document.body.style.overflow = 'hidden'; // Kunci scroll beranda
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

            // Logika Geser Javascript (Transform TranslateX)
            let currentTranslate = 0;
            const cardWidth = 260; // 250px + 10px gap

            leftArrow.addEventListener('click', () => {
                currentTranslate += cardWidth * 3;
                if (currentTranslate > 0) currentTranslate = 0;
                container.style.transform = `translateX(${currentTranslate}px)`;
            });

            rightArrow.addEventListener('click', () => {
                const maxTranslate = -((category.movies.length - 2) * cardWidth);
                currentTranslate -= cardWidth * 3;
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
                
                // Gunakan background (16:9) jika ada, jika tidak, gunakan poster
                const thumbnail = movie.background || movie.poster;

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
