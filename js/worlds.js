/**
 * Dream Eater — Three Dream Worlds Environment Manager
 * Smoothly renders and interpolates between:
 * Level 1: Midnight Garden
 * Level 2: Moonlit Ocean
 * Level 3: Celestial Dream
 */

class DreamWorldManager {
  constructor() {
    this.currentLevel = 1;
    this.targetLevel = 1;
    this.transitionProgress = 1.0; // 0.0 to 1.0

    // Ambient floating elements
    this.fireflies = [];
    this.bubbles = [];
    this.clouds = [];
    this.lightRays = [];

    // Wave parameters for ocean
    this.wavePhase = 0;

    // Palette Definitions [Top, Mid, Bottom]
    this.palettes = {
      1: {
        name: "Midnight Garden",
        subtitle: "Realm of slumbering flora & fireflies",
        top: [11, 16, 33],       // Deep Midnight
        mid: [21, 28, 56],       // Night Blue
        bottom: [15, 23, 42],    // Dark Indigo
        accent: [255, 209, 102]  // Golden Firefly
      },
      2: {
        name: "Moonlit Ocean",
        subtitle: "Tides of luminous lavender & silver moon",
        top: [24, 18, 59],       // Purple Night
        mid: [43, 27, 77],       // Ocean Violet
        bottom: [22, 42, 85],    // Luminous Deep Blue
        accent: [163, 196, 243]  // Moon Sapphire
      },
      3: {
        name: "Celestial Dream",
        subtitle: "Pastel heavens & iridescent clouds",
        top: [65, 34, 76],       // Sunset Lavender
        mid: [104, 61, 116],     // Pastel Mauve
        bottom: [226, 169, 183], // Rose Peach Dawn
        accent: [244, 194, 194]  // Pastel Pink Glow
      }
    };
  }

  /**
   * Initializes ambient elements for all three worlds
   */
  init(p) {
    // 1. Fireflies for Midnight Garden
    this.fireflies = [];
    for (let i = 0; i < 40; i++) {
      this.fireflies.push({
        x: p.random(p.width),
        y: p.random(p.height),
        size: p.random(2, 4.5),
        speedX: p.random(-0.5, 0.5),
        speedY: p.random(-0.4, 0.4),
        pulseOffset: p.random(p.TWO_PI),
        pulseSpeed: p.random(0.02, 0.05)
      });
    }

    // 2. Floating ocean bubbles/jellies for Moonlit Ocean
    this.bubbles = [];
    for (let i = 0; i < 25; i++) {
      this.bubbles.push({
        x: p.random(p.width),
        y: p.random(p.height * 0.5, p.height),
        radius: p.random(6, 18),
        speedY: p.random(-0.3, -0.9),
        swaySpeed: p.random(0.01, 0.03),
        swayAmp: p.random(15, 35),
        phase: p.random(p.TWO_PI)
      });
    }

    // 3. Ethereal Clouds for Celestial Dream
    this.clouds = [];
    for (let i = 0; i < 7; i++) {
      this.clouds.push({
        x: p.random(-100, p.width + 100),
        y: p.random(p.height * 0.1, p.height * 0.6),
        width: p.random(220, 480),
        height: p.random(70, 140),
        speed: p.random(0.15, 0.35),
        alpha: p.random(60, 120)
      });
    }

    // 4. Celestial Light Rays
    this.lightRays = [];
    for (let i = 0; i < 5; i++) {
      this.lightRays.push({
        x: p.random(p.width * 0.2, p.width * 0.8),
        width: p.random(80, 180),
        angle: p.random(-0.15, 0.15),
        alpha: p.random(20, 50),
        pulseSpeed: p.random(0.01, 0.02)
      });
    }
  }

  /**
   * Set target level based on collected stars
   * Level 1: 0 - 9
   * Level 2: 10 - 19
   * Level 3: 20+
   */
  updateLevel(starsCollected) {
    let target = 1;
    if (starsCollected >= 20) target = 3;
    else if (starsCollected >= 10) target = 2;

    if (target !== this.targetLevel) {
      this.targetLevel = target;
      this.transitionProgress = 0.0;
      this.showWorldBanner(target);
      if (window.dreamAudio) {
        window.dreamAudio.playWorldTransitionSound();
      }
    }
  }

