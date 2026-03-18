// Initialize a single carousel
function initCarousel(container: HTMLElement) {
  const carouselId = container.getAttribute('data-carousel-id');
  if (!carouselId) return;

  const track = document.getElementById(carouselId);
  const dots = container.querySelectorAll<HTMLButtonElement>('.carousel-dot');
  const prevBtn = container.querySelector<HTMLButtonElement>('.carousel-nav-btn.prev');
  const nextBtn = container.querySelector<HTMLButtonElement>('.carousel-nav-btn.next');

  if (!track || !dots.length || !prevBtn || !nextBtn) return;

  let currentIndex = 0;
  const totalSlides = dots.length;
  let autoPlayInterval: number | null = null;

  function goToSlide(index: number) {
    currentIndex = (index + totalSlides) % totalSlides;
    (track as HTMLElement).style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = window.setInterval(nextSlide, 4000);
  }

  function stopAutoPlay() {
    if (autoPlayInterval !== null) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  // Event listeners for buttons
  prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    prevSlide();
    stopAutoPlay();
    setTimeout(startAutoPlay, 8000);
  });

  nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    nextSlide();
    stopAutoPlay();
    setTimeout(startAutoPlay, 8000);
  });

  // Event listeners for dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToSlide(index);
      stopAutoPlay();
      setTimeout(startAutoPlay, 8000);
    });
  });

  // Pause on hover
  container.addEventListener('mouseenter', stopAutoPlay);
  container.addEventListener('mouseleave', startAutoPlay);

  // Handle first image load for aspect ratio
  const firstImg = track.querySelector<HTMLImageElement>('img[data-carousel-first="true"]');
  if (firstImg) {
    const handleImageLoad = () => {
      const ratio = firstImg.naturalWidth / firstImg.naturalHeight;
      if (ratio > 0 && track) {
        (track as HTMLElement).style.aspectRatio = ratio.toString();
        const images = track.querySelectorAll<HTMLImageElement>('img');
        images.forEach(img => {
          img.classList.remove('aspect-[3/2]');
          img.style.aspectRatio = ratio.toString();
        });
      }
    };

    if (firstImg.complete) {
      handleImageLoad();
    } else {
      firstImg.addEventListener('load', handleImageLoad);
    }
  }

  // Start autoplay
  startAutoPlay();

  // Cleanup on page unload
  window.addEventListener('beforeunload', stopAutoPlay);
}

// Initialize all carousels on the page
export function initAllCarousels() {
  const carousels = document.querySelectorAll<HTMLElement>('.carousel-container');
  carousels.forEach(initCarousel);
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllCarousels);
} else {
  initAllCarousels();
}

// Also re-initialize for view transitions
document.addEventListener('astro:page-load', initAllCarousels);
