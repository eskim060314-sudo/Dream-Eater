# ✧ Dream Eater ✧
*An interactive celestial dream world web game built with p5.js and ml5.js FaceMesh.*

Catch falling stars by opening your mouth in front of your webcam. Progress through three shifting dream realms, avoid nightmare shards, and weave 30 celestial stars into your unique final constellation.

---

## ✨ Features

1. **Webcam & Mouth Tracking**
   - Real-time facial landmark detection using **ml5.js FaceMesh**.
   - Mirrored webcam feed blended smoothly into the dreamscape with an ethereal translucent effect.
   - Dynamic mouth aperture tracking: detects when your mouth opens and generates a glowing dream vortex.
   - Smooth exponential filtering eliminates webcam jitter while maintaining sub-frame responsiveness.
   - **One-click Mouse / Touch Mode** toggle for effortless play even without a webcam or in low light.

2. **Three Types of Celestial Stars**
   - 🌟 **Golden Stars (+10 pts)**: Radiant 5-point stars that release golden stardust particles and sparkling bell chords.
   - 💎 **Blue Stars (+15 pts)**: Crystalline sapphire stars that burst into luminous cyan glitter and crystal harp arpeggios.
   - 🌑 **Nightmare Shards (-10 pts)**: Spiky obsidian shards that temporarily darken the realm and play a muffled sub-bass gong.

3. **Three Morphing Dream Worlds**
   - **Level 1 — Midnight Garden (Stars 0–9)**: Deep indigo skies, glowing fireflies, drifting spores, and silhouetted dream flora with bioluminescent tips.
   - **Level 2 — Moonlit Ocean (Stars 10–19)**: Mystical violet-blue tides, an ethereal crescent moon, shimmering reflection columns, and floating sea motes.
   - **Level 3 — Celestial Dream (Stars 20–29)**: Pastel rose and lavender dawn, billowing parallax clouds, and radiant celestial light beams.
   - Transitions between realms are seamless, gradual, and accompanied by harmonic resonance.

4. **Procedural Web Audio API Sound Engine**
   - 100% self-contained procedural audio synthesis — **zero external audio file dependencies** (no missing 404s, CORS errors, or asset latency).
   - Generative ambient dream music with warm evolving pads and sporadic pentatonic celestial wind chimes.
   - Unique melodic chime sounds for each star type.
   - Mute / Unmute control with visual state indicators.

5. **Final Constellation**
   - Upon collecting **30 positive stars**, the dream shifts into the cosmic heavens.
   - The collected stars ascend and lock into a procedurally generated astronomical figure (e.g. *Cygnus Somnii*, *Cetus Aureus*, *Corona Aurora*, *Phoenix Astralis*).
   - Luminous glowing lines connect the stars one by one to reveal your unique constellation.
   - Displays the inscription: *“Every dream leaves a constellation behind.”*
   - Includes final score summary and **Dream Again** replay option.

6. **Aesthetic & Artistic Direction**
   - Custom color palette: Midnight Blue (`#0B1021`), Pale Astral Blue (`#A3C4F3`), Lavender (`#B8A9C9`), Pastel Rose (`#F4C2C2`), and Astral Gold (`#FFD166`).
   - Glassmorphism HUD with subtle borders, glowing blur effects, and elegant serif typography (*Cinzel* & *Quicksand*).
   - Additive particle blending and custom gravitational attraction towards open mouth.

---

## 🚀 How to Run Locally

Because the webcam and ml5.js FaceMesh utilize modern web APIs (`navigator.mediaDevices.getUserMedia`), browsers require the game to be served over `http://localhost` or `https://` (rather than a raw `file://` URL).

### Option 1: Python HTTP Server (Built-in on Mac/Linux/Windows)
Open terminal in the project directory:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in Google Chrome, Edge, Safari, or Firefox.

### Option 2: Node.js (npx serve or live-server)
```bash
npx serve .
```

### Option 3: VS Code Live Server
Right-click `index.html` and select **"Open with Live Server"**.

---

## 🌐 Deploy to GitHub Pages

Dream Eater is fully static and zero-dependency:

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Dream Eater web game"
   git branch -M main
   git remote add origin https://github.com/<your-username>/Dream-Eater.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select branch `main` and folder `/ (root)`.
   - Click **Save**.
3. Your game will be live at `https://<your-username>.github.io/Dream-Eater/`!

---

## 🎮 Controls

| Action | Camera Mode | Mouse / Touch Mode |
|---|---|---|
| **Move Avatar** | Move your head / face | Move cursor or finger |
| **Open Mouth** | Open your mouth | Click and hold mouse or touch screen |
| **Catch Stars** | Open mouth when star touches aura | Hold click when star touches aura |
| **Mute Audio** | Click the speaker icon in top right | Click the speaker icon in top right |
| **Switch Modes** | Click the camera icon in top right | Click the camera icon in top right |

---

## 🛠️ Project Structure

```
Dream-Eater/
├── index.html        # Main HTML layout, HUD, overlays, and script loaders
├── style.css         # Glassmorphism design, glow effects, responsive CSS
├── js/
│   ├── audio.js      # Web Audio API sound synthesis & ambient dream music
│   ├── tracker.js    # ml5.js FaceMesh mouth detection & mouse fallback
│   ├── worlds.js     # Three dream world environments & smooth transitions
│   ├── stars.js      # Star types, physics, gravity pull & particle bursts
│   ├── constellation.js # Procedural final constellation generator & animation
│   └── sketch.js     # Master p5.js loop & state manager
└── README.md         # Documentation & guide
```

---

*“Every dream leaves a constellation behind.”*