  /**
   * Displays temporary smooth world transition banner
   */
  showWorldBanner(level) {
    const banner = document.getElementById('world-banner');
    const title = document.getElementById('banner-title');
    const desc = document.getElementById('banner-desc');
    const hudWorldName = document.getElementById('world-name');
    const hudWorldSubtitle = document.getElementById('world-subtitle');

    const pal = this.palettes[level];
    if (title) title.textContent = `Entering Dream Realm ${level}`;
    if (desc) desc.textContent = pal.name;
    if (hudWorldName) hudWorldName.textContent = pal.name;
    if (hudWorldSubtitle) hudWorldSubtitle.textContent = pal.subtitle;

    if (banner) {
      banner.classList.remove('hidden');
      setTimeout(() => {
        banner.classList.add('hidden');
      }, 3500);
    }
  }

  /**
   * Render background dreamscape & world elements
   */
  render(p) {
    // Progressively smooth transition
    if (this.currentLevel !== this.targetLevel) {
      this.transitionProgress += 0.01;
      if (this.transitionProgress >= 1.0) {
        this.currentLevel = this.targetLevel;
        this.transitionProgress = 1.0;
      }
    }

    // 1. Draw smooth interpolated gradient background
    this.renderGradientSky(p);

    // 2. Render World-Specific Layers based on level weights
    const level1Weight = this.getLevelWeight(1);
    const level2Weight = this.getLevelWeight(2);
    const level3Weight = this.getLevelWeight(3);

    // Level 1: Midnight Garden (Fireflies + Botanical silhouettes)
    if (level1Weight > 0.02) {
      this.renderMidnightGarden(p, level1Weight);
    }

    // Level 2: Moonlit Ocean (Moon + Sinusoidal Waves + Sea motes)
    if (level2Weight > 0.02) {
      this.renderMoonlitOcean(p, level2Weight);
    }

    // Level 3: Celestial Dream (Clouds + Prismatic light rays)
    if (level3Weight > 0.02) {
      this.renderCelestialDream(p, level3Weight);
    }
  }

  /**
   * Calculates blend weight (0 to 1) for each level
   */
  getLevelWeight(lvl) {
    if (this.currentLevel === this.targetLevel) {
      return this.currentLevel === lvl ? 1.0 : 0.0;
    }
    // Interpolating between current and target
    if (lvl === this.currentLevel) return 1.0 - this.transitionProgress;
    if (lvl === this.targetLevel) return this.transitionProgress;
    return 0.0;
  }

  /**
   * Render interpolated sky gradient
   */
  renderGradientSky(p) {
    const curPal = this.palettes[this.currentLevel];
    const tgtPal = this.palettes[this.targetLevel];
    const t = this.transitionProgress;

    // Helper to lerp RGB arrays
    const lerpColorArray = (c1, c2, amt) => [
      p.lerp(c1[0], c2[0], amt),
      p.lerp(c1[1], c2[1], amt),
      p.lerp(c1[2], c2[2], amt)
    ];

    const cTop = lerpColorArray(curPal.top, tgtPal.top, t);
    const cMid = lerpColorArray(curPal.mid, tgtPal.mid, t);
    const cBottom = lerpColorArray(curPal.bottom, tgtPal.bottom, t);

    // Draw vertical gradient bands
    const bands = 24;
    const bandHeight = p.height / bands;

    p.noStroke();
    for (let i = 0; i < bands; i++) {
      const normY = i / bands;
      let r, g, b;

      if (normY < 0.5) {
        const subT = normY / 0.5;
        r = p.lerp(cTop[0], cMid[0], subT);
        g = p.lerp(cTop[1], cMid[1], subT);
        b = p.lerp(cTop[2], cMid[2], subT);
      } else {
        const subT = (normY - 0.5) / 0.5;
        r = p.lerp(cMid[0], cBottom[0], subT);
        g = p.lerp(cMid[1], cBottom[1], subT);
        b = p.lerp(cMid[2], cBottom[2], subT);
      }

      p.fill(r, g, b);
      p.rect(0, i * bandHeight, p.width, bandHeight + 1);
    }
  }

