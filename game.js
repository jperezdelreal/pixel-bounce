// Pixel Bounce — HTML5 Canvas Arcade Game
// Built by Syntax Sorcery Pipeline
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = 400;
const H = 600;
canvas.width = W;
canvas.height = H;

// Multiplayer server configuration
const GAME_SERVER_URL = 'http://localhost:3000';

const STATE = { TITLE: 0, PLAY: 1, OVER: 2, DAILY: 3, EDITOR: 4, GALLERY: 5, LOBBY: 6 };
let state = STATE.TITLE;
let score = 0;
let highScore = parseInt(localStorage.getItem('pb_hi') || '0', 10);
let stars = [];
let platforms = [];
let particles = [];
let powerups = [];
let activePower = null; // { type, timer }
let cameraY = 0;
let maxHeight = 0;

// --- Level Editor State ---
let editorLevel = { platforms: [], stars: [], spawn: { x: W / 2, y: H - 100 } };
let editorTool = 'normal'; // normal, bouncy, breakable, portal, star, spawn, delete
let editorHistory = []; // undo/redo stack
let editorHistoryIndex = -1;
let isPreviewMode = false;
const EDITOR_TOOLS = ['normal', 'bouncy', 'breakable', 'portal', 'star', 'spawn', 'delete'];
const GRID_SIZE = 20;
let editorToast = null; // { text, timer, type: 'success'|'error' }
let showImportModal = false;
let importInput = '';
let showMetadataModal = false;
let metadataInputs = { name: '', description: '', difficulty: 'Medium', tags: '' };
let metadataFocusField = 'name'; // name, description, tags

// --- Community Gallery State ---
let galleryLevels = [];
let gallerySort = 'recent'; // recent, popular, top-rated
let galleryScroll = 0;
let selectedGalleryLevel = null;
let showRatingModal = false;
let pendingRating = 0;
let communityLevelId = null;
let isPlayingCommunityLevel = false;

// --- Leaderboard State ---
let showLeaderboard = false;
let leaderboardLevelId = null;
let leaderboardScores = [];
let showNamePrompt = false;
let nameInput = '';
let currentScore = 0;
let currentScoreHighlighted = false;

// --- Persistent Stats & Skins ---
const defaultStats = { totalStars: 0, totalGames: 0, totalDeaths: 0, bestScore: 0 };
let stats = JSON.parse(localStorage.getItem('pb_stats') || JSON.stringify(defaultStats));
let selectedSkin = parseInt(localStorage.getItem('pb_skin') || '0', 10);
let runStars = 0;

