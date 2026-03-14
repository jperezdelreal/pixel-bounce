// Room.js — Room state management for multiplayer matches

const ROOM_STATES = {
  WAITING: 'waiting',
  STARTING: 'starting',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

const MAX_PLAYERS = 4;
const COUNTDOWN_DURATION = 3;

class Room {
  constructor(code, creatorId) {
    this.code = code;
    this.creatorId = creatorId;
    this.state = ROOM_STATES.WAITING;
    this.players = new Map(); // playerId -> { id, name, ready, socketId, score?, finishTime? }
    this.countdownTimer = null;
    this.seed = null;
    this.createdAt = Date.now();
  }

  addPlayer(playerId, playerName, socketId) {
    if (this.players.size >= MAX_PLAYERS) {
      return { success: false, error: 'Room is full' };
    }
    
    if (this.state !== ROOM_STATES.WAITING) {
      return { success: false, error: 'Game already in progress' };
    }

    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      ready: false,
      socketId: socketId,
      score: 0,
      finishTime: null
    });

    return { success: true };
  }

  removePlayer(playerId) {
    const removed = this.players.delete(playerId);
    
    // Cancel countdown if someone leaves during start
    if (this.state === ROOM_STATES.STARTING && this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
      this.state = ROOM_STATES.WAITING;
    }

    return removed;
  }

  toggleReady(playerId) {
    const player = this.players.get(playerId);
    if (!player) return false;

    player.ready = !player.ready;
    return true;
  }

  allReady() {
    if (this.players.size < 2) return false;
    for (let player of this.players.values()) {
      if (!player.ready) return false;
    }
    return true;
  }

  startCountdown(onCountdown, onStart) {
    if (this.state !== ROOM_STATES.WAITING) return false;
    if (!this.allReady()) return false;

    this.state = ROOM_STATES.STARTING;
    let countdown = COUNTDOWN_DURATION;

    onCountdown(countdown);

    this.countdownTimer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        onCountdown(countdown);
      } else {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.startRace();
        onStart();
      }
    }, 1000);

    return true;
  }

  startRace() {
    this.state = ROOM_STATES.PLAYING;
    this.seed = Math.floor(Math.random() * 1000000);
  }

  finishRace() {
    this.state = ROOM_STATES.FINISHED;
  }

  isEmpty() {
    return this.players.size === 0;
  }

  getPlayerList() {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      ready: p.ready,
      score: p.score || 0,
      finishTime: p.finishTime
    }));
  }

  toJSON() {
    return {
      code: this.code,
      state: this.state,
      players: this.getPlayerList(),
      seed: this.seed,
      maxPlayers: MAX_PLAYERS
    };
  }
}

module.exports = { Room, ROOM_STATES, MAX_PLAYERS };
