/**
 * Dream Eater — Stars & Particle System
 * Manages Golden Stars, Blue Stars, and Nightmare Shards with smooth physics,
 * gravitational pull towards open mouth, and additive particle bursts.
 */

const STAR_TYPES = {
  GOLD: 'gold',
  BLUE: 'blue',
  BLACK: 'black'
};

class DreamStar {
  constructor(p, type, x, y) {
    this.p = p;
    this.type = type;
    this.x = x || p.random(p.width * 0.1, p.width * 0.9);
    this.y = y || -30;
    this.baseSpeed = p.random(1.6, 2.8);
    this.speed = this.baseSpeed;
    
    // Sinusoidal floating wave
    this.swayFreq = p.random(0.015, 0.035);
    this.swayAmp = p.random(0.8, 1.8);
    this.phase = p.random(p.TWO_PI);

    // Visual attributes
    this.rotation = p.random(p.TWO_PI);
    this.rotSpeed = p.random(-0.02, 0.02);
    this.radius = 18;
    this.isDead = false;
    this.isBeingCaught = false;

    // Tail / Trailing particles
    this.trail = [];
  }

  update(mouth) {
    const p = this.p;

    // 1. Gravitational pull towards open mouth
    if (mouth && mouth.isOpen) {
      const d = p.dist(this.x, this.y, mouth.x, mouth.y);
      const pullRadius = 140 + mouth.openness * 50;

      if (d < pullRadius) {
        this.isBeingCaught = true;
        // Gravitational curve towards mouth
        const pullStrength = p.map(d, 0, pullRadius, 0.35, 0.05);
        this.x = p.lerp(this.x, mouth.x, pullStrength);
        this.y = p.lerp(this.y, mouth.y, pullStrength);
      } else {
        this.isBeingCaught = false;
      }
    } else {
      this.isBeingCaught = false;
    }

    // 2. Normal falling physics if not sucked in rapidly
    if (!this.isBeingCaught) {
      this.y += this.speed;
      this.x += Math.sin(p.frameCount * this.swayFreq + this.phase) * this.swayAmp;
    }

    this.rotation += this.rotSpeed;

    // 3. Update stardust trail
    if (p.frameCount % 2 === 0) {
      this.trail.push({
        x: this.x + p.random(-2, 2),
        y: this.y + p.random(-2, 2),
        alpha: 140,
        size: p.random(2, 4)
      });
    }

    for (let i = this.trail.length - 1; i >= 0; i--) {
      const t = this.trail[i];
      t.y -= 0.3;
      t.alpha -= 9;
      if (t.alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }

    // Check bottom boundary
    if (this.y > p.height + 40) {
      this.isDead = true;
    }
  }

  render() {
    const p = this.p;

    // 1. Render stardust trail
    p.noStroke();
    for (const t of this.trail) {
      if (this.type === STAR_TYPES.GOLD) {
        p.fill(255, 209, 102, t.alpha * 0.7);
      } else if (this.type === STAR_TYPES.BLUE) {
        p.fill(163, 196, 243, t.alpha * 0.8);
      } else {
        p.fill(147, 51, 234, t.alpha * 0.5);
      }
      p.circle(t.x, t.y, t.size);
    }

    // 2. Render Star Body
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);

    if (this.type === STAR_TYPES.GOLD) {
      this.renderGoldenStar(p);
    } else if (this.type === STAR_TYPES.BLUE) {
      this.renderBlueStar(p);
    } else if (this.type === STAR_TYPES.BLACK) {
      this.renderBlackStar(p);
    }

    p.pop();
  }

  /**
   * Radiant 5-point Golden Astral Star
   */
  renderGoldenStar(p) {
    // Outer shimmering glow
    p.noStroke();
    const pulse = 1 + 0.15 * Math.sin(p.frameCount * 0.08);

    p.fill(255, 209, 102, 35);
    p.circle(0, 0, 48 * pulse);

    p.fill(255, 225, 130, 85);
    p.circle(0, 0, 30 * pulse);

    // 5-pointed star
    p.fill(255, 240, 180);
    p.stroke(255, 209, 102, 220);
    p.strokeWeight(1.2);
    this.drawStarPolygon(p, 0, 0, 8, 18, 5);

    // Center jewel glint
    p.fill(255, 255, 255, 240);
    p.noStroke();
    p.circle(0, 0, 5);
  }