const SKINS = [
  { name: 'Classic', hint: 'Default', unlock: () => true,
    draw(cx, x, y, r) {
      const g = cx.createRadialGradient(x - 2, y - 2, 1, x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#e94560'); g.addColorStop(1, '#c81e45');
      cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
    }},
  { name: 'Neon Green', hint: 'Score 200+', unlock: () => stats.bestScore >= 200,
    draw(cx, x, y, r) {
      cx.shadowColor = '#00ff88'; cx.shadowBlur = 18;
      cx.fillStyle = '#00ff88'; cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
      cx.shadowBlur = 0;
    }},
  { name: 'Gold', hint: '50 stars total', unlock: () => stats.totalStars >= 50,
    draw(cx, x, y, r) {
      const g = cx.createRadialGradient(x - 2, y - 2, 1, x, y, r);
      g.addColorStop(0, '#fff8dc'); g.addColorStop(0.5, '#ffd700'); g.addColorStop(1, '#b8860b');
      cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
    }},
  { name: 'Ice', hint: 'Score 500+', unlock: () => stats.bestScore >= 500,
    draw(cx, x, y, r) {
      const g = cx.createRadialGradient(x - 2, y - 2, 1, x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#88ddff'); g.addColorStop(1, '#0088cc');
      cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
    }},
  { name: 'Shadow', hint: 'Play 10 games', unlock: () => stats.totalGames >= 10,
    draw(cx, x, y, r) {
      cx.globalAlpha = 0.4; cx.fillStyle = '#6633aa';
      cx.beginPath(); cx.arc(x + 3, y + 3, r, 0, Math.PI * 2); cx.fill();
      cx.globalAlpha = 1; cx.fillStyle = '#9944ee';
      cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
    }},
  { name: 'Pixel', hint: 'Score 100 no stars', unlock: () => stats.bestScore >= 100,
    draw(cx, x, y, r) {
      cx.fillStyle = '#e94560'; cx.fillRect(x - r, y - r, r * 2, r * 2);
    }},
  { name: 'Rainbow', hint: 'Score 1000+', unlock: () => stats.bestScore >= 1000,
    draw(cx, x, y, r) {
      const hue = (Date.now() / 10) % 360;
      cx.fillStyle = `hsl(${hue}, 100%, 60%)`;
      cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
    }},
  { name: 'Ghost', hint: 'Die 25 times', unlock: () => stats.totalDeaths >= 25,
    draw(cx, x, y, r) {
      cx.globalAlpha = 0.15; cx.fillStyle = '#ffffff';
      cx.beginPath(); cx.arc(x - 4, y, r, 0, Math.PI * 2); cx.fill();
      cx.globalAlpha = 0.4; cx.fillStyle = '#ccccff';
      cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
      cx.globalAlpha = 1;
    }},
];

function saveStats() { localStorage.setItem('pb_stats', JSON.stringify(stats)); }

// --- Achievements ---
let unlockedAchievements = JSON.parse(localStorage.getItem('pb_achievements') || '[]');
let runBounces = 0;
let runStartTime = 0;
let achievementToast = null; // { text, timer }
let showAchievementOverlay = false;

const ACHIEVEMENTS = [
  { id: 'first_steps', name: 'First Steps', icon: '🐣', check: () => score >= 50 },
  { id: 'sky_climber', name: 'Sky Climber', icon: '⛰️', check: () => score >= 500 },
  { id: 'star_collector', name: 'Star Collector', icon: '⭐', check: () => runStars >= 10 },
  { id: 'star_hoarder', name: 'Star Hoarder', icon: '🌟', check: () => stats.totalStars >= 50 },
  { id: 'bouncy_castle', name: 'Bouncy Castle', icon: '🏰', check: () => runBounces >= 100 },
  { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', check: () => score >= 200 && (Date.now() - runStartTime) < 60000 },
  { id: 'untouchable', name: 'Untouchable', icon: '🛡️', check: () => score >= 300 && runStars === 0 },
  { id: 'marathon', name: 'Marathon', icon: '🏃', check: () => stats.totalGames >= 25 },
  { id: 'legend', name: 'Legend', icon: '👑', check: () => score >= 1000 },
  { id: 'perfectionist', name: 'Perfectionist', icon: '💎',
    check: () => ACHIEVEMENTS.filter(a => a.id !== 'perfectionist').every(a => unlockedAchievements.includes(a.id)) },
];

function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (!unlockedAchievements.includes(a.id) && a.check()) {
      unlockedAchievements.push(a.id);
      achievementToast = { text: a.icon + ' ' + a.name + ' unlocked!', timer: 180 };
      playTone(1000, 0.1, 'sine', 0.15);
      setTimeout(() => playTone(1200, 0.15, 'sine', 0.12), 100);
    }
  }
  localStorage.setItem('pb_achievements', JSON.stringify(unlockedAchievements));
}

// --- Multiplayer State ---
let multiplayerClient = null;
let lobbyState = 'menu'; // menu, creating, joining, in-room, quick-match
let currentRoom = null; // { code, players: [], state }
let roomCodeInput = '';
let playerNameInput = localStorage.getItem('pb_player_name') || '';
let serverPing = 0;
let lastPingTime = 0;
let isReady = false;
let countdownValue = 0;
let lobbyError = null;

// MultiplayerClient - Socket.io wrapper
class MultiplayerClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.pingInterval = null;
  }

  connect() {
    if (this.socket) return;
    
    // Load socket.io from CDN
    if (typeof io === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
      script.onload = () => this.initSocket();
      document.head.appendChild(script);
    } else {
      this.initSocket();
    }
  }

  initSocket() {
    this.socket = io(GAME_SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupSocketListeners();
    this.startPing();
  }

  setupSocketListeners() {
    if (!this.socket) return;

    // Remove any existing listeners first to prevent memory leaks
    this.socket.off('connect');
    this.socket.off('disconnect');
    this.socket.off('connect_error');
    this.socket.off('room-update');
    this.socket.off('countdown');
    this.socket.off('race-start');
    this.socket.off('player-left');
    this.socket.off('matched');
    this.socket.off('error');
    this.socket.off('pong');

    // Add fresh listeners
    this.socket.on('connect', () => {
      console.log('[MP] Connected to server');
      this.connected = true;
      lobbyError = null;
    });

    this.socket.on('disconnect', () => {
      console.log('[MP] Disconnected from server');
      this.connected = false;
      lobbyError = 'Disconnected from server';
      this.cleanup();
    });

    this.socket.on('connect_error', (err) => {
      console.log('[MP] Connection error:', err.message);
      this.connected = false;
      lobbyError = 'Cannot connect to server';
    });

    this.socket.on('room-update', (data) => {
      currentRoom = data;
      isReady = data.players.find(p => p.id === this.socket.id)?.ready || false;
    });

    this.socket.on('countdown', (data) => {
      countdownValue = data.seconds;
      playTone(800, 0.05, 'square', 0.1);
    });

    this.socket.on('race-start', (data) => {
      console.log('[MP] Race starting!', data);
      countdownValue = 0;
      // TODO: Start multiplayer race with seed
      playTone(1200, 0.1, 'sine', 0.15);
    });

    this.socket.on('player-left', (data) => {
      console.log('[MP] Player left:', data.playerName);
    });

    this.socket.on('matched', (data) => {
      console.log('[MP] Matched! Room:', data.roomCode);
      lobbyState = 'in-room';
    });

    this.socket.on('error', (data) => {
      console.log('[MP] Error:', data.message);
      lobbyError = data.message;
    });

    this.socket.on('pong', (data) => {
      serverPing = Date.now() - lastPingTime;
    });
  }

  startPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.pingInterval = setInterval(() => {
      if (this.connected) {
        lastPingTime = Date.now();
        this.socket.emit('ping');
      }
    }, 2000);
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  cleanup() {
    this.stopPing();
    if (this.socket) {
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('connect_error');
      this.socket.off('room-update');
      this.socket.off('countdown');
      this.socket.off('race-start');
      this.socket.off('player-left');
      this.socket.off('matched');
      this.socket.off('error');
      this.socket.off('pong');
    }
  }

  disconnect() {
    this.cleanup();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  createRoom(name) {
    if (!this.socket) return;
    this.socket.emit('create-room', { name }, (response) => {
      if (response.success) {
        lobbyState = 'in-room';
        lobbyError = null;
      } else {
        lobbyError = response.error;
      }
    });
  }

  joinRoom(code, name) {
    if (!this.socket) return;
    this.socket.emit('join-room', { roomCode: code, name }, (response) => {
      if (response.success) {
        lobbyState = 'in-room';
        lobbyError = null;
      } else {
        lobbyError = response.error;
      }
    });
  }

  quickMatch(name) {
    if (!this.socket) return;
    this.socket.emit('quick-match', { name }, (response) => {
      if (response.success) {
        lobbyState = 'quick-match';
        lobbyError = null;
      } else {
        lobbyError = response.error;
      }
    });
  }

  toggleReady() {
    if (!this.socket) return;
    this.socket.emit('ready', {}, (response) => {
      if (!response.success) {
        lobbyError = response.error;
      }
    });
  }

  leaveRoom() {
    if (!this.socket) return;
    this.socket.emit('leave-room', {}, (response) => {
      lobbyState = 'menu';
      currentRoom = null;
      isReady = false;
      countdownValue = 0;
    });
    this.cleanup();
  }
}

// --- Daily Challenge ---
const DAILY_MODIFIERS = [
  { name: 'Heavy Gravity', icon: '🪨', apply: m => { m.gravity = 0.525; } },
  { name: 'Mega Bounce', icon: '🦘', apply: m => { m.bounceMul = 1.5; } },
  { name: 'Tiny Ball', icon: '🔬', apply: m => { m.ballRadius = 4; } },
  { name: 'Star Rain', icon: '🌧️', apply: m => { m.starRate = 0.8; } },
  { name: 'Narrow Platforms', icon: '📏', apply: m => { m.platformScale = 0.7; } },
  { name: 'Fast Platforms', icon: '💨', apply: m => { m.moveChance = 0.3; m.moveSpeed = 2; } },
];

let isDailyMode = false;
let dailyMods = { gravity: 0.35, bounceMul: 1, ballRadius: 8, starRate: 0.4, platformScale: 1, moveChance: 0.15, moveSpeed: 1 };
const defaultMods = { ...dailyMods };

function seededRandom(seed) {
  let s = seed;
  return function() { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// --- LevelAPI: Backend Abstraction Layer ---
const LevelAPI = {
  save(level) {
    const levels = this._getLevels();
    const id = 'lvl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const galleryLevel = {
      id,
      ...level,
      plays: 0,
      rating: 0,
      ratingCount: 0,
      created: new Date().toISOString()
    };
    levels.push(galleryLevel);
    localStorage.setItem('pixelbounce_gallery', JSON.stringify(levels));
    return id;
  },
  
  list(sort = 'recent') {
    const levels = this._getLevels();
    switch (sort) {
      case 'popular':
        return levels.sort((a, b) => b.plays - a.plays);
      case 'top-rated':
        return levels.sort((a, b) => b.rating - a.rating);
      case 'recent':
      default:
        return levels.sort((a, b) => new Date(b.created) - new Date(a.created));
    }
  },
  
  get(id) {
    const levels = this._getLevels();
    return levels.find(l => l.id === id);
  },
  
  rate(id, stars) {
    const levels = this._getLevels();
    const level = levels.find(l => l.id === id);
    if (level) {
      const ratedLevels = this._getRatedLevels();
      
      if (ratedLevels[id]) {
        // Already rated - update existing rating
        const oldRating = ratedLevels[id];
        const totalRating = level.rating * level.ratingCount - oldRating + stars;
        level.rating = totalRating / level.ratingCount;
      } else {
        // First time rating
        const totalRating = level.rating * level.ratingCount + stars;
        level.ratingCount++;
        level.rating = totalRating / level.ratingCount;
      }
      
      ratedLevels[id] = stars;
      localStorage.setItem('pixelbounce_rated', JSON.stringify(ratedLevels));
      localStorage.setItem('pixelbounce_gallery', JSON.stringify(levels));
    }
  },
  
  hasRated(id) {
    const ratedLevels = this._getRatedLevels();
    return !!ratedLevels[id];
  },
  
  _getRatedLevels() {
    try {
      const data = localStorage.getItem('pixelbounce_rated');
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Failed to parse rated levels data:', e);
      return {};
    }
  },
  
  incrementPlays(id) {
    const levels = this._getLevels();
    const level = levels.find(l => l.id === id);
    if (level) {
      level.plays++;
      localStorage.setItem('pixelbounce_gallery', JSON.stringify(levels));
    }
  },
  
  _getLevels() {
    try {
      const data = localStorage.getItem('pixelbounce_gallery');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to parse gallery data, returning empty array:', e);
      return [];
    }
  },
  
  _initDemoLevels() {
    if (this._getLevels().length > 0) return;
    
    const demos = [
      {
        version: 1,
        platforms: [
          { x: 160, y: 540, w: 80, h: 10, type: 'static', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 80, y: 470, w: 80, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 240, y: 400, w: 80, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 160, y: 330, w: 80, h: 10, type: 'portal', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 80, y: 260, w: 80, h: 10, type: 'moving', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 240, y: 190, w: 80, h: 10, type: 'static', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 160, y: 120, w: 80, h: 10, type: 'breakable', dir: 1, speed: 1.5, broken: false, pulse: 0 }
        ],
        stars: [
          { x: 120, y: 450, r: 5, pulse: 0, collected: false },
          { x: 280, y: 380, r: 5, pulse: 0, collected: false },
          { x: 120, y: 240, r: 5, pulse: 0, collected: false }
        ],
        spawn: { x: 200, y: 560 },
        metadata: { name: 'Skyward Bounce', description: 'Master all platform types in this vertical challenge!', difficulty: 'Medium', tags: ['tutorial', 'variety'], author: 'Proto Man', created: new Date().toISOString() }
      },
      {
        version: 1,
        platforms: [
          { x: 160, y: 540, w: 80, h: 10, type: 'static', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 40, y: 480, w: 60, h: 10, type: 'breakable', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 140, y: 480, w: 60, h: 10, type: 'breakable', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 240, y: 480, w: 60, h: 10, type: 'breakable', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 160, y: 420, w: 80, h: 10, type: 'static', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 80, y: 360, w: 80, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 240, y: 300, w: 80, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 160, y: 240, w: 80, h: 10, type: 'portal', dir: 1, speed: 1.5, broken: false, pulse: 0 }
        ],
        stars: [
          { x: 100, y: 500, r: 5, pulse: 0, collected: false },
          { x: 200, y: 500, r: 5, pulse: 0, collected: false },
          { x: 280, y: 500, r: 5, pulse: 0, collected: false },
          { x: 120, y: 340, r: 5, pulse: 0, collected: false },
          { x: 280, y: 280, r: 5, pulse: 0, collected: false }
        ],
        spawn: { x: 200, y: 560 },
        metadata: { name: 'Glass Gauntlet', description: 'Careful! These platforms break. Collect all stars on your way up.', difficulty: 'Hard', tags: ['precision', 'stars'], author: 'Cut Man', created: new Date().toISOString() }
      },
      {
        version: 1,
        platforms: [
          { x: 160, y: 540, w: 80, h: 10, type: 'static', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 60, y: 470, w: 70, h: 10, type: 'moving', dir: 1, speed: 2, broken: false, pulse: 0 },
          { x: 270, y: 410, w: 70, h: 10, type: 'moving', dir: -1, speed: 2, broken: false, pulse: 0 },
          { x: 60, y: 350, w: 70, h: 10, type: 'moving', dir: 1, speed: 2, broken: false, pulse: 0 },
          { x: 270, y: 290, w: 70, h: 10, type: 'moving', dir: -1, speed: 2, broken: false, pulse: 0 },
          { x: 160, y: 230, w: 80, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 200, y: 160, w: 80, h: 10, type: 'portal', dir: 1, speed: 1.5, broken: false, pulse: 0 }
        ],
        stars: [
          { x: 95, y: 450, r: 5, pulse: 0, collected: false },
          { x: 305, y: 390, r: 5, pulse: 0, collected: false },
          { x: 95, y: 330, r: 5, pulse: 0, collected: false },
          { x: 305, y: 270, r: 5, pulse: 0, collected: false }
        ],
        spawn: { x: 200, y: 560 },
        metadata: { name: 'Rhythm Rush', description: 'Time your jumps with moving platforms. Feel the rhythm!', difficulty: 'Hard', tags: ['moving', 'timing'], author: 'Guts Man', created: new Date().toISOString() }
      },
      {
        version: 1,
        platforms: [
          { x: 160, y: 540, w: 80, h: 10, type: 'static', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 100, y: 480, w: 90, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 210, y: 480, w: 90, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 160, y: 420, w: 80, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 100, y: 360, w: 90, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 210, y: 360, w: 90, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 160, y: 300, w: 80, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 160, y: 240, w: 100, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 160, y: 180, w: 120, h: 10, type: 'bouncy', dir: 1, speed: 1.5, broken: false, pulse: 0 }
        ],
        stars: [
          { x: 145, y: 500, r: 5, pulse: 0, collected: false },
          { x: 255, y: 500, r: 5, pulse: 0, collected: false },
          { x: 200, y: 440, r: 5, pulse: 0, collected: false },
          { x: 145, y: 380, r: 5, pulse: 0, collected: false },
          { x: 255, y: 380, r: 5, pulse: 0, collected: false },
          { x: 200, y: 320, r: 5, pulse: 0, collected: false },
          { x: 200, y: 260, r: 5, pulse: 0, collected: false },
          { x: 200, y: 200, r: 5, pulse: 0, collected: false }
        ],
        spawn: { x: 200, y: 560 },
        metadata: { name: 'Bounce Haven', description: 'Non-stop bouncing action. Go for the high score!', difficulty: 'Easy', tags: ['bouncy', 'fun'], author: 'Mega Man', created: new Date().toISOString() }
      },
      {
        version: 1,
        platforms: [
          { x: 160, y: 540, w: 80, h: 10, type: 'static', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 40, y: 470, w: 60, h: 10, type: 'portal', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 300, y: 410, w: 60, h: 10, type: 'static', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 100, y: 350, w: 60, h: 10, type: 'portal', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 280, y: 290, w: 60, h: 10, type: 'static', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 60, y: 230, w: 60, h: 10, type: 'portal', dir: 1, speed: 1.5, broken: false, pulse: 0 },
          { x: 180, y: 170, w: 60, h: 10, type: 'static', dir: 1, speed: 1.5, broken: false, pulse: 0 }
        ],
        stars: [
          { x: 70, y: 450, r: 5, pulse: 0, collected: false },
          { x: 330, y: 390, r: 5, pulse: 0, collected: false },
          { x: 130, y: 330, r: 5, pulse: 0, collected: false },
          { x: 310, y: 270, r: 5, pulse: 0, collected: false },
          { x: 90, y: 210, r: 5, pulse: 0, collected: false }
        ],
        spawn: { x: 200, y: 560 },
        metadata: { name: 'Portal Maze', description: 'Use portal platforms to teleport your way to the top!', difficulty: 'Expert', tags: ['portal', 'challenge'], author: 'Proto Man', created: new Date().toISOString() }
      }
    ];
    
    demos.forEach(demo => {
      const id = 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const galleryLevel = {
        id,
        ...demo,
        plays: Math.floor(Math.random() * 50) + 10,
        rating: 3.5 + Math.random() * 1.5,
        ratingCount: Math.floor(Math.random() * 20) + 5,
        created: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      this._getLevels().push(galleryLevel);
    });
    
    localStorage.setItem('pixelbounce_gallery', JSON.stringify(this._getLevels()));
  }
};

// --- ScoreAPI: localStorage-backed leaderboards (REST-ready interface) ---
const ScoreAPI = {
  submit(levelId, playerName, score) {
    if (!levelId || score === undefined || score === null) return;
    
    const scores = this._getScores();
    if (!scores[levelId]) scores[levelId] = [];
    
    // Sanitize player name
    const name = playerName && playerName.trim() !== '' 
      ? playerName.trim().substring(0, 30) 
      : 'Anonymous';
    
    const entry = {
      playerName: name,
      score: parseInt(score, 10),
      timestamp: new Date().toISOString()
    };
    
    scores[levelId].push(entry);
    
    // Keep only top 100 scores per level (performance)
    scores[levelId].sort((a, b) => b.score - a.score);
    if (scores[levelId].length > 100) {
      scores[levelId] = scores[levelId].slice(0, 100);
    }
    
    try {
      localStorage.setItem('pixelbounce_scores', JSON.stringify(scores));
      return true;
    } catch (e) {
      console.warn('Failed to save score:', e);
      return false;
    }
  },
  
  getTop(levelId, limit = 10) {
    const scores = this._getScores();
    const levelScores = scores[levelId] || [];
    return levelScores.slice(0, limit);
  },
  
  _getScores() {
    try {
      const data = localStorage.getItem('pixelbounce_scores');
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Failed to parse scores data:', e);
      return {};
    }
  }
};


// Initialize demo levels on first visit
LevelAPI._initDemoLevels();

function getDailyKey() { return new Date().toISOString().slice(0, 10); }

function getDailyModifiers() {
  const seed = getDailyKey().split('-').reduce((a, b) => a * 31 + parseInt(b), 0);
  const rng = seededRandom(Math.abs(seed));
  const count = rng() < 0.4 ? 1 : 2;
  const shuffled = [...DAILY_MODIFIERS].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

function getDailyData() {
  const key = 'pb_daily_' + getDailyKey();
  return JSON.parse(localStorage.getItem(key) || '{"scores":[],"attempts":0}');
}

function saveDailyScore(s) {
  const key = 'pb_daily_' + getDailyKey();
  const data = getDailyData();
  data.attempts++;
  data.scores.push(s);
  data.scores.sort((a, b) => b - a);
  data.scores = data.scores.slice(0, 3);
  localStorage.setItem(key, JSON.stringify(data));
}

const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 8 };
const keys = {};
let touchX = null;

// --- Audio (WebAudio API — procedural, zero external files) ---
let audioCtx = null;
let muted = localStorage.getItem('pb_mute') === '1';
let audioUnlocked = false;
let bgmGain = null;
let bgmTimeout = null;

function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioUnlocked = true;
  startBGM();
}

function playTone(freq, duration, type, vol) {
  if (!audioCtx || muted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol || 0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function sfxBounce(vy) {
  const pitch = 200 + Math.abs(vy) * 30;
  playTone(pitch, 0.1, 'square', 0.12);
}

function sfxStar() {
  playTone(880, 0.08, 'square', 0.1);
  setTimeout(() => playTone(1100, 0.12, 'square', 0.1), 60);
}

function sfxGameOver() {
  playTone(400, 0.15, 'sawtooth', 0.12);
  setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.12), 120);
  setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.1), 240);
}

