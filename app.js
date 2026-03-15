const STORAGE_KEY = "techno-signs-best-score";
const LANE_COUNT = 4;
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1440;
const LANE_AREA_TOP = 120;
const LANE_AREA_BOTTOM = 1210;
const JUDGE_LINE_Y = 1110;

const signs = [
  {
    id: "yield",
    meaning: "voorrang verlenen",
    hint: "Geef andere weggebruikers eerst voorrang.",
    shape: "triangle",
    theme: "#ffffff",
    border: "#e2353a",
    symbol: "yield",
  },
  {
    id: "no-parking",
    meaning: "niet parkeren",
    hint: "Je mag hier niet parkeren.",
    shape: "circle",
    theme: "#1f60d0",
    border: "#e2353a",
    symbol: "noParking",
  },
  {
    id: "no-stopping",
    meaning: "niet stilstaan",
    hint: "Niet stoppen of wachten.",
    shape: "circle",
    theme: "#1f60d0",
    border: "#e2353a",
    symbol: "noStopping",
  },
  {
    id: "straight",
    meaning: "verplicht rechtdoor",
    hint: "Je moet hier rechtdoor rijden.",
    shape: "circle",
    theme: "#1f60d0",
    border: "#ffffff",
    symbol: "straight",
  },
  {
    id: "no-entry",
    meaning: "verboden in te rijden",
    hint: "Je mag deze weg niet in.",
    shape: "circle",
    theme: "#db2f35",
    border: "#ffffff",
    symbol: "noEntry",
  },
  {
    id: "priority-road",
    meaning: "voorrangsweg",
    hint: "Deze weg heeft voorrang bij kruisingen.",
    shape: "diamond",
    theme: "#ffd54a",
    border: "#ffffff",
    symbol: "priorityRoad",
  },
  {
    id: "danger-turn",
    meaning: "gevaarlijke bocht",
    hint: "Pas op voor een scherpe bocht.",
    shape: "triangle",
    theme: "#ffffff",
    border: "#e2353a",
    symbol: "dangerTurn",
  },
  {
    id: "crosswalk",
    meaning: "voetgangersoversteekplaats",
    hint: "Let op overstekende voetgangers.",
    shape: "square",
    theme: "#1f60d0",
    border: "#ffffff",
    symbol: "crosswalk",
  },
  {
    id: "roundabout",
    meaning: "rotonde",
    hint: "Het verkeer rijdt in een rondje.",
    shape: "circle",
    theme: "#1f60d0",
    border: "#ffffff",
    symbol: "roundabout",
  },
  {
    id: "stop",
    meaning: "stop",
    hint: "Je moet helemaal stoppen.",
    shape: "octagon",
    theme: "#db2f35",
    border: "#ffffff",
    symbol: "stop",
  },
  {
    id: "speed-50",
    meaning: "maximumsnelheid 50",
    hint: "Harder dan 50 km/u mag niet.",
    shape: "circle",
    theme: "#ffffff",
    border: "#e2353a",
    symbol: "speed50",
  },
  {
    id: "one-way",
    meaning: "eenrichtingsverkeer",
    hint: "Verkeer mag maar een kant op.",
    shape: "square",
    theme: "#1f60d0",
    border: "#ffffff",
    symbol: "oneWay",
  },
];

const ui = {
  canvas: document.querySelector("#game-canvas"),
  score: document.querySelector("#score"),
  combo: document.querySelector("#combo"),
  lives: document.querySelector("#lives"),
  level: document.querySelector("#level"),
  bestScore: document.querySelector("#best-score"),
  tempo: document.querySelector("#tempo"),
  feedback: document.querySelector("#feedback"),
  startButton: document.querySelector("#start-button"),
  pauseButton: document.querySelector("#pause-button"),
  restartButton: document.querySelector("#restart-button"),
  leftButton: document.querySelector("#left-button"),
  rightButton: document.querySelector("#right-button"),
  laneButtons: document.querySelector("#lane-buttons"),
  signLegend: document.querySelector("#sign-legend"),
};

const ctx = ui.canvas.getContext("2d");

