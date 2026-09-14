const cells = [...document.querySelectorAll('.cell')];
const statusText = document.querySelector('#status-text');
const turnIndicator = document.querySelector('.turn-indicator');
const scoreX = document.querySelector('#score-x');
const scoreO = document.querySelector('#score-o');
const scoreCards = [...document.querySelectorAll('.score-card')];
const newRoundButton = document.querySelector('#new-round');
const pauseButton = document.querySelector('#pause-game');
const resetMatchButton = document.querySelector('#reset-match');
const nameX = document.querySelector('#name-x');
const nameO = document.querySelector('#name-o');
const leaderboardBody = document.querySelector('#leaderboard-body');
const welcomeModal = document.querySelector('#welcome-modal');
const welcomeForm = document.querySelector('#welcome-form');
const loadingScreen = document.querySelector('#loading-screen');
const themeToggle = document.querySelector('#theme-toggle');
const clearDataButton = document.querySelector('#clear-data');
const confettiLayer = document.querySelector('#confetti-layer');
const gameView = document.querySelector('#game-view');
const dashboardView = document.querySelector('#dashboard-view');
const gameNav = document.querySelector('#game-nav');
const dashboardNav = document.querySelector('#dashboard-nav');
const leaderboardNav = document.querySelector('#leaderboard-nav');
const playersNav = document.querySelector('#players-nav');
const settingsNav = document.querySelector('#settings-nav');
const gamesView = document.querySelector('#games-view');
const dominoView = document.querySelector('#domino-view');
const leaderboardsView = document.querySelector('#leaderboards-view');
const playersView = document.querySelector('#players-view');
const settingsView = document.querySelector('#settings-view');
const playXoButton = document.querySelector('#play-xo');
const playDominoesButton = document.querySelector('#play-dominoes');
const dominoBackButton = document.querySelector('#domino-back');
const dominoNewButton = document.querySelector('#domino-new');
const dominoStatus = document.querySelector('#domino-status');
const dominoChain = document.querySelector('#domino-chain');
const dominoPlayerHand = document.querySelector('#domino-player-hand');
const dominoOpponentHand = document.querySelector('#domino-opponent-hand');
const dominoOpponentLabel = document.querySelector('#domino-opponent-label');
const dominoTurnLabel = document.querySelector('#domino-turn-label');
const dominoMoveHint = document.querySelector('#domino-move-hint');
const dominoDrawButton = document.querySelector('#domino-draw');
const dominoPassButton = document.querySelector('#domino-pass');
const dominoStockCount = document.querySelector('#domino-stock-count');
const dominoNameX = document.querySelector('#domino-name-x');
const dominoNameO = document.querySelector('#domino-name-o');
const dominoScoreX = document.querySelector('#domino-score-x');
const dominoScoreO = document.querySelector('#domino-score-o');
const dominoStartScreen = document.querySelector('#domino-start-screen');
const dominoStartCopy = document.querySelector('#domino-start-copy');
const dominoCountdown = document.querySelector('#domino-countdown');
const overallLeaderboardBody = document.querySelector('#overall-leaderboard-body');
const dominoLeaderboardBody = document.querySelector('#domino-leaderboard-body');
const publicPlayerGrid = document.querySelector('#public-player-grid');
const overallTab = document.querySelector('#overall-tab');
const dominoesTab = document.querySelector('#dominoes-tab');
const overallLeaderboardWrap = document.querySelector('#overall-leaderboard-wrap');
const dominoLeaderboardWrap = document.querySelector('#domino-leaderboard-wrap');
const settingsThemeButton = document.querySelector('#settings-theme');
const settingsClearButton = document.querySelector('#settings-clear');
const totalPlayers = document.querySelector('#total-players');
const totalGames = document.querySelector('#total-games');
const totalWins = document.querySelector('#total-wins');
const highestScore = document.querySelector('#highest-score');
const gameModeSelect = document.querySelector('#game-mode');
const difficultyField = document.querySelector('#difficulty-field');
const difficultySelect = document.querySelector('#ai-difficulty');

const STORAGE_KEY = 'xo-game-data-v1';
const THEME_KEY = 'xo-theme';
const PRIVATE_ID_PATTERN = /^[A-Za-z0-9_-]{4,24}$/;
const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

let board = Array(9).fill('');
let currentPlayer = 'X';
let scores = { X: 0, O: 0 };
let players = { X: null, O: null };
let accounts = [];
let roundOver = false;
let paused = false;
let nextRoundTimer;
let sessionMode = 'pvp';
let sessionDifficulty = 'normal';
let pendingAiTimer;
let aiThinking = false;

function readStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function normalizeName(name) { return name.trim().replace(/\s+/g, ' '); }
function accountKey(name) { return normalizeName(name).toLocaleLowerCase(); }

function makeAccount(name, source = {}) {
  const now = new Date().toISOString();
  return {
    name: normalizeName(name),
    privateId: source.privateId || source.id || '',
    bestScore: Number(source.bestScore) || 0,
    lastScore: Number(source.lastScore ?? source.latestScore) || 0,
    gamesPlayed: Number(source.gamesPlayed) || 0,
    wins: Number(source.wins) || 0,
    winStreak: Number(source.winStreak) || 0,
    xp: Number(source.xp) || 0,
    level: Number(source.level) || 1,
    achievements: Array.isArray(source.achievements) ? source.achievements : [],
    matchHistory: Array.isArray(source.matchHistory) ? source.matchHistory : [],
    dominoes: source.dominoes || { gamesPlayed: 0, wins: 0, losses: 0, bestScore: 0, winStreak: 0, bestStreak: 0, achievements: [], matchHistory: [] },
    aiStats: source.aiStats || { xo: {}, dominoes: {} },
    createdDate: source.createdDate || now,
    lastPlayedDate: source.lastPlayedDate || null
  };
}

