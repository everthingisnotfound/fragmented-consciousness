# Fragmented Consciousness: Local Development Setup Guide

## 📋 Prerequisites

Before you start, make sure you have the following installed on your laptop:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **pnpm** (v10 or higher) - Install globally with: `npm install -g pnpm`
- **Git** (optional, but recommended) - [Download](https://git-scm.com/)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Verify Installation

Open your terminal/command prompt and run:

```bash
node --version    # Should show v18.x.x or higher
pnpm --version    # Should show 10.x.x or higher
```

---

## 🚀 Getting Started

### Step 1: Extract the ZIP File

Extract `fragmented-consciousness-complete.zip` to a location on your laptop. For example:

```bash
# On macOS/Linux
unzip fragmented-consciousness-complete.zip
cd fragmented-consciousness

# On Windows
# Right-click the ZIP file → Extract All → Choose destination folder
# Then open Command Prompt/PowerShell and navigate to the folder
cd fragmented-consciousness
```

### Step 2: Install Dependencies

Inside the project directory, run:

```bash
pnpm install
```

This will install all required packages (React, Three.js, Tailwind CSS, etc.). This may take 2-5 minutes depending on your internet speed.

### Step 3: Start the Development Server

Once dependencies are installed, run:

```bash
pnpm dev
```

You should see output like:

```
VITE v7.1.9  ready in 512 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

### Step 4: Open in Browser

Open your web browser and navigate to:

```
http://localhost:5173/
```

You should see the **Fragmented Consciousness** launcher page with 6 window cards.

---

## 🎮 Using the Application

### Launcher Page (Home)

The main page displays 6 cognitive windows:

1. **🧬 BODY** - Primary creature simulation with 3D physics
2. **👁️ VISION** - Mouse tracking and perception rays
3. **🧠 MEMORY** - Path recording and neural connections
4. **✋ TOUCH** - Click-based tactile feedback
5. **👂 HEARING** - Sound event visualization
6. **💖 EMOTION** - Emotional state and aura

### Opening Windows

- Click **"OPEN WINDOW"** on any card to open that window in a new browser tab/window
- Click **"Open All Windows"** to open all 6 windows simultaneously
- Each window shows the creature's consciousness level (X/6) in the top-right corner

### Interacting with Windows

**Body Window:**
- Displays the 3D creature with physics simulation
- Shows real-time position, velocity, and emotional state
- Creature moves based on consciousness level

**Vision Window:**
- Move your mouse around to create perception rays
- Colored particles orbit your mouse position
- Light beams emanate from the gaze point

**Memory Window:**
- Displays path history with color coding:
  - 🔵 Blue = Safe paths
  - 🟡 Yellow = Exploration
  - 🟠 Orange = Collision
  - 🔴 Red = Danger
- Neural connections show learned routes

**Touch Window:**
- Click anywhere to create contact nodes
- Organic mesh connects all touch points
- Shows tactile memory visualization

**Hearing Window:**
- Click to create sound events
- Ripples expand outward showing sound propagation
- Waveforms represent ambient audio

**Emotion Window:**
- Click to cycle through emotions: Curious → Happy → Fearful → Excited → Calm
- Aura color changes based on emotional state
- Particles respond to emotional changes

---

## 📁 Project Structure

```
fragmented-consciousness/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── pages/            # Window components (Body, Vision, Memory, etc.)
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # Utilities (sharedState.ts, threeSetup.ts)
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom React hooks
│   │   ├── App.tsx           # Main app routes
│   │   ├── index.css         # Global styles & Tailwind config
│   │   └── main.tsx          # React entry point
│   ├── index.html            # HTML template
│   └── public/               # Static assets
├── server/                    # Backend (Express) - not used in static mode
├── shared/                    # Shared types and constants
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
```

---

## 🛠️ Available Commands

### Development

```bash
# Start development server (with hot reload)
pnpm dev

# Type check (verify TypeScript errors)
pnpm check

# Format code with Prettier
pnpm format
```

### Production Build

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

---

## 🔧 Customization & Development

### Modifying the Creature

Edit `client/src/lib/threeSetup.ts` to change:
- Creature colors and materials
- Particle effects
- Bloom intensity
- Animation speed

### Changing Window Styles

Edit individual window files in `client/src/pages/`:
- `WindowBody.tsx` - Body window styling
- `WindowVision.tsx` - Vision window styling
- `WindowMemory.tsx` - Memory window styling
- `WindowTouch.tsx` - Touch window styling
- `WindowHearing.tsx` - Hearing window styling
- `WindowEmotion.tsx` - Emotion window styling

### Adjusting Global Colors

Edit `client/src/index.css` to modify:
- Color palette (OKLCH format)
- Typography system
- Spacing tokens
- Tailwind theme

### Adding New Features

1. Create new page in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Use `initializeSharedState()` to connect to the consciousness system
4. Subscribe to state updates with `.subscribe()`

---

## 🐛 Troubleshooting

### Port Already in Use

If you get an error like "Port 5173 already in use":

```bash
# macOS/Linux: Find and kill the process
lsof -i :5173
kill -9 <PID>

# Windows: Use Task Manager or:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Or specify a different port:

```bash
pnpm dev -- --port 3000
```

### Dependencies Not Installing

If `pnpm install` fails:

```bash
# Clear pnpm cache
pnpm store prune

# Delete lock file and reinstall
rm pnpm-lock.yaml
pnpm install
```

### Browser Shows Blank Page

1. Check browser console (F12 → Console tab) for errors
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear browser cache and cookies
4. Try a different browser

### Three.js Not Rendering

1. Ensure your GPU supports WebGL
2. Check browser console for WebGL errors
3. Try disabling browser extensions that might interfere with WebGL

---

## 📚 Key Technologies

- **React 19** - UI framework
- **Three.js** - 3D graphics and creature rendering
- **Tailwind CSS 4** - Utility-first styling
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **BroadcastChannel API** - Cross-window communication

---

## 🎨 Design Philosophy

The project uses a **Soft Futurism** aesthetic with:
- Gentle gradients and pastel colors
- Glowing bloom effects
- Floating particles and organic geometry
- Smooth animations and transitions
- Accessible typography and contrast

---

## 📖 Additional Resources

- **Three.js Documentation**: https://threejs.org/docs/
- **React Documentation**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Vite Guide**: https://vitejs.dev/guide/

---

## 🚀 Next Steps

After getting the project running:

1. **Explore the code** - Read through the window components to understand how they work
2. **Experiment** - Try modifying colors, animations, and interactions
3. **Extend features** - Add new cognitive functions or interactions
4. **Deploy** - Use the Manus platform or deploy to Vercel/Netlify

---

## 💡 Tips

- **Hot Reload**: Changes to files are automatically reflected in the browser (no manual refresh needed)
- **DevTools**: Press F12 to open browser DevTools and inspect elements
- **Console Logs**: Check the browser console for debug information
- **Multiple Windows**: Open all 6 windows simultaneously to see how consciousness emerges from distributed cognition

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Ensure all prerequisites are installed correctly
4. Try deleting `node_modules` and running `pnpm install` again

---

**Enjoy exploring Fragmented Consciousness! 🌟**