function sfxBouncy() { playTone(600, 0.15, 'sine', 0.15); playTone(900, 0.1, 'sine', 0.1); }
function sfxBreakable() { playTone(150, 0.2, 'sawtooth', 0.1); }
function sfxPortal() {
  playTone(500, 0.1, 'sine', 0.12);
  setTimeout(() => playTone(800, 0.1, 'sine', 0.12), 80);
  setTimeout(() => playTone(1200, 0.15, 'sine', 0.1), 160);
}

function sfxPowerUp() {
  playTone(660, 0.08, 'square', 0.12);
  setTimeout(() => playTone(880, 0.08, 'square', 0.12), 70);
  setTimeout(() => playTone(1100, 0.12, 'square', 0.1), 140);
}

function startBGM() {
  if (!audioCtx || muted) return;
  bgmGain = audioCtx.createGain();
  bgmGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  bgmGain.connect(audioCtx.destination);

  // Simple 8-bit arpeggio loop
  const notes = [262, 330, 392, 523, 392, 330, 262, 196];
  const noteLen = 0.18;
  function playLoop() {
    if (!audioCtx || muted) return;
    const now = audioCtx.currentTime;
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * noteLen);
      g.gain.setValueAtTime(0.04, now + i * noteLen);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * noteLen + noteLen * 0.9);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(now + i * noteLen);
      osc.stop(now + i * noteLen + noteLen);
    });
    bgmTimeout = setTimeout(playLoop, notes.length * noteLen * 1000);
  }
  playLoop();
}

function stopBGM() {
  if (bgmTimeout) { clearTimeout(bgmTimeout); bgmTimeout = null; }
}

function toggleMute() {
  muted = !muted;
  localStorage.setItem('pb_mute', muted ? '1' : '0');
  if (muted) stopBGM();
  else if (audioCtx) startBGM();
}

// Cache canvas bounding rect to avoid layout thrashing on every touch move.
// Initialized immediately (script runs after body is parsed so layout is available),
// then refreshed whenever the canvas is resized or the device is rotated.
let cachedRect = canvas.getBoundingClientRect();
function updateCachedRect() { cachedRect = canvas.getBoundingClientRect(); }
new ResizeObserver(updateCachedRect).observe(canvas);
window.addEventListener('orientationchange', updateCachedRect);

// --- Input ---
const isPlaying = () => state === STATE.PLAY || state === STATE.DAILY;
document.onkeydown = e => {
  keys[e.key] = true;
  if (e.key === 'm' || e.key === 'M') toggleMute();
  if ((e.key === 'a') && !isPlaying()) showAchievementOverlay = !showAchievementOverlay;
  // Skin selector on title screen
  if (state === STATE.TITLE && !showAchievementOverlay) {
    if (e.key === 'ArrowLeft') { selectedSkin = (selectedSkin - 1 + SKINS.length) % SKINS.length; localStorage.setItem('pb_skin', selectedSkin); }
    if (e.key === 'ArrowRight') { selectedSkin = (selectedSkin + 1) % SKINS.length; localStorage.setItem('pb_skin', selectedSkin); }
  }
  if (e.key === 'd' && state === STATE.TITLE && !showAchievementOverlay) startGame(true);
  if (e.key === 'e' && state === STATE.TITLE && !showAchievementOverlay) startEditor();
  if (e.key === 'c' && state === STATE.TITLE && !showAchievementOverlay) startGallery();
  if (e.key === 'm' && state === STATE.TITLE && !showAchievementOverlay) enterLobby();
  if ((e.key === ' ' || e.key === 'Enter') && !isPlaying()) startGame();
  // Lobby controls
  if (state === STATE.LOBBY) {
    if (e.key === 'Escape') {
      if (lobbyState === 'in-room' || lobbyState === 'quick-match') {
        multiplayerClient.leaveRoom();
      } else {
        leaveLobby();
      }
    }
    if (lobbyState === 'menu') {
      if (e.key === '1') lobbyState = 'creating';
      if (e.key === '2') lobbyState = 'joining';
      if (e.key === '3') {
        if (multiplayerClient && multiplayerClient.connected) {
          multiplayerClient.quickMatch(playerNameInput || 'Player');
        }
      }
    } else if (lobbyState === 'creating') {
      if (e.key === 'Enter') {
        if (multiplayerClient && multiplayerClient.connected) {
          multiplayerClient.createRoom(playerNameInput || 'Player');
        }
      }
      if (e.key === 'Escape') lobbyState = 'menu';
      if (e.key === 'Backspace' && playerNameInput.length > 0) {
        playerNameInput = playerNameInput.slice(0, -1);
        localStorage.setItem('pb_player_name', playerNameInput);
      } else if (e.key.length === 1 && playerNameInput.length < 20 && /[a-zA-Z0-9 ]/.test(e.key)) {
        playerNameInput += e.key;
        localStorage.setItem('pb_player_name', playerNameInput);
      }
    } else if (lobbyState === 'joining') {
      if (e.key === 'Enter' && roomCodeInput.length === 6) {
        if (multiplayerClient && multiplayerClient.connected) {
          multiplayerClient.joinRoom(roomCodeInput, playerNameInput || 'Player');
        }
      }
      if (e.key === 'Escape') {
        lobbyState = 'menu';
        roomCodeInput = '';
      }
      if (e.key === 'Backspace' && roomCodeInput.length > 0) {
        roomCodeInput = roomCodeInput.slice(0, -1);
      } else if (e.key.length === 1 && roomCodeInput.length < 6 && /[A-Z0-9]/i.test(e.key)) {
        roomCodeInput += e.key.toUpperCase();
      }
    } else if (lobbyState === 'in-room') {
      if (e.key === 'r' || e.key === 'R') {
        if (multiplayerClient && multiplayerClient.connected) {
          multiplayerClient.toggleReady();
        }
      }
    }
  }
  // Editor controls
  if (state === STATE.EDITOR) {
    if (showImportModal) {
      if (e.key === 'Escape') {
        closeImportModal();
      }
      if (e.key === 'Enter') {
        importLevel(importInput);
      }
      return;
    }
    if (showMetadataModal) {
      if (e.key === 'Escape') {
        closeMetadataModal();
      }
      if (e.key === 'Enter') {
        saveMetadata();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (metadataFocusField === 'name') metadataFocusField = 'description';
        else if (metadataFocusField === 'description') metadataFocusField = 'tags';
        else metadataFocusField = 'name';
      }
      if (e.key === 'Backspace') {
        if (metadataFocusField === 'name' && metadataInputs.name.length > 0) {
          metadataInputs.name = metadataInputs.name.slice(0, -1);
        } else if (metadataFocusField === 'description' && metadataInputs.description.length > 0) {
          metadataInputs.description = metadataInputs.description.slice(0, -1);
        } else if (metadataFocusField === 'tags' && metadataInputs.tags.length > 0) {
          metadataInputs.tags = metadataInputs.tags.slice(0, -1);
        }
      } else if (e.key.length === 1) {
        if (metadataFocusField === 'name' && metadataInputs.name.length < 50) {
          metadataInputs.name += e.key;
        } else if (metadataFocusField === 'description' && metadataInputs.description.length < 200) {
          metadataInputs.description += e.key;
        } else if (metadataFocusField === 'tags' && metadataInputs.tags.length < 100) {
          metadataInputs.tags += e.key;
        }
      }
      return;
    }
    if (e.key === 'Escape') { state = STATE.TITLE; }
    if (e.key === 'p' || e.key === 'P') previewLevel();
    if (e.key === 'z' && (keys['Control'] || keys['Meta'])) editorUndo();
    if (e.key === 'y' && (keys['Control'] || keys['Meta'])) editorRedo();
    if (e.key === 's' && (keys['Control'] || keys['Meta'])) {
      e.preventDefault();
      exportLevel();
    }
    if (e.key === 'x' || e.key === 'X') exportLevel();
    if (e.key === 'i' || e.key === 'I') openImportModal();
    if (e.key === 'm' || e.key === 'M') openMetadataModal();
    if (e.key === 'f' || e.key === 'F') handleFileImport();
    if (e.key === 'u' || e.key === 'U') uploadToGallery();
    // Tool selection with number keys
    if (e.key >= '1' && e.key <= '7') {
      const toolIdx = parseInt(e.key) - 1;
      if (toolIdx < EDITOR_TOOLS.length) editorTool = EDITOR_TOOLS[toolIdx];
    }
  }
  // Preview mode ESC returns to editor
  if (state === STATE.PLAY && isPreviewMode && e.key === 'Escape') {
    isPreviewMode = false;
    state = STATE.EDITOR;
  }
  // Gallery controls
  if (state === STATE.GALLERY) {
    if (showLeaderboard) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        showLeaderboard = false;
        leaderboardLevelId = null;
        leaderboardScores = [];
      }
      return;
    }
    if (showRatingModal) {
      if (e.key >= '1' && e.key <= '5') {
        pendingRating = parseInt(e.key);
      }
      if (e.key === 'Enter' && pendingRating > 0) {
        LevelAPI.rate(communityLevelId, pendingRating);
        showRatingModal = false;
        pendingRating = 0;
        communityLevelId = null;
        isPlayingCommunityLevel = false;
      }
      if (e.key === 'Escape') {
        showRatingModal = false;
        pendingRating = 0;
        communityLevelId = null;
        isPlayingCommunityLevel = false;
      }
      return;
    }
    if (e.key === 'Escape') {
      state = STATE.TITLE;
      selectedGalleryLevel = null;
    }
    if (e.key === 'ArrowUp') galleryScroll = Math.max(0, galleryScroll - 1);
    if (e.key === 'ArrowDown') galleryScroll = Math.min(galleryLevels.length - 1, galleryScroll + 1);
    if (e.key === '1') { gallerySort = 'recent'; galleryLevels = LevelAPI.list(gallerySort); galleryScroll = 0; }
    if (e.key === '2') { gallerySort = 'popular'; galleryLevels = LevelAPI.list(gallerySort); galleryScroll = 0; }
    if (e.key === '3') { gallerySort = 'top-rated'; galleryLevels = LevelAPI.list(gallerySort); galleryScroll = 0; }
    if (e.key === 'l' || e.key === 'L') {
      // View leaderboard for current level
      if (galleryLevels[galleryScroll]) {
        showLeaderboard = true;
        leaderboardLevelId = galleryLevels[galleryScroll].id;
        leaderboardScores = ScoreAPI.getTop(leaderboardLevelId, 10);
      }
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (galleryLevels[galleryScroll]) {
        playCommunityLevel(galleryLevels[galleryScroll]);
      }
    }
  }
  // Community level game over -> name prompt or rating
  if (state === STATE.OVER && communityLevelId) {
    if (showNamePrompt) {
      // Handle name input
      if (e.key === 'Enter') {
        // Submit score with name (or Anonymous)
        const finalName = nameInput.trim() !== '' ? nameInput.trim() : 'Anonymous';
        ScoreAPI.submit(communityLevelId, finalName, currentScore);
        showNamePrompt = false;
        nameInput = '';
        // Now show leaderboard with highlighted score
        showLeaderboard = true;
        leaderboardLevelId = communityLevelId;
        leaderboardScores = ScoreAPI.getTop(communityLevelId, 10);
        currentScoreHighlighted = true;
      } else if (e.key === 'Escape') {
        // Skip leaderboard submission
        showNamePrompt = false;
        nameInput = '';
        currentScoreHighlighted = false;
      } else if (e.key === 'Backspace' && nameInput.length > 0) {
        nameInput = nameInput.slice(0, -1);
      } else if (e.key.length === 1 && nameInput.length < 20) {
        // Allow alphanumeric and spaces
        if (/[a-zA-Z0-9 ]/.test(e.key)) {
          nameInput += e.key;
        }
      }
      return;
    }
    if (showLeaderboard) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        // Close leaderboard and return to gallery
        showLeaderboard = false;
        leaderboardLevelId = null;
        leaderboardScores = [];
        currentScoreHighlighted = false;
        communityLevelId = null;
        isPlayingCommunityLevel = false;
        state = STATE.GALLERY;
      }
      return;
    }
    if (e.key === 'r') {
      if (LevelAPI.hasRated(communityLevelId)) {
        // Already rated - just go back to gallery
        state = STATE.GALLERY;
        isPlayingCommunityLevel = false;
        communityLevelId = null;
      } else {
        showRatingModal = true;
        pendingRating = 0;
      }
    }
  }
};
document.onkeyup = e => { keys[e.key] = false; };