function loadAccounts(savedData) {
  if (Array.isArray(savedData.accounts)) return savedData.accounts.map((account) => makeAccount(account.name, account));
  const migrated = Object.values(savedData.playerRecords || {}).map((record) => makeAccount(record.name, record));
  const oldPlayers = Object.values(savedData.players || {}).filter(Boolean);
  oldPlayers.forEach((name) => {
    if (!migrated.some((account) => accountKey(account.name) === accountKey(name))) migrated.push(makeAccount(name));
  });
  return migrated;
}

function saveStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ accounts }));
}

function applyTheme(theme = localStorage.getItem(THEME_KEY) || 'light') {
  const dark = theme === 'dark';
  document.body.classList.toggle('dark', dark);
  themeToggle.textContent = dark ? '☀' : '☾';
  themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#202b2b' : '#f5f1e8');
}

function aiName() { return `AI · ${sessionDifficulty[0].toUpperCase()}${sessionDifficulty.slice(1)}`; }
function aiPersonality() { return { easy: 'Let’s see...', normal: 'Your move.', hard: 'Interesting.', expert: 'Think carefully.', master: 'I’ve got a plan.', impossible: 'Your move.' }[sessionDifficulty] || 'Your move.'; }
function playerName(mark) { return players[mark]?.name || (mark === 'O' && sessionMode === 'ai' ? aiName() : `Player ${mark}`); }

function recordAiResult(account, game, difficulty, result, score = 0) {
  if (!account) return;
  const stats = account.aiStats[game][difficulty] || { games: 0, wins: 0, losses: 0, draws: 0, bestScore: 0, streak: 0, bestStreak: 0 };
  stats.games += 1;
  stats.bestScore = Math.max(stats.bestScore, score);
  if (result === 'win') { stats.wins += 1; stats.streak += 1; stats.bestStreak = Math.max(stats.bestStreak, stats.streak); }
  else { if (result === 'loss') stats.losses += 1; if (result === 'draw') stats.draws += 1; stats.streak = 0; }
  account.aiStats[game][difficulty] = stats;
}

function updateTurnUI() {
  statusText.textContent = `${playerName(currentPlayer)}'s turn`;
  turnIndicator.style.background = currentPlayer === 'X' ? 'var(--coral)' : 'var(--teal)';
  scoreCards.forEach((card) => card.classList.toggle('active', card.dataset.player === currentPlayer));
}

function getWinningLine() {
  return winningLines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
}

function renderBoard() {
  cells.forEach((cell, index) => {
    const value = board[index];
    cell.textContent = value === 'X' ? '×' : value === 'O' ? '○' : '';
    cell.className = `cell${value ? ` ${value.toLowerCase()}` : ''}`;
    cell.disabled = Boolean(value) || roundOver || paused || aiThinking;
    cell.setAttribute('aria-label', `${cell.getAttribute('aria-label').split(',')[0]}, ${value ? `Player ${value}` : 'empty'}`);
  });
  pauseButton.disabled = roundOver || !players.X || (sessionMode !== 'ai' && !players.O);
  pauseButton.textContent = paused ? 'Resume' : 'Pause';
}

function renderPlayers() {
  nameX.textContent = playerName('X');
  nameO.textContent = playerName('O');
  scoreX.textContent = scores.X;
  scoreO.textContent = scores.O;
}

function sortedAccounts() {
  return [...accounts].sort((a, b) => b.bestScore - a.bestScore || b.wins - a.wins || a.name.localeCompare(b.name));
}

function renderDashboard() {
  const records = sortedAccounts();
  const games = Math.floor(records.reduce((sum, account) => sum + account.gamesPlayed, 0) / 2);
  totalPlayers.textContent = records.length;
  totalGames.textContent = games;
  totalWins.textContent = records.reduce((sum, account) => sum + account.wins, 0);
  highestScore.textContent = records.reduce((highest, account) => Math.max(highest, account.bestScore), 0);

  if (!records.length) {
    leaderboardBody.innerHTML = '<tr><td colspan="7" class="empty-leaderboard">Your first result will appear here.</td></tr>';
  } else {
    leaderboardBody.innerHTML = records.map((account, index) => `<tr><td>#${index + 1}</td><td>${escapeHtml(account.name)}</td><td>${account.bestScore}</td><td>${account.gamesPlayed}</td><td>${account.wins}</td><td>${account.level}</td><td>${account.achievements.length}</td></tr>`).join('');
  }
  renderOverallLeaderboard(records);
  renderDominoLeaderboard();
  renderPublicPlayers(records);
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }

function renderOverallLeaderboard(records = sortedAccounts()) {
  overallLeaderboardBody.innerHTML = records.length ? records.map((account, index) => `<tr><td>#${index + 1}</td><td>${escapeHtml(account.name)}</td><td>${account.bestScore}</td><td>${account.gamesPlayed}</td><td>${account.wins}</td><td>${account.level}</td></tr>`).join('') : '<tr><td colspan="6" class="empty-leaderboard">No players yet.</td></tr>';
}

