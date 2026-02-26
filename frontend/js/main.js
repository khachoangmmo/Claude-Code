/**
 * Mrbo Ads E-Learning — Main JavaScript
 * Shared utilities, component renderers, and global behaviors
 */

// ── Navbar scroll effect ──────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);

  const scrollBtn = document.getElementById('scrollTop');
  if (scrollBtn) scrollBtn.classList.toggle('show', window.scrollY > 400);
});

// ── Scroll to top ─────────────────────────────────────────────────────────────
document.getElementById('scrollTop')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Intersection Observer for fade-in animations ──────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ── Course Card Renderer ──────────────────────────────────────────────────────
function renderCourseCard(course) {
  const levelLabels = { beginner: 'Cơ bản', intermediate: 'Trung cấp', advanced: 'Nâng cao' };
  const hours = Math.floor((course.duration || 0) / 60);
  const mins  = (course.duration || 0) % 60;
  const durationStr = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;

  const emoji = course.emoji ||
    { 'Facebook Ads': '📱', 'Google Ads': '🔍', 'TikTok Ads': '🎵', 'Zalo Ads': '💬', 'Landing Page': '🌐', 'Data & Analytics': '📊' }[course.category_name] || '📚';

  const stars = '★'.repeat(Math.round(course.rating || 0)) + '☆'.repeat(5 - Math.round(course.rating || 0));

  const priceHtml = course.price === 0
    ? `<span class="price-free">Miễn phí</span>`
    : `<div class="price-current">${(course.price || 0).toLocaleString('vi-VN')}₫</div>
       ${course.original_price ? `<div class="price-original">${course.original_price.toLocaleString('vi-VN')}₫</div>` : ''}`;

  const discountPct = course.original_price && course.price
    ? Math.round((1 - course.price / course.original_price) * 100) : 0;

  return `
    <div class="course-card" onclick="window.location.href='/course.html?slug=${course.slug}'">
      <div class="course-thumbnail">
        ${course.thumbnail
          ? `<img src="${course.thumbnail}" alt="${course.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''
        }
        <div class="course-thumbnail-placeholder" ${course.thumbnail ? 'style="display:none"' : ''}>${emoji}</div>

        ${course.is_featured ? `<div class="course-badge badge-featured"><i class="fas fa-bolt"></i> Nổi bật</div>` : ''}
        ${discountPct >= 30 ? `<div class="course-badge badge-hot" style="top:${course.is_featured ? '40px' : '12px'};left:12px">-${discountPct}%</div>` : ''}
        <div class="course-level">${levelLabels[course.level] || course.level || ''}</div>

        <div class="course-play-btn">
          <div class="play-icon"><i class="fas fa-play"></i></div>
        </div>
      </div>

      <div class="course-body">
        <div class="course-category">${course.category_name || ''}</div>
        <h3 class="course-title">${course.title}</h3>
        <div class="course-instructor">
          <i class="fas fa-user" style="font-size:0.7rem;margin-right:4px"></i>
          ${course.instructor_name || 'Mrbo Ads'}
        </div>

        <div class="course-rating" style="margin-bottom:10px">
          <span class="rating-score">${course.rating || '0'}</span>
          <span class="stars">${stars}</span>
          <span class="rating-count">(${(course.rating_count || 0).toLocaleString('vi-VN')})</span>
        </div>

        <div class="course-meta">
          <span><i class="fas fa-clock"></i> ${durationStr}</span>
          <span><i class="fas fa-users"></i> ${(course.enrolled_count || 0).toLocaleString('vi-VN')}</span>
        </div>

        <div class="course-footer">
          <div class="course-price">${priceHtml}</div>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();window.location.href='/course.html?slug=${course.slug}'">
            Xem ngay
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── Format helpers ────────────────────────────────────────────────────────────
function formatPrice(amount) {
  return amount === 0 ? 'Miễn phí' : amount.toLocaleString('vi-VN') + '₫';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Toast notification ────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.getElementById('mrbo-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'mrbo-toast';
  const colors = { success: 'var(--accent-green)', error: '#EF4444', info: 'var(--accent-blue)' };
  const icons  = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };

  toast.style.cssText = `
    position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(20px);
    background:var(--dark-700); border:1px solid ${colors[type]}40;
    border-left:3px solid ${colors[type]};
    padding:12px 20px; border-radius:var(--radius-md); z-index:9999;
    display:flex; align-items:center; gap:8px;
    font-size:0.88rem; color:var(--text-primary);
    box-shadow:var(--shadow-lg); opacity:0; transition:all 0.3s ease;
    white-space:nowrap; max-width:90vw;
  `;
  toast.innerHTML = `<i class="fas ${icons[type]}" style="color:${colors[type]}"></i> ${message}`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Smooth anchor scrolling ───────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
