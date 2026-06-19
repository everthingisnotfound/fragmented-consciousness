# Fragmented Consciousness: A Distributed Artificial Lifeform

An interactive multi-window browser experiment exploring consciousness as a distributed phenomenon. This project visualizes how cognition, memory, perception, and emotion combine to create intelligent behavior through multiple synchronized browser windows.

## Concept

**"Consciousness is not located in one place."**

A single digital creature exists across multiple browser windows. Each window represents a different cognitive or sensory function:

- **Window 1 (Body)**: The creature's physical form and primary simulation
- **Window 2 (Vision)**: Sight and perception through mouse tracking
- **Window 3 (Memory)**: Learning and path history with neural connections
- **Window 4 (Touch)**: Physical contact and surface understanding
- **Window 5 (Hearing)**: Environmental awareness and audio response
- **Window 6 (Emotion)**: Emotional state and internal experience

When all windows are open, the creature is **fully conscious (6/6)**. As you close windows, it loses cognitive abilities and becomes more primitive. The desktop arrangement influences the creature's behavior—consciousness emerges from the interaction of distributed processes.

## Features

### Core Mechanics

- **Real-time Synchronization**: All windows communicate via BroadcastChannel API
- **Consciousness Level Indicator**: Live display of cognitive capacity (1-6)
- **Adaptive Behavior**: Creature's actions change based on available cognitive functions
- **Visual Feedback**: Each window has distinct aesthetics reflecting its function
- **Physics Simulation**: 3D creature movement with smooth animation at 60 FPS

### Window Functions

| Window | Function | Visual Style | Interaction |
|--------|----------|--------------|-------------|
| Body | Primary simulation, creature physics, state machine | 3D rendered creature with glow effects | Real-time physics and movement |
| Vision | Mouse tracking, perception, navigation | Colorful rays, gradients, light beams | Move mouse to direct sight |
| Memory | Path history, learned routes, danger zones | Glowing trails (color-coded), neural connections | Automatic path recording |
| Touch | Collision recording, surface understanding | Organic mesh, contact nodes, network growth | Click to create contact events |
| Hearing | Environmental awareness, event detection | Expanding waveforms, ripples, particles | Click to create sound events |
| Emotion | Emotional state, internal experience | Dynamic aura, color field, particles | Click to cycle emotions |

### Consciousness Levels

| Level | State | Behavior | Visual Impact |
|-------|-------|----------|---------------|
| 6/6 | Fully Conscious | Intelligent navigation, memory-based decisions | All systems active, vibrant |
| 5/6 | Minor Loss | Slight hesitation, occasional memory gaps | One system dimmed |
| 4/6 | Noticeably Impaired | Random decisions mixed with memory | Two systems dim |
| 3/6 | Confused | Mostly random with memory flashes | Three systems dim |
| 2/6 | Primitive | Instinct-driven, no memory or emotion | Four systems dim |
| 1/6 | Instinct Only | Pure physics-based movement | Only Body active |

## Getting Started

### Opening Windows

1. **Visit the launcher**: Open the main page to see all available windows
2. **Open individual windows**: Click "Open Window" on any card
3. **Open all at once**: Click "Open All Windows" to launch the full experience
4. **Arrange on desktop**: Position windows side-by-side, overlapping, or stacked

### Interacting with Windows

**Body Window**: Watch the creature move and respond to its consciousness level

**Vision Window**: Move your mouse to direct the creature's perception rays

**Memory Window**: Observe path trails being recorded as the creature explores

**Touch Window**: Click to create contact nodes and build tactile memory

**Hearing Window**: Click to generate sound events and ripples

**Emotion Window**: Click to cycle through emotional states (Curious → Happy → Fearful → Excited → Calm)

### Experiencing Consciousness

1. **Start with all windows open**: Experience full consciousness (6/6)
2. **Close Vision**: Creature becomes blind, navigation becomes random
3. **Close Memory**: Creature forgets all learned paths
4. **Close Touch**: Creature loses physical feedback
5. **Close Hearing**: Creature becomes deaf to events
6. **Close Emotion**: Creature becomes purely logical
7. **Only Body remains**: Creature reduces to pure instinct

## Technical Architecture

### Technology Stack

