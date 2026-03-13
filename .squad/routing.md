# Routing Rules — Pixel Bounce

## How Work Gets Assigned

### Proto Man — Lead / Architect
- Architecture decisions and structural changes
- Code review and PR approval
- Roadmap scoping and feature design
- Cross-cutting concerns (performance, build, deployment)
- **Labels:** `squad:protoman`

### Cut Man — Game Developer
- Gameplay mechanics (physics, collision, movement)
- Canvas API rendering and animation
- Player controls (keyboard, touch)
- Platform behavior, collectibles, scoring
- Game loop and state management
- **Labels:** `squad:cutman`

### Guts Man — Tester / QA
- Writing and maintaining tests
- Edge case identification
- Quality gates and regression checks
- Bug reproduction and validation
- Performance testing
- **Labels:** `squad:gutsman`

### @copilot — Coding Agent
- Simple, well-defined issues with clear acceptance criteria
- Single-file changes or small scoped tasks
- Bug fixes with clear reproduction steps
- Documentation updates
- **Labels:** `squad:copilot`
- **Auto-assign:** Issues labeled `squad:copilot` are auto-assigned

### Scribe — Session Logger
- Session log creation and updates
- Decision documentation
- Context handoff between sessions
- **Labels:** `squad:scribe`

## Escalation
- If an issue spans multiple domains → route to **Proto Man** for scoping
- If a gameplay issue needs tests → **Cut Man** implements, **Guts Man** reviews
- If @copilot fails or produces incomplete work → escalate to **Cut Man** or **Proto Man**
