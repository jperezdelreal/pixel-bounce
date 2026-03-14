// Pixel Bounce Multiplayer Server
// WebSocket server for lobby system and multiplayer matches

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Room, ROOM_STATES } = require('./Room');

const PORT = process.env.PORT || 3000;
const app = express();
const httpServer = createServer(app);

// CORS configuration for Socket.io
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:8080', 'http://127.0.0.1:8080'];

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST']
  }
});

// State
const rooms = new Map(); // roomCode -> Room
const quickMatchQueue = new Set(); // Set of socketIds waiting for quick match
const playerRooms = new Map(); // socketId -> roomCode
const playerData = new Map(); // socketId -> { id, name }

// Rate limiting
const messageRates = new Map(); // socketId -> { count, resetTime }
const RATE_LIMIT = 20; // messages per second
const RATE_WINDOW = 1000; // 1 second

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Pixel Bounce Server');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    players: playerData.size,
    queueing: quickMatchQueue.size,
    uptime: process.uptime()
  });
});

// Generate 6-character alphanumeric room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
}

// Rate limiting check
function checkRateLimit(socketId) {
  const now = Date.now();
  const rateData = messageRates.get(socketId);
  
  if (!rateData || now > rateData.resetTime) {
    messageRates.set(socketId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (rateData.count >= RATE_LIMIT) {
    return false;
  }
  
  rateData.count++;
  return true;
}

// Clean up empty rooms periodically
setInterval(() => {
  for (const [code, room] of rooms.entries()) {
    if (room.isEmpty() && Date.now() - room.createdAt > 60000) { // 1 minute old
      rooms.delete(code);
      console.log(`[CLEANUP] Removed empty room: ${code}`);
    }
  }
}, 30000); // Check every 30 seconds

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[CONNECT] ${socket.id}`);

  // Initialize player data
  playerData.set(socket.id, {
    id: socket.id,
    name: `Player${Math.floor(Math.random() * 9999)}`
  });

  // Ping/pong for latency measurement
  socket.on('ping', () => {
    socket.emit('pong', { serverTime: Date.now() });
  });

  // Create a new room
  socket.on('create-room', (data, callback) => {
    if (!checkRateLimit(socket.id)) {
      return callback({ success: false, error: 'Rate limit exceeded' });
    }

    // Leave any existing room first
    leaveCurrentRoom(socket);

    const code = generateRoomCode();
    const player = playerData.get(socket.id);
    
    if (data && data.name) {
      player.name = data.name.substring(0, 20); // Max 20 chars
    }

    const room = new Room(code, socket.id);
    room.addPlayer(player.id, player.name, socket.id);
    rooms.set(code, room);
    playerRooms.set(socket.id, code);

    socket.join(code);
    
    console.log(`[CREATE] Room ${code} by ${player.name}`);
    
    callback({ success: true, roomCode: code });
    broadcastRoomUpdate(code);
  });

  // Join room by code
  socket.on('join-room', (data, callback) => {
    if (!checkRateLimit(socket.id)) {
      return callback({ success: false, error: 'Rate limit exceeded' });
    }

    const { roomCode, name } = data;
    const room = rooms.get(roomCode?.toUpperCase());

    if (!room) {
      return callback({ success: false, error: 'Room not found' });
    }

    // Leave any existing room first
    leaveCurrentRoom(socket);

    const player = playerData.get(socket.id);
    if (name) {
      player.name = name.substring(0, 20);
    }

    const result = room.addPlayer(player.id, player.name, socket.id);
    
    if (!result.success) {
      return callback(result);
    }

    playerRooms.set(socket.id, roomCode.toUpperCase());
    socket.join(roomCode.toUpperCase());

    console.log(`[JOIN] ${player.name} joined room ${roomCode.toUpperCase()}`);

    callback({ success: true, roomCode: roomCode.toUpperCase() });
    broadcastRoomUpdate(roomCode.toUpperCase());
  });

  // Quick match - join matchmaking queue
  socket.on('quick-match', (data, callback) => {
    if (!checkRateLimit(socket.id)) {
      return callback({ success: false, error: 'Rate limit exceeded' });
    }

    // Leave any existing room first
    leaveCurrentRoom(socket);

    const player = playerData.get(socket.id);
    if (data && data.name) {
      player.name = data.name.substring(0, 20);
    }

    quickMatchQueue.add(socket.id);
    console.log(`[QUEUE] ${player.name} entered quick match (${quickMatchQueue.size} waiting)`);

    callback({ success: true, message: 'Searching for match...' });

    // Try to form a room with waiting players
    tryMatchmaking();
  });

  // Toggle ready status
  socket.on('ready', (data, callback) => {
    if (!checkRateLimit(socket.id)) {
      return callback({ success: false, error: 'Rate limit exceeded' });
    }

    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) {
      return callback({ success: false, error: 'Not in a room' });
    }

    const room = rooms.get(roomCode);
    if (!room) {
      return callback({ success: false, error: 'Room not found' });
    }

    room.toggleReady(socket.id);
    callback({ success: true });
    broadcastRoomUpdate(roomCode);

    // Check if all players are ready
    if (room.allReady() && room.state === ROOM_STATES.WAITING) {
      room.startCountdown(
        (seconds) => {
          io.to(roomCode).emit('countdown', { seconds });
        },
        () => {
          io.to(roomCode).emit('race-start', {
            seed: room.seed,
            players: room.getPlayerList()
          });
          console.log(`[START] Race started in room ${roomCode}`);
          startRaceGameLoop(roomCode, room);
        }
      );
    }
  });

  // Player state updates during race
  socket.on('player-state', (data) => {
    if (!checkRateLimit(socket.id)) return;

    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room || room.state !== ROOM_STATES.PLAYING) return;

    room.updatePlayerState(socket.id, data);
  });

  // Rematch request
  socket.on('rematch', () => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room || room.state !== ROOM_STATES.FINISHED) return;

    room.resetForRematch();
    broadcastRoomUpdate(roomCode);
    console.log(`[REMATCH] Room ${roomCode} reset for rematch`);
  });

  // Leave current room
  socket.on('leave-room', (data, callback) => {
    const success = leaveCurrentRoom(socket);
    callback({ success });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] ${socket.id}`);
    
    // Remove from quick match queue
    quickMatchQueue.delete(socket.id);

    // Leave room and notify others
    const roomCode = playerRooms.get(socket.id);
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        const player = playerData.get(socket.id);
        
        // Mark player as disconnected in race
        if (room.state === ROOM_STATES.PLAYING) {
          const playerInRoom = room.players.get(socket.id);
          if (playerInRoom) {
            playerInRoom.alive = false;
            playerInRoom.name += ' (DC)';
          }
        }
        
        room.removePlayer(socket.id);
        
        io.to(roomCode).emit('player-left', {
          playerId: socket.id,
          playerName: player?.name || 'Player'
        });

        if (room.isEmpty()) {
          // Clean up race timers before deleting room
          if (room.gameStateTimer) clearInterval(room.gameStateTimer);
          if (room.raceInterval) clearInterval(room.raceInterval);
          rooms.delete(roomCode);
          console.log(`[REMOVE] Empty room ${roomCode} deleted`);
        } else {
          broadcastRoomUpdate(roomCode);
        }
      }
      playerRooms.delete(socket.id);
    }

    // Cleanup
    playerData.delete(socket.id);
    messageRates.delete(socket.id);
  });
});