function dominoStats(account) {
  if (!account.dominoes) account.dominoes = { gamesPlayed: 0, wins: 0, losses: 0, bestScore: 0, winStreak: 0, bestStreak: 0, achievements: [], matchHistory: [] };
  return account.dominoes;
}

function renderDominoLeaderboard() {
  const records = accounts.filter((account) => dominoStats(account).gamesPlayed > 0).sort((a, b) => dominoStats(b).bestScore - dominoStats(a).bestScore || dominoStats(b).wins - dominoStats(a).wins || a.name.localeCompare(b.name));
  dominoLeaderboardBody.innerHTML = records.length ? records.map((account, index) => { const stats = dominoStats(account); const rate = stats.gamesPlayed ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0; return `<tr><td>#${index + 1}</td><td>${escapeHtml(account.name)}</td><td>${stats.bestScore}</td><td>${stats.gamesPlayed}</td><td>${stats.wins}</td><td>${rate}%</td><td>${stats.winStreak}</td></tr>`; }).join('') : '<tr><td colspan="7" class="empty-leaderboard">Play a Dominoes match to enter the standings.</td></tr>';
}

function renderPublicPlayers(records = sortedAccounts()) {
  publicPlayerGrid.innerHTML = records.length ? records.map((account) => { const stats = dominoStats(account); const rate = stats.gamesPlayed ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0; return `<article class="public-player-card"><h2>${escapeHtml(account.name)}</h2><p>Level ${account.level} · ${account.achievements.length} achievements</p><p>Overall: ${account.wins} wins · ${account.gamesPlayed} games</p><p>Dominoes: ${stats.wins} wins · ${stats.gamesPlayed} games</p><p>Dominoes best: ${stats.bestScore} · ${rate}% win rate</p></article>`; }).join('') : '<p class="empty-leaderboard">No public player profiles yet.</p>';
}

function authFields(mark) {
  return {
    mode: document.querySelector(`#player-${mark.toLowerCase()}-mode`),
    name: document.querySelector(`#player-${mark.toLowerCase()}-name`),
    id: document.querySelector(`#player-${mark.toLowerCase()}-id`),
    confirm: document.querySelector(`#player-${mark.toLowerCase()}-id-confirm`),
    feedback: document.querySelector(`#player-${mark.toLowerCase()}-feedback`),
    confirmField: document.querySelector(`#player-${mark.toLowerCase()}-id-confirm`).closest('.confirm-field')
  };
}

function setFeedback(mark, message = '') {
  const feedback = authFields(mark).feedback;
  feedback.textContent = message;
  feedback.hidden = !message;
}

function updateAuthMode(mark) {
  const fields = authFields(mark);
  const isNew = fields.mode.value === 'new';
  fields.confirmField.hidden = !isNew;
  fields.confirm.required = isNew;
  fields.id.placeholder = isNew ? 'Choose a private ID' : 'Enter your private ID';
  setFeedback(mark);
}

function updateSessionMode() {
  sessionMode = gameModeSelect.value;
  sessionDifficulty = difficultySelect.value;
  difficultyField.hidden = sessionMode !== 'ai';
  const opponentField = document.querySelector('.player-auth[data-mark="O"]');
  opponentField.hidden = sessionMode === 'ai';
  ['player-o-name', 'player-o-id', 'player-o-id-confirm'].forEach((id) => { document.querySelector(`#${id}`).required = sessionMode !== 'ai' && (id !== 'player-o-id-confirm' || document.querySelector('#player-o-mode').value === 'new'); });
}

function validateCredentials(mark) {
  const fields = authFields(mark);
  const name = normalizeName(fields.name.value);
  const privateId = fields.id.value.trim();
  setFeedback(mark);
  if (!name || !PRIVATE_ID_PATTERN.test(privateId)) {
    setFeedback(mark, 'Enter a valid player name and private ID (4–24 letters, numbers, _ or -).');
    return null;
  }

  if (fields.mode.value === 'new') {
    if (privateId !== fields.confirm.value.trim()) {
      setFeedback(mark, 'Private IDs do not match.');
      return null;
    }
    if (accounts.some((account) => account.privateId === privateId)) {
      setFeedback(mark, 'This ID is already in use. Please choose another one.');
      return null;
    }
    return { name, privateId, existing: null };
  }

  const existing = accounts.find((account) => accountKey(account.name) === accountKey(name) && account.privateId === privateId);
  if (!existing) {
    setFeedback(mark, 'Invalid player name or ID.');
    return null;
  }
  return { name, privateId, existing };
}

const dominoState = { hands: { X: [], O: [] }, stock: [], chain: [], ends: [null, null], current: 'X', scores: { X: 0, O: 0 }, consecutivePasses: 0, active: false, aiThinking: false, matchStart: 0 };
let dominoIntroTimers = [];

function createDominoSet() {
  const tiles = [];
  for (let left = 0; left <= 6; left += 1) for (let right = left; right <= 6; right += 1) tiles.push({ id: `d-${left}-${right}`, left, right });
  return tiles;
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [result[index], result[swap]] = [result[swap], result[index]]; }
  return result;
}

function dotMarkup(value) {
  const positions = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  return Array.from({ length: 9 }, (_, index) => `<span class="${positions[value].includes(index) ? 'pip' : ''}"></span>`).join('');
}

