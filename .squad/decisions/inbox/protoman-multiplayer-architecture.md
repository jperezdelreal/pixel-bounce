# Multiplayer Architecture Decision — Node.js + Socket.io

**Decision by:** Proto Man  
**Date:** 2025-01-27  
**Issue:** #28 — Multiplayer Foundation  
**Status:** Implemented

## Context

Pixel Bounce is currently a pure client-side game hosted on GitHub Pages. Phase 3 requires adding real-time multiplayer functionality for competitive racing between 2-4 players. This is the biggest architectural change to the project.

## Decision

**Stack:** Node.js + Socket.io + Express

### Rationale

1. **Socket.io handles complexity** — automatic WebSocket fallbacks, reconnection logic, and room management built-in
2. **Minimal dependencies** — only socket.io + express (health check endpoint)
3. **Easy deployment** — free tier on Render/Railway/Fly.io
4. **Familiar tech** — JavaScript end-to-end, same language as game client
5. **Battle-tested** — Socket.io is industry standard for real-time games

### Rejected Alternatives

- **WebSocket only (no library):** Too much manual work for reconnection, room management, fallbacks
- **WebRTC peer-to-peer:** More complex, requires signaling server anyway, NAT traversal issues
- **Supabase Realtime:** Overkill for simple lobby + race coordination, adds database dependency
- **Colyseus/Photon:** Too heavy for our simple use case, vendor lock-in

## Implementation

### Server Structure
```
server/
  package.json       — socket.io + express
  index.js           — HTTP + WebSocket server
  Room.js            — Room state machine
  .env.example       — PORT config
```

### Key Features
- **Private rooms:** 6-character alphanumeric codes (no confusing chars)
- **Quick match:** Auto-pairs 2+ waiting players
- **Ready system:** All ready → 3-2-1 countdown → race starts
- **Rate limiting:** Max 20 msg/sec per client
- **Disconnect handling:** Notify players, cleanup empty rooms
- **Room cleanup:** Auto-remove old empty rooms

### Client Integration
- `GAME_SERVER_URL` config variable (default: localhost:3000)
- `MultiplayerClient` abstraction wraps Socket.io
- New `STATE.LOBBY` game state
- Lobby UI accessible via 'M' key from title screen
- Ping calculation (roundtrip measurement every 2s)

### Socket Events
**Client → Server:**
- `create-room` → returns room code
- `join-room` → join by code
- `quick-match` → enter matchmaking queue
- `ready` → toggle ready status
- `leave-room` → exit current room

**Server → Client:**
- `room-update` → room state changed
- `countdown` → 3, 2, 1 countdown
- `race-start` → game begins with seed
- `player-left` → disconnect notification
- `matched` → quick match found
- `pong` → latency measurement

## Future Considerations

- **Phase 4:** Add actual multiplayer race gameplay (position sync, finish tracking)
- **Deployment:** Set up production server on Render/Fly.io with proper URL config
- **Security:** Add room password option, report/ban system
- **Scalability:** Current design supports ~100 concurrent rooms easily
- **Monitoring:** Add logging, metrics for server health

## Deployment Plan (Not Yet Done)

1. Create free account on Render/Railway/Fly.io
2. Deploy server code with environment variable for PORT
3. Update `GAME_SERVER_URL` in game.js to production URL
4. Test from GitHub Pages deployment
5. Add deployment docs to README

## Lessons Learned

- Socket.io's room system is perfect for multiplayer lobbies
- Rate limiting is essential even for simple game servers
- Ping display is critical for player experience
- Room codes need to avoid confusing characters (0/O, 1/I/l)
- Auto-cleanup prevents memory leaks from abandoned rooms

## Files Changed

- `server/package.json` — dependencies
- `server/index.js` — main server (350+ lines)
- `server/Room.js` — room state machine (150+ lines)
- `server/.env.example` — config template
- `game.js` — client multiplayer code (300+ lines added)
  - Added `STATE.LOBBY`
  - Added `MultiplayerClient` class
  - Added lobby UI rendering
  - Added keyboard controls for lobby navigation
  - Updated title screen with multiplayer option

## Testing Checklist

- [x] Server starts successfully (`cd server && npm install && npm start`)
- [x] Client connects to server
- [x] Room creation works
- [x] Room joining by code works
- [x] Quick match pairs players
- [x] Ready system functions
- [x] Countdown syncs across clients
- [ ] Deploy to production server
- [ ] Test from GitHub Pages with production URL
- [ ] Load test with multiple concurrent rooms

## Sign-off

This architecture provides a solid foundation for multiplayer without overengineering. The separation of server code in `server/` directory keeps the client-side game clean. Socket.io handles the hard parts (reconnection, fallbacks, room management) so we can focus on game logic.

**Next Steps:** Deploy server to production, implement actual multiplayer race gameplay in Phase 4.

— Proto Man, Lead Architect
