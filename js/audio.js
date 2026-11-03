/**
 * Dream Eater — Web Audio API Synthesizer & Procedural Sound Engine
 * Generates all sound effects and dreamy ambient background music in real-time.
 * 100% self-contained, zero external audio asset dependencies.
 */

class DreamAudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    
    // Ambient Music State
    this.ambientInterval = null;
    this.padOscillators = [];
    this.filterNode = null;
  }

  /**
   * Initializes the AudioContext upon user gesture (Start button)
   */
  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.isInitialized = true;
      this.startAmbientMusic();
    } catch (e) {
      console.warn("Web Audio API not supported or blocked:", e);
    }
  }

  /**
   * Resumes AudioContext if suspended by browser policy
   */
  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Toggle Mute State
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.7;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  /**
   * Golden Star Sound: Warm, sparkling celestial bell chord (E5, G#5, B5, E6)
   */
  playGoldenStarSound() {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    const freqs = [659.25, 830.61, 987.77, 1318.51]; // E major celestial chord

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.035);

      gain.gain.setValueAtTime(0.001, t + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.25 / freqs.length, t + idx * 0.035 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.035 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.035);
      osc.stop(t + idx * 0.035 + 1.3);
    });
  }

  /**
   * Blue Star Sound: Crystalline shimmering harp arpeggio (high ethereal harmonics)
   */
  playBlueStarSound() {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    // Pentatonic high sparkle: A5, C6, D6, E6, G6
    const freqs = [880.0, 1046.5, 1174.66, 1318.51, 1567.98];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc2.type = 'sine';
      
      const startTime = t + idx * 0.045;
      osc.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq * 2, startTime); // Octave overtone shimmer

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2 / freqs.length, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.4);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(startTime + 1.5);
      osc2.stop(startTime + 1.5);
    });
  }

  /**
   * Black Star Sound: Ominous low muffled gong / sub-bass dissonant chord
   */
  playBlackStarSound() {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    
    // Sub oscillator with slight pitch drop
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, t);
    filter.frequency.exponentialRampToValueAtTime(70, t + 0.9);

    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(110, t); // A2
    subOsc.frequency.exponentialRampToValueAtTime(55, t + 0.9); // Drop to A1

    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);

    subOsc.connect(filter);
    filter.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(t);
    subOsc.stop(t + 1.0);

    // Dissonant minor second chime
    const dissOsc = this.ctx.createOscillator();
    const dissGain = this.ctx.createGain();
    dissOsc.type = 'sine';
    dissOsc.frequency.setValueAtTime(233.08, t); // Bb3
    dissGain.gain.setValueAtTime(0.12, t);
    dissGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);

    dissOsc.connect(dissGain);
    dissGain.connect(this.sfxGain);
    dissOsc.start(t);
    dissOsc.stop(t + 0.75);
  }

  /**
   * World Transition Sound: Uplifting deep harmonic sweep
   */
  playWorldTransitionSound() {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.Q.value = 3.0;
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + 1.5);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 1.5);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 2.3);
  }

  /**
   * Constellation Finale Sound: Majestic celestial symphony chord
   */
  playConstellationFinale() {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    // Cmaj9 open cosmic chord: C3, G3, D4, E4, B4, D5, G5
    const freqs = [130.81, 196.00, 293.66, 329.63, 493.88, 587.33, 783.99];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.001, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.2 / Math.sqrt(freqs.length), t + delay + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 4.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 4.6);
    });
  }

  /**
   * Single Constellation Line Connecting Chime
   */
  playStarConnectChime(freq = 523.25) {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.85);
  }

  /**
   * Ambient Generative Dream Music
   * Generates a lush, continuous harmonic pad with subtle filter sweeps
   * and sporadic, delicate pentatonic wind chimes.
   */
  startAmbientMusic() {
    if (!this.ctx) return;

    // Create warm pad synth (F, A, C, E, G soothing dream chords)
    const chords = [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [196.00, 246.94, 293.66, 392.00]  // G6
    ];

    let currentChordIdx = 0;

    // Filter for the pad to make it soft and dreamy
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.filterNode.connect(this.musicGain);

    const playChordCycle = () => {
      if (!this.ctx || this.ctx.state === 'closed') return;
      const t = this.ctx.currentTime;
      const chord = chords[currentChordIdx];
      currentChordIdx = (currentChordIdx + 1) % chords.length;

      // Filter gentle swell
      this.filterNode.frequency.cancelScheduledValues(t);
      this.filterNode.frequency.setValueAtTime(350, t);
      this.filterNode.frequency.exponentialRampToValueAtTime(650, t + 2.5);
      this.filterNode.frequency.exponentialRampToValueAtTime(350, t + 5.0);

      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.045, t + 1.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 5.8);

        osc.connect(gain);
        gain.connect(this.filterNode);

        osc.start(t);
        osc.stop(t + 6.0);
      });

      // Sporadic high dream chime (pentatonic scale note)
      if (Math.random() > 0.3) {
        setTimeout(() => {
          if (!this.ctx || this.isMuted) return;
          const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
          const chimeFreq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
          const ct = this.ctx.currentTime;
          
          const chOsc = this.ctx.createOscillator();
          const chGain = this.ctx.createGain();
          chOsc.type = 'triangle';
          chOsc.frequency.setValueAtTime(chimeFreq, ct);

          chGain.gain.setValueAtTime(0.0001, ct);
          chGain.gain.exponentialRampToValueAtTime(0.03, ct + 0.05);
          chGain.gain.exponentialRampToValueAtTime(0.0001, ct + 1.8);

          chOsc.connect(chGain);
          chGain.connect(this.musicGain);

          chOsc.start(ct);
          chOsc.stop(ct + 1.9);
        }, 1200 + Math.random() * 2000);
      }
    };

    // Play first cycle and set recurring interval
    playChordCycle();
    this.ambientInterval = setInterval(playChordCycle, 5500);
  }

  stopAmbientMusic() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }
}

// Global instance
window.dreamAudio = new DreamAudioManager();