  /**
   * Level 1: Midnight Garden Rendering
   */
  renderMidnightGarden(p, weight) {
    p.push();

    // Fireflies
    for (const ff of this.fireflies) {
      ff.x += ff.speedX;
      ff.y += ff.speedY;

      // Wrap boundaries
      if (ff.x < 0) ff.x = p.width;
      if (ff.x > p.width) ff.x = 0;
      if (ff.y < 0) ff.y = p.height;
      if (ff.y > p.height) ff.y = 0;

      const pulse = Math.sin(p.frameCount * ff.pulseSpeed + ff.pulseOffset);
      const alpha = p.map(pulse, -1, 1, 40, 240) * weight;
      const size = ff.size * (0.8 + 0.3 * pulse);

      // Glow halo
      p.noStroke();
      p.fill(255, 209, 102, alpha * 0.35);
      p.circle(ff.x, ff.y, size * 3.5);

      // Core
      p.fill(255, 245, 180, alpha);
      p.circle(ff.x, ff.y, size);
    }

    // Silhouetted Dream Flora at bottom
    p.noStroke();
    p.fill(6, 9, 20, 220 * weight);

    p.beginShape();
    p.vertex(0, p.height);
    p.vertex(0, p.height - 45);
    for (let x = 0; x <= p.width; x += 60) {
      const hillY = p.height - 40 + Math.sin(x * 0.01) * 15;
      p.vertex(x, hillY);
    }
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);

    // Glowing botanical tips
    p.stroke(163, 196, 243, 90 * weight);
    p.strokeWeight(1.5);
    for (let x = 30; x < p.width; x += 110) {
      const sway = Math.sin(p.frameCount * 0.02 + x) * 8;
      const baseY = p.height - 20;
      const tipY = baseY - 60 - Math.abs(Math.sin(x)) * 30;

      p.line(x, baseY, x + sway, tipY);
      
      // Bioluminescent tip
      p.noStroke();
      p.fill(255, 209, 102, 180 * weight);
      p.circle(x + sway, tipY, 4.5);
      p.stroke(163, 196, 243, 90 * weight);
    }