  /**
   * Crystalline Faceted Sapphire Star
   */
  renderBlueStar(p) {
    p.noStroke();
    const pulse = 1 + 0.12 * Math.sin(p.frameCount * 0.1);

    // Sapphire halo
    p.fill(114, 177, 255, 45);
    p.circle(0, 0, 52 * pulse);

    p.fill(163, 196, 243, 90);
    p.circle(0, 0, 28 * pulse);

    // 4-point diamond star with cross accents
    p.fill(235, 248, 255);
    p.stroke(114, 177, 255, 240);
    p.strokeWeight(1.2);
    this.drawStarPolygon(p, 0, 0, 6, 20, 4);

    // Intersecting smaller star
    p.fill(255, 255, 255, 200);
    this.drawStarPolygon(p, 0, 0, 4, 12, 4);
  }

  /**
   * Nightmare Shard: Spiky dark star with purple/void embers
   */
  renderBlackStar(p) {
    p.noStroke();
    const pulse = 1 + 0.18 * Math.sin(p.frameCount * 0.15);

    // Dark void shadow aura
    p.fill(20, 5, 30, 180);
    p.circle(0, 0, 44 * pulse);

    p.fill(147, 51, 234, 60);
    p.circle(0, 0, 32 * pulse);

    // Spiky dark obsidian star
    p.fill(15, 12, 28);
    p.stroke(192, 132, 252, 220);
    p.strokeWeight(1.5);
    this.drawStarPolygon(p, 0, 0, 6, 17, 7);

    // Ominous inner core
    p.fill(168, 85, 247, 220);
    p.noStroke();
    p.circle(0, 0, 4);
  }

  /**
   * Utility to draw N-pointed star polygon
   */
  drawStarPolygon(p, x, y, radius1, radius2, npoints) {
    const angle = p.TWO_PI / npoints;
    const halfAngle = angle / 2.0;
    p.beginShape();
    for (let a = 0; a < p.TWO_PI; a += angle) {
      const sx = x + Math.cos(a) * radius2;
      const sy = y + Math.sin(a) * radius2;
      p.vertex(sx, sy);
      const sx2 = x + Math.cos(a + halfAngle) * radius1;
      const sy2 = y + Math.sin(a + halfAngle) * radius1;
      p.vertex(sx2, sy2);
    }
    p.endShape(p.CLOSE);
  }
}

/**
 * High-performance Particle System for Star Bursts
 */
class StarParticle {
  constructor(p, x, y, colorType) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.colorType = colorType;

    const angle = p.random(p.TWO_PI);
    const speed = p.random(1.8, 6.5);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.drag = 0.94;
    this.gravity = 0.04;
    this.size = p.random(3, 7.5);
    this.alpha = 255;
    this.decay = p.random(4, 8);
    this.twinklePhase = p.random(p.TWO_PI);
  }

  update() {
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  render() {
    const p = this.p;
    p.noStroke();

    let r = 255, g = 255, b = 255;
    if (this.colorType === STAR_TYPES.GOLD) {
      r = 255; g = p.random(200, 230); b = 100;
    } else if (this.colorType === STAR_TYPES.BLUE) {
      r = 130; g = 190; b = 255;
    } else if (this.colorType === STAR_TYPES.BLACK) {
      r = 168; g = 85; b = 247;
    }

    const sz = this.size * (0.7 + 0.3 * Math.sin(p.frameCount * 0.2 + this.twinklePhase));
    p.fill(r, g, b, Math.max(0, this.alpha));
    p.circle(this.x, this.y, sz);
  }

  isDead() {
    return this.alpha <= 0;
  }
}

/**
 * Star System Manager
 */
