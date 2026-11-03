/**
 * Dream Eater — FaceMesh & Mouth Tracking Module
 * Supports ml5.js FaceMesh with smooth exponential filtering, mirrored coordinate
 * mapping, and seamless mouse/touch fallback mode.
 */

class DreamTracker {
  constructor() {
    this.video = null;
    this.faceMesh = null;
    this.predictions = [];
    
    // Status
    this.isCameraReady = false;
    this.isModelLoaded = false;
    this.isModelLoading = false;
    this.hasFaceDetected = false;
    this.useMouseFallback = false;
    this.cameraPermissionDenied = false;

    // Smoothed Mouth State
    this.mouth = {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.65,
      rawX: window.innerWidth / 2,
      rawY: window.innerHeight * 0.65,
      openness: 0,        // 0.0 (closed) to 1.0 (fully open)
      rawOpenness: 0,
      isOpen: false,
      threshold: 0.28,    // calibrated ratio threshold
      radius: 40,         // catch radius
      catchCount: 0
    };

    // Mouse mode state
    this.mouseMouth = {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.65,
      isMouseDown: false
    };

    // Visual ripple waves around mouth
    this.mouthRipples = [];

    // Internal video display bounds
    this.videoAspect = 4 / 3;
    this.videoScale = 1;
    this.videoOffsetX = 0;
    this.videoOffsetY = 0;
  }

  /**
   * Initializes the video capture and FaceMesh model
   */
  init(p) {
    // Start loading FaceMesh right away in parallel
    this.loadFaceMeshModel();

    // 1. Setup video capture
    try {
      this.video = p.createCapture({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      }, (stream) => {
        this.isCameraReady = true;
        this.updateStatusPill("Camera ready.", this.isModelLoaded);
        this.bindDetection();
      });

      if (this.video && this.video.elt) {
        this.video.elt.setAttribute('playsinline', '');
        this.video.elt.onerror = (e) => {
          console.warn("Video element error:", e);
          this.enableMouseFallback("Camera error. Mouse mode activated.");
        };
      }

      this.video.size(640, 480);
      this.video.hide(); // Hide raw DOM video element; drawn on canvas
    } catch (err) {
      console.warn("Camera capture initialization error:", err);
      this.enableMouseFallback("Camera access unavailable. Using Mouse Mode.");
    }

    // Safety timeout: if model takes > 8s or camera prompt ignored, allow mouse mode
    setTimeout(() => {
      if (!this.isModelLoaded && !this.cameraPermissionDenied) {
        this.updateStatusPill("Click anywhere or toggle mouse mode if camera is slow.", false);
      }
    }, 7000);
  }

  /**
   * Loads FaceMesh model using ml5 (supporting ml5 v1.x and v0.x)
   */
  loadFaceMeshModel() {
    if (this.isModelLoaded || this.isModelLoading) return;
    this.isModelLoading = true;

    if (typeof ml5 === 'undefined') {
      console.warn("ml5.js not detected yet. Retrying in 500ms.");
      this.isModelLoading = false;
      setTimeout(() => this.loadFaceMeshModel(), 500);
      return;
    }

    try {
      // ml5 v1.x API: ml5.faceMesh(options, callback)
      if (typeof ml5.faceMesh === 'function') {
        const options = {
          maxFaces: 1,
          refineLandmarks: true,
          flipHorizontal: false // We mirror manually for canvas accuracy
        };

        this.faceMesh = ml5.faceMesh(options, () => {
          this.isModelLoaded = true;
          this.isModelLoading = false;
          this.updateStatusPill("FaceMesh Ready!", this.isCameraReady);
          this.bindDetection();
        });
      } 
      // ml5 v0.12.x fallback: ml5.facemesh(video, options, callback)
      else if (typeof ml5.facemesh === 'function') {
        const options = { maxFaces: 1, flipHorizontal: false };
        if (this.video) {
          this.faceMesh = ml5.facemesh(this.video, options, () => {
            this.isModelLoaded = true;
            this.isModelLoading = false;
            this.updateStatusPill("FaceMesh Ready!", true);
          });

          this.faceMesh.on('predict', (results) => {
            this.predictions = results;
          });
        }
      }
    } catch (err) {
      console.warn("FaceMesh loading error:", err);
      this.isModelLoading = false;
      this.enableMouseFallback("FaceMesh error. Mouse mode activated.");
    }
  }

