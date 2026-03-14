# Ceremonies — Pixel Bounce

## Design Review
- **Trigger:** Manual (on demand)
- **Lead:** Proto Man
- **Participants:** Cut Man, Guts Man
- **Purpose:** Review proposed architecture or feature designs before implementation
- **Process:**
  1. Proto Man presents the design or delegates presentation
  2. Cut Man evaluates implementation feasibility
  3. Guts Man identifies testability concerns and edge cases
  4. Decision recorded in `.squad/decisions.md`

---

## Sprint Planning

| Field | Value |
|-------|-------|
| **Trigger** | auto |
| **When** | before |
| **Condition** | board clear — no open issues with label `squad` |
| **Facilitator** | lead |
| **Participants** | lead-only |
| **Time budget** | focused |
| **Enabled** | ✅ yes |

**Agenda:**
1. Read recent closed issues, merged PRs, roadmap.md, README.md, and .squad/decisions.md
2. Analyze project state holistically — what's been done, what's missing, what's next
3. Create N issues (2-7) that advance the project organically
4. Anti-repetition check: do NOT recreate issues that were recently closed or are duplicates
5. If project has reached a natural endpoint, declare "🏁 Natural endpoint" instead of creating issues
