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

        // Setel Hero Background dengan film pertama yang memiliki gambar background
        // Cari semua film yang punya background
        let allMoviesWithBg = [];
        categories.forEach(cat => {
            cat.movies.forEach(m => {
                if (m.background) allMoviesWithBg.push(m);
            });
        });

        if (allMoviesWithBg.length > 0) {
            // Pilih acak dari top 10
            const heroMovie = allMoviesWithBg[Math.floor(Math.random() * Math.min(10, allMoviesWithBg.length))];
            
            heroTitle.textContent = heroMovie.title;
            if (heroMovie.description) {
                heroDesc.textContent = heroMovie.description.substring(0, 150) + "...";
            }
            
            heroSection.style.backgroundImage = `url('${heroMovie.background}')`;
        }

        // Render Setiap Kategori
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

            // Fitur geser
            leftArrow.addEventListener('click', () => {
                container.scrollBy({ left: -window.innerWidth * 0.7, behavior: 'smooth' });
            });
            rightArrow.addEventListener('click', () => {
                container.scrollBy({ left: window.innerWidth * 0.7, behavior: 'smooth' });
            });

            // Render Kartu Film
            category.movies.forEach(movie => {
                const card = document.createElement('div');
                card.className = 'movie-card';
                
                card.addEventListener('click', () => {
                    window.open(movie.link, '_blank');
                });

                let yearHTML = movie.release_date ? `<span class="year">${movie.release_date.substring(0,4)}</span>` : '';
                let ratingHTML = movie.rating ? `<span>⭐ ${movie.rating}</span>` : '';

                card.innerHTML = `
                    <div class="card-image-wrapper">
                        <img src="${movie.poster}" loading="lazy" alt="${movie.title}">
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