  /**
   * Binds detection stream once both video and FaceMesh are ready
   */
  bindDetection() {
    if (!this.isCameraReady || !this.isModelLoaded || !this.faceMesh) return;
    try {
      if (this.faceMesh.detectStart && this.video) {
        const videoElem = this.video.elt || this.video;
        this.faceMesh.detectStart(videoElem, (results) => {
          this.predictions = results;
        });
        this.updateStatusPill("FaceMesh Ready! Align your face.", true);
      }
    } catch (e) {
      console.warn("Error binding FaceMesh detectStart:", e);
    }
  }

  /**
   * Fallback to mouse/touch interaction
   */
  enableMouseFallback(message) {
    this.useMouseFallback = true;
    this.updateStatusPill(message || "Mouse Mode: Move cursor, Click to open mouth", true);
    const camIcon = document.getElementById('cam-icon');
    if (camIcon) camIcon.style.opacity = '0.5';
  }

  /**
   * Toggles between webcam FaceMesh tracking and mouse tracking
   */
  toggleInputMode() {
    this.useMouseFallback = !this.useMouseFallback;
    const msg = this.useMouseFallback
      ? "Switched to Mouse Mode (Click/Hold to open mouth)"
      : (this.isModelLoaded ? "Webcam FaceMesh Active" : "Waiting for camera...");
    this.updateStatusPill(msg, this.useMouseFallback || this.isModelLoaded);
    return this.useMouseFallback;
  }

  /**
   * Update UI status pill
   */
  updateStatusPill(text, isReady) {
    const pill = document.getElementById('camera-status-pill');
    const msg = document.getElementById('camera-status-msg');
    const pulse = pill ? pill.querySelector('.status-pulse') : null;
    if (msg) msg.textContent = text;
    if (pulse) {
      if (isReady) pulse.classList.add('ready');
      else pulse.classList.remove('ready');
    }
  }

  /**
   * Updates tracking calculations on each animation frame
   */
  update(p) {
    if (this.useMouseFallback) {
      this.updateMouseTracking(p);
    } else {
      this.updateFaceMeshTracking(p);
    }

    // Update mouth ripples
    for (let i = this.mouthRipples.length - 1; i >= 0; i--) {
      const rip = this.mouthRipples[i];
      rip.radius += rip.speed;
      rip.alpha -= rip.decay;
      if (rip.alpha <= 0) {
        this.mouthRipples.splice(i, 1);
      }
    }

    // Trigger subtle ripple when mouth actively opens
    if (this.mouth.isOpen && Math.random() < 0.25) {
      this.triggerMouthRipple(p.color(180, 220, 255), 1.2);
    }

    // Update HUD indicator pill
    this.updateMouthHudPill();
  }

