// DOM-элементы
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('scoreDisplay');
const poopEatenSpan = document.getElementById('poopEatenDisplay');
const highScoreSpan = document.getElementById('highScoreDisplay');
const gameOverDiv = document.getElementById('gameOverText');
// Модальные окна
const startModal = document.getElementById('startModal');
const hungerBarBg = document.getElementById('hungerBarBg');
const hungerBarOverlay = document.getElementById('hungerBarOverlay');
const manaSpan = document.getElementById('manaDisplay');
const manaBarBg = document.getElementById('manaBarBg');
const phase2Modal = document.getElementById('phase2Modal');
const helpModal = document.getElementById('helpModal');
const startButton = document.getElementById('startButton');
const phase2Button = document.getElementById('phase2Button');
const cannibalModal = document.getElementById('cannibalModal');
const cannibalButton = document.getElementById('cannibalButton');
const helpButton = document.getElementById('helpButton');
const closeHelpButton = document.getElementById('closeHelpButton');
const abilitiesButton = document.getElementById('abilitiesButton');
const abilitiesModal = document.getElementById('abilitiesModal');
const abilitiesList = document.getElementById('abilitiesList');
const closeAbilitiesButton = document.getElementById('closeAbilitiesButton');
const abilitySlots = [
    document.getElementById('abilitySlot1'),
    document.getElementById('abilitySlot2'),
    document.getElementById('abilitySlot3')
];
const gameTimeSpan = document.getElementById('gameTimeDisplay');
let worldDiscoveredDown = false;
let gameTime = 0;                // прошедшее время активной игры (мс)
let lastTimeUpdate = 0;          // момент последнего обновления счётчика времени
const gameTimeDisplay = null;    // будет назначен позже

// ---------- Состояние ----------
let snake = [], prevSnake = [];
let gameOverLines = [];
let dir = { x: 0, y: 0 };
let score = 0, highScore = 0;
let mana = 0;
const MAX_MANA = 100;
let equippedAbilities = [null, null, null];   // три слота, пока доступен только 0
let abilityCooldowns = [0, 0, 0];             // время окончания кулдауна для каждого слота (performance.now())
let tailSegments = [];                        // сброшенные сегменты хвоста {x, y, life}
const MAX_MANA = 100;
let gameRunning = false, gameOverFlag = false;
let paused = false;
let pauseStartTime = 0;
let playerPoopsEaten = 0;
let foods = [], prevFoods = [];
let poops = [];
let applesEaten = 0;
let poisonActive = false, lastPoisonCheck = 0;
let pill = null;
let sickParticles = [];
let lastAppleTime = 0;           // время последнего съеденного яблока
let isStarving = false;          // флаг голода
let lastHungerTick = 0;          // для точного штрафа по секундам
let poopSnake = [], prevPoopSnake = [];
let poopSnakeActive = false, poopSnakeDir = { x: 0, y: 0 };
let poopSnakeNextThreshold = CONFIG.poopThresholdStart;
let poopSnakeJustSpawned = false;
let warningActive = false, warningPulse = 0, spawnSide = -1;
let poopSnakeMessageText = '', poopSnakeMessageUntil = 0;

let bullet = null, prevBullet = null;
let sanitationCharges = 0;
let nextSanitationScore = 1000;
let sanitationMilestoneReached = false;
let jailMode = false, jailSnake = [], jailPrevSnake = [];
let jailDir = { x: 0, y: 0 };
let jailStartTime = 0;
let awaitingJailStart = false;
let awaitingJailReason = '';
let jailCountdown = false, jailCountdownValue = 0, jailCountdownStart = 0;

let worldDiscovered = false;

let egg = null, eggCooldown = 0;
let firstEggLaid = false, eggAppleCounter = 0;
let lastEggTime = 0;  
let babySnakes = [], babyPrevSnakes = [], babyDirections = [];
let babyFleeing = [];   // true, если детёныш убегает к границе после укуса
let awaitingHatch = false;
let hadBabies = false;

let vultures = [], prevVultures = [];
let vulturesPerWave = 1, vultureMoveCounter = 0;

let laserStart = 0, laserEndX = 0, laserEndY = 0;
let flashStart = 0;
const FLASH_DURATION = 300;
const LASER_DURATION = 200;

// Очереди поворотов (макс. длина 2)
let moveQueue = [];
let jailMoveQueue = [];

let lastUpdateTime = 0, animationFrameId = null;

// Загрузка рекорда
if (localStorage.getItem('snakeHighScore')) {
    highScore = parseInt(localStorage.getItem('snakeHighScore'));
    highScoreSpan.textContent = highScore;
}