// Helper: Leave current room
function leaveCurrentRoom(socket) {
  const roomCode = playerRooms.get(socket.id);
  if (!roomCode) return false;

  const room = rooms.get(roomCode);
  if (!room) {
    playerRooms.delete(socket.id);
    return false;
  }

  const player = playerData.get(socket.id);
  room.removePlayer(socket.id);
  socket.leave(roomCode);
  playerRooms.delete(socket.id);

  console.log(`[LEAVE] ${player?.name || socket.id} left room ${roomCode}`);

  // Notify others
  io.to(roomCode).emit('player-left', {
    playerId: socket.id,
    playerName: player?.name || 'Player'
  });

  // Clean up empty room
  if (room.isEmpty()) {
    rooms.delete(roomCode);
    console.log(`[REMOVE] Empty room ${roomCode} deleted`);
  } else {
    broadcastRoomUpdate(roomCode);
  }

  return true;
}

// Helper: Broadcast room update to all players in room
function broadcastRoomUpdate(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  io.to(roomCode).emit('room-update', room.toJSON());
}

// Helper: Try to match waiting players
function tryMatchmaking() {
  if (quickMatchQueue.size < 2) return;

  // Take up to 4 players from queue
  const matched = Array.from(quickMatchQueue).slice(0, 4);
  
  // Create room for matched players
  const code = generateRoomCode();
  const firstPlayer = playerData.get(matched[0]);
  const room = new Room(code, matched[0]);
  rooms.set(code, room);

  console.log(`[MATCHMAKING] Creating room ${code} for ${matched.length} players`);

  // Add all matched players to room
  for (const socketId of matched) {
    const player = playerData.get(socketId);
    if (player) {
      room.addPlayer(player.id, player.name, socketId);
      playerRooms.set(socketId, code);
      
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(code);
        socket.emit('matched', { roomCode: code });
      }

      quickMatchQueue.delete(socketId);
    }
  }

  broadcastRoomUpdate(code);
}

// Game loop for race mode
function startRaceGameLoop(roomCode, room) {
  // Broadcast game state at 20Hz (every 50ms)
  room.gameStateTimer = setInterval(() => {
    const gameState = room.getGameState();
    io.to(roomCode).emit('game-state', gameState);
    
    // Check if race should end
    if (room.checkRaceEnd()) {
      endRace(roomCode, room);
    }
  }, 50);
  
  // Race timer countdown (every second)
  room.raceInterval = setInterval(() => {
    room.raceTimer--;
    if (room.raceTimer <= 0) {
      room.raceTimer = 0;
    }
  }, 1000);
}

function endRace(roomCode, room) {
  console.log(`[END] Race ended in room ${roomCode}`);
  
  room.finishRace();
  const rankings = room.getRankings();
  
  io.to(roomCode).emit('race-end', { rankings });
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Pixel Bounce Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