const state = {
  running: false,
  gameOver: false,
  score: 0,
  combo: 0,
  lives: 3,
  level: 1,
  correct: 0,
  bestScore: Number.parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10),
  bpm: 118,
  activeSign: null,
  laneOptions: [],
  laneTargetIndex: 0,
  queue: [],
  particles: [],
  beatPulse: 0,
  beatFlash: 0,
  laneFlash: Array.from({ length: LANE_COUNT }, () => 0),
  lastTimestamp: 0,
};

class TechnoEngine {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.noiseBuffer = null;
    this.nextStepTime = 0;
    this.stepIndex = 0;
    this.lookAhead = 0.18;
  }

  async start() {
    if (!window.AudioContext && !window.webkitAudioContext) {
      return;
    }

    if (!this.context) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioCtor();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.14;
      this.masterGain.connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.nextStepTime = this.context.currentTime + 0.05;
  }

  createNoiseBuffer() {
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 1, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  get stepDuration() {
    return 60 / state.bpm / 4;
  }

  update() {
    if (!state.running || !this.context) {
      return;
    }

    while (this.nextStepTime < this.context.currentTime + this.lookAhead) {
      this.scheduleStep(this.stepIndex, this.nextStepTime);
      this.nextStepTime += this.stepDuration;
      this.stepIndex = (this.stepIndex + 1) % 16;
    }
  }

  scheduleStep(step, time) {
    if (step % 4 === 0) {
      this.playKick(time);
      state.beatPulse = 1;
      state.beatFlash = 0.9;
    }

    if (step === 4 || step === 12) {
      this.playClap(time);
    }

    if (step % 2 === 0) {
      this.playHiHat(time);
    }

    const bassPattern = [
      55.0,
      55.0,
      65.41,
      55.0,
      82.41,
      65.41,
      55.0,
      73.42,
      55.0,
      55.0,
      65.41,
      55.0,
      98.0,
      82.41,
      73.42,
      65.41,
    ];
    if (step % 2 === 0) {
      this.playBass(time, bassPattern[step]);
    }
  }

  playKick(time) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(44, time + 0.22);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.8, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);

    osc.connect(gain).connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.26);
  }

  playClap(time) {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, time);
    filter.Q.value = 1.5;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.22, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    source.connect(filter).connect(gain).connect(this.masterGain);
    source.start(time);
    source.stop(time + 0.2);
  }

  playHiHat(time) {
    const source = this.context.createBufferSource();
    const highpass = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    source.buffer = this.noiseBuffer;
    highpass.type = "highpass";
    highpass.frequency.value = 5200;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.09, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);

    source.connect(highpass).connect(gain).connect(this.masterGain);
    source.start(time);
    source.stop(time + 0.065);
  }

  playBass(time, frequency) {
    const osc = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(frequency, time);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.08, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

    osc.connect(filter).connect(gain).connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.24);
  }
}

const techno = new TechnoEngine();

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function laneWidth() {
  return CANVAS_WIDTH / LANE_COUNT;
}

function laneCenterX(index) {
  return laneWidth() * index + laneWidth() / 2;
}

function createParticleBurst(x, y, color) {
  for (let i = 0; i < 20; i += 1) {
    const speed = 110 + Math.random() * 240;
    const angle = Math.random() * Math.PI * 2;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.9 + Math.random() * 0.5,
      age: 0,
      size: 6 + Math.random() * 10,
      color,
    });
  }
}

function queueSigns() {
  while (state.queue.length < 5) {
    const pool = shuffle(signs);
    state.queue.push(...pool);
  }
}

function pickLaneOptions(correctSign) {
  const distractors = shuffle(signs.filter((sign) => sign.id !== correctSign.id)).slice(0, LANE_COUNT - 1);
  return shuffle([correctSign, ...distractors]);
}

function prepareRound() {
  queueSigns();
  const sign = state.queue.shift();
  const options = pickLaneOptions(sign);
  const correctLane = options.findIndex((option) => option.id === sign.id);
  const startingLane = Math.floor(Math.random() * LANE_COUNT);

  state.laneOptions = options;
  state.laneTargetIndex = correctLane;
  state.activeSign = {
    sign,
    laneIndex: startingLane,
    x: laneCenterX(startingLane),
    y: -120,
    size: 150,
    spin: Math.random() * Math.PI * 2,
    wobble: Math.random() * Math.PI * 2,
  };

  updateLaneButtons();
  setFeedback(`Zoek: ${sign.meaning}`);
}