// Paste handler for import modal
document.addEventListener('paste', (e) => {
  if (state === STATE.EDITOR && showImportModal) {
    e.preventDefault();
    importInput = e.clipboardData.getData('text');
  }
});

canvas.onclick = (e) => {
  if (state === STATE.EDITOR) {
    handleEditorClick(e);
  } else if (state === STATE.GALLERY) {
    handleGalleryClick(e);
  } else if (state === STATE.OVER && communityLevelId) {
    // Return to gallery from community level
    if (!showRatingModal) {
      communityLevelId = null;
      isPlayingCommunityLevel = false;
      state = STATE.GALLERY;
    }
  } else if (!isPlaying()) {
    startGame();
  }
};

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (state === STATE.OVER && communityLevelId) {
    // Return to gallery from community level
    if (!showRatingModal) {
      communityLevelId = null;
      isPlayingCommunityLevel = false;
      state = STATE.GALLERY;
    }
    return;
  }
  if (!isPlaying()) { startGame(); return; }
  touchX = (e.touches[0].clientX - cachedRect.left) / cachedRect.width * W;
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  touchX = (e.touches[0].clientX - cachedRect.left) / cachedRect.width * W;
}, { passive: false });
canvas.addEventListener('touchend', e => { e.preventDefault(); touchX = null; }, { passive: false });

// --- Factories ---
function makePlatform(y) {
  const w = (60 + Math.random() * 50) * dailyMods.platformScale;
  const roll = Math.random();
  let type;
  if (roll < 0.03 && score > 300) type = 'portal';
  else if (roll < 0.11 && score > 100) type = 'breakable';
  else if (roll < 0.21) type = 'bouncy';
  else if (roll < dailyMods.moveChance + 0.21) type = 'moving';
  else type = 'static';
  return {
    x: Math.random() * (W - w), y, w, h: 10,
    type,
    dir: Math.random() < 0.5 ? 1 : -1,
    speed: (1 + Math.random() * 1.5) * dailyMods.moveSpeed,
    broken: false,
    pulse: Math.random() * Math.PI * 2
  };
}

function makeStar(minY, maxY) {
  return {
    x: 20 + Math.random() * (W - 40),
    y: minY + Math.random() * (maxY - minY),
    r: 5, pulse: Math.random() * Math.PI * 2, collected: false
  };
}

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 20 + Math.random() * 20,
      color, r: 2 + Math.random() * 3
    });
  }
}

const POWER_TYPES = ['shield', 'magnet', 'boost'];
const POWER_COLORS = { shield: '#4488ff', magnet: '#ffdd00', boost: '#ff4444' };
const POWER_ICONS = { shield: '🛡', magnet: '🧲', boost: '🚀' };
let lastPowerUpHeight = 0;

function makePowerUp(x, y) {
  const type = POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)];
  return { x, y: y - 30, type, r: 10, pulse: Math.random() * Math.PI * 2, collected: false };
}

// --- Editor Functions ---
function startEditor() {
  ensureAudio();
  state = STATE.EDITOR;
  isPreviewMode = false;
  editorLevel = { 
    platforms: [], 
    stars: [], 
    spawn: { x: W / 2, y: H - 100 },
    metadata: { name: 'Untitled Level', description: '', difficulty: 'Medium', tags: [], author: 'Player', created: new Date().toISOString() }
  };
  editorTool = 'normal';
  editorHistory = [];
  editorHistoryIndex = -1;
  cameraY = 0;
  showMetadataModal = false;
  metadataInputs = { name: '', description: '', difficulty: 'Medium', tags: '' };
  metadataFocusField = 'name';
}

function handleEditorClick(e) {
  const rect = canvas.getBoundingClientRect();
  const rawX = ((e.clientX - rect.left) / rect.width) * W;
  const rawY = ((e.clientY - rect.top) / rect.height) * H;
  const x = Math.round((rawX / GRID_SIZE)) * GRID_SIZE;
  const y = Math.round(((rawY + cameraY) / GRID_SIZE)) * GRID_SIZE;

  // Metadata modal difficulty badge clicks
  if (showMetadataModal) {
    const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];
    for (let i = 0; i < difficulties.length; i++) {
      const bx = 30 + i * 90;
      const by = 355;
      if (rawX >= bx && rawX <= bx + 80 && rawY >= by && rawY <= by + 30) {
        metadataInputs.difficulty = difficulties[i];
        return;
      }
    }
    return;
  }

  // Check for UI button clicks (toolbar at bottom)
  if (rawY >= H - 90) {
    // Tool buttons
    for (let i = 0; i < EDITOR_TOOLS.length; i++) {
      const btnX = 10 + i * 55;
      const btnY = H - 70;
      if (rawX >= btnX && rawX <= btnX + 50 && rawY >= btnY && rawY <= btnY + 30) {
        editorTool = EDITOR_TOOLS[i];
        return;
      }
    }
    
    // Export button (left side, below tools)
    if (rawX >= 10 && rawX <= 70 && rawY >= H - 38 && rawY <= H - 13) {
      exportLevel();
      return;
    }
    
    // Import button (right side, below tools)
    if (rawX >= 80 && rawX <= 140 && rawY >= H - 38 && rawY <= H - 13) {
      openImportModal();
      return;
    }
    
    // File Import button
    if (rawX >= 150 && rawX <= 210 && rawY >= H - 38 && rawY <= H - 13) {
      handleFileImport();
      return;
    }
    
    return; // Don't place objects in toolbar area
  }

  const worldY = rawY + cameraY;

  if (editorTool === 'delete') {
    // Delete platform or star at position
    const platIdx = editorLevel.platforms.findIndex(p =>
      rawX >= p.x && rawX <= p.x + p.w && worldY >= p.y && worldY <= p.y + p.h);
    const starIdx = editorLevel.stars.findIndex(s =>
      Math.sqrt((rawX - s.x) ** 2 + (worldY - s.y) ** 2) < 10);
    if (platIdx >= 0) {
      editorSaveState();
      editorLevel.platforms.splice(platIdx, 1);
    } else if (starIdx >= 0) {
      editorSaveState();
      editorLevel.stars.splice(starIdx, 1);
    }
  } else if (editorTool === 'spawn') {
    editorSaveState();
    editorLevel.spawn = { x, y };
  } else if (editorTool === 'star') {
    editorSaveState();
    editorLevel.stars.push({ x, y, r: 5, pulse: 0, collected: false });
  } else {
    // Place platform
    const w = 80;
    const h = 10;
    editorSaveState();
    editorLevel.platforms.push({
      x: x - w / 2, y, w, h,
      type: editorTool === 'normal' ? 'static' : editorTool,
      dir: 1, speed: 1.5, broken: false, pulse: 0
    });
  }
}

function editorSaveState() {
  // Remove any redo history
  editorHistory.splice(editorHistoryIndex + 1);
  // Save current state
  editorHistory.push(JSON.parse(JSON.stringify(editorLevel)));
  // Limit to 20 actions
  if (editorHistory.length > 20) editorHistory.shift();
  else editorHistoryIndex++;
}

function editorUndo() {
  if (editorHistoryIndex >= 0) {
    editorLevel = JSON.parse(JSON.stringify(editorHistory[editorHistoryIndex]));
    editorHistoryIndex--;
  }
}

function editorRedo() {
  if (editorHistoryIndex < editorHistory.length - 1) {
    editorHistoryIndex++;
    editorLevel = JSON.parse(JSON.stringify(editorHistory[editorHistoryIndex]));
  }
}

function previewLevel() {
  if (editorLevel.platforms.length === 0) return; // Need at least one platform
  isPreviewMode = true;
  state = STATE.PLAY;
  score = 0;
  cameraY = 0;
  maxHeight = 0;
  ball.x = editorLevel.spawn.x;
  ball.y = editorLevel.spawn.y;
  ball.vx = 0;
  ball.vy = -8;
  ball.r = 8;
  // Copy editor level to game state
  platforms = JSON.parse(JSON.stringify(editorLevel.platforms));
  stars = JSON.parse(JSON.stringify(editorLevel.stars));
  particles = [];
  powerups = [];
  activePower = null;
  runStars = 0;
  runBounces = 0;
  runStartTime = Date.now();
}