    p.pop();
  }

  /**
   * Level 2: Moonlit Ocean Rendering
   */
  renderMoonlitOcean(p, weight) {
    p.push();

    // 1. Glowing Celestial Moon
    const moonX = p.width * 0.78;
    const moonY = p.height * 0.22;
    const moonR = 64;

    // Lunar outer corona
    p.noStroke();
    p.fill(244, 230, 255, 20 * weight);
    p.circle(moonX, moonY, moonR * 3.2);

    p.fill(244, 230, 255, 45 * weight);
    p.circle(moonX, moonY, moonR * 2.1);

    // Moon body
    p.fill(255, 250, 235, 210 * weight);
    p.circle(moonX, moonY, moonR);

    // Subtle crescent shadow
    p.fill(43, 27, 77, 190 * weight);
    p.circle(moonX + 16, moonY - 10, moonR * 0.88);

    // 2. Luminous Ocean Waves at lower half
    this.wavePhase += 0.02;
    const oceanTopY = p.height * 0.68;

    // Ocean surface layer 1 (Background swell)
    p.noStroke();
    p.fill(26, 32, 74, 180 * weight);
    p.beginShape();
    p.vertex(0, p.height);
    for (let x = 0; x <= p.width; x += 20) {
      const y = oceanTopY + Math.sin(x * 0.007 + this.wavePhase * 0.7) * 22;
      p.vertex(x, y);
    }
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);

    // Ocean surface layer 2 (Mid-ground wave with moonlight shimmer)
    p.fill(20, 48, 98, 200 * weight);
    p.beginShape();
    p.vertex(0, p.height);
    for (let x = 0; x <= p.width; x += 15) {
      const y = oceanTopY + 25 + Math.sin(x * 0.012 - this.wavePhase) * 16;
      p.vertex(x, y);
    }
    p.vertex(p.width, p.height);
    p.endShape(p.CLOSE);

    // Moon reflection column on water
    p.stroke(255, 250, 220, 110 * weight);
    p.strokeWeight(2.0);
    for (let y = oceanTopY + 10; y < p.height; y += 14) {
      const distDown = (y - oceanTopY) / (p.height - oceanTopY);
      const shimmerWidth = (30 + distDown * 140) * (0.8 + 0.3 * Math.sin(y * 0.1 + p.frameCount * 0.05));
      p.line(moonX - shimmerWidth * 0.5, y, moonX + shimmerWidth * 0.5, y);
    }

    // 3. Floating Sea Motes / Jelly Bubbles
    for (const b of this.bubbles) {
      b.y += b.speedY;
      if (b.y < oceanTopY - 30) {
        b.y = p.height + 20;
        b.x = p.random(p.width);
      }

      const swayX = b.x + Math.sin(p.frameCount * b.swaySpeed + b.phase) * b.swayAmp;
      
      // Translucent bubble
      p.noFill();
      p.stroke(163, 196, 243, 120 * weight);
      p.strokeWeight(1.2);
      p.circle(swayX, b.y, b.radius);

      p.fill(255, 255, 255, 140 * weight);
      p.noStroke();
      p.circle(swayX - b.radius * 0.25, b.y - b.radius * 0.25, b.radius * 0.3);
    }

    p.pop();
  }

  /**
   * Level 3: Celestial Dream Rendering
   */
  renderCelestialDream(p, weight) {
    p.push();

    // 1. Prismatic Celestial Rays
    for (const ray of this.lightRays) {
      const alpha = (ray.alpha + Math.sin(p.frameCount * ray.pulseSpeed) * 15) * weight;
      p.noStroke();
      p.fill(255, 240, 245, Math.max(0, alpha));

      p.beginShape();
      p.vertex(ray.x, 0);
      p.vertex(ray.x + ray.width * 0.4, 0);
      p.vertex(ray.x + ray.width * 1.8 + Math.tan(ray.angle) * p.height, p.height);
      p.vertex(ray.x - ray.width * 0.8 + Math.tan(ray.angle) * p.height, p.height);
      p.endShape(p.CLOSE);
    }

    // 2. Parallax Dream Clouds (Fluffy layered bezier clouds)
    for (const c of this.clouds) {
      c.x += c.speed;
      if (c.x - c.width > p.width) {
        c.x = -c.width - 50;
        c.y = p.random(p.height * 0.08, p.height * 0.55);
      }

      p.noStroke();
      p.fill(244, 215, 235, c.alpha * weight * 0.5);

      // Cloud puffs
      const cx = c.x;
      const cy = c.y;
      const w = c.width;
      const h = c.height;

      p.ellipse(cx, cy, w * 0.65, h * 0.65);
      p.ellipse(cx - w * 0.2, cy + h * 0.1, w * 0.45, h * 0.5);
      p.ellipse(cx + w * 0.2, cy + h * 0.05, w * 0.5, h * 0.55);
      p.ellipse(cx, cy + h * 0.15, w * 0.8, h * 0.45);
    }

    // 3. Shimmering Iridescent Cosmic Dust
    p.stroke(255, 255, 255, 170 * weight);
    for (let i = 0; i < 20; i++) {
      const sx = (p.noise(i * 10, p.frameCount * 0.003) * p.width * 1.5) % p.width;
      const sy = (p.noise(i * 20, p.frameCount * 0.003) * p.height * 1.2) % p.height;
      const twinkle = Math.sin(p.frameCount * 0.05 + i) * 2.5;

      p.strokeWeight(Math.max(1, 2 + twinkle));
      p.point(sx, sy);
    }

    p.pop();
  }
}

// Global world manager instance
window.dreamWorlds = new DreamWorldManager();