function setFeedback(message) {
  ui.feedback.textContent = message;
}

function updateHud() {
  ui.score.textContent = `${state.score}`;
  ui.combo.textContent = `${state.combo}x`;
  ui.lives.textContent = `${state.lives}`;
  ui.level.textContent = `${state.level}`;
  ui.bestScore.textContent = `${state.bestScore}`;
  ui.tempo.textContent = `${state.bpm} BPM`;
}

function updateLaneButtons() {
  ui.laneButtons.innerHTML = "";

  state.laneOptions.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lane-button";
    if (state.activeSign && state.activeSign.laneIndex === index) {
      button.classList.add("is-selected");
    }
    button.innerHTML = `${option.meaning}<small>Lane ${index + 1}</small>`;
    button.addEventListener("click", () => {
      if (!state.activeSign) {
        return;
      }
      state.activeSign.laneIndex = index;
      updateLaneButtons();
    });
    ui.laneButtons.appendChild(button);
  });
}

function renderLegend() {
  const featuredSigns = [
    "yield",
    "no-parking",
    "no-entry",
    "priority-road",
    "crosswalk",
    "speed-50",
  ]
    .map((id) => signs.find((sign) => sign.id === id))
    .filter(Boolean);

  ui.signLegend.innerHTML = "";
  featuredSigns.forEach((sign) => {
    const row = document.createElement("div");
    row.className = "legend-row";
    const icon = document.createElement("div");
    icon.className = `legend-sign ${sign.shape}`;
    icon.style.color = sign.border;
    if (sign.shape !== "triangle") {
      icon.style.background = sign.theme;
      icon.style.border = `3px solid ${sign.border}`;
    }
    if (sign.shape === "diamond") {
      icon.style.background = sign.theme;
      icon.style.border = `3px solid ${sign.border}`;
    }
    if (sign.id === "priority-road") {
      icon.style.boxShadow = "0 0 0 4px #111f35 inset";
    }
    if (sign.id === "stop") {
      icon.textContent = "STOP";
      icon.style.fontSize = "0.45rem";
      icon.style.display = "grid";
      icon.style.placeItems = "center";
      icon.style.fontWeight = "700";
      icon.style.background = sign.theme;
      icon.style.border = `3px solid ${sign.border}`;
    }

    const copy = document.createElement("div");
    copy.className = "legend-copy";
    copy.innerHTML = `<strong>${sign.meaning}</strong><span>${sign.hint}</span>`;

    row.append(icon, copy);
    ui.signLegend.appendChild(row);
  });
}

function startGame() {
  state.running = true;
  state.gameOver = false;
  state.lastTimestamp = 0;
  if (techno.context) {
    techno.nextStepTime = techno.context.currentTime + 0.05;
  }
  if (!state.activeSign) {
    prepareRound();
  }
  setFeedback(`Zoek: ${state.activeSign.sign.meaning}`);
}

function pauseGame() {
  state.running = false;
  setFeedback("Pauze. Druk op start om verder te spelen.");
}

function resetGame() {
  state.running = false;
  state.gameOver = false;
  state.score = 0;
  state.combo = 0;
  state.lives = 3;
  state.level = 1;
  state.correct = 0;
  state.bpm = 118;
  state.queue = [];
  state.particles = [];
  state.laneFlash.fill(0);
  state.beatPulse = 0;
  state.beatFlash = 0;
  state.activeSign = null;
  updateHud();
  prepareRound();
  setFeedback("Press start to begin.");
}

function endGame() {
  state.running = false;
  state.gameOver = true;

  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    localStorage.setItem(STORAGE_KEY, `${state.bestScore}`);
  }

  updateHud();
  setFeedback(`Einde set. Score ${state.score}. Druk op restart voor nog een ronde.`);
}

function handleHit() {
  const previousMeaning = state.activeSign.sign.meaning;
  state.combo += 1;
  state.correct += 1;
  state.score += 100 + (state.combo - 1) * 20 + state.level * 10;
  state.level = 1 + Math.floor(state.correct / 6);
  state.bpm = Math.min(150, 118 + (state.level - 1) * 4);
  state.laneFlash[state.activeSign.laneIndex] = 1;
  createParticleBurst(state.activeSign.x, JUDGE_LINE_Y, "#9effd5");
  prepareRound();
  setFeedback(`Juist. ${previousMeaning} gescoord. Volgende: ${state.activeSign.sign.meaning}`);
  updateHud();
}