function dominoMarkup(tile, options = {}) {
  const { hidden = false, interactive = false, valid = true, angle = 0, horizontal = false, className = '' } = options;
  if (hidden) return `<span class="back-tile" style="--tilt: ${angle}deg"></span>`;
  const tag = interactive ? 'button' : 'span';
  const attributes = interactive ? ` type="button" data-domino-tile-id="${tile.id}" aria-label="Domino ${tile.left} to ${tile.right}"` : '';
  return `<${tag} class="domino-piece${horizontal ? ' horizontal' : ''}${valid ? '' : ' invalid'} ${className}" style="--angle: ${angle}deg"${attributes}><span class="domino-half">${dotMarkup(tile.left)}</span><span class="domino-half">${dotMarkup(tile.right)}</span></${tag}>`;
}

function dominoTilePlayable(tile) {
  return !dominoState.chain.length || tile.left === dominoState.ends[0] || tile.right === dominoState.ends[0] || tile.left === dominoState.ends[1] || tile.right === dominoState.ends[1];
}

function dominoPips(tile) { return tile.left + tile.right; }

function renderDomino() {
  if (!dominoState.active) return;
  const current = dominoState.current;
  const other = current === 'X' ? 'O' : 'X';
  const visibleHandMark = sessionMode === 'ai' ? 'X' : current;
  dominoNameX.textContent = playerName('X');
  dominoNameO.textContent = playerName('O');
  dominoScoreX.textContent = dominoState.scores.X;
  dominoScoreO.textContent = dominoState.scores.O;
  dominoStockCount.textContent = dominoState.stock.length;
  document.querySelectorAll('[data-domino-player]').forEach((card) => card.classList.toggle('active', card.dataset.dominoPlayer === current));
  dominoOpponentLabel.textContent = `${playerName(sessionMode === 'ai' ? 'O' : other)}'s hand`;
  dominoOpponentHand.innerHTML = dominoState.hands[sessionMode === 'ai' ? 'O' : other].map((_, index) => dominoMarkup(null, { hidden: true, angle: [-9, -5, -2, 3, 6, 9, 12][index] || 0 })).join('');
  const handAngles = [-16, -11, -7, -2, 3, 8, 13];
  dominoPlayerHand.innerHTML = dominoState.hands[visibleHandMark].map((tile, index) => dominoMarkup(tile, { interactive: sessionMode !== 'ai' || current === 'X', valid: dominoTilePlayable(tile), angle: handAngles[index] || 0, className: `hand-tile-${index}`, horizontal: false })).join('');
  dominoChain.innerHTML = dominoState.chain.length ? dominoState.chain.map((tile, index) => dominoMarkup(tile, { angle: index % 4 === 2 ? 90 : 0, horizontal: index % 4 === 2, className: `chain-tile-${index}` })).join('') : '<span class="domino-empty">The first tile opens the table.</span>';
  dominoTurnLabel.textContent = `${playerName(visibleHandMark)}'s hand`;
  const hasMove = dominoState.hands[current].some(dominoTilePlayable);
  dominoMoveHint.textContent = sessionMode === 'ai' && current === 'O' ? `${aiPersonality()} ${aiName()} is thinking...` : hasMove ? 'Choose a playable tile' : dominoState.stock.length ? 'No match. Draw a tile.' : 'No match. Pass the turn.';
  if (!dominoState.aiThinking) dominoStatus.textContent = `${playerName(current)}'s turn`;
  dominoDrawButton.disabled = hasMove || !dominoState.stock.length;
  dominoPassButton.disabled = hasMove || dominoState.stock.length > 0;
  if (sessionMode === 'ai' && current === 'O') { dominoDrawButton.disabled = true; dominoPassButton.disabled = true; }
  dominoPlayerHand.querySelectorAll('[data-domino-tile-id]').forEach((tileButton) => tileButton.addEventListener('click', () => playDominoTile(tileButton.dataset.dominoTileId)));
}

function placeDomino(tile) {
  if (!dominoState.chain.length) {
    dominoState.chain.push(tile);
    dominoState.ends = [tile.left, tile.right];
    return;
  }
  const leftMatch = tile.left === dominoState.ends[0] || tile.right === dominoState.ends[0];
  const otherValue = (end) => tile.left === end ? tile.right : tile.left;
  if (tile.right === dominoState.ends[1] || tile.left === dominoState.ends[1]) {
    dominoState.chain.push(tile);
    dominoState.ends[1] = otherValue(dominoState.ends[1]);
  } else if (leftMatch) {
    dominoState.chain.unshift(tile);
    dominoState.ends[0] = otherValue(dominoState.ends[0]);
  }
}

function switchDominoTurn() {
  dominoState.current = dominoState.current === 'X' ? 'O' : 'X';
  renderDomino();
  scheduleDominoAiTurn();
}

function playDominoTile(tileId) {
  if (!dominoState.active || dominoState.roundOver) return;
  const hand = dominoState.hands[dominoState.current];
  const tileIndex = hand.findIndex((tile) => tile.id === tileId);
  if (tileIndex < 0 || !dominoTilePlayable(hand[tileIndex])) { dominoStatus.textContent = 'That tile cannot connect here'; return; }
  const [tile] = hand.splice(tileIndex, 1);
  placeDomino(tile);
  dominoState.consecutivePasses = 0;
  if (!hand.length) { finishDominoRound(dominoState.current); return; }
  switchDominoTurn();
}

