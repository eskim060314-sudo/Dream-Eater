/**
 * Dream Eater — Master p5.js Sketch & Game State Coordinator
 */

// Game States
const GAME_STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  CONSTELLATION: 'constellation'
};

let currentGameState = GAME_STATE.TITLE;

// Game Metrics
let dreamScore = 0;
let positiveStarsCaught = 0;
let nightmareShardsSwallowed = 0;
const TOTAL_STARS_GOAL = 30;

// p5.js Sketch Definition
new p5((p) => {

  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('game-container');
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));

    // Initialize Subsystems
    if (window.dreamTracker) {
      window.dreamTracker.init(p);
    }
    if (window.dreamWorlds) {
      window.dreamWorlds.init(p);
    }

    // Attach UI DOM Event Listeners
    setupUIEventListeners();
  };

  p.draw = () => {
    p.clear();

    // 1. Render Dream World Environment (Sky gradient & ambient layers)
    if (window.dreamWorlds) {
      window.dreamWorlds.render(p);
    }

    // 2. State-Specific Rendering & Logic
    if (currentGameState === GAME_STATE.TITLE) {
      // Gentle floating preview in title screen
      if (window.dreamTracker) {
        window.dreamTracker.update(p);
        window.dreamTracker.renderMirroredVideo(p);
        window.dreamTracker.renderMouthAura(p);
      }
    } 
    else if (currentGameState === GAME_STATE.PLAYING) {
      // A. Mirrored translucent video feed
      if (window.dreamTracker) {
        window.dreamTracker.renderMirroredVideo(p);
        window.dreamTracker.update(p);
      }

      // B. Falling Stars & Particle Systems
      if (window.dreamStars) {
        window.dreamStars.update(p, window.dreamTracker.mouth, handleStarCaught);
        window.dreamStars.render(p);
      }

      // C. Player's Mouth Vortex & Glow Aura
      if (window.dreamTracker) {
        window.dreamTracker.renderMouthAura(p);
      }
    } 
    else if (currentGameState === GAME_STATE.CONSTELLATION) {
      // Final Constellation Scene
      if (window.dreamConstellation) {
        window.dreamConstellation.update(p);
        window.dreamConstellation.render(p);
      }
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    if (window.dreamWorlds) {
      window.dreamWorlds.init(p);
    }
  };

  /**
   * Star Collected Callback
   */
  function handleStarCaught(event) {
    if (event.isPositive) {
      positiveStarsCaught++;
      dreamScore = Math.max(0, dreamScore + event.scoreDelta);
      
      // Update HUD World Progression
      if (window.dreamWorlds) {
        window.dreamWorlds.updateLevel(positiveStarsCaught);
      }

      // Check if player reached the final constellation goal!
      if (positiveStarsCaught >= TOTAL_STARS_GOAL) {
        triggerConstellationVictory();
      }
    } else {
      nightmareShardsSwallowed++;
      dreamScore = Math.max(0, dreamScore + event.scoreDelta);
    }

    // Update HUD counters
    updateHUD();
  }

  /**
   * Transition to Final Constellation Scene
   */
  function triggerConstellationVictory() {
    currentGameState = GAME_STATE.CONSTELLATION;

    // Fade out game HUD
    const hud = document.getElementById('hud');
    if (hud) hud.classList.add('hidden');

    // Launch constellation sequence
    if (window.dreamConstellation && window.dreamStars) {
      window.dreamConstellation.start(
        p,
        window.dreamStars.collectedPositiveStars,
        dreamScore,
        nightmareShardsSwallowed
      );
    }
  }

  /**
   * UI DOM Bindings
   */
  function setupUIEventListeners() {
    // 1. Start Dreaming Button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        // Init Web Audio
        if (window.dreamAudio) {
          window.dreamAudio.init();
        }

        // Hide start screen, reveal HUD
        const startScreen = document.getElementById('start-screen');
        const hud = document.getElementById('hud');
        if (startScreen) startScreen.classList.add('hidden');
        if (hud) hud.classList.remove('hidden');

        currentGameState = GAME_STATE.PLAYING;
      });
    }

    // 2. Play Again / Dream Again Button
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        resetGame();
      });
    }

    // 3. Audio Toggle Button
    const audioBtn = document.getElementById('audio-btn');
    const soundOn = document.getElementById('sound-on-icon');
    const soundOff = document.getElementById('sound-off-icon');

    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        if (!window.dreamAudio) return;
        if (!window.dreamAudio.isInitialized) {
          window.dreamAudio.init();
        }
        const isMuted = window.dreamAudio.toggleMute();
        if (isMuted) {
          if (soundOn) soundOn.classList.add('hidden');
          if (soundOff) soundOff.classList.remove('hidden');
        } else {
          if (soundOn) soundOn.classList.remove('hidden');
          if (soundOff) soundOff.classList.add('hidden');
        }
      });
    }

    // 4. Input Mode Toggle (Camera / Mouse)
    const toggleInputBtn = document.getElementById('toggle-input-btn');
    if (toggleInputBtn) {
      toggleInputBtn.addEventListener('click', () => {
        if (window.dreamTracker) {
          window.dreamTracker.toggleInputMode();
        }
      });
    }
  }

  /**
   * Updates HUD UI elements
   */
  function updateHUD() {
    const scoreVal = document.getElementById('score-display');
    const starCountText = document.getElementById('star-count-text');
    const progressBarFill = document.getElementById('progress-bar-fill');

    if (scoreVal) {
      scoreVal.textContent = dreamScore;
      scoreVal.classList.add('score-bump');
      setTimeout(() => scoreVal.classList.remove('score-bump'), 200);
    }

    if (starCountText) {
      starCountText.textContent = `${positiveStarsCaught} / ${TOTAL_STARS_GOAL}`;
    }

    if (progressBarFill) {
      const pct = Math.min(100, (positiveStarsCaught / TOTAL_STARS_GOAL) * 100);
      progressBarFill.style.width = `${pct}%`;
    }
  }

  /**
   * Resets game state for a new dream cycle
   */
  function resetGame() {
    dreamScore = 0;
    positiveStarsCaught = 0;
    nightmareShardsSwallowed = 0;

    if (window.dreamStars) window.dreamStars.reset();
    if (window.dreamWorlds) {
      window.dreamWorlds.currentLevel = 1;
      window.dreamWorlds.targetLevel = 1;
      window.dreamWorlds.transitionProgress = 1.0;
      window.dreamWorlds.showWorldBanner(1);
    }
    if (window.dreamConstellation) {
      window.dreamConstellation.hide();
    }

    updateHUD();

    const hud = document.getElementById('hud');
    if (hud) hud.classList.remove('hidden');

    currentGameState = GAME_STATE.PLAYING;
  }

});