function handleMiss() {
  const correctMeaning = state.activeSign.sign.meaning;
  state.combo = 0;
  state.lives -= 1;
  state.laneFlash[state.laneTargetIndex] = 1;
  createParticleBurst(laneCenterX(state.laneTargetIndex), JUDGE_LINE_Y, "#ff6b9e");

  if (state.lives <= 0) {
    endGame();
    return;
  }

  prepareRound();
  setFeedback(`Net mis. Het juiste antwoord was "${correctMeaning}". Volgende: ${state.activeSign.sign.meaning}`);
  updateHud();
}

function resolveActiveSign() {
  if (!state.activeSign) {
    return;
  }

  if (state.activeSign.laneIndex === state.laneTargetIndex) {
    handleHit();
  } else {
    handleMiss();
  }
}

function moveActiveSign(delta) {
  if (!state.activeSign || state.gameOver) {
    return;
  }

  state.activeSign.laneIndex = clamp(state.activeSign.laneIndex + delta, 0, LANE_COUNT - 1);
  updateLaneButtons();
}

function updateGame(deltaSeconds) {
  state.beatPulse = Math.max(0, state.beatPulse - deltaSeconds * 2.6);
  state.beatFlash = Math.max(0, state.beatFlash - deltaSeconds * 1.6);
  state.laneFlash = state.laneFlash.map((value) => Math.max(0, value - deltaSeconds * 2.4));

  state.particles = state.particles.filter((particle) => particle.age < particle.life);
  state.particles.forEach((particle) => {
    particle.age += deltaSeconds;
    particle.x += particle.vx * deltaSeconds;
    particle.y += particle.vy * deltaSeconds;
    particle.vy += 180 * deltaSeconds;
  });

  if (!state.running || !state.activeSign) {
    return;
  }

  const baseSpeed = 290 + (state.level - 1) * 42;
  state.activeSign.y += baseSpeed * deltaSeconds;
  state.activeSign.x += (laneCenterX(state.activeSign.laneIndex) - state.activeSign.x) * Math.min(1, deltaSeconds * 12);
  state.activeSign.spin += deltaSeconds * 0.5;
  state.activeSign.wobble += deltaSeconds * 4;

  if (state.activeSign.y >= JUDGE_LINE_Y) {
    resolveActiveSign();
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, `rgba(15, 29, 56, ${0.98 - state.beatFlash * 0.12})`);
  gradient.addColorStop(1, "#040c16");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const pulseRadius = 250 + state.beatPulse * 160;
  const pulse = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    220,
    40,
    CANVAS_WIDTH / 2,
    220,
    pulseRadius
  );
  pulse.addColorStop(0, `rgba(87, 215, 255, ${0.22 + state.beatPulse * 0.22})`);
  pulse.addColorStop(1, "rgba(87, 215, 255, 0)");
  ctx.fillStyle = pulse;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 520);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let y = 0; y < CANVAS_HEIGHT; y += 58) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  for (let i = 0; i <= LANE_COUNT; i += 1) {
    const x = i * laneWidth();
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, LANE_AREA_TOP);
    ctx.lineTo(x, JUDGE_LINE_Y + 80);
    ctx.stroke();
  }
  ctx.restore();

  drawEqualizer();
}

