/**
 * Dream Eater — Final Constellation Module
 * Animates the 30 collected positive stars ascending into the cosmos,
 * procedurally generates a unique celestial constellation with glowing links,
 * and presents the final poetic revelation.
 */

class DreamConstellation {
  constructor() {
    this.isActive = false;
    this.stars = [];
    this.connections = [];
    this.animProgress = 0;       // 0 to 1 for star positioning
    this.connectionProgress = 0; // Number of connected lines
    this.connectTimer = 0;
    this.constellationName = "The Dream Weaver";
    
    // Archetype definitions with relative coordinate layouts (scaled to screen)
    this.archetypes = [
      {
        name: "Cygnus Somnii — The Dream Swan",
        bones: [
          [0.5, 0.2], [0.5, 0.35], [0.5, 0.5], [0.5, 0.68], [0.5, 0.8], // Body spine
          [0.25, 0.38], [0.38, 0.42], [0.62, 0.42], [0.75, 0.38],       // Wings
          [0.18, 0.48], [0.82, 0.48], [0.44, 0.76], [0.56, 0.76]        // Wingtips & tail
        ]
      },
      {
        name: "Cetus Aureus — The Astral Whale",
        bones: [
          [0.22, 0.45], [0.35, 0.38], [0.5, 0.36], [0.65, 0.42], [0.78, 0.52], // Body spine
          [0.32, 0.55], [0.46, 0.58], [0.6, 0.54],                             // Belly
          [0.82, 0.42], [0.88, 0.35], [0.88, 0.65],                            // Fluke tail
          [0.42, 0.26], [0.48, 0.22]                                           // Dorsal fin
        ]
      },
      {
        name: "Corona Aurora — The Crown of Dawn",
        bones: [
          [0.2, 0.55], [0.3, 0.45], [0.4, 0.35], [0.5, 0.28], [0.6, 0.35], [0.7, 0.45], [0.8, 0.55], // Arch
          [0.28, 0.62], [0.4, 0.65], [0.5, 0.66], [0.6, 0.65], [0.72, 0.62],                          // Base
          [0.35, 0.25], [0.5, 0.18], [0.65, 0.25]                                                      // Jewels
        ]
      },
      {
        name: "Lyra Aetheria — The Harp of Slumber",
        bones: [
          [0.36, 0.22], [0.64, 0.22], [0.32, 0.45], [0.68, 0.45], [0.42, 0.72], [0.58, 0.72], // Frame
          [0.42, 0.3], [0.42, 0.65], [0.5, 0.3], [0.5, 0.65], [0.58, 0.3], [0.58, 0.65]         // Strings
        ]
      },
      {
        name: "Phoenix Astralis — The Reborn Dream",
        bones: [
          [0.5, 0.22], [0.5, 0.38], [0.5, 0.55], // Crest and chest
          [0.32, 0.35], [0.2, 0.45], [0.15, 0.6], // Left wing
          [0.68, 0.35], [0.8, 0.45], [0.85, 0.6], // Right wing
          [0.45, 0.72], [0.55, 0.72], [0.4, 0.85], [0.5, 0.88], [0.6, 0.85] // Plume tails
        ]
      }
    ];
  }

  /**
   * Initializes the constellation scene with the 30 collected stars
   */
  start(p, collectedStars, totalScore, nightmareCount) {
    this.isActive = true;
    this.animProgress = 0;
    this.connectionProgress = 0;
    this.connectTimer = 0;

    // Pick random archetype
    const archetype = p.random(this.archetypes);
    this.constellationName = archetype.name;

    // Layout 30 stars based on archetype bones + celestial fill
    this.stars = [];
    const numStars = 30;

    // Compute center and scale bounds
    const cx = p.width * 0.5;
    const cy = p.height * 0.42;
    const w = Math.min(p.width * 0.75, 750);
    const h = Math.min(p.height * 0.6, 550);

    const boneCount = archetype.bones.length;

    for (let i = 0; i < numStars; i++) {
      let targetX, targetY;

      if (i < boneCount) {
        // Direct bone anchor point with subtle jitter
        const b = archetype.bones[i];
        targetX = cx + (b[0] - 0.5) * w + p.random(-8, 8);
        targetY = cy + (b[1] - 0.5) * h + p.random(-8, 8);
      } else {
        // Complementary satellite / cluster star between bones
        const b1 = archetype.bones[i % boneCount];
        const b2 = archetype.bones[(i + 1) % boneCount];
        const lerpFactor = p.random(0.2, 0.8);
        targetX = cx + p.lerp(b1[0] - 0.5, b2[0] - 0.5, lerpFactor) * w + p.random(-25, 25);
        targetY = cy + p.lerp(b1[1] - 0.5, b2[1] - 0.5, lerpFactor) * h + p.random(-25, 25);
      }

      // Initial positions: start from where they were caught, or bottom fountain
      const initial = collectedStars[i] || { x: p.random(p.width), y: p.height + 50 };

      this.stars.push({
        x: initial.x,
        y: initial.y,
        startX: initial.x,
        startY: initial.y,
        targetX: targetX,
        targetY: targetY,
        type: (collectedStars[i] && collectedStars[i].type) || (i % 2 === 0 ? 'gold' : 'blue'),
        radius: p.random(4, 7),
        twinklePhase: p.random(p.TWO_PI),
        hoverAlpha: 0
      });
    }

    // Build Delaunay-style or proximity-based connections for constellation lines
    this.connections = this.buildConnections(p, this.stars);

    // Play finale sound
    if (window.dreamAudio) {
      window.dreamAudio.playConstellationFinale();
    }

    // Show final UI overlay after animation settles
    setTimeout(() => {
      this.displayFinalUI(totalScore, nightmareCount);
    }, 3800);
  }