function drawDominoTile() {
  const hand = dominoState.hands[dominoState.current];
  if (!dominoState.stock.length || hand.some(dominoTilePlayable)) return;
  hand.push(dominoState.stock.pop());
  renderDomino();
}

function passDominoTurn() {
  const hand = dominoState.hands[dominoState.current];
  if (dominoState.stock.length || hand.some(dominoTilePlayable)) return;
  dominoState.consecutivePasses += 1;
  if (dominoState.consecutivePasses >= 2) { finishDominoRound(); return; }
  switchDominoTurn();
}

function dominoMoveScore(tile, hand, ends) {
  const remaining = hand.filter((candidate) => candidate.id !== tile.id);
  const flexible = remaining.reduce((score, candidate) => score + (candidate.left === tile.left || candidate.right === tile.left || candidate.left === tile.right || candidate.right === tile.right ? 1 : 0), 0);
  const control = (tile.left === tile.right ? 3 : 0) + tile.left + tile.right;
  return flexible * 7 - (tile.left + tile.right) * 2 + control + (ends.includes(tile.left) || ends.includes(tile.right) ? 5 : 0);
}

function chooseDominoAiTile() {
  const hand = dominoState.hands.O;
  const moves = hand.filter(dominoTilePlayable);
  if (!moves.length) return null;
  if (sessionDifficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];
  const ranked = moves.map((tile) => ({ tile, score: dominoMoveScore(tile, hand, dominoState.ends) + (Math.random() * (sessionDifficulty === 'normal' ? 14 : sessionDifficulty === 'hard' ? 5 : 1)) }));
  if (sessionDifficulty === 'normal') return ranked.sort((a, b) => b.score - a.score)[0].tile;
  if (sessionDifficulty === 'hard') return ranked.sort((a, b) => b.score - a.score)[0].tile;
  const searchDepth = sessionDifficulty === 'expert' ? 2 : sessionDifficulty === 'master' ? 3 : 4;
  function search(available, ends, depth) {
    if (!available.length || depth === 0) return -available.reduce((sum, tile) => sum + dominoPips(tile), 0);
    let best = -Infinity;
    available.filter((tile) => !dominoState.chain.length || tile.left === ends[0] || tile.right === ends[0] || tile.left === ends[1] || tile.right === ends[1]).forEach((tile) => {
      const nextEnds = [...ends];
      if (!dominoState.chain.length) nextEnds.splice(0, 2, tile.left, tile.right);
      else if (tile.left === ends[0] || tile.right === ends[0]) nextEnds[0] = tile.left === ends[0] ? tile.right : tile.left;
      else nextEnds[1] = tile.left === ends[1] ? tile.right : tile.left;
      best = Math.max(best, dominoMoveScore(tile, available, ends) + search(available.filter((candidate) => candidate.id !== tile.id), nextEnds, depth - 1));
    });
    return best;
  }
  return moves.sort((a, b) => search([b], dominoState.ends, searchDepth) - search([a], dominoState.ends, searchDepth))[0];
}

function scheduleDominoAiTurn() {
  if (sessionMode !== 'ai' || dominoState.current !== 'O' || !dominoState.active || dominoState.roundOver) return;
  dominoState.aiThinking = true;
  dominoStatus.textContent = `${aiPersonality()} ${aiName()} is thinking...`;
  const delays = { easy: 400, normal: 600, hard: 800, expert: 1000, master: 1200, impossible: 1450 };
  setTimeout(() => {
    if (!dominoState.active || dominoState.roundOver || dominoState.current !== 'O') return;
    const move = chooseDominoAiTile();
    if (move) { dominoState.aiThinking = false; playDominoTile(move.id); return; }
    if (dominoState.stock.length) { dominoState.hands.O.push(dominoState.stock.pop()); dominoState.aiThinking = false; renderDomino(); scheduleDominoAiTurn(); return; }
    dominoState.aiThinking = false;
    passDominoTurn();
  }, delays[sessionDifficulty] || 600);
}

function startDominoRound(resetScores = false) {
  if (resetScores) dominoState.scores = { X: 0, O: 0 };
  const deck = shuffle(createDominoSet());
  dominoState.hands = { X: deck.splice(0, 7), O: deck.splice(0, 7) };
  dominoState.stock = deck;
  dominoState.chain = [];
  dominoState.ends = [null, null];
  dominoState.current = 'X';
  dominoState.consecutivePasses = 0;
  dominoState.active = true;
  dominoState.roundOver = false;
  dominoState.aiThinking = false;
  dominoState.matchStart = Date.now();
  renderDomino();
}

function finishDominoRound(winner = null) {
  dominoState.roundOver = true;
  const remaining = { X: dominoState.hands.X.reduce((sum, tile) => sum + dominoPips(tile), 0), O: dominoState.hands.O.reduce((sum, tile) => sum + dominoPips(tile), 0) };
  if (!winner && remaining.X !== remaining.O) winner = remaining.X < remaining.O ? 'X' : 'O';
  const roundScore = winner ? Math.max(1, Math.abs(remaining.X - remaining.O)) : 0;
  if (winner) dominoState.scores[winner] += roundScore;
  const winnerText = winner ? `${playerName(winner)} wins with ${roundScore} points` : 'The table is blocked · draw';
  dominoStatus.textContent = winnerText;
  if (winner) {
    const winnerCard = document.querySelector(`[data-domino-player="${winner}"]`);
    winnerCard.classList.add('domino-winner');
    setTimeout(() => winnerCard.classList.remove('domino-winner'), 950);
  }
  recordDominoMatch(winner, roundScore);
  renderDomino();
  setTimeout(() => startDominoRound(false), 1400);
}