- **Three.js**: 3D rendering and creature visualization
- **React 19**: Component-based UI framework
- **Tailwind CSS 4**: Responsive styling
- **BroadcastChannel API**: Cross-window synchronization
- **Canvas 2D**: 2D visualizations for perception, memory, touch, hearing, emotion

### Communication Layer

The **SharedStateManager** uses BroadcastChannel API to synchronize state across all windows:

```typescript
// Each window initializes with its type
const stateManager = initializeSharedState('body');

// Subscribe to state updates
stateManager.subscribe((state) => {
  // React to state changes
});

// Update shared state
stateManager.updateCreature({ position, velocity });
stateManager.updateConsciousness(activeWindows);
```

### State Structure

```typescript
SharedState {
  creature: {
    position: Vector3,
    velocity: Vector3,
    state: "exploring" | "resting" | "fleeing" | "learning",
    emotionalState: "curious" | "happy" | "fearful" | "excited" | "calm",
    energy: 0-100
  },
  consciousness: {
    activeWindows: string[],
    level: 1-6,
    description: string
  },
  memory: {
    paths: Path[],
    collisions: Collision[]
  },
  environment: {
    obstacles: Obstacle[],
    targets: Target[]
  }
}
```

### File Structure

```
client/src/
├── pages/
│   ├── Launcher.tsx          # Main entry point with window cards
│   ├── WindowBody.tsx        # 3D creature simulation
│   ├── WindowVision.tsx      # Perception and sight
│   ├── WindowMemory.tsx      # Learning and path history
│   ├── WindowTouch.tsx       # Physical contact
│   ├── WindowHearing.tsx     # Environmental awareness
│   └── WindowEmotion.tsx     # Emotional state
├── lib/
│   ├── sharedState.ts        # BroadcastChannel communication
│   └── threeSetup.ts         # Three.js scene initialization
└── App.tsx                   # Route definitions
```

## Design Philosophy

**Soft Futurism + Neural Aesthetics**

- **Beautiful Color Palettes**: Soft gradients, no pure black backgrounds
- **Ambient Particles**: Floating energy structures throughout
- **Bloom Effects**: Glowing elements suggest consciousness and awareness
- **Organic Geometry**: Flowing curves, natural forms, non-rigid shapes
- **Neural Network Motifs**: Connection lines and nodes represent cognitive processes

Inspired by Journey, GRIS, Monument Valley, and abstract consciousness art.

## Performance Optimization

- **60 FPS Target**: Optimized animation loops and rendering
- **GPU-Accelerated Particles**: Three.js particle systems
- **Canvas Optimization**: Efficient 2D drawing with minimal redraws
- **Responsive Design**: Adapts to any window size

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements**: BroadcastChannel API support (available in all modern browsers)

## Extending the Project

### Adding New Windows

1. Create a new component in `client/src/pages/Window{Name}.tsx`
2. Initialize shared state: `initializeSharedState('{name}')`
3. Subscribe to updates: `stateManager.subscribe()`
4. Add route in `App.tsx`
5. Add window card in `Launcher.tsx`

### Customizing Behavior

Edit `client/src/lib/sharedState.ts` to modify:
- Consciousness level calculations
- State update logic
- Memory management
- Creature behavior rules

### Modifying Visuals

- **Colors**: Update gradient definitions in each window component
- **Animations**: Adjust animation loop timing and easing
- **Particles**: Modify particle count, size, and behavior
- **Creature Model**: Enhance Three.js geometry in `threeSetup.ts`

## Future Enhancements

- Audio input integration for Hearing window
- Machine learning-based creature behavior
- Persistent memory across sessions
- Multiplayer consciousness sharing
- VR/AR support for immersive experience
- Advanced physics with collision detection
- Procedural environment generation

## Credits

**Concept**: Exploring consciousness as a distributed phenomenon through multi-window browser interaction

**Inspiration**: Journey, GRIS, Monument Valley, neural network visualizations, abstract consciousness art

**Technology**: Three.js, React, Tailwind CSS, BroadcastChannel API

## License

MIT License - Feel free to fork, modify, and extend this project.

---

**Experience consciousness as a distributed phenomenon. Open multiple windows and watch a digital lifeform emerge.**
