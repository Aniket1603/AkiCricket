# AkiCricket AI – The Ultimate IPL Mind Reader 🏏✨

AkiCricket AI is a premium, dark-cyber cricket-themed AI guessing game. Think of an IPL player, team, stadium, or legendary moment, and watch the AI read your mind and guess it in under 15 Yes/No questions.

Featuring dynamic AI commentator personalities, voice mode speech controls, a dual-AI battle arena, and dynamic career timelines powered by the **Google Gemini API**.

---

## 🎨 Visual Cyber-Cricket Theme
- **Neon-Infused HUD:** Designed using Neon Blue (`#00f0ff`), IPL Gold (`#ffd700`), Electric Purple (`#9d4edd`), and Cricket Green (`#39ff14`).
- **Interactive Hologram Avatar:** SVG-based glowing assistant animating 5 facial expressions (`thinking`, `happy`, `confident`, `shocked`, `victory`) matched to confidence scores.
- **Stadium Particles:** Custom Canvas particle emitter overlaying glowing floating sparks, floodlight beams, and scanning gridlines.
- **Micro-Animations:** Fluid transitions and bounce scales powered by `Framer Motion`.

---

## 🏏 Core Features

1. **5 Diverse Game Modes:**
   - **IPL Player Guess:** Think of superstars like Dhoni, Kohli, Rohit, ABD.
   - **IPL Team Guess:** Think of franchises like CSK, MI, RCB, KKR.
   - **Historic Moments:** Match thrillers, final-ball finishes, McCullum's 158.
   - **Mystery Stadium:** Legendary arenas like Wankhede and Eden Gardens.
   - **IPL Legends Only:** Special high-difficulty hard mode.
2. **AI Personality & Commentary:** AI gets dramatic during the final questions and shifts dialogue based on its internal elimination confidence.
3. **Voice Mode:** Speak "Yes", "No", or "Skip" to play hands-free, and hear the AI announcer read questions out loud.
4. **AI Battle Arena:** Dual-agent simulation where Agent A attempts to guess, while Agent B uses predictive forecasting to anticipate Agent A's next question.
5. **Hint & Coin Economy:** Earn coins on victories. Spend coins to Skip Questions, Reveal Matches, or Prune candidate branches.
6. **Timeline History Explorer:** Interactive career timelines generated on-demand by Gemini after a game finishes.
7. **Share Card Generator:** Draws and compiles score stats on an HTML canvas for immediate PNG download.
8. **Firestore & Local Fallbacks:** Integrates Auth/Firestore databases, falling back automatically to offline LocalStorage modes if environment credentials are not present.

---

## 🛠 Tech Stack
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + Custom Keyframes
- **Animation:** Framer Motion
- **AI Models:** Google Gemini 2.5 Flash / Gemini 2.0 Flash
- **Database & Auth:** Firebase client with transparent localStorage backup

---

## 📂 Project Directory Structure

```
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Main Dashboard (Modes, Achievements, Dev keys console)
│   │   ├── layout.tsx               # Root Layout with Font loaders, Canvas backdrops, & Header Nav
│   │   ├── game/
│   │   │   └── page.tsx             # Play Stadium (Elimination questioning loop, hints)
│   │   ├── battle/
│   │   │   └── page.tsx             # Battle Arena (Agent A vs Agent B chat logs)
│   │   ├── leaderboard/
│   │   │   └── page.tsx             # Hall of Fame (Rank tables & AI diagnostics)
│   │   └── api/
│   │       ├── guess/
│   │       │   └── route.ts         # Server Route: Gemini guessing engine integration
│   │       ├── battle/
│   │       │   └── route.ts         # Server Route: Duel round simulation
│   │       └── timeline/
│   │           └── route.ts         # Server Route: Highlights timeline generation
│   ├── components/
│   │   ├── Avatar.tsx               # Holographic animated SVG AI analyst
│   │   ├── ParticleBackground.tsx   # Canvas dust sparks & floodlights sweeps
│   │   ├── ShareCard.tsx            # HTML5 Canvas PNG compiler
│   │   ├── TimelineExplorer.tsx     # Gemini career achievements loader
│   │   └── VoiceHandler.tsx         # SpeechSynthesis & SpeechRecognition bridge
│   ├── lib/
│   │   ├── firebase.ts              # Firebase Client SDK initialize with LocalStorage fallback
│   │   └── gemini.ts                # Gemini generative client setup and mock fallbacks
│   └── styles/
│       └── globals.css              # Cyber-cricket design utilities & scrollbar shapes
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18.0.0 or higher
- npm or yarn

### Steps
1. Clone the project and navigate to the directory:
   ```bash
   cd "APL 26 May"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   # Firebase Config (Optional - fell back to LocalStorage if blank)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   ```
   *Note: You can also configure your Gemini API key interactively using the **Developer API Console** inside the web app dashboard.*
4. Start the local server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.