function recordDominoMatch(winner, roundScore) {
  const matchId = `DM-${Date.now().toString(36).toUpperCase()}`;
  const duration = Math.max(1, Math.round((Date.now() - dominoState.matchStart) / 1000));
  const match = { matchId, date: new Date().toISOString(), players: [playerName('X'), playerName('O')], winner: winner ? playerName(winner) : 'Draw', scores: { X: dominoState.scores.X, O: dominoState.scores.O }, duration };
  const recordedMarks = sessionMode === 'ai' ? ['X'] : ['X', 'O'];
  recordedMarks.forEach((mark) => {
    const stats = dominoStats(players[mark]);
    const won = winner === mark;
    stats.gamesPlayed += 1;
    stats.bestScore = Math.max(stats.bestScore, roundScore);
    if (won) {
      stats.wins += 1;
      stats.winStreak += 1;
      stats.bestStreak = Math.max(stats.bestStreak, stats.winStreak);
      if (stats.wins >= 1) recordAchievement(stats, 'First Domino Win');
      if (stats.wins >= 5) recordAchievement(stats, '5 Domino Wins');
      if (stats.wins >= 10) recordAchievement(stats, '10 Domino Wins');
      if (stats.bestStreak >= 5) recordAchievement(stats, '5 Win Streak');
    } else {
      if (winner) stats.losses += 1;
      stats.winStreak = 0;
    }
    if (stats.bestScore >= 20) recordAchievement(stats, 'High Score');
    if (stats.wins >= 20) recordAchievement(stats, 'Domino Master');
    stats.matchHistory.unshift(match);
    stats.matchHistory = stats.matchHistory.slice(0, 20);
  });
  if (sessionMode === 'ai') recordAiResult(players.X, 'dominoes', sessionDifficulty, winner === 'X' ? 'win' : winner === 'O' ? 'loss' : 'draw', roundScore);
  saveStorage();
  renderDashboard();
}

function startDominoExperience() {
  dominoIntroTimers.forEach((timer) => clearTimeout(timer));
  showView('domino');
  dominoStartScreen.hidden = false;
  dominoStartCopy.textContent = 'Welcome to the table';
  dominoCountdown.textContent = '';
  dominoIntroTimers.push(setTimeout(() => { dominoStartCopy.textContent = 'Get ready'; dominoCountdown.textContent = '3'; }, 350));
  dominoIntroTimers.push(setTimeout(() => { dominoCountdown.textContent = '2'; }, 700));
  dominoIntroTimers.push(setTimeout(() => { dominoCountdown.textContent = '1'; }, 1050));
  dominoIntroTimers.push(setTimeout(() => { dominoStartCopy.textContent = 'Make your move'; dominoCountdown.textContent = 'GO!'; }, 1400));
  dominoIntroTimers.push(setTimeout(() => { dominoStartScreen.hidden = true; startDominoRound(true); }, 1700));
}

function recordAchievement(account, label) {
  if (!account.achievements.includes(label)) account.achievements.push(label);
}

function updateProgress(account, opponent, result, score) {
  account.gamesPlayed += 1;
  account.lastScore = score;
  account.bestScore = Math.max(account.bestScore, score);
  account.lastPlayedDate = new Date().toISOString();
  account.matchHistory.unshift({ opponent, result, score, date: account.lastPlayedDate });
  account.matchHistory = account.matchHistory.slice(0, 20);
  if (result === 'win') {
    account.wins += 1;
    account.winStreak += 1;
    account.xp += 100;
    account.level = 1 + Math.floor(account.xp / 500);
    recordAchievement(account, 'First win');
    if (account.winStreak >= 3) recordAchievement(account, 'Hot streak');
    if (account.wins >= 10) recordAchievement(account, 'Ten wins');
  } else {
    account.winStreak = 0;
  }
}

function recordRound(winner) {
  const winnerMark = winner || '';
  const resultFor = (mark) => winner ? (winnerMark === mark ? 'win' : 'loss') : 'draw';
  ['X', 'O'].forEach((mark) => {
    const account = players[mark];
    if (account) updateProgress(account, playerName(mark === 'X' ? 'O' : 'X'), resultFor(mark), scores[mark]);
  });
  if (sessionMode === 'ai') recordAiResult(players.X, 'xo', sessionDifficulty, winner === 'X' ? 'win' : winner === 'O' ? 'loss' : 'draw', scores.X);
  saveStorage();
  renderDashboard();
}

function celebrate(winner) {
  document.querySelector(`.score-card[data-player="${winner}"]`).classList.add('winner-card');
  const colors = ['var(--coral)', 'var(--teal)', 'var(--yellow)'];
  for (let index = 0; index < 18; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${45 + Math.random() * 10}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty('--x', `${(Math.random() - 0.5) * 340}px`);
    piece.style.animationDelay = `${Math.random() * 100}ms`;
    confettiLayer.appendChild(piece);
  }
  setTimeout(() => { confettiLayer.replaceChildren(); document.querySelectorAll('.winner-card').forEach((card) => card.classList.remove('winner-card')); }, 850);
}