function drawEqualizer() {
  const bars = 12;
  const width = 32;
  const gap = 16;
  const originX = CANVAS_WIDTH / 2 - ((bars * width + (bars - 1) * gap) / 2);
  for (let i = 0; i < bars; i += 1) {
    const wave = Math.sin((performance.now() * 0.01) + i * 0.8);
    const height = 26 + ((wave + 1) / 2) * 90 + state.beatPulse * 80;
    const x = originX + i * (width + gap);
    const y = 70;
    const gradient = ctx.createLinearGradient(x, y + height, x, y);
    gradient.addColorStop(0, "rgba(87, 215, 255, 0.1)");
    gradient.addColorStop(1, "rgba(215, 255, 108, 0.85)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y + 120 - height, width, height);
  }
}

function drawJudgeLine() {
  ctx.save();
  ctx.fillStyle = "rgba(255, 139, 61, 0.18)";
  ctx.fillRect(0, JUDGE_LINE_Y - 12, CANVAS_WIDTH, 24);
  ctx.strokeStyle = "rgba(255, 196, 132, 0.85)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, JUDGE_LINE_Y);
  ctx.lineTo(CANVAS_WIDTH, JUDGE_LINE_Y);
  ctx.stroke();
  ctx.restore();
}

function drawLaneCards() {
  state.laneOptions.forEach((option, index) => {
    const x = index * laneWidth() + 18;
    const y = LANE_AREA_BOTTOM;
    const width = laneWidth() - 36;
    const height = 182;
    const selected = state.activeSign && state.activeSign.laneIndex === index;
    const flash = state.laneFlash[index];

    ctx.save();
    ctx.fillStyle = selected ? "rgba(255, 139, 61, 0.22)" : "rgba(10, 21, 39, 0.82)";
    ctx.strokeStyle = flash > 0.01 ? `rgba(158,255,213,${0.55 * flash})` : "rgba(255,255,255,0.08)";
    ctx.lineWidth = selected ? 5 : 3;
    roundRect(ctx, x, y, width, height, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 34px 'Avenir Next', sans-serif";
    wrapText(option.meaning, x + 20, y + 44, width - 40, 38);

    ctx.fillStyle = "rgba(164, 189, 210, 0.9)";
    ctx.font = "600 22px 'Avenir Next', sans-serif";
    ctx.fillText(`lane ${index + 1}`, x + 20, y + height - 24);
    ctx.restore();
  });
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let drawY = y;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, drawY);
      line = word;
      drawY += lineHeight;
    } else {
      line = testLine;
    }
  });

  if (line) {
    ctx.fillText(line, x, drawY);
  }
}

function drawActiveSign() {
  if (!state.activeSign) {
    return;
  }

  drawSign(ctx, state.activeSign.sign, state.activeSign.x, state.activeSign.y, state.activeSign.size);

  ctx.save();
  ctx.fillStyle = "#f7fbff";
  ctx.font = "700 36px 'Avenir Next', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Stuur het bord naar de juiste baan", CANVAS_WIDTH / 2, 110);
  ctx.restore();
}

function drawQueuePreview() {
  const preview = state.queue.slice(0, 3);
  preview.forEach((sign, index) => {
    drawSign(ctx, sign, 110 + index * 92, 110, 62);
  });

  ctx.save();
  ctx.fillStyle = "rgba(164, 189, 210, 0.9)";
  ctx.font = "600 22px 'Avenir Next', sans-serif";
  ctx.fillText("Next", 110, 48);
  ctx.restore();
}

