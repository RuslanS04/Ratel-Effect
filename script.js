/* ============================================
   RatelEffect — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ============ NAVBAR SCROLL EFFECT ============
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  });

  // ============ MOBILE NAV TOGGLE ============
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // Close nav on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // ============ SMOOTH SCROLL FOR ANCHOR LINKS ============
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ============ SCROLL REVEAL ANIMATIONS ============
  const revealElements = document.querySelectorAll('.reveal, .stagger-children');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Once visible, stop observing
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ============ FAQ ACCORDION ============
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all others
      faqItems.forEach(i => i.classList.remove('active'));

      // Toggle current
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // ============ LIGHTBOX ============
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxName = document.getElementById('lightboxName');
  const lightboxId = document.getElementById('lightboxId');
  const lightboxClose = document.getElementById('lightboxClose');
  const galleryItems = document.querySelectorAll('.gallery-item');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const src = item.getAttribute('data-src');
      const info = item.querySelector('.gallery-item-info');
      const name = info ? info.querySelector('.gallery-item-name').textContent : 'RatelEffect';
      const id = info ? info.querySelector('.gallery-item-id').textContent : '';

      lightboxImg.src = src;
      lightboxName.textContent = name;
      lightboxId.textContent = id;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // ============ PARTICLE SYSTEM ============
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.4 + 0.1;
      this.fadeDirection = Math.random() > 0.5 ? 1 : -1;

      // Random neon color
      const colors = [
        { r: 0, g: 240, b: 255 },   // cyan
        { r: 176, g: 38, b: 255 },   // purple
        { r: 255, g: 0, b: 229 },    // magenta
        { r: 57, g: 255, b: 20 },    // green
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Fade in/out
      this.opacity += this.fadeDirection * 0.002;
      if (this.opacity >= 0.5) this.fadeDirection = -1;
      if (this.opacity <= 0.05) this.fadeDirection = 1;

      // Wrap around edges
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`;
      ctx.fill();

      // Glow effect
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 0.1})`;
      ctx.fill();
    }
  }

  // Create particles
  const particleCount = Math.min(60, Math.floor(window.innerWidth / 20));
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Draw connections between close particles
  const drawConnections = () => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          const opacity = (1 - distance / 150) * 0.08;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  };

  const animateParticles = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawConnections();
    animationId = requestAnimationFrame(animateParticles);
  };

  animateParticles();

  // ============ COUNTER ANIMATION ============
  const animateCounter = (element, target, suffix = '') => {
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeOut);

      element.textContent = current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  // Observe hero stats for counter animation
  const heroStats = document.querySelectorAll('.hero-stat-value');
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent.trim();

        if (text === '4,999') {
          animateCounter(el, 4999);
        } else if (text === '150+') {
          animateCounter(el, 150, '+');
        } else if (text === '4') {
          animateCounter(el, 4);
        }

        statsObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  heroStats.forEach(stat => statsObserver.observe(stat));

  // ============ GLITCH EFFECT ON HERO IMAGES ============
  const heroNftPreviews = document.querySelectorAll('.hero-showcase-grid .nft-preview');

  const triggerGlitch = () => {
    const randomPreview = heroNftPreviews[Math.floor(Math.random() * heroNftPreviews.length)];
    const img = randomPreview.querySelector('img');

    img.style.transform = `translate(${(Math.random() - 0.5) * 4}px, ${(Math.random() - 0.5) * 4}px)`;
    img.style.filter = `hue-rotate(${Math.random() * 60}deg) saturate(${1 + Math.random()})`;

    setTimeout(() => {
      img.style.transform = '';
      img.style.filter = '';
    }, 100);
  };

  // Random glitch effect every 3-6 seconds
  const glitchInterval = () => {
    triggerGlitch();
    setTimeout(glitchInterval, 3000 + Math.random() * 3000);
  };
  setTimeout(glitchInterval, 2000);

  // ============ TILT EFFECT ON GALLERY ITEMS ============
  const galleryCards = document.querySelectorAll('.gallery-item');

  galleryCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / centerY * -5;
      const rotateY = (x - centerX) / centerX * 5;

      card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ============ ACTIVE NAV LINK HIGHLIGHTER ============
  const sections = document.querySelectorAll('section[id]');
  const navLinkElements = document.querySelectorAll('.nav-links a[href^="#"]');

  const highlightNav = () => {
    const scrollPosition = window.scrollY + 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinkElements.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.style.color = 'var(--neon-cyan)';
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav);

  // ============ PAGE LOAD ANIMATION ============
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.8s ease';
  
  window.addEventListener('load', () => {
    document.body.style.opacity = '1';
  });

  // Fallback in case load event already fired
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);

});