function exportLevel() {
  if (!editorLevel.metadata.name || editorLevel.metadata.name.trim() === '') {
    showToast('Set a level name first! [M]', 'error');
    return;
  }
  const levelData = {
    version: 1,
    platforms: editorLevel.platforms,
    stars: editorLevel.stars,
    spawn: editorLevel.spawn,
    metadata: {
      name: editorLevel.metadata.name,
      description: editorLevel.metadata.description,
      difficulty: editorLevel.metadata.difficulty,
      tags: editorLevel.metadata.tags,
      author: editorLevel.metadata.author,
      created: editorLevel.metadata.created
    }
  };
  const json = JSON.stringify(levelData, null, 2);
  
  // Copy to clipboard
  navigator.clipboard.writeText(json).then(() => {
    showToast('Level copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'error');
  });
  
  // Download as file
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `level-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importLevel(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (!data.platforms || !Array.isArray(data.platforms)) {
      showToast('Invalid level format: missing platforms', 'error');
      return false;
    }
    if (!data.spawn || typeof data.spawn.x !== 'number' || typeof data.spawn.y !== 'number') {
      showToast('Invalid level format: missing spawn', 'error');
      return false;
    }
    
    // Validate stars (optional but must be array if present)
    const stars = data.stars && Array.isArray(data.stars) ? data.stars : [];
    
    // Load level into editor
    editorSaveState();
    editorLevel = {
      platforms: data.platforms.map(p => ({
        x: p.x || 0,
        y: p.y || 0,
        w: p.w || 80,
        h: p.h || 10,
        type: p.type || 'static',
        dir: p.dir || 1,
        speed: p.speed || 1.5,
        broken: false,
        pulse: 0
      })),
      stars: stars.map(s => ({
        x: s.x || 0,
        y: s.y || 0,
        r: 5,
        pulse: 0,
        collected: false
      })),
      spawn: { x: data.spawn.x, y: data.spawn.y },
      metadata: {
        name: (data.metadata && data.metadata.name) || 'Untitled Level',
        description: (data.metadata && data.metadata.description) || '',
        difficulty: (data.metadata && data.metadata.difficulty) || 'Medium',
        tags: (data.metadata && Array.isArray(data.metadata.tags)) ? data.metadata.tags : [],
        author: (data.metadata && data.metadata.author) || 'Player',
        created: (data.metadata && data.metadata.created) || new Date().toISOString()
      }
    };
    
    showToast('Level imported!', 'success');
    showImportModal = false;
    importInput = '';
    return true;
  } catch (err) {
    showToast('Invalid level format', 'error');
    return false;
  }
}

function openImportModal() {
  showImportModal = true;
  importInput = '';
}

function closeImportModal() {
  showImportModal = false;
  importInput = '';
}

function handleFileImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      importLevel(ev.target.result);
    };
    reader.readAsText(file);
  };
  input.click();
}

function openMetadataModal() {
  showMetadataModal = true;
  metadataInputs = {
    name: editorLevel.metadata.name,
    description: editorLevel.metadata.description,
    difficulty: editorLevel.metadata.difficulty,
    tags: editorLevel.metadata.tags.join(', ')
  };
  metadataFocusField = 'name';
}

function closeMetadataModal() {
  showMetadataModal = false;
}

function saveMetadata() {
  editorLevel.metadata.name = metadataInputs.name.trim() || 'Untitled Level';
  editorLevel.metadata.description = metadataInputs.description.trim();
  editorLevel.metadata.difficulty = metadataInputs.difficulty;
  editorLevel.metadata.tags = [...new Set(metadataInputs.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0))].slice(0, 5);
  showMetadataModal = false;
  showToast('Metadata saved!', 'success');
}

function showToast(text, type = 'success') {
  editorToast = { text, timer: 120, type }; // 2 seconds at 60fps
}

// --- Gallery Functions ---
function startGallery() {
  ensureAudio();
  state = STATE.GALLERY;
  gallerySort = 'recent';
  galleryLevels = LevelAPI.list(gallerySort);
  galleryScroll = 0;
  selectedGalleryLevel = null;
}

// --- Multiplayer Lobby Functions ---
function enterLobby() {
  ensureAudio();
  state = STATE.LOBBY;
  lobbyState = 'menu';
  lobbyError = null;
  
  // Initialize multiplayer client
  if (!multiplayerClient) {
    multiplayerClient = new MultiplayerClient();
  }
  multiplayerClient.connect();
}

function leaveLobby() {
  state = STATE.TITLE;
  lobbyState = 'menu';
  currentRoom = null;
  isReady = false;
  countdownValue = 0;
  lobbyError = null;
  if (multiplayerClient) {
    multiplayerClient.disconnect();
  }
}

function handleGalleryClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * W;
  const y = ((e.clientY - rect.top) / rect.height) * H;
  
  // Sort buttons
  const sortBtns = [
    { x: 20, y: 70, w: 110, sort: 'recent' },
    { x: 140, y: 70, w: 110, sort: 'popular' },
    { x: 260, y: 70, w: 110, sort: 'top-rated' }
  ];
  for (const btn of sortBtns) {
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + 25) {
      gallerySort = btn.sort;
      galleryLevels = LevelAPI.list(gallerySort);
      galleryScroll = 0;
      return;
    }
  }
  
  // Level cards (clickable area)
  const startY = 110;
  const cardH = 90;
  const visibleCards = Math.min(5, galleryLevels.length);
  for (let i = 0; i < visibleCards; i++) {
    const idx = galleryScroll + i;
    if (idx >= galleryLevels.length) break;
    const cardY = startY + i * (cardH + 10);
    if (x >= 10 && x <= W - 10 && y >= cardY && y <= cardY + cardH) {
      playCommunityLevel(galleryLevels[idx]);
      return;
    }
  }
}

function playCommunityLevel(level) {
  ensureAudio();
  isPreviewMode = false;
  isDailyMode = false;
  isPlayingCommunityLevel = true;
  communityLevelId = level.id;
  state = STATE.PLAY;
  score = 0;
  cameraY = 0;
  maxHeight = 0;
  ball.x = level.spawn.x;
  ball.y = level.spawn.y;
  ball.vx = 0;
  ball.vy = -8;
  ball.r = 8;
  platforms = JSON.parse(JSON.stringify(level.platforms));
  stars = JSON.parse(JSON.stringify(level.stars));
  particles = [];
  powerups = [];
  activePower = null;
  runStars = 0;
  runBounces = 0;
  runStartTime = Date.now();
  LevelAPI.incrementPlays(level.id);
}

function uploadToGallery() {
  if (!editorLevel.metadata.name || editorLevel.metadata.name.trim() === '' || editorLevel.metadata.name === 'Untitled Level') {
    showToast('Set a unique level name! [M]', 'error');
    return;
  }
  if (editorLevel.platforms.length === 0) {
    showToast('Add platforms first!', 'error');
    return;
  }
  
  const levelData = {
    version: 1,
    platforms: editorLevel.platforms,
    stars: editorLevel.stars,
    spawn: editorLevel.spawn,
    metadata: {
      name: editorLevel.metadata.name,
      description: editorLevel.metadata.description,
      difficulty: editorLevel.metadata.difficulty,
      tags: editorLevel.metadata.tags,
      author: editorLevel.metadata.author,
      created: editorLevel.metadata.created
    }
  };
  
  const id = LevelAPI.save(levelData);
  showToast('Level uploaded to gallery!', 'success');
}

function renderLevelThumbnail(level) {
  const thumbW = 60;
  const thumbH = 80;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = thumbW;
  offCanvas.height = thumbH;
  const offCtx = offCanvas.getContext('2d');
  
  // Background
  offCtx.fillStyle = '#0f3460';
  offCtx.fillRect(0, 0, thumbW, thumbH);
  
  // Guard against empty levels
  if (!level.platforms || level.platforms.length === 0) {
    offCtx.fillStyle = '#555';
    offCtx.font = '10px "Courier New", monospace';
    offCtx.textAlign = 'center';
    offCtx.fillText('No', thumbW / 2, thumbH / 2 - 5);
    offCtx.fillText('Preview', thumbW / 2, thumbH / 2 + 8);
    return offCanvas;
  }
  
  // Find bounds
  const allY = level.platforms.map(p => p.y).concat((level.stars || []).map(s => s.y));
  const minY = Math.min(...allY, level.spawn.y);
  const maxY = Math.max(...allY, level.spawn.y);
  const rangeY = maxY - minY || 100;
  const scale = Math.min(thumbW / W, thumbH / rangeY) * 0.8;
  
  offCtx.save();
  offCtx.translate(thumbW / 2, thumbH / 2);
  offCtx.scale(scale, scale);
  offCtx.translate(-W / 2, -(minY + rangeY / 2));
  
  // Platforms
  for (const p of level.platforms) {
    const colors = {
      bouncy: '#00ff88',
      breakable: '#ff8c00',
      portal: '#b44dff',
      moving: '#16c79a',
      static: '#e94560'
    };
    offCtx.fillStyle = colors[p.type] || '#e94560';
    offCtx.fillRect(p.x, p.y, p.w, p.h);
  }
  
  // Stars
  offCtx.fillStyle = '#ffd700';
  for (const s of level.stars) {
    offCtx.beginPath();
    offCtx.arc(s.x, s.y, 3, 0, Math.PI * 2);
    offCtx.fill();
  }
  
  // Spawn
  offCtx.strokeStyle = '#00ff00';
  offCtx.lineWidth = 2;
  offCtx.beginPath();
  offCtx.arc(level.spawn.x, level.spawn.y, 5, 0, Math.PI * 2);
  offCtx.stroke();
  
  offCtx.restore();
  
  return offCanvas;
}

// --- Game Init ---
function startGame(daily) {
  ensureAudio();
  isPreviewMode = false;
  isDailyMode = !!daily;
  // Reset modifiers
  Object.assign(dailyMods, defaultMods);
  if (isDailyMode) {
    const dd = getDailyData();
    if (dd.attempts >= 3) return; // max 3 daily attempts
    getDailyModifiers().forEach(m => m.apply(dailyMods));
    state = STATE.DAILY;
  } else {
    state = STATE.PLAY;
  }
  score = 0;
  cameraY = 0;
  maxHeight = 0;
  ball.x = W / 2;
  ball.y = H - 100;
  ball.vx = 0;
  ball.vy = -8;
  ball.r = dailyMods.ballRadius;
  platforms = [];
  stars = [];
  particles = [];
  powerups = [];
  activePower = null;
  lastPowerUpHeight = 0;
  runStars = 0;
  runBounces = 0;
  runStartTime = Date.now();
  stats.totalGames++;
  saveStats();

  // Starting platform directly under the ball
  platforms.push({ x: W / 2 - 40, y: H - 60, w: 80, h: 10, type: 'static', dir: 0, speed: 0, broken: false, pulse: 0 });
  for (let i = 0; i < 8; i++) {
    platforms.push(makePlatform(H - 120 - i * 70));
  }
  for (let i = 0; i < 4; i++) {
    stars.push(makeStar(100, H - 100));
  }
}

// --- Update ---
function update() {
  if (state === STATE.EDITOR) {
    // Editor camera control with arrow keys
    if (keys['ArrowUp']) cameraY -= 5;
    if (keys['ArrowDown']) cameraY += 5;
    // Update toast timer
    if (editorToast && editorToast.timer > 0) {
      editorToast.timer--;
      if (editorToast.timer <= 0) editorToast = null;
    }
    return;
  }
  if (state !== STATE.PLAY && state !== STATE.DAILY) return;

  const accel = 0.5;
  ball.vx *= 0.92;
  ball.vy += dailyMods.gravity;

  if (keys['ArrowLeft'] || keys['a'] || keys['A']) ball.vx -= accel;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) ball.vx += accel;
  if (touchX !== null) {
    if (touchX < ball.x - 10) ball.vx -= accel;
    else if (touchX > ball.x + 10) ball.vx += accel;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Horizontal wrap
  if (ball.x < -ball.r) ball.x = W + ball.r;
  if (ball.x > W + ball.r) ball.x = -ball.r;

  // Platform collision (only when falling)
  if (ball.vy > 0) {
    for (const p of platforms) {
      if (p.broken) continue;
      if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w &&
          ball.y + ball.r >= p.y && ball.y + ball.r <= p.y + p.h + ball.vy + 2) {
        const baseVy = (-10 - Math.min(score * 0.02, 4)) * dailyMods.bounceMul;
        runBounces++;
        // Boost power-up: amplify next bounce
        const boostMul = (activePower && activePower.type === 'boost') ? 2.5 : 1;
        if (boostMul > 1) activePower = null;
        if (p.type === 'bouncy') {
          ball.vy = baseVy * 2 * boostMul;
          sfxBouncy();
          spawnParticles(ball.x, p.y, '#00ff88', 8);
        } else if (p.type === 'breakable') {
          ball.vy = baseVy * boostMul;
          p.broken = true;
          sfxBreakable();
          spawnParticles(ball.x, p.y, '#ff8c00', 12);
        } else if (p.type === 'portal') {
          const highest = Math.min(...platforms.filter(q => !q.broken && q !== p).map(q => q.y));
          ball.y = highest - ball.r - 20;
          ball.vy = baseVy * boostMul;
          sfxPortal();
          spawnParticles(ball.x, p.y, '#b44dff', 15);
          spawnParticles(ball.x, ball.y, '#b44dff', 10);
        } else {
          ball.vy = baseVy * boostMul;
          sfxBounce(ball.vy);
          spawnParticles(ball.x, p.y, '#e94560', 5);
        }
        ball.y = p.type === 'portal' ? ball.y : p.y - ball.r;
        break;
      }
    }
  }

  // Moving platforms
  for (const p of platforms) {
    if (p.type === 'moving') {
      p.x += p.speed * p.dir;
      if (p.x <= 0 || p.x + p.w >= W) p.dir *= -1;
    }
  }

  // Camera follows ball upward
  if (ball.y - cameraY < H * 0.35) {
    cameraY = ball.y - H * 0.35;
  }

  // Score based on height climbed
  const height = -(ball.y - H);
  if (height > maxHeight) {
    score += Math.floor((height - maxHeight) / 10);
    maxHeight = height;
  }

  // Spawn new platforms above — spacing scales with jump capability
  let highestY = Math.min(...platforms.map(p => p.y));
  while (highestY > cameraY - 100) {
    const bounceVy = (10 + Math.min(score * 0.02, 4)) * dailyMods.bounceMul;
    const maxJump = (bounceVy * bounceVy) / (2 * dailyMods.gravity);
    const safeGap = maxJump * 0.4;
    const gap = 50 + Math.random() * Math.max(safeGap - 50, 10);
    const newP = makePlatform(highestY - gap);
    platforms.push(newP);
    if (Math.random() < dailyMods.starRate) stars.push(makeStar(newP.y - 60, newP.y - 10));
    // Spawn power-up every ~200 height units
    const currentHeight = -(newP.y - H);
    if (currentHeight - lastPowerUpHeight >= 200) {
      powerups.push(makePowerUp(newP.x + newP.w / 2, newP.y));
      lastPowerUpHeight = currentHeight;
    }
    highestY = newP.y;
  }

  // Cleanup off-screen + broken platforms
  platforms = platforms.filter(p => !p.broken && p.y < cameraY + H + 50);
  stars = stars.filter(s => !s.collected && s.y < cameraY + H + 50);
  powerups = powerups.filter(pu => !pu.collected && pu.y < cameraY + H + 50);

  // Magnet timer countdown
  if (activePower && activePower.type === 'magnet') {
    activePower.timer--;
    if (activePower.timer <= 0) activePower = null;
  }

  // Star collection (magnet expands radius)
  const magnetRadius = (activePower && activePower.type === 'magnet') ? 80 : 0;
  for (const s of stars) {
    if (s.collected) continue;
    const dx = ball.x - s.x, dy = ball.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < ball.r + s.r + 4 + magnetRadius) {
      s.collected = true;
      score += 25;
      runStars++;
      stats.totalStars++;
      sfxStar();
      spawnParticles(s.x, s.y, '#ffd700', 10);
    }
  }

  // Power-up collection
  for (const pu of powerups) {
    if (pu.collected) continue;
    const dx = ball.x - pu.x, dy = ball.y - pu.y;
    if (Math.sqrt(dx * dx + dy * dy) < ball.r + pu.r) {
      pu.collected = true;
      if (pu.type === 'magnet') {
        activePower = { type: 'magnet', timer: 300 }; // ~5 seconds at 60fps
      } else {
        activePower = { type: pu.type, timer: -1 }; // single-use
      }
      sfxPowerUp();
      spawnParticles(pu.x, pu.y, POWER_COLORS[pu.type], 12);
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Game over (shield intercepts once)
  if (ball.y - cameraY > H + 50) {
    if (activePower && activePower.type === 'shield') {
      // Shield saves: bounce back up
      ball.vy = -12;
      ball.y = cameraY + H - 20;
      activePower = null;
      playTone(700, 0.2, 'sine', 0.15);
      spawnParticles(ball.x, ball.y, '#4488ff', 20);
    } else if (isPreviewMode) {
      // Return to editor from preview
      isPreviewMode = false;
      state = STATE.EDITOR;
      ball.r = 8; // reset radius
    } else if (isPlayingCommunityLevel) {
      // Community level game over - prompt for name and submit score
      state = STATE.OVER;
      sfxGameOver();
      stats.totalDeaths++;
      if (score > stats.bestScore) stats.bestScore = score;
      saveStats();
      checkAchievements();
      ball.r = 8; // reset radius
      // Trigger name prompt for leaderboard
      showNamePrompt = true;
      nameInput = '';
      currentScore = score;
      currentScoreHighlighted = false;
    } else {
      state = STATE.OVER;
      sfxGameOver();
      stats.totalDeaths++;
      if (score > stats.bestScore) stats.bestScore = score;
      saveStats();
      checkAchievements();
      if (isDailyMode) saveDailyScore(score);
      if (!isDailyMode && score > highScore) {
        highScore = score;
        localStorage.setItem('pb_hi', String(highScore));
      }
      ball.r = 8; // reset radius
    }
  }
  
  // Check achievements
  if (isPlaying()) checkAchievements();
}

// --- Draw ---
function draw() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0f3460');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Background stars (parallax)
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 0; i < 40; i++) {
    const sx = (i * 97 + 13) % W;
    const sy = ((i * 131 + 7 - cameraY * 0.1) % H + H) % H;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  ctx.save();
  ctx.translate(0, -cameraY);

  // Platforms
  for (const p of platforms) {
    if (p.broken) continue;
    let c1, c2;
    switch (p.type) {
      case 'bouncy':
        p.pulse += 0.06;
        c1 = '#00ff88'; c2 = '#00cc66';
        break;
      case 'breakable':
        c1 = '#ff8c00'; c2 = '#cc6600';
        break;
      case 'portal':
        p.pulse += 0.08;
        c1 = '#b44dff'; c2 = '#8800cc';
        break;
      case 'moving':
        c1 = '#16c79a'; c2 = '#0e8a6d';
        break;
      default:
        c1 = '#e94560'; c2 = '#c81e45';
    }
    const pg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    pg.addColorStop(0, c1); pg.addColorStop(1, c2);
    ctx.fillStyle = pg;
    // Bouncy platforms pulse in size
    const scaleW = p.type === 'bouncy' ? 1 + Math.sin(p.pulse) * 0.03 : 1;
    const drawX = p.x - (p.w * scaleW - p.w) / 2;
    roundRect(ctx, drawX, p.y, p.w * scaleW, p.h, 3);
    ctx.fill();
    // Breakable crack lines
    if (p.type === 'breakable') {
      ctx.strokeStyle = '#553300';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x + p.w * 0.3, p.y);
      ctx.lineTo(p.x + p.w * 0.5, p.y + p.h);
      ctx.moveTo(p.x + p.w * 0.7, p.y);
      ctx.lineTo(p.x + p.w * 0.55, p.y + p.h);
      ctx.stroke();
    }
    // Portal shimmer
    if (p.type === 'portal') {
      ctx.globalAlpha = 0.3 + Math.sin(p.pulse) * 0.2;
      ctx.fillStyle = '#e0aaff';
      roundRect(ctx, p.x, p.y, p.w, p.h, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Stars
  for (const s of stars) {
    if (s.collected) continue;
    s.pulse += 0.08;
    drawStar(s.x, s.y, s.r * (1 + Math.sin(s.pulse) * 0.2));
  }

  // Power-ups
  for (const pu of powerups) {
    if (pu.collected) continue;
    pu.pulse += 0.05;
    const bobY = pu.y + Math.sin(pu.pulse) * 4;
    const color = POWER_COLORS[pu.type];
    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pu.x, bobY, pu.r, 0, Math.PI * 2);
    ctx.fill();
    // Icon
    ctx.shadowBlur = 0;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(POWER_ICONS[pu.type], pu.x, bobY + 4);
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (p.life / 40), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Ball — render with selected skin
  const skinIdx = SKINS[selectedSkin].unlock() ? selectedSkin : 0;
  ctx.shadowColor = '#e94560';
  ctx.shadowBlur = 15;
  SKINS[skinIdx].draw(ctx, ball.x, ball.y, ball.r);
  ctx.shadowBlur = 0;

  ctx.restore();

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 12, 28);
  ctx.textAlign = 'right';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Best: ' + highScore, W - 12, 28);
  // Daily mode indicator
  if (isDailyMode) {
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('DAILY', W - 12, 44);
  }
  // Mute indicator
  ctx.textAlign = 'center';
  ctx.font = '12px "Courier New", monospace';
  ctx.fillStyle = muted ? '#e94560' : '#555';
  ctx.fillText(muted ? '🔇 M' : '🔊 M', W / 2, 18);
  // Active power-up indicator
  if (activePower) {
    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    ctx.fillStyle = POWER_COLORS[activePower.type];
    const label = POWER_ICONS[activePower.type] + ' ' + activePower.type.toUpperCase();
    ctx.fillText(label, 12, 48);
    if (activePower.type === 'magnet') {
      // Duration bar
      const barW = 60 * (activePower.timer / 300);
      ctx.fillRect(12, 52, barW, 3);
    }
  }

  if (state === STATE.TITLE) drawTitleScreen();
  if (state === STATE.OVER) drawGameOver();
  if (state === STATE.EDITOR) drawEditor();
  if (state === STATE.GALLERY) drawGallery();
  if (state === STATE.LOBBY) drawLobby();

  // Achievement toast
  if (achievementToast && achievementToast.timer > 0) {
    achievementToast.timer--;
    const alpha = Math.min(achievementToast.timer / 30, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#1a1a2e';
    roundRect(ctx, W / 2 - 120, H - 60, 240, 35, 6);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    roundRect(ctx, W / 2 - 120, H - 60, 240, 35, 6);
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(achievementToast.text, W / 2, H - 38);
    ctx.globalAlpha = 1;
  }

  // Achievement overlay
  if (showAchievementOverlay) {
    ctx.fillStyle = 'rgba(10,10,30,0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText('ACHIEVEMENTS', W / 2, 40);
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press A to close', W / 2, 58);
    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
      const a = ACHIEVEMENTS[i];
      const unlocked = unlockedAchievements.includes(a.id);
      const y = 85 + i * 50;
      ctx.textAlign = 'left';
      ctx.font = '18px sans-serif';
      ctx.fillText(unlocked ? a.icon : '🔒', 30, y + 4);
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = unlocked ? '#fff' : '#555';
      ctx.fillText(a.name, 60, y);
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = unlocked ? '#16c79a' : '#444';
      ctx.fillText(unlocked ? '✓ Unlocked' : '???', 60, y + 16);
    }
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText(unlockedAchievements.length + '/' + ACHIEVEMENTS.length, W / 2, H - 20);
  }
}

function drawTitleScreen() {
  ctx.fillStyle = 'rgba(10,10,30,0.75)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 42px "Courier New", monospace';
  ctx.fillText('PIXEL', W / 2, H / 2 - 50);
  ctx.fillText('BOUNCE', W / 2, H / 2);
  ctx.fillStyle = '#fff';
  ctx.font = '16px "Courier New", monospace';
  ctx.fillText('Click or Tap to Start', W / 2, H / 2 + 50);
  ctx.fillStyle = '#aaa';
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText('Arrow keys / WASD / Touch', W / 2, H / 2 + 80);
  drawStar(W / 2 - 50, H / 2 - 100, 8);
  drawStar(W / 2 + 50, H / 2 - 100, 8);
  drawStar(W / 2, H / 2 - 120, 10);
  // Skin selector
  const skin = SKINS[selectedSkin];
  const unlocked = skin.unlock();
  ctx.fillStyle = unlocked ? '#fff' : '#555';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText('◀  ' + skin.name + '  ▶', W / 2, H / 2 + 110);
  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = unlocked ? '#16c79a' : '#e94560';
  ctx.fillText(unlocked ? '✓ Unlocked' : '🔒 ' + skin.hint, W / 2, H / 2 + 126);
  // Preview ball
  if (unlocked) {
    skin.draw(ctx, W / 2, H / 2 + 150, 12);
  } else {
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(W / 2, H / 2 + 150, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#666'; ctx.font = '14px sans-serif';
    ctx.fillText('?', W / 2, H / 2 + 155);
  }
  // Daily challenge button
  const todayMods = getDailyModifiers();
  const dd = getDailyData();
  ctx.fillStyle = dd.attempts >= 3 ? '#555' : '#ffd700';
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillText('[ D ] Daily Challenge', W / 2, H / 2 + 185);
  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText(todayMods.map(m => m.icon + ' ' + m.name).join(' + '), W / 2, H / 2 + 200);
  ctx.fillText('Attempts: ' + dd.attempts + '/3' + (dd.scores.length ? '  Best: ' + dd.scores[0] : ''), W / 2, H / 2 + 215);
  // Level Editor & Gallery
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillText('[ E ] Level Editor', W / 2, H / 2 + 238);
  ctx.fillText('[ C ] Community Gallery', W / 2, H / 2 + 253);
  // Multiplayer
  ctx.fillStyle = '#16c79a';
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillText('[ M ] Multiplayer', W / 2, H / 2 + 268);
  // Controls hint
  ctx.fillStyle = '#555';
  ctx.font = '10px "Courier New", monospace';
  ctx.fillText('[A] Achievements  [Shift+M] Mute', W / 2, H / 2 + 293);
}

function drawLobby() {
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a1128');
  grad.addColorStop(1, '#001f3f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  
  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#16c79a';
  ctx.font = 'bold 32px "Courier New", monospace';
  ctx.fillText('MULTIPLAYER', W / 2, 50);
  
  // Connection status
  const connected = multiplayerClient && multiplayerClient.connected;
  ctx.font = '11px "Courier New", monospace';
  ctx.fillStyle = connected ? '#00ff88' : '#ff3333';
  ctx.fillText(connected ? '● Connected' : '● Connecting...', W / 2, 75);
  
  // Ping display
  if (connected && serverPing > 0) {
    ctx.fillStyle = '#aaa';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(`Ping: ${serverPing}ms`, W / 2, 90);
  }
  
  // Error message
  if (lobbyError) {
    ctx.fillStyle = 'rgba(255,50,50,0.9)';
    roundRect(ctx, 30, 100, W - 60, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('⚠ ' + lobbyError, W / 2, 125);
  }
  
  const startY = lobbyError ? 160 : 120;
  
  if (lobbyState === 'menu') {
    // Main menu
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('Choose Mode:', W / 2, startY);
    
    // Buttons
    const buttons = [
      { key: '1', label: 'Create Room', color: '#ffd700', y: startY + 50 },
      { key: '2', label: 'Join Room', color: '#16c79a', y: startY + 100 },
      { key: '3', label: 'Quick Match', color: '#ff8c00', y: startY + 150 }
    ];
    
    for (const btn of buttons) {
      ctx.fillStyle = btn.color + '22';
      roundRect(ctx, 50, btn.y - 20, W - 100, 50, 8);
      ctx.fill();
      ctx.strokeStyle = btn.color;
      ctx.lineWidth = 2;
      roundRect(ctx, 50, btn.y - 20, W - 100, 50, 8);
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillText(`[${btn.key}] ${btn.label}`, W / 2, btn.y + 8);
    }
    
    ctx.fillStyle = '#aaa';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('[ESC] Back to Title', W / 2, H - 30);
    
  } else if (lobbyState === 'creating') {
    // Create room - enter name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillText('CREATE PRIVATE ROOM', W / 2, startY);
    
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Enter your name:', W / 2, startY + 40);
    
    // Name input
    ctx.fillStyle = 'rgba(255,215,0,0.1)';
    roundRect(ctx, 40, startY + 55, W - 80, 50, 6);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    roundRect(ctx, 40, startY + 55, W - 80, 50, 6);
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Courier New", monospace';
    const displayName = playerNameInput || 'Player';
    ctx.fillText(displayName, W / 2, startY + 88);
    
    // Cursor
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      const cursorX = W / 2 + ctx.measureText(displayName).width / 2 + 3;
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(cursorX, startY + 73, 2, 22);
    }
    
    ctx.fillStyle = '#aaa';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('[Enter] Create | [ESC] Back', W / 2, startY + 140);
    
  } else if (lobbyState === 'joining') {
    // Join room - enter code
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillText('JOIN PRIVATE ROOM', W / 2, startY);
    
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Enter 6-character room code:', W / 2, startY + 40);
    
    // Code input
    ctx.fillStyle = 'rgba(22,199,154,0.1)';
    roundRect(ctx, 100, startY + 55, W - 200, 60, 6);
    ctx.fill();
    ctx.strokeStyle = '#16c79a';
    ctx.lineWidth = 2;
    roundRect(ctx, 100, startY + 55, W - 200, 60, 6);
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.letterSpacing = '8px';
    ctx.fillText(roomCodeInput || '______', W / 2, startY + 95);
    ctx.letterSpacing = '0px';
    
    ctx.fillStyle = '#aaa';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('[Enter] Join | [ESC] Back', W / 2, startY + 140);
    
  } else if (lobbyState === 'quick-match') {
    // Quick match - searching
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText('SEARCHING FOR MATCH', W / 2, startY + 50);
    
    // Animated dots
    const dots = '.'.repeat((Math.floor(Date.now() / 500) % 4));
    ctx.font = '24px "Courier New", monospace';
    ctx.fillText(dots, W / 2, startY + 90);
    
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Finding players...', W / 2, startY + 130);
    
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('[ESC] Cancel', W / 2, H - 30);
    
  } else if (lobbyState === 'in-room' && currentRoom) {
    // In room view
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText('ROOM: ' + currentRoom.code, W / 2, startY);
    
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Share this code with friends', W / 2, startY + 20);
    
    // Players list
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText('Players (' + currentRoom.players.length + '/' + currentRoom.maxPlayers + '):', 30, startY + 60);
    
    for (let i = 0; i < currentRoom.players.length; i++) {
      const player = currentRoom.players[i];
      const py = startY + 90 + i * 50;
      
      // Player card
      ctx.fillStyle = player.ready ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)';
      roundRect(ctx, 30, py, W - 60, 40, 6);
      ctx.fill();
      ctx.strokeStyle = player.ready ? '#00ff88' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      roundRect(ctx, 30, py, W - 60, 40, 6);
      ctx.stroke();
      
      // Player name
      ctx.fillStyle = '#fff';
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText(player.name, 45, py + 25);
      
      // Ready status
      ctx.textAlign = 'right';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillStyle = player.ready ? '#00ff88' : '#888';
      ctx.fillText(player.ready ? '✓ READY' : 'NOT READY', W - 45, py + 25);
      ctx.textAlign = 'left';
    }
    
    // Countdown
    if (countdownValue > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(10,10,30,0.9)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 80px "Courier New", monospace';
      ctx.fillText(countdownValue.toString(), W / 2, H / 2 + 20);
      ctx.font = '20px "Courier New", monospace';
      ctx.fillText('GET READY!', W / 2, H / 2 - 40);
    } else {
      // Controls
      ctx.textAlign = 'center';
      const bottomY = H - 50;
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = isReady ? '#aaa' : '#ffd700';
      ctx.fillText('[R] ' + (isReady ? 'Not Ready' : 'Ready Up'), W / 2, bottomY);
      
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = '#aaa';
      ctx.fillText('[ESC] Leave Room', W / 2, bottomY + 20);
    }
  }
}

function drawEditor() {
  // Draw grid
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = -cameraY; y < H + cameraY; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y - cameraY);
    ctx.lineTo(W, y - cameraY);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(0, -cameraY);

  // Draw platforms from editor level
  for (const p of editorLevel.platforms) {
    let c1, c2;
    switch (p.type) {
      case 'bouncy':
        c1 = '#00ff88'; c2 = '#00cc66';
        break;
      case 'breakable':
        c1 = '#ff8c00'; c2 = '#cc6600';
        break;
      case 'portal':
        c1 = '#b44dff'; c2 = '#8800cc';
        break;
      case 'moving':
        c1 = '#16c79a'; c2 = '#0e8a6d';
        break;
      default:
        c1 = '#e94560'; c2 = '#c81e45';
    }
    const pg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    pg.addColorStop(0, c1); pg.addColorStop(1, c2);
    ctx.fillStyle = pg;
    roundRect(ctx, p.x, p.y, p.w, p.h, 3);
    ctx.fill();
  }

  // Draw stars from editor level
  for (const s of editorLevel.stars) {
    drawStar(s.x, s.y, s.r);
  }

  // Draw spawn point
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(editorLevel.spawn.x, editorLevel.spawn.y, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#00ff00';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('S', editorLevel.spawn.x, editorLevel.spawn.y + 5);

  ctx.restore();

  // Toolbar
  ctx.fillStyle = 'rgba(10,10,30,0.85)';
  ctx.fillRect(0, H - 90, W, 90);

  // Tool buttons
  const toolLabels = {
    normal: '1:Normal',
    bouncy: '2:Bouncy',
    breakable: '3:Break',
    portal: '4:Portal',
    star: '5:Star',
    spawn: '6:Spawn',
    delete: '7:Delete'
  };
  const toolColors = {
    normal: '#e94560',
    bouncy: '#00ff88',
    breakable: '#ff8c00',
    portal: '#b44dff',
    star: '#ffd700',
    spawn: '#00ff00',
    delete: '#ff0000'
  };

  for (let i = 0; i < EDITOR_TOOLS.length; i++) {
    const tool = EDITOR_TOOLS[i];
    const x = 10 + i * 55;
    const y = H - 70;
    const isActive = editorTool === tool;

    // Button background
    ctx.fillStyle = isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)';
    roundRect(ctx, x, y, 50, 30, 4);
    ctx.fill();

    // Button border
    ctx.strokeStyle = isActive ? toolColors[tool] : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = isActive ? 2 : 1;
    roundRect(ctx, x, y, 50, 30, 4);
    ctx.stroke();

    // Button label
    ctx.fillStyle = isActive ? '#fff' : '#aaa';
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(toolLabels[tool], x + 25, y + 20);
  }

  // Instructions
  ctx.fillStyle = '#fff';
  ctx.font = '11px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Click to place | [X] Export | [I] Import | [U] Upload', 10, H - 38);
  ctx.fillText('[P] Preview | [M] Metadata | [ESC] Exit | ↑↓ Scroll', 10, H - 24);
  
  // Export/Import buttons
  // Export button
  ctx.fillStyle = 'rgba(0,180,100,0.7)';
  roundRect(ctx, 10, H - 38, 60, 20, 4);
  ctx.fill();
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1;
  roundRect(ctx, 10, H - 38, 60, 20, 4);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Export', 40, H - 24);
  
  // Import button
  ctx.fillStyle = 'rgba(0,120,200,0.7)';
  roundRect(ctx, 80, H - 38, 60, 20, 4);
  ctx.fill();
  ctx.strokeStyle = '#4488ff';
  ctx.lineWidth = 1;
  roundRect(ctx, 80, H - 38, 60, 20, 4);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText('Import', 110, H - 24);
  
  // File Import button
  ctx.fillStyle = 'rgba(200,120,0,0.7)';
  roundRect(ctx, 150, H - 38, 60, 20, 4);
  ctx.fill();
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 1;
  roundRect(ctx, 150, H - 38, 60, 20, 4);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText('File', 180, H - 24);
  
  ctx.textAlign = 'left';

  // Current tool indicator
  ctx.textAlign = 'right';
  ctx.fillStyle = toolColors[editorTool];
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.fillText(toolLabels[editorTool].split(':')[1], W - 10, H - 50);

  // Stats
  ctx.fillStyle = '#aaa';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText(`Platforms: ${editorLevel.platforms.length}`, W - 10, H - 28);
  ctx.fillText(`Stars: ${editorLevel.stars.length}`, W - 10, H - 12);
  
  // Import Modal
  if (showImportModal) {
    ctx.fillStyle = 'rgba(10,10,30,0.95)';
    ctx.fillRect(0, 0, W, H);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4488ff';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText('IMPORT LEVEL', W / 2, 60);
    
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Paste level JSON below:', W / 2, 90);
    
    // Input box
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, 20, 110, W - 40, 200, 6);
    ctx.fill();
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 2;
    roundRect(ctx, 20, 110, W - 40, 200, 6);
    ctx.stroke();
    
    // Show input text (simple single line for now)
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'left';
    const displayText = importInput.length > 50 ? importInput.substring(0, 50) + '...' : importInput;
    ctx.fillText(displayText || '(paste JSON here)', 30, 130);
    
    // Instructions
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaa';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('Press [Enter] to import, [ESC] to cancel', W / 2, 340);
    ctx.fillText('Or use [F] File button to upload .json file', W / 2, 360);
  }
  
  // Metadata Modal
  if (showMetadataModal) {
    ctx.fillStyle = 'rgba(10,10,30,0.95)';
    ctx.fillRect(0, 0, W, H);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText('LEVEL METADATA', W / 2, 50);
    
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Set level info before exporting', W / 2, 75);
    
    const fields = [
      { key: 'name', label: 'Name', y: 110, maxLen: 50 },
      { key: 'description', label: 'Description', y: 190, maxLen: 200 },
      { key: 'tags', label: 'Tags (comma separated)', y: 270, maxLen: 100 }
    ];
    
    for (const field of fields) {
      const isFocused = metadataFocusField === field.key;
      
      // Label
      ctx.textAlign = 'left';
      ctx.fillStyle = isFocused ? '#ffd700' : '#aaa';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText(field.label, 30, field.y - 5);
      
      // Input box
      ctx.fillStyle = isFocused ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)';
      roundRect(ctx, 20, field.y, W - 40, 50, 6);
      ctx.fill();
      ctx.strokeStyle = isFocused ? '#ffd700' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = isFocused ? 2 : 1;
      roundRect(ctx, 20, field.y, W - 40, 50, 6);
      ctx.stroke();
      
      // Input text
      ctx.fillStyle = '#fff';
      ctx.font = '11px "Courier New", monospace';
      const val = metadataInputs[field.key];
      const displayVal = val.length > 45 ? val.substring(0, 45) + '...' : val;
      ctx.fillText(displayVal || `(enter ${field.key})`, 30, field.y + 30);
      
      // Cursor
      if (isFocused) {
        const cursorX = 30 + ctx.measureText(displayVal || '').width + 2;
        if (Math.floor(Date.now() / 500) % 2 === 0) {
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(cursorX, field.y + 15, 2, 20);
        }
      }
    }
    
    // Difficulty selector
    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillText('Difficulty', 30, 345);
    
    const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];
    const diffColors = { Easy: '#00ff88', Medium: '#ffd700', Hard: '#ff8c00', Expert: '#ff3333' };
    for (let i = 0; i < difficulties.length; i++) {
      const diff = difficulties[i];
      const bx = 30 + i * 90;
      const by = 355;
      const isActive = metadataInputs.difficulty === diff;
      
      ctx.fillStyle = isActive ? diffColors[diff] + '44' : 'rgba(255,255,255,0.05)';
      roundRect(ctx, bx, by, 80, 30, 4);
      ctx.fill();
      ctx.strokeStyle = isActive ? diffColors[diff] : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = isActive ? 2 : 1;
      roundRect(ctx, bx, by, 80, 30, 4);
      ctx.stroke();
      
      ctx.fillStyle = isActive ? '#fff' : '#888';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(diff, bx + 40, by + 20);
    }
    
    // Instructions
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaa';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('[Tab] Next field | [Enter] Save | [ESC] Cancel', W / 2, H - 40);
    ctx.fillText('Click difficulty badges to change', W / 2, H - 22);
  }
  
  // Toast notification
  if (editorToast) {
    const toastY = 20;
    const toastW = 240;
    const toastH = 50;
    const toastX = (W - toastW) / 2;
    
    const bgColor = editorToast.type === 'success' ? 'rgba(0,180,100,0.95)' : 'rgba(220,50,50,0.95)';
    ctx.fillStyle = bgColor;
    roundRect(ctx, toastX, toastY, toastW, toastH, 8);
    ctx.fill();
    
    const borderColor = editorToast.type === 'success' ? '#00ff88' : '#ff3333';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    roundRect(ctx, toastX, toastY, toastW, toastH, 8);
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(editorToast.text, W / 2, toastY + 32);
  }
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(10,10,30,0.75)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 36px "Courier New", monospace';
  ctx.fillText(isDailyMode ? 'DAILY OVER' : 'GAME OVER', W / 2, H / 2 - 40);
  ctx.fillStyle = '#fff';
  ctx.font = '22px "Courier New", monospace';
  ctx.fillText('Score: ' + score, W / 2, H / 2 + 10);
  if (!isDailyMode && score >= highScore && score > 0) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('NEW HIGH SCORE!', W / 2, H / 2 + 40);
  }
  if (isDailyMode) {
    const dd = getDailyData();
    ctx.fillStyle = '#ffd700';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('Daily Best: ' + (dd.scores[0] || 0), W / 2, H / 2 + 40);
    ctx.fillStyle = '#aaa';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('Attempts: ' + dd.attempts + '/3', W / 2, H / 2 + 58);
  }
  ctx.fillStyle = '#aaa';
  ctx.font = '14px "Courier New", monospace';
  if (communityLevelId) {
    if (LevelAPI.hasRated(communityLevelId)) {
      ctx.fillText('You already rated this level', W / 2, H / 2 + 80);
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('Click / Tap to Return', W / 2, H / 2 + 100);
    } else {
      ctx.fillText('Press [R] to rate level', W / 2, H / 2 + 80);
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('or Click / Tap to Return', W / 2, H / 2 + 100);
    }
  } else {
    ctx.fillText('Click or Tap to Restart', W / 2, H / 2 + 80);
  }
  
  // Rating modal
  if (showRatingModal) {
    ctx.fillStyle = 'rgba(10,10,30,0.95)';
    ctx.fillRect(0, 0, W, H);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText('RATE THIS LEVEL', W / 2, H / 2 - 60);
    
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Press 1-5 stars, then [Enter]', W / 2, H / 2 - 20);
    
    // Star rating display
    for (let i = 1; i <= 5; i++) {
      const sx = W / 2 - 70 + (i - 1) * 35;
      const sy = H / 2 + 20;
      ctx.font = '24px sans-serif';
      ctx.fillStyle = i <= pendingRating ? '#ffd700' : '#555';
      ctx.fillText('★', sx, sy);
      
      // Number hint
      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = '#aaa';
      ctx.fillText(i, sx, sy + 25);
    }
    
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('[ESC] Skip', W / 2, H / 2 + 80);
  }
  
  // Name prompt for leaderboard
  if (showNamePrompt) {
    ctx.fillStyle = 'rgba(10,10,30,0.95)';
    ctx.fillRect(0, 0, W, H);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#16c79a';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText('SUBMIT SCORE', W / 2, H / 2 - 80);
    
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Your Score: ' + currentScore, W / 2, H / 2 - 40);
    
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Enter your name:', W / 2, H / 2 - 5);
    
    // Input box
    ctx.fillStyle = 'rgba(22,199,154,0.15)';
    roundRect(ctx, W / 2 - 150, H / 2 + 10, 300, 40, 6);
    ctx.fill();
    ctx.strokeStyle = '#16c79a';
    ctx.lineWidth = 2;
    roundRect(ctx, W / 2 - 150, H / 2 + 10, 300, 40, 6);
    ctx.stroke();
    
    // Input text
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'center';
    const displayName = nameInput || 'Anonymous';
    ctx.fillText(displayName, W / 2, H / 2 + 36);
    
    // Cursor
    if (nameInput.length > 0 && Math.floor(Date.now() / 500) % 2 === 0) {
      const cursorX = W / 2 + ctx.measureText(displayName).width / 2 + 3;
      ctx.fillStyle = '#16c79a';
      ctx.fillRect(cursorX, H / 2 + 20, 2, 22);
    }
    
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.fillText('[Enter] Submit | [ESC] Skip', W / 2, H / 2 + 90);
    ctx.fillText('(leave blank for Anonymous)', W / 2, H / 2 + 108);
  }
  
  // Leaderboard modal
  if (showLeaderboard) {
    ctx.fillStyle = 'rgba(10,10,30,0.95)';
    ctx.fillRect(0, 0, W, H);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText('🏆 LEADERBOARD', W / 2, 50);
    
    if (leaderboardScores.length === 0) {
      ctx.fillStyle = '#aaa';
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText('No scores yet. Be the first!', W / 2, H / 2);
    } else {
      const startY = 100;
      const lineH = 42;
      
      // Header
      ctx.textAlign = 'left';
      ctx.fillStyle = '#888';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillText('RANK', 30, startY - 10);
      ctx.fillText('PLAYER', 90, startY - 10);
      ctx.fillText('SCORE', W - 100, startY - 10);
      ctx.textAlign = 'right';
      ctx.fillText('DATE', W - 20, startY - 10);
      
      // Scores
      for (let i = 0; i < Math.min(10, leaderboardScores.length); i++) {
        const entry = leaderboardScores[i];
        const y = startY + i * lineH;
        
        // Check if this is the current player's score (if just submitted)
        const isCurrentScore = currentScoreHighlighted && 
                               entry.score === currentScore && 
                               Math.abs(new Date(entry.timestamp) - new Date()) < 5000; // within 5 seconds
        
        // Background for current score
        if (isCurrentScore) {
          ctx.fillStyle = 'rgba(255,215,0,0.2)';
          roundRect(ctx, 15, y - 5, W - 30, lineH - 5, 4);
          ctx.fill();
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2;
          roundRect(ctx, 15, y - 5, W - 30, lineH - 5, 4);
          ctx.stroke();
        }
        
        // Rank
        ctx.textAlign = 'left';
        const rankColor = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : (isCurrentScore ? '#ffd700' : '#aaa');
        ctx.fillStyle = rankColor;
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText('#' + (i + 1), 30, y + 20);
        
        // Player name
        ctx.font = isCurrentScore ? 'bold 14px "Courier New", monospace' : '14px "Courier New", monospace';
        ctx.fillStyle = isCurrentScore ? '#fff' : '#ddd';
        const nameText = entry.playerName.length > 15 ? entry.playerName.substring(0, 15) + '...' : entry.playerName;
        ctx.fillText(nameText, 90, y + 20);
        
        // Score
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = isCurrentScore ? '#ffd700' : '#fff';
        ctx.fillText(entry.score.toString(), W - 100, y + 20);
        
        // Date
        ctx.textAlign = 'right';
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#888';
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        ctx.fillText(dateStr, W - 20, y + 20);
      }
    }
    
    ctx.textAlign = 'center';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('[ESC or Enter] Close', W / 2, H - 30);
  }
}

function drawStar(x, y, r) {
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

function drawGallery() {
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0f3460');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  
  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#16c79a';
  ctx.font = 'bold 28px "Courier New", monospace';
  ctx.fillText('COMMUNITY GALLERY', W / 2, 40);
  
  // Sort buttons
  const sortLabels = { recent: '1:Recent', popular: '2:Popular', 'top-rated': '3:Top Rated' };
  const sortBtns = [
    { x: 20, y: 70, w: 110, sort: 'recent' },
    { x: 140, y: 70, w: 110, sort: 'popular' },
    { x: 260, y: 70, w: 110, sort: 'top-rated' }
  ];
  
  for (const btn of sortBtns) {
    const isActive = gallerySort === btn.sort;
    ctx.fillStyle = isActive ? 'rgba(22,199,154,0.3)' : 'rgba(255,255,255,0.05)';
    roundRect(ctx, btn.x, btn.y, btn.w, 25, 4);
    ctx.fill();
    ctx.strokeStyle = isActive ? '#16c79a' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = isActive ? 2 : 1;
    roundRect(ctx, btn.x, btn.y, btn.w, 25, 4);
    ctx.stroke();
    ctx.fillStyle = isActive ? '#fff' : '#aaa';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(sortLabels[btn.sort], btn.x + btn.w / 2, btn.y + 17);
  }
  
  // Level cards
  if (galleryLevels.length === 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaa';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('No levels yet. Create one in the editor!', W / 2, H / 2);
  } else {
    const startY = 110;
    const cardH = 90;
    const visibleCards = Math.min(5, galleryLevels.length);
    
    for (let i = 0; i < visibleCards; i++) {
      const idx = galleryScroll + i;
      if (idx >= galleryLevels.length) break;
      
      const level = galleryLevels[idx];
      const cardY = startY + i * (cardH + 10);
      const isHighlighted = idx === galleryScroll;
      
      // Card background
      ctx.fillStyle = isHighlighted ? 'rgba(22,199,154,0.15)' : 'rgba(255,255,255,0.05)';
      roundRect(ctx, 10, cardY, W - 20, cardH, 6);
      ctx.fill();
      ctx.strokeStyle = isHighlighted ? '#16c79a' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = isHighlighted ? 2 : 1;
      roundRect(ctx, 10, cardY, W - 20, cardH, 6);
      ctx.stroke();
      
      // Thumbnail
      const thumb = renderLevelThumbnail(level);
      ctx.drawImage(thumb, 20, cardY + 5, 60, 80);
      
      // Level info
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px "Courier New", monospace';
      const nameText = level.metadata.name.length > 22 ? level.metadata.name.substring(0, 22) + '...' : level.metadata.name;
      ctx.fillText(nameText, 90, cardY + 20);
      
      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = '#aaa';
      const descText = level.metadata.description.length > 28 ? level.metadata.description.substring(0, 28) + '...' : level.metadata.description;
      ctx.fillText(descText || 'No description', 90, cardY + 35);
      
      // Difficulty badge
      const diffColors = { Easy: '#00ff88', Medium: '#ffd700', Hard: '#ff8c00', Expert: '#ff3333' };
      ctx.fillStyle = diffColors[level.metadata.difficulty] || '#aaa';
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.fillText(level.metadata.difficulty, 90, cardY + 50);
      
      // Stats
      ctx.fillStyle = '#888';
      ctx.font = '9px "Courier New", monospace';
      ctx.fillText('★ ' + level.rating.toFixed(1) + ' (' + level.ratingCount + ')', 90, cardY + 65);
      ctx.fillText('▶ ' + level.plays + ' plays', 90, cardY + 78);
      
      // Author
      ctx.fillStyle = '#666';
      ctx.font = '8px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('by ' + level.metadata.author, W - 20, cardY + 78);
    }
    
    // Scroll indicator
    if (galleryLevels.length > visibleCards) {
      ctx.fillStyle = '#555';
      ctx.font = '10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('↑↓ ' + (galleryScroll + 1) + '/' + galleryLevels.length, W / 2, H - 15);
    }
  }
  
  // Instructions
  ctx.fillStyle = '#aaa';
  ctx.font = '11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[Enter] Play | [L] Leaderboard | [1-3] Sort | [ESC] Back', W / 2, H - 35);
  
  // Leaderboard overlay (when viewing from gallery)
  if (showLeaderboard) {
    ctx.fillStyle = 'rgba(10,10,30,0.95)';
    ctx.fillRect(0, 0, W, H);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText('🏆 LEADERBOARD', W / 2, 50);
    
    // Show level name
    const level = LevelAPI.get(leaderboardLevelId);
    if (level) {
      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = '#16c79a';
      const nameText = level.metadata.name.length > 30 ? level.metadata.name.substring(0, 30) + '...' : level.metadata.name;
      ctx.fillText(nameText, W / 2, 80);
    }
    
    if (leaderboardScores.length === 0) {
      ctx.fillStyle = '#aaa';
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText('No scores yet. Be the first!', W / 2, H / 2);
    } else {
      const startY = 120;
      const lineH = 42;
      
      // Header
      ctx.textAlign = 'left';
      ctx.fillStyle = '#888';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillText('RANK', 30, startY - 10);
      ctx.fillText('PLAYER', 90, startY - 10);
      ctx.fillText('SCORE', W - 100, startY - 10);
      ctx.textAlign = 'right';
      ctx.fillText('DATE', W - 20, startY - 10);
      
      // Scores
      for (let i = 0; i < Math.min(10, leaderboardScores.length); i++) {
        const entry = leaderboardScores[i];
        const y = startY + i * lineH;
        
        // Rank
        ctx.textAlign = 'left';
        const rankColor = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#aaa';
        ctx.fillStyle = rankColor;
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText('#' + (i + 1), 30, y + 20);
        
        // Player name
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = '#ddd';
        const nameText = entry.playerName.length > 15 ? entry.playerName.substring(0, 15) + '...' : entry.playerName;
        ctx.fillText(nameText, 90, y + 20);
        
        // Score
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(entry.score.toString(), W - 100, y + 20);
        
        // Date
        ctx.textAlign = 'right';
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#888';
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        ctx.fillText(dateStr, W - 20, y + 20);
      }
    }
    
    ctx.textAlign = 'center';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('[ESC or Enter] Close', W / 2, H - 30);
  }
}

(function loop() { update(); draw(); requestAnimationFrame(loop); })();