  /**
   * Generates pleasing minimal-spanning aesthetic constellation connections
   */
  buildConnections(p, starList) {
    const conns = [];
    const maxDist = Math.min(p.width, p.height) * 0.22;

    for (let i = 0; i < starList.length; i++) {
      let closestNeighbours = [];

      for (let j = 0; j < starList.length; j++) {
        if (i === j) continue;
        const d = p.dist(
          starList[i].targetX, starList[i].targetY,
          starList[j].targetX, starList[j].targetY
        );
        if (d < maxDist) {
          closestNeighbours.push({ idx: j, dist: d });
        }
      }

      // Sort by distance and pick 1-2 nearest neighbours
      closestNeighbours.sort((a, b) => a.dist - b.dist);
      const pickCount = Math.min(closestNeighbours.length, 2);

      for (let k = 0; k < pickCount; k++) {
        const j = closestNeighbours[k].idx;
        // Avoid duplicate reverse connections
        const exists = conns.some(c => (c.a === i && c.b === j) || (c.a === j && c.b === i));
        if (!exists) {
          conns.push({ a: i, b: j, drawn: 0 });
        }
      }
    }

    return conns;
  }

  /**
   * Update constellation animation frames
   */
  update(p) {
    if (!this.isActive) return;

    // 1. Move stars to target constellation positions
    if (this.animProgress < 1.0) {
      this.animProgress += 0.012;
      const ease = this.easeOutCubic(Math.min(1.0, this.animProgress));

      for (const s of this.stars) {
        s.x = p.lerp(s.startX, s.targetX, ease);
        s.y = p.lerp(s.startY, s.targetY, ease);
      }
    } else {
      // 2. Connect lines sequentially once stars reach their celestial positions
      this.connectTimer++;
      if (this.connectTimer % 6 === 0 && this.connectionProgress < this.connections.length) {
        this.connectionProgress++;

        // Play subtle star chime
        if (window.dreamAudio) {
          const notes = [440, 523.25, 587.33, 659.25, 783.99, 880];
          const note = notes[this.connectionProgress % notes.length];
          window.dreamAudio.playStarConnectChime(note);
        }
      }

      // Subtle celestial floating
      for (let i = 0; i < this.stars.length; i++) {
        const s = this.stars[i];
        const driftX = Math.sin(p.frameCount * 0.02 + i) * 0.6;
        const driftY = Math.cos(p.frameCount * 0.02 + i) * 0.6;
        s.x = s.targetX + driftX;
        s.y = s.targetY + driftY;
      }
    }
  }

  easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  /**
   * Render the constellation
   */
  render(p) {
    if (!this.isActive) return;

    // Deep cosmic background wash
    p.push();
    p.fill(11, 16, 33, 190);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);

    // 1. Draw glowing constellation lines
    const activeConns = Math.min(this.connectionProgress, this.connections.length);

    p.strokeWeight(1.4);
    for (let i = 0; i < activeConns; i++) {
      const conn = this.connections[i];
      const s1 = this.stars[conn.a];
      const s2 = this.stars[conn.b];

      // Soft glow line
      p.stroke(163, 196, 243, 80);
      p.strokeWeight(3.5);
      p.line(s1.x, s1.y, s2.x, s2.y);

      // Core crisp line
      p.stroke(255, 255, 255, 190);
      p.strokeWeight(1.2);
      p.line(s1.x, s1.y, s2.x, s2.y);
    }

    // 2. Draw star nodes
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      const twinkle = Math.sin(p.frameCount * 0.08 + s.twinklePhase) * 0.3;
      const r = s.radius * (1 + twinkle);

      // Node aura
      p.noStroke();
      if (s.type === 'gold') {
        p.fill(255, 209, 102, 60);
        p.circle(s.x, s.y, r * 4.5);
        p.fill(255, 225, 140, 220);
      } else {
        p.fill(163, 196, 243, 60);
        p.circle(s.x, s.y, r * 4.5);
        p.fill(220, 240, 255, 220);
      }

      // Star point
      p.circle(s.x, s.y, r * 1.6);
      p.fill(255, 255, 255, 250);
      p.circle(s.x, s.y, r * 0.8);
    }

    p.pop();
  }

  /**
   * Shows the final victory HUD
   */
  displayFinalUI(totalScore, nightmareCount) {
    const screen = document.getElementById('constellation-screen');
    const nameElem = document.getElementById('constellation-name');
    const finalScoreElem = document.getElementById('final-score');
    const finalNightmareElem = document.getElementById('final-shards-avoided');

    if (nameElem) nameElem.textContent = this.constellationName;
    if (finalScoreElem) finalScoreElem.textContent = totalScore;
    if (finalNightmareElem) finalNightmareElem.textContent = nightmareCount;

    if (screen) {
      screen.classList.remove('hidden');
    }
  }

  hide() {
    this.isActive = false;
    const screen = document.getElementById('constellation-screen');
    if (screen) screen.classList.add('hidden');
  }
}

// Global constellation instance
window.dreamConstellation = new DreamConstellation();