class DreamStarManager {
  constructor() {
    this.stars = [];
    this.particles = [];
    this.collectedPositiveStars = []; // For final constellation (max 30)
    this.spawnTimer = 0;
    this.spawnInterval = 75; // frames between spawns
  }

  reset() {
    this.stars = [];
    this.particles = [];
    this.collectedPositiveStars = [];
    this.spawnTimer = 0;
  }

  update(p, mouth, onCatch) {
    // 1. Spawning logic
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnRandomStar(p);
    }

    // 2. Update and check collisions for stars
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const star = this.stars[i];
      star.update(mouth);

      // Collision check with mouth
      if (mouth && mouth.isOpen) {
        const d = p.dist(star.x, star.y, mouth.x, mouth.y);
        if (d < mouth.radius + star.radius) {
          // Caught!
          this.triggerCatch(p, star, mouth, onCatch);
          this.stars.splice(i, 1);
          continue;
        }
      }

      if (star.isDead) {
        this.stars.splice(i, 1);
      }
    }

    // 3. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.update();
      if (pt.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  spawnRandomStar(p) {
    // Probabilities:
    // Gold: 50%, Blue: 30%, Black: 20%
    const roll = p.random(100);
    let type = STAR_TYPES.GOLD;
    if (roll < 50) {
      type = STAR_TYPES.GOLD;
    } else if (roll < 80) {
      type = STAR_TYPES.BLUE;
    } else {
      type = STAR_TYPES.BLACK;
    }

    this.stars.push(new DreamStar(p, type));
  }

  /**
   * Star Collected: Sound, Particles, Score, Effect
   */
  triggerCatch(p, star, mouth, onCatch) {
    // Explode into particles
    const particleCount = star.type === STAR_TYPES.BLACK ? 25 : 35;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new StarParticle(p, star.x, star.y, star.type));
    }

    // Trigger visual feedback on mouth
    if (window.dreamTracker) {
      const color = star.type === STAR_TYPES.BLACK 
        ? p.color(168, 85, 247) 
        : (star.type === STAR_TYPES.BLUE ? p.color(140, 200, 255) : p.color(255, 220, 120));
      window.dreamTracker.triggerMouthRipple(color, 1.8);
    }

    // Sound effect & Callback
    if (star.type === STAR_TYPES.GOLD) {
      if (window.dreamAudio) window.dreamAudio.playGoldenStarSound();
      this.recordPositiveStar(star);
      this.triggerFlashEffect('gold');
      if (onCatch) onCatch({ type: star.type, scoreDelta: 10, isPositive: true });
    } else if (star.type === STAR_TYPES.BLUE) {
      if (window.dreamAudio) window.dreamAudio.playBlueStarSound();
      this.recordPositiveStar(star);
      this.triggerFlashEffect('blue');
      if (onCatch) onCatch({ type: star.type, scoreDelta: 15, isPositive: true });
    } else if (star.type === STAR_TYPES.BLACK) {
      if (window.dreamAudio) window.dreamAudio.playBlackStarSound();
      this.triggerNightmareVignette();
      if (onCatch) onCatch({ type: star.type, scoreDelta: -10, isPositive: false });
    }
  }

  recordPositiveStar(star) {
    if (this.collectedPositiveStars.length < 30) {
      this.collectedPositiveStars.push({
        type: star.type,
        x: star.x,
        y: star.y,
        timestamp: Date.now()
      });
    }
  }

  triggerFlashEffect(type) {
    const flash = document.getElementById('dream-flash');
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 350);
    }
  }

  triggerNightmareVignette() {
    const vig = document.getElementById('nightmare-vignette');
    if (vig) {
      vig.classList.add('active');
      setTimeout(() => vig.classList.remove('active'), 700);
    }
  }

  render(p) {
    // 1. Render all falling stars
    for (const star of this.stars) {
      star.render();
    }

    // 2. Render all particles with additive blending
    p.push();
    p.blendMode(p.ADD);
    for (const pt of this.particles) {
      pt.render();
    }
    p.pop();
  }
}

// Global star manager instance
window.dreamStars = new DreamStarManager();
