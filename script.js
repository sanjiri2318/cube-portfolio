document.body.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

const cursor = document.querySelector(".cursor");
const hoverTargets = document.querySelectorAll("a, button, .card");

if (cursor && finePointer) {
  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;

  const moveCursor = () => {
    currentX += (targetX - currentX) * 0.18;
    currentY += (targetY - currentY) * 0.18;
    cursor.style.left = `${currentX}px`;
    cursor.style.top = `${currentY}px`;
    requestAnimationFrame(moveCursor);
  };

  window.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  hoverTargets.forEach((element) => {
    element.addEventListener("mouseenter", () => cursor.classList.add("active"));
    element.addEventListener("mouseleave", () => cursor.classList.remove("active"));
  });

  moveCursor();
} else if (cursor) {
  cursor.style.display = "none";
}

const progress = document.querySelector(".scroll-progress");
const updateProgress = () => {
  if (!progress) {
    return;
  }
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  progress.style.width = `${percent}%`;
};

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();

const revealElements = document.querySelectorAll("[data-anim], .reveal");
if (!prefersReducedMotion && revealElements.length) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const parallaxElements = document.querySelectorAll("[data-parallax]");
const updateParallax = () => {
  if (prefersReducedMotion) {
    return;
  }
  const scrollY = window.scrollY;
  parallaxElements.forEach((element) => {
    const speed = Number(element.dataset.parallax || 0);
    element.style.setProperty("--offset", `${scrollY * speed}px`);
  });
};

window.addEventListener("scroll", updateParallax, { passive: true });
updateParallax();

const tiltElements = document.querySelectorAll(".tilt");
if (finePointer && !prefersReducedMotion) {
  tiltElements.forEach((card) => {
    const handleMove = (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const maxTilt = 8;
      const tiltX = ((y - centerY) / centerY) * -maxTilt;
      const tiltY = ((x - centerX) / centerX) * maxTilt;
      card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    };

    const resetTilt = () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    };

    card.addEventListener("mousemove", handleMove);
    card.addEventListener("mouseleave", resetTilt);
    card.addEventListener("blur", resetTilt);
  });
}

const canvas = document.querySelector(".bg-canvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  const mouse = { x: 0, y: 0, active: false };
  let particles = [];
  let width = 0;
  let height = 0;
  let animationId = null;

  const resizeCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const createParticles = () => {
    const baseCount = Math.round((width * height) / 16000);
    const count = Math.max(50, Math.min(baseCount, 140));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.8 + 0.6,
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.strokeStyle = "rgba(124,123,255,0.18)";

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        const radius = 140;
        if (dist < radius && dist > 0.1) {
          const force = (1 - dist / radius) * 0.6;
          p.vx += (dx / dist) * force * 0.02;
          p.vy += (dy / dist) * force * 0.02;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    animationId = requestAnimationFrame(draw);
  };

  if (!prefersReducedMotion && ctx) {
    resizeCanvas();
    createParticles();
    draw();
    window.addEventListener("resize", () => {
      resizeCanvas();
      createParticles();
    });

    window.addEventListener("mousemove", (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.active = true;
    });

    window.addEventListener("mouseleave", () => {
      mouse.active = false;
    });
  } else if (ctx) {
    resizeCanvas();
    createParticles();
    ctx.clearRect(0, 0, width, height);
  }
}