function finishRound(winner, winningLine = []) {
  roundOver = true;
  winningLine.forEach((index) => cells[index].classList.add('winner'));
  if (winner) {
    scores[winner] += 1;
    renderPlayers();
    statusText.textContent = `${playerName(winner)} wins the round`;
    turnIndicator.style.background = winner === 'X' ? 'var(--coral)' : 'var(--teal)';
    celebrate(winner);
  } else {
    statusText.textContent = "It's a draw";
    turnIndicator.style.background = 'var(--yellow)';
  }
  recordRound(winner);
  clearTimeout(nextRoundTimer);
  nextRoundTimer = setTimeout(startRound, 950);
}

function xoAvailableMoves(state) { return state.map((value, index) => value ? -1 : index).filter((index) => index >= 0); }
function xoWinner(state) { return winningLines.find(([a, b, c]) => state[a] && state[a] === state[b] && state[a] === state[c]); }
function minimaxXo(state, maximizing, depth, alpha = -Infinity, beta = Infinity) {
  const line = xoWinner(state);
  if (line) return state[line[0]] === 'O' ? 10 + depth : depth - 10;
  const moves = xoAvailableMoves(state);
  if (!moves.length || depth <= 0) return state.reduce((score, value) => score + (value === 'O' ? 1 : value === 'X' ? -1 : 0), 0);
  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) { state[move] = 'O'; best = Math.max(best, minimaxXo(state, false, depth - 1, alpha, beta)); state[move] = ''; alpha = Math.max(alpha, best); if (beta <= alpha) break; }
    return best;
  }
  let best = Infinity;
  for (const move of moves) { state[move] = 'X'; best = Math.min(best, minimaxXo(state, true, depth - 1, alpha, beta)); state[move] = ''; beta = Math.min(beta, best); if (beta <= alpha) break; }
  return best;
}

