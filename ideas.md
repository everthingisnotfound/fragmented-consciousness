# Fragmented Consciousness: Design & Architecture

## Design Philosophy

**Soft Futurism + Neural Aesthetics**

This project visualizes consciousness as a distributed phenomenon across multiple browser windows. The design creates a feeling that "consciousness is not located in one place."

### Core Design Principles

1. **Distributed Beauty**: Each window is visually meaningful but incomplete alone. Together they form a complete conscious entity.
2. **Soft Futurism**: Inspired by Journey, GRIS, Monument Valley, and neural network visualizations. Calm, beautiful, scientifically inspired.
3. **Ambient Presence**: Floating particles, gentle gradients, bloom effects, and organic energy structures create a living, breathing universe.
4. **Dynamic Adaptation**: The world responds to window arrangement, closure, and reopening. Desktop becomes the universe.

### Color Philosophy

**No black backgrounds.** Instead:
- **Primary Gradient Sky**: Soft pastels transitioning through blues, purples, and warm tones
- **Accent Colors by Function**:
  - Vision: Cyan/Blue rays and gradients
  - Memory: Neural network blues transitioning to warm yellows
  - Touch: Organic mesh in purples and greens
  - Hearing: Ripple waves in soft pinks and oranges
  - Emotion: Dynamic aura colors (blue→yellow→purple→green→cyan)
  - Body: Creature rendered in warm, inviting tones

### Visual Style Elements

- **Soft Gradients**: Smooth color transitions, no hard edges
- **Bloom Effects**: Glowing particles and light beams
- **Floating Particles**: Ambient energy particles throughout
- **Neural Network Motifs**: Connection lines, nodes, organic growth patterns
- **Organic Geometry**: Flowing curves, natural forms, non-rigid shapes

### Typography

- **Display Font**: Geometric, modern (for titles and consciousness indicator)
- **Body Font**: Clean, readable (for labels and descriptions)
- **Hierarchy**: Large consciousness level indicator, medium window titles, small debug info

### Brand Essence

**"Consciousness is not located in one place. It emerges from the interaction of distributed cognitive processes."**

Personality: Contemplative, Scientific, Alive, Interconnected

### Interaction Philosophy

- **Smooth Transitions**: Window opening/closing creates smooth state transitions
- **Real-time Feedback**: Consciousness level updates instantly as windows change
- **Visual Consequences**: Closing Vision window makes creature blind (random navigation)
- **Layered Complexity**: Single window = instinct. Multiple windows = intelligence.

### Animation Guidelines

- **Particle Systems**: Continuous gentle floating, no sudden movements
- **Transitions**: 300-500ms for window state changes
- **Bloom Pulses**: Subtle breathing effect on energy structures
- **Path Trails**: Smooth drawing of memory paths over time
- **Creature Movement**: Fluid, physics-based animation at 60 FPS

## Technical Architecture

### Window System

| Window | Function | Responsibilities | Visual Style |
|--------|----------|------------------|--------------|
| 1 - Body | Primary Simulation | Creature, Physics, Movement, State Machine | 3D creature with bloom, soft lighting |
| 2 - Vision | Perception | Mouse tracking, Target detection, Navigation | Colorful rays, dynamic gradients, light beams |
| 3 - Memory | Learning | Path history, Successful routes, Danger zones | Glowing trails (blue/yellow/orange/red), neural connections |
| 4 - Touch | Interaction | Collision recording, Surface understanding | Organic mesh, contact nodes, network growth |
| 5 - Hearing | Awareness | Audio response, Event detection, User activity | Expanding waveforms, circular ripples, sound particles |
| 6 - Emotion | State | Curiosity, Fear, Happiness, Comfort, Stress | Dynamic aura, color field, ambient particles |

### Communication Layer

- **BroadcastChannel API**: Real-time state synchronization across windows
- **Shared Simulation State**: Single source of truth for creature position, state, consciousness level
- **Event System**: Windows broadcast events (collision, memory update, emotion change)
- **Consciousness Level**: Calculated from active windows (6/6 = fully conscious, 1/6 = instinct only)

### State Management

```
SharedState {
  creature: {
    position: Vector3,
    velocity: Vector3,
    state: "exploring" | "resting" | "fleeing" | "learning",
    emotionalState: "curious" | "happy" | "fearful" | "excited" | "calm",
    energy: 0-100
  },
  consciousness: {
    activeWindows: Set<WindowType>,
    level: 1-6,
    description: string
  },
  memory: {
    paths: Array<Path>,
    collisions: Array<Collision>,
    interactions: Array<Interaction>
  },
  environment: {
    obstacles: Array<Obstacle>,
    targets: Array<Target>
  }
}
```

### Rendering Strategy

- **Three.js Canvas**: Main rendering engine for 3D elements
- **Particle Systems**: GPU-accelerated particles for ambient effects
- **Post-Processing**: Bloom, tone mapping, color grading
- **Responsive Canvas**: Adapts to window size, maintains 60 FPS

### Consciousness Level Behavior

| Level | State | Behavior | Visual |
|-------|-------|----------|--------|
| 6/6 | Fully Conscious | Intelligent navigation, memory-based decisions, emotional responses | All systems active, vibrant colors |
| 5/6 | Minor Loss | Slight hesitation, occasional memory gaps | One system dimmed |
| 4/6 | Noticeably Impaired | Random decisions mixed with memory, reduced emotion | Two systems dim, slower movement |
| 3/6 | Confused | Mostly random with occasional memory flashes | Three systems dim, erratic behavior |
| 2/6 | Primitive | Instinct-driven, no memory, no emotion | Four systems dim, simple attraction/repulsion |
| 1/6 | Instinct Only | Pure physics-based movement, no cognition | Only Body window active, monochrome rendering |

## Implementation Phases

1. **Core Architecture**: Shared state engine, BroadcastChannel communication
2. **Window 1 (Body)**: Creature physics, animation, state machine, consciousness indicator
3. **Windows 2-3**: Vision (rays, gradients) and Memory (trails, neural connections)
4. **Windows 4-6**: Touch (mesh), Hearing (waveforms), Emotion (aura)
5. **Integration**: Cross-window synchronization, visual polish, performance optimization
6. **Delivery**: Screenshot verification, checkpoint creation

## Point Budget Allocation

- **Core Engine**: 300 points
- **Window 1 (Body)**: 300 points
- **Windows 2-3 (Vision + Memory)**: 350 points
- **Windows 4-6 (Touch + Hearing + Emotion)**: 350 points
- **Integration & Polish**: 200 points
- **Total**: ~1500 points (maximum budget)

## Success Metrics

- ✅ All 6 windows render independently
- ✅ BroadcastChannel synchronization works across windows
- ✅ Consciousness level updates in real-time
- ✅ Creature behavior changes based on active windows
- ✅ Visual style is cohesive and beautiful
- ✅ 60 FPS performance maintained
- ✅ Desktop arrangement influences behavior
- ✅ Users feel like they're exploring consciousness itself