  /**
   * Track FaceMesh landmarks & calculate mouth openness
   */
  updateFaceMeshTracking(p) {
    if (!this.predictions || this.predictions.length === 0) {
      this.hasFaceDetected = false;
      // Decay openness if face lost
      this.mouth.openness = p.lerp(this.mouth.openness, 0, 0.1);
      this.mouth.isOpen = false;
      return;
    }

    this.hasFaceDetected = true;
    const face = this.predictions[0];

    // Compute coordinate mapping between video source and p5 canvas (contain / cover)
    const vw = this.video ? this.video.width || 640 : 640;
    const vh = this.video ? this.video.height || 480 : 480;

    // We scale to cover screen smoothly
    const scale = Math.max(p.width / vw, p.height / vh);
    const offsetX = (p.width - vw * scale) / 2;
    const offsetY = (p.height - vh * scale) / 2;

    this.videoScale = scale;
    this.videoOffsetX = offsetX;
    this.videoOffsetY = offsetY;

    // Extract landmarks: supports both ml5 v1 (face.keypoints) and v0 (face.scaledMesh)
    let keypoints = face.keypoints || face.scaledMesh;

    if (keypoints && keypoints.length > 300) {
      // Standard MediaPipe FaceMesh Landmark Indices:
      // 13: Inner Upper Lip
      // 14: Inner Lower Lip
      // 61: Left mouth corner
      // 291: Right mouth corner
      // 10: Forehead top
      // 152: Chin bottom
      const getPt = (idx) => {
        const pt = keypoints[idx];
        if (!pt) return { x: 0, y: 0 };
        let px = pt.x !== undefined ? pt.x : pt[0];
        let py = pt.y !== undefined ? pt.y : pt[1];
        // If coordinate is normalized (0 to 1), convert to video pixel dimension
        if (px <= 1.0 && py <= 1.0 && vw > 1) {
          px *= vw;
          py *= vh;
        }
        return { x: px, y: py };
      };

      const upperLip = getPt(13);
      const lowerLip = getPt(14);
      const mouthLeft = getPt(61);
      const mouthRight = getPt(291);
      const forehead = getPt(10);
      const chin = getPt(152);

      // Raw center of mouth
      const rawMouthX = (upperLip.x + lowerLip.x) / 2;
      const rawMouthY = (upperLip.y + lowerLip.y) / 2;

      // Map to canvas with HORIZONTAL MIRRORING (flipping X)
      const mappedX = p.width - (rawMouthX * scale + offsetX);
      const mappedY = rawMouthY * scale + offsetY;

      // Distance calculations for normalized openness
      const verticalLipDist = Math.hypot(lowerLip.x - upperLip.x, lowerLip.y - upperLip.y);
      const mouthWidth = Math.hypot(mouthRight.x - mouthLeft.x, mouthRight.y - mouthLeft.y) || 1;
      const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y) || 1;

      // Ratio relative to mouth width & face height (invariant to player distance)
      const ratioWidth = verticalLipDist / mouthWidth;
      const ratioHeight = (verticalLipDist / faceHeight) * 3.5;
      const opennessRatio = (ratioWidth + ratioHeight) / 2;

      this.mouth.rawOpenness = opennessRatio;

      // Calibrate 0.0 (closed) to 1.0 (wide open)
      // Normal relaxed mouth ratio is ~0.12 - 0.22. Open mouth is >0.32
      const minClosed = 0.16;
      const maxOpened = 0.52;
      const normalizedOpenness = p.constrain(
        (opennessRatio - minClosed) / (maxOpened - minClosed),
        0, 1
      );

      // Smooth mouth position and aperture with exponential moving average
      this.mouth.x = p.lerp(this.mouth.x, mappedX, 0.32);
      this.mouth.y = p.lerp(this.mouth.y, mappedY, 0.32);
      this.mouth.openness = p.lerp(this.mouth.openness, normalizedOpenness, 0.35);

      // Openness decision threshold
      this.mouth.isOpen = this.mouth.openness > 0.28;
      // Dynamic collision catch radius: expands when mouth opens wider
      this.mouth.radius = p.lerp(35, 75, this.mouth.openness);
    }
  }

  /**
   * Track Mouse / Touch interaction as fallback
   */
  updateMouseTracking(p) {
    this.hasFaceDetected = true;

    // Follow mouse cursor smoothly
    const targetX = p.mouseX > 0 && p.mouseX < p.width ? p.mouseX : p.width / 2;
    const targetY = p.mouseY > 0 && p.mouseY < p.height ? p.mouseY : p.height * 0.7;

    this.mouth.x = p.lerp(this.mouth.x, targetX, 0.35);
    this.mouth.y = p.lerp(this.mouth.y, targetY, 0.35);

    // Mouse pressed or touch active opens mouth
    const targetOpen = p.mouseIsPressed ? 1.0 : 0.0;
    this.mouth.openness = p.lerp(this.mouth.openness, targetOpen, 0.25);
    this.mouth.isOpen = this.mouth.openness > 0.25;
    this.mouth.radius = p.lerp(38, 80, this.mouth.openness);
  }

  /**
   * Update UI pill in top HUD
   */
  updateMouthHudPill() {
    const pill = document.getElementById('mouth-pill');
    const dot = document.getElementById('mouth-pill-dot');
    const text = document.getElementById('mouth-pill-text');

    if (!pill || !dot || !text) return;

    if (!this.hasFaceDetected && !this.useMouseFallback) {
      dot.className = 'pill-dot';
      text.textContent = 'Seeking Face...';
    } else if (this.mouth.isOpen) {
      dot.className = 'pill-dot active';
      text.textContent = 'Mouth Open ✨';
    } else {
      dot.className = 'pill-dot';
      text.textContent = this.useMouseFallback ? 'Hold Click to Open' : 'Mouth Closed';
    }
  }

  /**
   * Spawns a glowing shockwave ripple at mouth
   */
  triggerMouthRipple(color, intensity = 1.0) {
    this.mouthRipples.push({
      x: this.mouth.x,
      y: this.mouth.y,
      radius: this.mouth.radius * 0.8,
      speed: 3.5 * intensity,
      alpha: 220,
      decay: 6,
      color: color
    });
  }

  /**
   * Render dreamy, mirrored webcam feed onto the canvas
   */
  renderMirroredVideo(p) {
    if (!this.video || !this.isCameraReady || this.useMouseFallback) return;

    p.push();
    // Mirror horizontally
    p.translate(p.width, 0);
    p.scale(-1, 1);

    // Set dreamy transparency
    p.tint(255, 45); // Ethereal translucent ghost feed
    const vw = this.video.width || 640;
    const vh = this.video.height || 480;
    const scale = Math.max(p.width / vw, p.height / vh);
    const sw = vw * scale;
    const sh = vh * scale;
    const sx = (p.width - sw) / 2;
    const sy = (p.height - sh) / 2;

    p.image(this.video, sx, sy, sw, sh);
    p.noTint();
    p.pop();
  }

  /**
   * Render Dream Mouth Vortex and interactive aura
   */
  renderMouthAura(p) {
    const m = this.mouth;

    p.push();
    p.translate(m.x, m.y);

    // 1. Render active ripple waves
    for (const rip of this.mouthRipples) {
      p.noFill();
      p.stroke(244, 194, 194, rip.alpha);
      p.strokeWeight(1.8);
      p.circle(0, 0, rip.radius * 2);
    }

    // 2. Swirling Stardust Aperture
    const openFactor = m.openness; // 0 to 1
    const baseR = m.radius;

    // Glowing outer halo
    const glowAlpha = p.map(openFactor, 0, 1, 35, 160);
    p.noStroke();
    
    // Gradient rings
    p.fill(163, 196, 243, glowAlpha * 0.4);
    p.circle(0, 0, baseR * 2.4);

    p.fill(244, 194, 194, glowAlpha * 0.6);
    p.circle(0, 0, baseR * 1.8);

    p.fill(255, 209, 102, glowAlpha * 0.8);
    p.circle(0, 0, baseR * 1.2);

    // Dynamic rotating celestial petals / suction vortex when open
    if (openFactor > 0.1) {
      const petals = 6;
      const angleStep = p.TWO_PI / petals;
      const rotSpeed = p.frameCount * 0.04;

      p.stroke(255, 255, 255, 180 * openFactor);
      p.strokeWeight(1.5);
      p.noFill();

      for (let i = 0; i < petals; i++) {
        const ang = i * angleStep + rotSpeed;
        const px = Math.cos(ang) * (baseR * 0.7);
        const py = Math.sin(ang) * (baseR * 0.7);
        
        p.circle(px, py, baseR * 0.5 * openFactor);
      }

      // Mouth opening center void
      p.fill(11, 16, 33, 210);
      p.noStroke();
      p.circle(0, 0, baseR * 0.9 * openFactor);
    }

    // Celestial center star dot
    p.fill(255, 255, 255, 230);
    p.noStroke();
    const coreSize = p.lerp(4, 8, openFactor);
    p.circle(0, 0, coreSize);

    // Cross glint
    p.stroke(255, 255, 255, 140);
    p.strokeWeight(1.2);
    const glintLen = p.lerp(10, 22, openFactor);
    p.line(-glintLen, 0, glintLen, 0);
    p.line(0, -glintLen, 0, glintLen);

    p.pop();
  }
}

// Global tracker instance
window.dreamTracker = new DreamTracker();