function chooseXoAiMove() {
  const moves = xoAvailableMoves(board);
  if (!moves.length) return -1;
  const immediate = (mark) => moves.find((move) => { board[move] = mark; const win = Boolean(xoWinner(board)); board[move] = ''; return win; });
  if (['normal', 'hard', 'expert', 'master', 'impossible'].includes(sessionDifficulty)) {
    const winning = immediate('O'); if (winning !== undefined) return winning;
    const block = immediate('X'); if (block !== undefined) return block;
  }
  if (sessionDifficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];
  if (sessionDifficulty === 'normal') {
    if (moves.includes(4) && Math.random() > 0.2) return 4;
    const corners = moves.filter((move) => [0, 2, 6, 8].includes(move));
    return corners.length && Math.random() > 0.35 ? corners[Math.floor(Math.random() * corners.length)] : moves[Math.floor(Math.random() * moves.length)];
  }
  const depth = sessionDifficulty === 'hard' ? 3 : sessionDifficulty === 'expert' ? 5 : 9;
  let bestScore = -Infinity; let bestMoves = [];
  moves.forEach((move) => { board[move] = 'O'; const score = minimaxXo(board, false, depth); board[move] = ''; if (score > bestScore) { bestScore = score; bestMoves = [move]; } else if (score === bestScore) bestMoves.push(move); });
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function scheduleXoAiMove() {
  if (sessionMode !== 'ai' || currentPlayer !== 'O' || roundOver) return;
  clearTimeout(pendingAiTimer);
  aiThinking = true;
  statusText.textContent = `${aiPersonality()} ${aiName()} is thinking...`;
  renderBoard();
  const delays = { easy: 450, normal: 650, hard: 850, expert: 1050, master: 1250, impossible: 1450 };
  pendingAiTimer = setTimeout(() => {
    if (roundOver || currentPlayer !== 'O') return;
    const move = chooseXoAiMove();
    aiThinking = false;
    if (move >= 0) { board[move] = 'O'; renderBoard(); }
    const winningLine = getWinningLine();
    if (winningLine) { finishRound('O', winningLine); return; }
    if (board.every(Boolean)) { finishRound(); return; }
    currentPlayer = 'X';
    updateTurnUI();
    renderBoard();
  }, delays[sessionDifficulty] || 650);
}

function playCell(event) {
  const index = Number(event.currentTarget.dataset.index);
  if (board[index] || roundOver || paused || !players.X || (sessionMode !== 'ai' && !players.O)) return;
  board[index] = currentPlayer;
  renderBoard();
  const winningLine = getWinningLine();
  if (winningLine) { finishRound(currentPlayer, winningLine); return; }
  if (board.every(Boolean)) { finishRound(); return; }
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateTurnUI();
  scheduleXoAiMove();
}

function startRound() {
  clearTimeout(nextRoundTimer);
  board = Array(9).fill('');
  currentPlayer = 'X';
  roundOver = false;
  paused = false;
  aiThinking = false;
  clearTimeout(pendingAiTimer);
  renderBoard();
  renderPlayers();
  updateTurnUI();
}

function resetMatch() {
  scores = { X: 0, O: 0 };
  startRound();
}

function togglePause() {
  if (roundOver || !players.X || !players.O) return;
  paused = !paused;
  if (paused) statusText.textContent = `${playerName(currentPlayer)}'s game is paused`;
  else updateTurnUI();
  renderBoard();
}

function clearCredentials() {
  ['X', 'O'].forEach((mark) => {
    const fields = authFields(mark);
    fields.id.value = '';
    fields.confirm.value = '';
    fields.id.type = 'password';
    fields.confirm.type = 'password';
    document.querySelectorAll(`[data-target="${fields.id.id}"], [data-target="${fields.confirm.id}"]`).forEach((button) => { button.textContent = 'Show'; });
  });
}

function openWelcome() {
  welcomeModal.hidden = false;
  document.body.classList.add('modal-open');
  welcomeForm.reset();
  gameModeSelect.value = 'pvp';
  difficultySelect.value = 'normal';
  updateSessionMode();
  clearCredentials();
  ['X', 'O'].forEach((mark) => updateAuthMode(mark));
  document.querySelector('#player-x-name').focus();
}

function clearData() {
  if (!confirm('Clear saved player accounts, scores, and leaderboard data?')) return;
  localStorage.removeItem(STORAGE_KEY);
  accounts = [];
  players = { X: null, O: null };
  scores = { X: 0, O: 0 };
  renderDashboard();
  renderPlayers();
  openWelcome();
}

function showView(view) {
  const views = { games: gamesView, game: gameView, domino: dominoView, dashboard: dashboardView, leaderboards: leaderboardsView, players: playersView, settings: settingsView };
  Object.entries(views).forEach(([name, element]) => { element.hidden = name !== view; });
  [gameNav, dashboardNav, leaderboardNav, playersNav, settingsNav].forEach((button) => button.classList.remove('active'));
  if (view === 'games' || view === 'game' || view === 'domino') gameNav.classList.add('active');
  if (view === 'dashboard') { dashboardNav.classList.add('active'); renderDashboard(); }
  if (view === 'leaderboards') { leaderboardNav.classList.add('active'); renderOverallLeaderboard(); renderDominoLeaderboard(); }
  if (view === 'players') { playersNav.classList.add('active'); renderPublicPlayers(); }
  if (view === 'settings') settingsNav.classList.add('active');
}

cells.forEach((cell) => cell.addEventListener('click', playCell));
newRoundButton.addEventListener('click', startRound);
pauseButton.addEventListener('click', togglePause);
resetMatchButton.addEventListener('click', resetMatch);
gameNav.addEventListener('click', () => showView('games'));
dashboardNav.addEventListener('click', () => showView('dashboard'));
leaderboardNav.addEventListener('click', () => showView('leaderboards'));
playersNav.addEventListener('click', () => showView('players'));
settingsNav.addEventListener('click', () => showView('settings'));
playXoButton.addEventListener('click', () => showView('game'));
playDominoesButton.addEventListener('click', startDominoExperience);
dominoBackButton.addEventListener('click', () => showView('games'));
dominoNewButton.addEventListener('click', startDominoExperience);
dominoDrawButton.addEventListener('click', drawDominoTile);
dominoPassButton.addEventListener('click', passDominoTurn);
themeToggle.addEventListener('click', () => {
  const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
});
settingsThemeButton.addEventListener('click', () => themeToggle.click());
clearDataButton.addEventListener('click', clearData);
settingsClearButton.addEventListener('click', clearData);
gameModeSelect.addEventListener('change', updateSessionMode);
document.querySelector('#ai-difficulty').addEventListener('change', () => { sessionDifficulty = difficultySelect.value; });
overallTab.addEventListener('click', () => { overallTab.classList.add('active'); dominoesTab.classList.remove('active'); overallLeaderboardWrap.hidden = false; dominoLeaderboardWrap.hidden = true; });
dominoesTab.addEventListener('click', () => { dominoesTab.classList.add('active'); overallTab.classList.remove('active'); overallLeaderboardWrap.hidden = true; dominoLeaderboardWrap.hidden = false; });
document.querySelectorAll('.player-mode').forEach((mode) => mode.addEventListener('change', () => updateAuthMode(mode.closest('.player-auth').dataset.mark)));
document.querySelectorAll('.show-secret').forEach((button) => button.addEventListener('click', () => {
  const input = document.querySelector(`#${button.dataset.target}`);
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  button.textContent = showing ? 'Show' : 'Hide';
  button.setAttribute('aria-label', `${showing ? 'Show' : 'Hide'} private ID`);
}));
welcomeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  updateSessionMode();
  const credentials = { X: validateCredentials('X'), O: sessionMode === 'ai' ? null : validateCredentials('O') };
  if (!credentials.X || (sessionMode !== 'ai' && !credentials.O)) return;
  if (sessionMode !== 'ai' && credentials.X.privateId === credentials.O.privateId) {
    setFeedback('O', 'Players must use different private IDs.');
    return;
  }
  players = {
    X: credentials.X.existing || makeAccount(credentials.X.name, { privateId: credentials.X.privateId }),
    O: sessionMode === 'ai' ? null : credentials.O.existing || makeAccount(credentials.O.name, { privateId: credentials.O.privateId })
  };
  players.X.name = credentials.X.name;
  if (players.O) players.O.name = credentials.O.name;
  if (!credentials.X.existing) accounts.push(players.X);
  if (sessionMode !== 'ai' && !credentials.O.existing) accounts.push(players.O);
  scores = { X: 0, O: 0 };
  saveStorage();
  renderDashboard();
  welcomeModal.hidden = true;
  document.body.classList.remove('modal-open');
  showView('games');
  startRound();
});

const savedData = readStorage();
accounts = loadAccounts(savedData);
const needsAccountMigration = !Array.isArray(savedData.accounts) || savedData.accounts.some((account) => !account.privateId);
if (needsAccountMigration && accounts.length) saveStorage();
applyTheme();
renderDashboard();
renderPlayers();
startRound();
showView('games');
setTimeout(() => { loadingScreen.remove(); openWelcome(); }, 1250);