function drawParticles() {
  state.particles.forEach((particle) => {
    const alpha = Math.max(0, 1 - particle.age / particle.life);
    const radius = Math.max(0, particle.size * alpha);
    if (radius <= 0) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawGameOver() {
  if (!state.gameOver) {
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(4, 12, 22, 0.65)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#f7fbff";
  ctx.textAlign = "center";
  ctx.font = "700 96px 'Avenir Next Condensed', sans-serif";
  ctx.fillText("SET OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);

  ctx.fillStyle = "#ffd6a1";
  ctx.font = "600 42px 'Avenir Next', sans-serif";
  ctx.fillText(`Final score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 8);
  ctx.fillText("Tap restart for another round", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 78);
  ctx.restore();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function drawSign(context, sign, x, y, size) {
  context.save();
  context.translate(x, y);
  context.shadowColor = "rgba(0,0,0,0.28)";
  context.shadowBlur = 30;
  context.shadowOffsetY = 10;

  switch (sign.shape) {
    case "triangle":
      drawTriangleSign(context, sign, size);
      break;
    case "diamond":
      drawDiamondSign(context, sign, size);
      break;
    case "square":
      drawSquareSign(context, sign, size);
      break;
    case "octagon":
      drawOctagonSign(context, sign, size);
      break;
    default:
      drawCircleSign(context, sign, size);
      break;
  }

  context.restore();
}

function drawTriangleSign(context, sign, size) {
  const height = size * 0.9;

  context.beginPath();
  context.moveTo(0, -height / 2);
  context.lineTo(size / 2, height / 2);
  context.lineTo(-size / 2, height / 2);
  context.closePath();
  context.fillStyle = "#ffffff";
  context.fill();
  context.lineWidth = size * 0.12;
  context.strokeStyle = sign.border;
  context.stroke();

  context.shadowBlur = 0;
  context.strokeStyle = "#111f35";
  context.fillStyle = "#111f35";
  context.lineCap = "round";

  if (sign.symbol === "dangerTurn") {
    context.lineWidth = size * 0.08;
    context.beginPath();
    context.moveTo(-size * 0.08, 0);
    context.bezierCurveTo(-size * 0.1, -size * 0.06, size * 0.06, -size * 0.14, size * 0.11, -size * 0.22);
    context.stroke();
    context.beginPath();
    context.arc(size * 0.1, -size * 0.18, size * 0.05, 0, Math.PI * 2);
    context.fill();
  }
}

function drawCircleSign(context, sign, size) {
  context.beginPath();
  context.arc(0, 0, size / 2, 0, Math.PI * 2);
  context.fillStyle = sign.theme;
  context.fill();
  context.lineWidth = size * 0.11;
  context.strokeStyle = sign.border;
  context.stroke();
  context.shadowBlur = 0;

  switch (sign.symbol) {
    case "noParking":
      context.strokeStyle = "#e2353a";
      context.lineWidth = size * 0.09;
      context.beginPath();
      context.moveTo(-size * 0.2, -size * 0.2);
      context.lineTo(size * 0.2, size * 0.2);
      context.stroke();
      break;
    case "noStopping":
      context.strokeStyle = "#e2353a";
      context.lineWidth = size * 0.08;
      context.beginPath();
      context.moveTo(-size * 0.22, -size * 0.22);
      context.lineTo(size * 0.22, size * 0.22);
      context.moveTo(size * 0.22, -size * 0.22);
      context.lineTo(-size * 0.22, size * 0.22);
      context.stroke();
      break;
    case "straight":
      context.strokeStyle = "#ffffff";
      context.fillStyle = "#ffffff";
      context.lineWidth = size * 0.09;
      context.beginPath();
      context.moveTo(0, size * 0.22);
      context.lineTo(0, -size * 0.18);
      context.stroke();
      context.beginPath();
      context.moveTo(-size * 0.12, -size * 0.02);
      context.lineTo(0, -size * 0.22);
      context.lineTo(size * 0.12, -size * 0.02);
      context.closePath();
      context.fill();
      break;
    case "noEntry":
      context.fillStyle = "#ffffff";
      roundRect(context, -size * 0.22, -size * 0.08, size * 0.44, size * 0.16, size * 0.06);
      context.fill();
      break;
    case "roundabout":
      context.strokeStyle = "#ffffff";
      context.lineWidth = size * 0.075;
      context.beginPath();
      context.arc(0, 0, size * 0.18, 0, Math.PI * 2);
      context.stroke();
      for (let i = 0; i < 3; i += 1) {
        const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
        const px = Math.cos(angle) * size * 0.18;
        const py = Math.sin(angle) * size * 0.18;
        context.beginPath();
        context.moveTo(px, py);
        context.lineTo(px - Math.sin(angle) * size * 0.12, py + Math.cos(angle) * size * 0.12);
        context.lineTo(px + Math.cos(angle) * size * 0.08, py + Math.sin(angle) * size * 0.08);
        context.closePath();
        context.fillStyle = "#ffffff";
        context.fill();
      }
      break;
    case "speed50":
      context.fillStyle = "#111f35";
      context.font = `700 ${size * 0.27}px 'Avenir Next', sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("50", 0, 0);
      break;
    default:
      break;
  }
}

function drawDiamondSign(context, sign, size) {
  context.rotate(Math.PI / 4);
  const side = size * 0.6;
  roundRect(context, -side / 2, -side / 2, side, side, size * 0.08);
  context.fillStyle = sign.border;
  context.fill();
  roundRect(context, -side * 0.39, -side * 0.39, side * 0.78, side * 0.78, size * 0.05);
  context.fillStyle = sign.theme;
  context.fill();
  roundRect(context, -side * 0.28, -side * 0.28, side * 0.56, side * 0.56, size * 0.04);
  context.fillStyle = "#111f35";
  context.fill();
  roundRect(context, -side * 0.19, -side * 0.19, side * 0.38, side * 0.38, size * 0.03);
  context.fillStyle = sign.theme;
  context.fill();
}

function drawSquareSign(context, sign, size) {
  roundRect(context, -size / 2, -size / 2, size, size, size * 0.12);
  context.fillStyle = sign.theme;
  context.fill();
  context.lineWidth = size * 0.08;
  context.strokeStyle = sign.border;
  context.stroke();
  context.shadowBlur = 0;
  context.strokeStyle = "#ffffff";
  context.fillStyle = "#ffffff";

  if (sign.symbol === "crosswalk") {
    context.beginPath();
    context.moveTo(-size * 0.23, size * 0.18);
    context.lineTo(size * 0.23, size * 0.18);
    context.stroke();
    for (let i = -2; i <= 2; i += 1) {
      context.fillRect(i * size * 0.08 - 6, size * 0.08, size * 0.05, size * 0.12);
    }
    context.beginPath();
    context.moveTo(-size * 0.1, -size * 0.14);
    context.lineTo(0, -size * 0.04);
    context.lineTo(size * 0.1, -size * 0.14);
    context.stroke();
    context.beginPath();
    context.arc(0, -size * 0.22, size * 0.05, 0, Math.PI * 2);
    context.fill();
  }

  if (sign.symbol === "oneWay") {
    context.lineWidth = size * 0.07;
    context.beginPath();
    context.moveTo(-size * 0.2, 0);
    context.lineTo(size * 0.16, 0);
    context.stroke();
    context.beginPath();
    context.moveTo(size * 0.02, -size * 0.14);
    context.lineTo(size * 0.22, 0);
    context.lineTo(size * 0.02, size * 0.14);
    context.closePath();
    context.fill();
  }
}

function drawOctagonSign(context, sign, size) {
  const r = size / 2;
  context.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.PI / 8 + (Math.PI * 2 * i) / 8;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) {
      context.moveTo(px, py);
    } else {
      context.lineTo(px, py);
    }
  }
  context.closePath();
  context.fillStyle = sign.theme;
  context.fill();
  context.lineWidth = size * 0.08;
  context.strokeStyle = sign.border;
  context.stroke();
  context.shadowBlur = 0;
  context.fillStyle = "#ffffff";
  context.font = `700 ${size * 0.18}px 'Avenir Next', sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("STOP", 0, 0);
}

function drawFrame() {
  drawBackground();
  drawQueuePreview();
  drawJudgeLine();
  drawLaneCards();
  drawActiveSign();
  drawParticles();
  drawGameOver();
}

function animate(timestamp) {
  const deltaSeconds = state.lastTimestamp ? (timestamp - state.lastTimestamp) / 1000 : 0;
  state.lastTimestamp = timestamp;

  updateGame(deltaSeconds);
  techno.update();
  drawFrame();
  requestAnimationFrame(animate);
}

function bindEvents() {
  ui.startButton.addEventListener("click", async () => {
    await techno.start();
    startGame();
  });

  ui.pauseButton.addEventListener("click", async () => {
    if (state.running) {
      pauseGame();
    } else if (!state.gameOver) {
      await techno.start();
      startGame();
    }
  });

  ui.restartButton.addEventListener("click", () => {
    resetGame();
  });

  ui.leftButton.addEventListener("click", () => moveActiveSign(-1));
  ui.rightButton.addEventListener("click", () => moveActiveSign(1));

  window.addEventListener("keydown", async (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      event.preventDefault();
      moveActiveSign(-1);
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      event.preventDefault();
      moveActiveSign(1);
    }

    if (event.key === " ") {
      event.preventDefault();
      if (state.running) {
        pauseGame();
      } else if (!state.gameOver) {
        await techno.start();
        startGame();
      }
    }

    if (event.key === "Enter" && state.gameOver) {
      event.preventDefault();
      resetGame();
    }
  });
}

renderLegend();
resetGame();
bindEvents();
requestAnimationFrame(animate);
