interface FluidParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  kind: 'stream' | 'burst' | 'mist';
}

const LIQUID_COLORS = [
  '#fef08a',
  '#fde047',
  '#facc15',
  '#ffffff',
  '#eab308',
];

/**
 * Runs a 60fps physics-based liquid throw & splash simulation on a full-stage canvas.
 * Returns a cleanup function to cancel the animation if skipped or replayed.
 */
export function runLiquidSplash(
  canvas: HTMLCanvasElement,
  origin: { x: number; y: number },
  target: { x: number; y: number },
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particles: FluidParticle[] = [];
  let rafId = 0;
  let burstTriggered = false;
  const startTime = performance.now();

  // Compute ballistic velocity so the liquid naturally arcs from bucket to target
  const flightTime = 0.42; // seconds
  const gravity = 1350; // px/s^2
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const baseVx = dx / flightTime;
  const baseVy = (dy - 0.5 * gravity * flightTime * flightTime) / flightTime;

  const spawnStreamBatch = (count: number, spread = 1) => {
    for (let i = 0; i < count; i++) {
      const jitterVx = (Math.random() - 0.5) * 140 * spread;
      const jitterVy = (Math.random() - 0.5) * 120 * spread;
      particles.push({
        x: origin.x + (Math.random() - 0.5) * 14,
        y: origin.y + (Math.random() - 0.5) * 14,
        vx: baseVx + jitterVx,
        vy: baseVy + jitterVy,
        radius: 5 + Math.random() * 11,
        color: LIQUID_COLORS[Math.floor(Math.random() * LIQUID_COLORS.length)],
        alpha: 0.85 + Math.random() * 0.15,
        life: 0,
        maxLife: 0.55 + Math.random() * 0.35,
        kind: 'stream',
      });
    }
  };

  const spawnImpactBurst = () => {
    // Radial water-like splash droplets & mist
    for (let i = 0; i < 42; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 440;
      const isMist = i % 3 === 0;
      particles.push({
        x: target.x + (Math.random() - 0.5) * 30,
        y: target.y + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 90,
        radius: isMist ? 2.5 + Math.random() * 4 : 5 + Math.random() * 10,
        color: LIQUID_COLORS[Math.floor(Math.random() * LIQUID_COLORS.length)],
        alpha: isMist ? 0.65 : 0.9,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.45,
        kind: isMist ? 'mist' : 'burst',
      });
    }
  };

  // Initial throw wave
  spawnStreamBatch(26, 0.85);

  let lastTime = startTime;
  let streamSpawnedWaves = 0;

  const tick = (now: number) => {
    const dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;
    const elapsed = (now - startTime) / 1000;

    // Emit trailing liquid waves over the first 160ms for a natural fluid tail
    if (elapsed > 0.04 && streamSpawnedWaves === 0) {
      spawnStreamBatch(20, 1.0);
      streamSpawnedWaves = 1;
    } else if (elapsed > 0.09 && streamSpawnedWaves === 1) {
      spawnStreamBatch(14, 1.2);
      streamSpawnedWaves = 2;
    }

    if (!burstTriggered && elapsed >= flightTime * 0.88) {
      burstTriggered = true;
      spawnImpactBurst();
    }

    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }

      // Apply gravity and subtle air drag
      const drag = p.kind === 'mist' ? 0.96 : 0.988;
      p.vx *= drag;
      p.vy = p.vy * drag + gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const progress = p.life / p.maxLife;
      const fade = 1 - Math.pow(progress, 1.8);
      const r = p.radius * (1 - progress * 0.35);

      // Stretch droplet along velocity vector for realistic liquid motion
      const speed = Math.hypot(p.vx, p.vy);
      const angle = Math.atan2(p.vy, p.vx);
      const stretch = Math.min(2.4, 1 + speed / 700);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.globalAlpha = p.alpha * fade;

      // Main liquid droplet
      ctx.beginPath();
      ctx.ellipse(0, 0, r * stretch, r / Math.sqrt(stretch), 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      // Glossy water-like specular highlight
      if (r > 4.5) {
        ctx.beginPath();
        ctx.ellipse(
          r * 0.22,
          -r * 0.25,
          r * 0.35 * stretch,
          r * 0.2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.fill();
      }

      ctx.restore();
    }

    if (particles.length > 0 || elapsed < 0.5) {
      rafId = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
    ctx.clearRect(0, 0, width, height);
  };
}
