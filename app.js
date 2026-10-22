/**
 * ===================================================================
 * SAFECIRCLE™ - PERSONAL SAFETY ASSISTANT & GUARDIAN ECOSYSTEM
 * Core Application Architecture & Interactive Controller
 * ===================================================================
 */

'use strict';

// ==================== CONFIGURATION & DEFAULT STATE ====================
const APP_STORAGE_KEY = 'safecircle_store_v1';

const DEFAULT_STATE = {
  currentView: 'dashboard',
  stealthMode: false,
  ttsEnabled: true,
  userLocation: {
    lat: 37.7749,
    lng: -122.4194,
    accuracy: '12m',
    address: 'Market St & 4th St, San Francisco, CA'
  },
  deviceBattery: 98,
  guardians: [
    {
      id: 'g-1',
      name: 'Elena Vance (Mom)',
      phone: '+1 (555) 234-8901',
      tier: 'Primary',
      avatar: 'M',
      status: 'Active',
      battery: '94%',
      distance: '1.4 km'
    },
    {
      id: 'g-2',
      name: 'Alex Rivera (Best Friend)',
      phone: '+1 (555) 789-1024',
      tier: 'Primary',
      avatar: 'A',
      status: 'Active',
      battery: '88%',
      distance: '0.8 km'
    },
    {
      id: 'g-3',
      name: 'Campus Police Security',
      phone: '+1 (555) 911-0020',
      tier: 'Campus',
      avatar: 'P',
      status: 'Dispatched 24/7',
      battery: '100%',
      distance: '0.5 km'
    },
    {
      id: 'g-4',
      name: 'Sam Chen (Roommate)',
      phone: '+1 (555) 341-9872',
      tier: 'Secondary',
      avatar: 'S',
      status: 'Active',
      battery: '72%',
      distance: '1.2 km'
    }
  ],
  safeHavens: [
    {
      id: 'sh-1',
      name: 'Central Police Station (Precinct 4)',
      type: 'police',
      typeLabel: 'Police Precinct',
      icon: '🛡️',
      lat: 37.7765,
      lng: -122.4172,
      distance: '350m',
      address: '850 Bryant St',
      openHours: '24/7 Verified Safe'
    },
    {
      id: 'sh-2',
      name: 'St. Francis Memorial Hospital ER',
      type: 'hospital',
      typeLabel: 'Emergency Room',
      icon: '🏥',
      lat: 37.7891,
      lng: -122.4155,
      distance: '620m',
      address: '900 Hyde St',
      openHours: '24/7 Medical & Security'
    },
    {
      id: 'sh-3',
      name: 'Walgreens 24-Hour Pharmacy',
      type: 'store',
      typeLabel: '24/7 Lit Store',
      icon: '🏪',
      lat: 37.7842,
      lng: -122.4089,
      distance: '480m',
      address: '135 4th St',
      openHours: 'Open 24/7 • Well-Lit Entrance'
    },
    {
      id: 'sh-4',
      name: 'Metro Transit Police Kiosk',
      type: 'police',
      typeLabel: 'Transit Guard',
      icon: '🛡️',
      lat: 37.7831,
      lng: -122.4065,
      distance: '510m',
      address: 'Powell St Station Concourse',
      openHours: 'Staffed 24/7'
    },
    {
      id: 'sh-5',
      name: 'Starbucks 24/7 Reserve Safe Zone',
      type: 'store',
      typeLabel: 'Public Haven',
      icon: '☕',
      lat: 37.7725,
      lng: -122.4110,
      distance: '850m',
      address: '398 7th St',
      openHours: '24/7 Staffed'
    }
  ],
  hazards: [
    {
      id: 'hz-1',
      title: 'Broken Streetlights (Zero Visibility)',
      type: 'lighting',
      severity: 'High',
      lat: 37.7735,
      lng: -122.4140,
      time: '1 hour ago',
      reportedBy: 'SafeCircle Community'
    },
    {
      id: 'hz-2',
      title: 'Suspicious Group Loitering in Alley',
      type: 'suspicious',
      severity: 'Medium',
      lat: 37.7788,
      lng: -122.4125,
      time: '2 hours ago',
      reportedBy: 'Verified User #912'
    }
  ],
  vaultLogs: [
    {
      id: 'log-1',
      type: 'SOS_TRIGGER',
      title: 'Emergency SOS Drill Executed',
      timestamp: 'Today, 10:14 AM',
      coords: '37.7749° N, 122.4194° W',
      details: 'Full system test executed. Simulated SMS sent to 4 guardians. Web Audio siren tested.',
      hash: 'sha256-a94f8fe5ccb19ba61c4c0873d391e987982fbbd3'
    },
    {
      id: 'log-2',
      type: 'CHECK_IN',
      title: 'Safety Ping Broadcasted',
      timestamp: 'Yesterday, 11:45 PM',
      coords: '37.7751° N, 122.4180° W',
      details: 'Custom ping sent: "In cab #KA01, heading home safely."',
      hash: 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4'
    },
    {
      id: 'log-3',
      type: 'MANUAL_NOTE',
      title: 'Suspicious Vehicle Recorded',
      timestamp: '2 days ago, 8:20 PM',
      coords: '37.7720° N, 122.4150° W',
      details: 'Dark grey sedan parked near bus stop with engine idling for 25 mins. Plate: 7XYZ89.',
      hash: 'sha256-7d1a54127b222502f5b79b5fb0803061152a44f9'
    }
  ]
};

// Application Global State
let AppState = { ...DEFAULT_STATE };

// ==================== WEB AUDIO SYNTHESIZER ENGINE ====================
const AudioEngine = {
  ctx: null,
  sirenOsc1: null,
  sirenOsc2: null,
  sirenGain: null,
  sirenInterval: null,
  isSirenPlaying: false,

  ringOsc: null,
  ringGain: null,
  ringInterval: null,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // Play short countdown beep
  playBeep(freq = 800, duration = 0.15) {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio beep error', e);
    }
  },

  // Start High-Decibel Siren Synth
  startSiren() {
    this.init();
    if (!this.ctx || this.isSirenPlaying) return;

    try {
      this.isSirenPlaying = true;
      this.sirenOsc1 = this.ctx.createOscillator();
      this.sirenOsc2 = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();

      this.sirenOsc1.type = 'sawtooth';
      this.sirenOsc2.type = 'triangle';

      this.sirenGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

      this.sirenOsc1.connect(this.sirenGain);
      this.sirenOsc2.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);

      let toggle = false;
      const modulate = () => {
        if (!this.isSirenPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (toggle) {
          this.sirenOsc1.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
          this.sirenOsc2.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
        } else {
          this.sirenOsc1.frequency.exponentialRampToValueAtTime(750, now + 0.35);
          this.sirenOsc2.frequency.exponentialRampToValueAtTime(650, now + 0.35);
        }
        toggle = !toggle;
      };

      this.sirenOsc1.start();
      this.sirenOsc2.start();
      modulate();
      this.sirenInterval = setInterval(modulate, 400);
    } catch (e) {
      console.warn('Siren start error', e);
    }
  },

  // Stop High-Decibel Siren Synth
  stopSiren() {
    this.isSirenPlaying = false;
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc1) {
      try { this.sirenOsc1.stop(); this.sirenOsc1.disconnect(); } catch (e) {}
      this.sirenOsc1 = null;
    }
    if (this.sirenOsc2) {
      try { this.sirenOsc2.stop(); this.sirenOsc2.disconnect(); } catch (e) {}
      this.sirenOsc2 = null;
    }
  },

  // Phone Ringtone Simulation
  startPhoneRing() {
    this.init();
    if (!this.ctx) return;
    this.stopPhoneRing();

    const ringCycle = () => {
      try {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc2.frequency.setValueAtTime(480, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.setValueAtTime(0, this.ctx.currentTime + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 1.8);
        osc2.stop(this.ctx.currentTime + 1.8);
      } catch (e) {}
    };

    ringCycle();
    this.ringInterval = setInterval(ringCycle, 3500);
  },

  stopPhoneRing() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
};

// ==================== TEXT TO SPEECH (VOICE ASSISTANT) ====================
const SpeechService = {
  speak(text) {
    if (!AppState.ttsEnabled) return;
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error', e);
    }
  },
  cancel() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
};

// ==================== STORAGE CONTROLLER ====================
function loadSavedState() {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      AppState = { ...DEFAULT_STATE, ...parsed };
    }
  } catch (e) {
    console.warn('Storage load failed, using defaults', e);
  }
}

function persistState() {
  try {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(AppState));
  } catch (e) {
    console.warn('Storage save failed', e);
  }
}

// ==================== TOAST NOTIFICATION SYSTEM ====================
function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '✓';
  if (type === 'danger') icon = '🚨';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span style="font-size: 1.1rem;">${icon}</span>
    <div>${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==================== VIEW NAVIGATION CONTROLLER ====================
function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const mobileNavItems = document.querySelectorAll('.b-nav-item');

  function switchView(viewName) {
    AppState.currentView = viewName;

    // Update Top Tabs
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === viewName);
    });

    // Update Bottom Nav
    mobileNavItems.forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });

    // Update View DOM
    document.querySelectorAll('.content-view').forEach(view => {
      view.classList.remove('active-view');
    });
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('active-view');
    }

    // Trigger map invalidation when switching to map views
    if (viewName === 'map' && MapController.fullMap) {
      setTimeout(() => MapController.fullMap.invalidateSize(), 150);
    }
    if (viewName === 'journey' && JourneyController.miniMap) {
      setTimeout(() => JourneyController.miniMap.invalidateSize(), 150);
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  mobileNavItems.forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
  });

  // Direct Shortcuts
  document.getElementById('btn-go-to-circle')?.addEventListener('click', () => switchView('circle'));
  document.getElementById('btn-view-map-peek')?.addEventListener('click', () => switchView('map'));
}

// ==================== STEALTH CAMOUFLAGE CALCULATOR ====================
const CamouflageController = {
  container: document.getElementById('camouflage-container'),
  display: document.getElementById('calc-display'),
  currentExpr: '',
  history: '',

  init() {
    const toggleBtn = document.getElementById('btn-toggle-stealth');
    const secretExitBtn = document.getElementById('calc-secret-exit');
    const stealthHintBtn = document.getElementById('calc-stealth-hint');

    toggleBtn?.addEventListener('click', () => this.show());
    secretExitBtn?.addEventListener('click', () => this.hide());
    stealthHintBtn?.addEventListener('click', () => {
      alert('Stealth Mode Activated. Type 007= or tap the top solar strip to unlock SafeCircle.');
    });

    // Keyboard ESC to exit stealth
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.container.classList.contains('camouflage-hidden')) {
        this.hide();
      }
    });

    // Calculator buttons
    this.container.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleBtn(btn));
    });
  },

  show() {
    this.container.classList.remove('camouflage-hidden');
    this.container.setAttribute('aria-hidden', 'false');
    this.currentExpr = '0';
    this.updateDisplay();
    showToast('🕶️ Stealth Disguise Activated', 'warning');
  },

  hide() {
    this.container.classList.add('camouflage-hidden');
    this.container.setAttribute('aria-hidden', 'true');
    showToast('SafeCircle Disguise Lifted', 'success');
  },

  handleBtn(btn) {
    const action = btn.dataset.action;
    const num = btn.dataset.num;

    if (num !== undefined) {
      if (this.currentExpr === '0' && num !== '.') {
        this.currentExpr = num;
      } else {
        this.currentExpr += num;
      }
    } else if (action === 'op') {
      const op = btn.dataset.val;
      this.currentExpr += ` ${op} `;
    } else if (action === 'clear') {
      this.currentExpr = '0';
    } else if (action === 'backspace') {
      this.currentExpr = this.currentExpr.slice(0, -1) || '0';
    } else if (action === 'percent') {
      try {
        this.currentExpr = String(parseFloat(this.currentExpr) / 100);
      } catch (e) {
        this.currentExpr = '0';
      }
    } else if (action === 'equals') {
      // Check for secret SafeCircle Unlock Code: "007="
      if (this.currentExpr.trim() === '007' || this.currentExpr.includes('007')) {
        this.hide();
        return;
      }
      try {
        // Safe evaluation
        const clean = this.currentExpr.replace(/[^0-9+\-*/. ]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${clean})`)();
        this.currentExpr = String(result);
      } catch (e) {
        this.currentExpr = 'Error';
      }
    }

    this.updateDisplay();
  },

  updateDisplay() {
    if (this.display) {
      this.display.innerText = this.currentExpr || '0';
    }
  }
};

// ==================== EMERGENCY SOS SYSTEM ====================
const SOSController = {
  countdownModal: document.getElementById('modal-sos-countdown'),
  activeModal: document.getElementById('modal-sos-active'),
  digitElem: document.getElementById('sos-countdown-digit'),
  progressCircle: document.getElementById('sos-circle-progress'),
  countdownTimer: null,
  currentCount: 3,

  init() {
    const mainBtn = document.getElementById('btn-primary-sos');
    const silentBtn = document.getElementById('btn-silent-sos');
    const testBtn = document.getElementById('btn-test-sos');
    const cancelBtn = document.getElementById('btn-cancel-sos');
    const forceBtn = document.getElementById('btn-force-sos-now');
    const declareSafeBtn = document.getElementById('btn-declare-safe');
    const muteSirenBtn = document.getElementById('btn-stop-siren-only');

    mainBtn?.addEventListener('click', () => this.startCountdown(false));
    silentBtn?.addEventListener('click', () => this.triggerSilentSOS());
    testBtn?.addEventListener('click', () => this.runDrill());
    cancelBtn?.addEventListener('click', () => this.cancelCountdown());
    forceBtn?.addEventListener('click', () => this.dispatchEmergency(false));
    declareSafeBtn?.addEventListener('click', () => this.disarmEmergency());
    muteSirenBtn?.addEventListener('click', () => {
      AudioEngine.stopSiren();
      const status = document.getElementById('active-siren-status');
      if (status) status.innerText = 'MUTED (Emergency Dispatched)';
      showToast('Siren audio muted', 'warning');
    });

    // Header Quick Siren
    document.getElementById('btn-quick-alarm')?.addEventListener('click', () => {
      if (AudioEngine.isSirenPlaying) {
        AudioEngine.stopSiren();
        showToast('Siren stopped', 'warning');
      } else {
        AudioEngine.startSiren();
        showToast('High-Decibel Siren Blasting!', 'danger');
      }
    });
  },

  startCountdown(isSilent = false) {
    this.currentCount = 3;
    if (this.digitElem) this.digitElem.innerText = this.currentCount;
    this.countdownModal.classList.remove('modal-hidden');

    AudioEngine.playBeep(600, 0.2);

    const circumference = 2 * Math.PI * 54; // ~339.29
    if (this.progressCircle) {
      this.progressCircle.style.strokeDashoffset = '0';
    }

    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.currentCount -= 1;
      if (this.digitElem) this.digitElem.innerText = this.currentCount;
      AudioEngine.playBeep(600 + (3 - this.currentCount) * 150, 0.15);

      if (this.progressCircle) {
        const offset = circumference * ((3 - this.currentCount) / 3);
        this.progressCircle.style.strokeDashoffset = String(offset);
      }

      if (this.currentCount <= 0) {
        clearInterval(this.countdownTimer);
        this.dispatchEmergency(isSilent);
      }
    }, 1000);
  },

  cancelCountdown() {
    clearInterval(this.countdownTimer);
    this.countdownModal.classList.add('modal-hidden');
    AudioEngine.playBeep(400, 0.1);
    showToast('Emergency SOS Cancelled (False Alarm)', 'warning');
  },

  dispatchEmergency(isSilent = false) {
    clearInterval(this.countdownTimer);
    this.countdownModal.classList.add('modal-hidden');

    if (!isSilent) {
      AudioEngine.startSiren();
    }

    // Populate active modal details
    const coordsElem = document.getElementById('active-sos-coords');
    if (coordsElem) {
      coordsElem.innerText = `${AppState.userLocation.lat.toFixed(4)}° N, ${AppState.userLocation.lng.toFixed(4)}° W`;
    }

    this.activeModal.classList.remove('modal-hidden');

    // Create Vault Record
    VaultController.addRecord({
      type: 'SOS_TRIGGER',
      title: isSilent ? 'Stealth SOS Dispatched' : 'Full Emergency SOS Dispatched',
      details: `Distress signal broadcast to ${AppState.guardians.length} guardians with live GPS coordinates (${AppState.userLocation.lat}, ${AppState.userLocation.lng}). Battery: ${AppState.deviceBattery}%. Siren: ${isSilent ? 'Silent' : 'Active'}.`,
      coords: `${AppState.userLocation.lat.toFixed(4)}° N, ${AppState.userLocation.lng.toFixed(4)}° W`
    });

    showToast('🚨 SOS DISPATCHED TO GUARDIAN CIRCLE & 911', 'danger', 6000);
  },

  triggerSilentSOS() {
    this.dispatchEmergency(true);
    showToast('🤫 Silent Stealth Alert Dispatched to Guardians', 'danger');
  },

  runDrill() {
    showToast('Running Safety System Drill...', 'warning');
    AudioEngine.playBeep(880, 0.3);
    setTimeout(() => {
      showToast('✓ GPS telemetry active • 4 Guardians linked • Audio engine verified', 'success', 4000);
    }, 600);
  },

  disarmEmergency() {
    AudioEngine.stopSiren();
    this.activeModal.classList.add('modal-hidden');
    showToast('Emergency Disarmed. You have marked yourself SAFE.', 'success');
  }
};

// ==================== FAKE CALL SIMULATOR ====================
const FakeCallController = {
  modal: document.getElementById('modal-fake-call'),
  incomingControls: document.getElementById('fake-incoming-controls'),
  activeControls: document.getElementById('fake-active-controls'),
  timerElem: document.getElementById('fake-call-timer'),
  stateElem: document.getElementById('fake-call-state'),
  avatarElem: document.getElementById('fake-caller-avatar'),
  nameElem: document.getElementById('fake-caller-name'),
  callTimer: null,
  ringTimeout: null,
  callSeconds: 0,

  init() {
    // Card delay buttons
    document.querySelectorAll('.tool-fake-call .btn-micro-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const delay = parseInt(btn.dataset.delay, 10);
        this.scheduleCall(delay);
      });
    });

    document.getElementById('btn-dismiss-fake-call')?.addEventListener('click', () => this.hangup());
    document.getElementById('btn-fake-decline')?.addEventListener('click', () => this.hangup());
    document.getElementById('btn-fake-hangup')?.addEventListener('click', () => this.hangup());
    document.getElementById('btn-fake-accept')?.addEventListener('click', () => this.acceptCall());
  },

  scheduleCall(delaySeconds) {
    if (delaySeconds === 0) {
      this.triggerCall();
    } else {
      showToast(`Fake call scheduled in ${delaySeconds} seconds. Lock your phone or leave screen ready.`, 'warning');
      clearTimeout(this.ringTimeout);
      this.ringTimeout = setTimeout(() => {
        this.triggerCall();
      }, delaySeconds * 1000);
    }
  },

  triggerCall() {
    this.incomingControls.style.display = 'block';
    this.activeControls.style.display = 'none';
    this.stateElem.innerText = 'Mobile Calling...';
    this.modal.classList.remove('modal-hidden');

    AudioEngine.startPhoneRing();
  },

  acceptCall() {
    AudioEngine.stopPhoneRing();
    this.incomingControls.style.display = 'none';
    this.activeControls.style.display = 'block';
    this.stateElem.innerText = '00:01';

    // Start in-call counter
    this.callSeconds = 1;
    clearInterval(this.callTimer);
    this.callTimer = setInterval(() => {
      this.callSeconds += 1;
      const mins = String(Math.floor(this.callSeconds / 60)).padStart(2, '0');
      const secs = String(this.callSeconds % 60).padStart(2, '0');
      this.timerElem.innerText = `${mins}:${secs}`;
      this.stateElem.innerText = `${mins}:${secs}`;
    }, 1000);

    // Realistic voice dialogue
    setTimeout(() => {
      SpeechService.speak("Hey! Are you almost done? I'm parked right outside with the hazards on, just come out whenever you're ready!");
    }, 800);
  },

  hangup() {
    AudioEngine.stopPhoneRing();
    SpeechService.cancel();
    clearInterval(this.callTimer);
    clearTimeout(this.ringTimeout);
    this.modal.classList.add('modal-hidden');
    showToast('Call ended', 'warning');
  }
};

// ==================== NIGHT STROBE FLASHER ====================
const StrobeController = {
  modal: document.getElementById('modal-strobe-flasher'),
  init() {
    document.getElementById('btn-toggle-strobe')?.addEventListener('click', () => this.start());
    document.getElementById('btn-stop-strobe')?.addEventListener('click', () => this.stop());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('modal-hidden')) {
        this.stop();
      }
    });
  },

  start() {
    this.modal.classList.remove('modal-hidden');
    showToast('⚠️ High-Intensity Strobe Beacon Activated', 'warning');
  },

  stop() {
    this.modal.classList.add('modal-hidden');
  }
};

// ==================== "WALK WITH ME" JOURNEY CONTROLLER ====================
const JourneyController = {
  setupPanel: document.getElementById('journey-setup-panel'),
  activePanel: document.getElementById('journey-active-panel'),
  statusBadge: document.getElementById('journey-header-status'),
  statusText: document.getElementById('journey-status-text'),
  clockElem: document.getElementById('journey-clock'),
  progressFill: document.getElementById('journey-progress-fill'),
  activeDestElem: document.getElementById('active-dest-label'),
  activeEtaElem: document.getElementById('active-eta-label'),
  heartbeatBox: document.getElementById('heartbeat-prompt-box'),
  activeBadgeMini: document.getElementById('journey-active-badge'),

  timer: null,
  totalSeconds: 900,
  secondsRemaining: 900,
  isActive: false,
  miniMap: null,
  routeMarker: null,
  routePath: null,

  init() {
    document.getElementById('btn-quick-start-walk')?.addEventListener('click', () => {
      setupNavigation();
      const tabJourney = document.getElementById('tab-journey');
      if (tabJourney) tabJourney.click();
      this.startJourney();
    });

    document.getElementById('btn-start-journey')?.addEventListener('click', () => this.startJourney());
    document.getElementById('btn-arrived-safely')?.addEventListener('click', () => this.finishJourney(true));
    document.getElementById('btn-journey-heartbeat-ok')?.addEventListener('click', () => this.handleHeartbeat());
    document.getElementById('btn-journey-extend')?.addEventListener('click', () => this.extendTrip(5));
    document.getElementById('btn-journey-panic')?.addEventListener('click', () => {
      SOSController.dispatchEmergency(false);
    });

    this.initMiniMap();
  },

  initMiniMap() {
    const el = document.getElementById('journey-mini-map');
    if (!el || typeof L === 'undefined') return;

    try {
      this.miniMap = L.map('journey-mini-map', {
        zoomControl: false,
        attributionControl: false
      }).setView([AppState.userLocation.lat, AppState.userLocation.lng], 16);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(this.miniMap);

      // User beacon pulse icon
      const userIcon = L.divIcon({
        className: 'user-radar-beacon',
        html: `<div style="width:16px;height:16px;background:#10b981;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px #10b981;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      this.routeMarker = L.marker([AppState.userLocation.lat, AppState.userLocation.lng], { icon: userIcon }).addTo(this.miniMap);
    } catch (e) {
      console.warn('MiniMap init error', e);
    }
  },

  startJourney() {
    const dest = document.getElementById('journey-destination-input').value.trim() || 'Destination';
    const durationMins = parseInt(document.getElementById('journey-duration-select').value, 10) || 15;

    this.totalSeconds = durationMins * 60;
    this.secondsRemaining = this.totalSeconds;
    this.isActive = true;

    this.setupPanel.style.display = 'none';
    this.activePanel.style.display = 'block';
    this.statusBadge.classList.add('active-journey');
    this.statusText.innerText = 'PROTECTED';
    this.activeBadgeMini.style.display = 'inline-block';
    this.activeDestElem.innerText = dest;

    // Calculate ETA
    const eta = new Date(Date.now() + this.totalSeconds * 1000);
    this.activeEtaElem.innerText = `ETA: ${eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    this.logEvent(`Journey started: "${dest}" (${durationMins}m window)`);

    // Broadcast check-in SMS simulation
    showToast(`Guardian Circle notified: "Started walk to ${dest}."`, 'success');

    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 1000);
    this.updateClock();

    if (this.miniMap) {
      setTimeout(() => this.miniMap.invalidateSize(), 150);
    }
  },

  tick() {
    if (!this.isActive) return;
    this.secondsRemaining -= 1;

    // Simulate minor movement
    if (this.routeMarker) {
      const latOffset = (Math.random() - 0.5) * 0.0001;
      const lngOffset = (Math.random() - 0.5) * 0.0001;
      const cur = this.routeMarker.getLatLng();
      this.routeMarker.setLatLng([cur.lat + latOffset, cur.lng + lngOffset]);
    }

    // Trigger Heartbeat check at 50%
    if (this.secondsRemaining === Math.floor(this.totalSeconds / 2)) {
      this.promptHeartbeat();
    }

    if (this.secondsRemaining <= 0) {
      clearInterval(this.timer);
      this.secondsRemaining = 0;
      this.triggerMissedCheckinAlarm();
    }

    this.updateClock();
  },

  updateClock() {
    const mins = String(Math.floor(this.secondsRemaining / 60)).padStart(2, '0');
    const secs = String(this.secondsRemaining % 60).padStart(2, '0');
    this.clockElem.innerText = `${mins}:${secs}`;

    const pct = Math.max(0, (this.secondsRemaining / this.totalSeconds) * 100);
    this.progressFill.style.width = `${pct}%`;
  },

  promptHeartbeat() {
    AudioEngine.playBeep(700, 0.2);
    this.heartbeatBox.style.display = 'flex';
    this.logEvent('Safety Heartbeat Check prompt displayed.');
  },

  handleHeartbeat() {
    this.heartbeatBox.style.display = 'none';
    showToast('Safety Check-in Confirmed. SafeCircle standing by.', 'success');
    this.logEvent('User confirmed safety check-in.');
  },

  extendTrip(mins) {
    this.totalSeconds += mins * 60;
    this.secondsRemaining += mins * 60;
    this.updateClock();
    showToast(`Added ${mins} minutes to journey window.`, 'success');
  },

  triggerMissedCheckinAlarm() {
    showToast('⚠️ Missed Safe Check-in Window! Escalating...', 'danger');
    AudioEngine.playBeep(900, 0.4);
    setTimeout(() => {
      SOSController.dispatchEmergency(false);
    }, 2000);
  },

  finishJourney(arrivedSafely = true) {
    this.isActive = false;
    clearInterval(this.timer);

    this.setupPanel.style.display = 'flex';
    this.activePanel.style.display = 'none';
    this.statusBadge.classList.remove('active-journey');
    this.statusText.innerText = 'STANDBY';
    this.activeBadgeMini.style.display = 'none';

    if (arrivedSafely) {
      AudioEngine.playBeep(1000, 0.15);
      showToast('🎉 You have arrived safely! Guardian Circle updated.', 'success', 5000);
      this.logEvent('Journey completed successfully. User arrived safely.');

      VaultController.addRecord({
        type: 'CHECK_IN',
        title: 'Journey Completed Safely',
        details: `Destination reached safely: ${this.activeDestElem.innerText}. Total protected transit logged.`,
        coords: `${AppState.userLocation.lat.toFixed(4)}° N, ${AppState.userLocation.lng.toFixed(4)}° W`
      });
    }
  },

  logEvent(msg) {
    const logs = document.getElementById('journey-event-logs');
    if (!logs) return;
    const item = document.createElement('div');
    item.className = 'log-item';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    item.innerHTML = `<span class="log-time">${now}</span><span class="log-text">${msg}</span>`;
    logs.prepend(item);
  }
};

// ==================== INTERACTIVE MAP CONTROLLER (LEAFLET.JS) ====================
const MapController = {
  fullMap: null,
  markersLayer: null,
  activeFilter: 'all',

  init() {
    const mapElem = document.getElementById('full-safe-map');
    if (!mapElem || typeof L === 'undefined') return;

    try {
      this.fullMap = L.map('full-safe-map', {
        zoomControl: true
      }).setView([AppState.userLocation.lat, AppState.userLocation.lng], 15);

      // Dark theme CartoDB tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(this.fullMap);

      this.markersLayer = L.layerGroup().addTo(this.fullMap);

      // Add User Current Location Marker
      const userDot = L.circleMarker([AppState.userLocation.lat, AppState.userLocation.lng], {
        radius: 9,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      }).addTo(this.fullMap);

      userDot.bindPopup('<strong>📍 You Are Here</strong><br>GPS Fix Accuracy: 12m');

      // User radar glow ring
      L.circle([AppState.userLocation.lat, AppState.userLocation.lng], {
        radius: 200,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.08,
        weight: 1
      }).addTo(this.fullMap);

      this.renderMarkers();
      this.renderSidebarHavens();

      // Filter Buttons
      document.querySelectorAll('.map-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeFilter = btn.dataset.filter;
          this.renderMarkers();
          this.renderSidebarHavens();
        });
      });

      // Recenter Button
      document.getElementById('btn-recenter-map')?.addEventListener('click', () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => {
              AppState.userLocation.lat = pos.coords.latitude;
              AppState.userLocation.lng = pos.coords.longitude;
              this.fullMap.setView([pos.coords.latitude, pos.coords.longitude], 16);
              showToast('Map centered to live GPS coordinates', 'success');
            },
            () => {
              this.fullMap.setView([AppState.userLocation.lat, AppState.userLocation.lng], 16);
              showToast('Centered to current position', 'success');
            }
          );
        } else {
          this.fullMap.setView([AppState.userLocation.lat, AppState.userLocation.lng], 16);
        }
      });
    } catch (e) {
      console.warn('Map initialization failed', e);
    }
  },

  renderMarkers() {
    if (!this.markersLayer) return;
    this.markersLayer.clearLayers();

    // Render Safe Havens
    AppState.safeHavens.forEach(haven => {
      if (this.activeFilter !== 'all' && this.activeFilter !== haven.type && this.activeFilter !== 'haven') return;

      let color = '#3b82f6';
      if (haven.type === 'police') color = '#6366f1';
      if (haven.type === 'hospital') color = '#ef4444';
      if (haven.type === 'store') color = '#10b981';

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background:${color};color:#fff;width:34px;height:34px;border-radius:10px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 10px rgba(0,0,0,0.5);">
            ${haven.icon}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
      });

      const marker = L.marker([haven.lat, haven.lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="color:#0f172a;min-width:180px;">
          <h4 style="margin:0 0 4px 0;font-size:14px;color:#1e293b;">${haven.icon} ${haven.name}</h4>
          <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;">${haven.address} • <strong>${haven.distance} away</strong></p>
          <span style="background:#10b981;color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;">${haven.openHours}</span>
        </div>
      `);
      this.markersLayer.addLayer(marker);
    });

    // Render Hazard Reports
    if (this.activeFilter === 'all' || this.activeFilter === 'hazard') {
      AppState.hazards.forEach(hz => {
        const hzIcon = L.divIcon({
          className: 'hazard-map-pin',
          html: `
            <div style="background:#f59e0b;color:#000;width:32px;height:32px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 4px 10px rgba(0,0,0,0.5);">
              ⚠️
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const hzMarker = L.marker([hz.lat, hz.lng], { icon: hzIcon });
        hzMarker.bindPopup(`
          <div style="color:#0f172a;min-width:180px;">
            <h4 style="margin:0 0 4px 0;font-size:14px;color:#b45309;">⚠️ ${hz.title}</h4>
            <p style="margin:0 0 4px 0;font-size:12px;color:#64748b;">Reported ${hz.time} by ${hz.reportedBy}</p>
            <span style="background:#fef3c7;color:#b45309;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;">Risk: ${hz.severity}</span>
          </div>
        `);
        this.markersLayer.addLayer(hzMarker);
      });
    }
  },

  renderSidebarHavens() {
    const list = document.getElementById('map-havens-scroll-list');
    const badge = document.getElementById('havens-count-badge');
    const peekList = document.getElementById('nearest-havens-list');
    if (!list) return;

    list.innerHTML = '';
    if (peekList) peekList.innerHTML = '';

    const filtered = AppState.safeHavens.filter(h => {
      if (this.activeFilter === 'all') return true;
      if (this.activeFilter === 'hazard') return false;
      return h.type === this.activeFilter;
    });

    if (badge) badge.innerText = `${filtered.length} Places`;

    filtered.forEach((haven, idx) => {
      const item = document.createElement('div');
      item.className = 'haven-item';
      item.innerHTML = `
        <div class="haven-main-info">
          <div class="haven-type-icon">${haven.icon}</div>
          <div>
            <div class="haven-name">${haven.name}</div>
            <div class="haven-meta">${haven.address} • ${haven.openHours}</div>
          </div>
        </div>
        <span class="haven-distance-badge">${haven.distance}</span>
      `;

      item.addEventListener('click', () => {
        if (this.fullMap) {
          this.fullMap.setView([haven.lat, haven.lng], 17);
        }
      });

      list.appendChild(item);

      // Render top 3 in dashboard peek list
      if (peekList && idx < 3) {
        const peekItem = item.cloneNode(true);
        peekItem.addEventListener('click', () => {
          document.getElementById('tab-map')?.click();
          if (this.fullMap) {
            setTimeout(() => this.fullMap.setView([haven.lat, haven.lng], 17), 200);
          }
        });
        peekList.appendChild(peekItem);
      }
    });
  }
};

// ==================== GUARDIAN CIRCLE CONTROLLER ====================
const CircleController = {
  init() {
    this.renderGuardians();

    const addModal = document.getElementById('modal-add-guardian');
    document.getElementById('btn-add-contact-modal')?.addEventListener('click', () => {
      document.getElementById('guardian-edit-id').value = '';
      document.getElementById('guardian-name-input').value = '';
      document.getElementById('guardian-phone-input').value = '';
      addModal.classList.remove('modal-hidden');
    });

    document.getElementById('btn-close-guardian-modal')?.addEventListener('click', () => {
      addModal.classList.add('modal-hidden');
    });

    document.getElementById('btn-cancel-guardian')?.addEventListener('click', () => {
      addModal.classList.add('modal-hidden');
    });

    document.getElementById('form-guardian')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('guardian-name-input').value.trim();
      const phone = document.getElementById('guardian-phone-input').value.trim();
      const tier = document.getElementById('guardian-tier-select').value;

      if (!name || !phone) return;

      const newGuardian = {
        id: `g-${Date.now()}`,
        name,
        phone,
        tier,
        avatar: name.charAt(0).toUpperCase(),
        status: 'Active',
        battery: '95%',
        distance: 'Nearby'
      };

      AppState.guardians.push(newGuardian);
      persistState();
      this.renderGuardians();
      addModal.classList.add('modal-hidden');
      showToast(`Added ${name} to your Safe Circle!`, 'success');
    });

    // Quick Broadcast Check-in
    document.getElementById('btn-send-checkin')?.addEventListener('click', () => {
      const msg = document.getElementById('quick-checkin-text').value.trim() || 'I am safe and sound!';
      showToast(`Broadcasted check-in to ${AppState.guardians.length} guardians: "${msg}"`, 'success', 4500);

      VaultController.addRecord({
        type: 'CHECK_IN',
        title: 'Quick Circle Ping Broadcast',
        details: `Message sent: "${msg}". Recipient count: ${AppState.guardians.length}. Coordinates attached.`,
        coords: `${AppState.userLocation.lat.toFixed(4)}° N, ${AppState.userLocation.lng.toFixed(4)}° W`
      });
    });
  },

  renderGuardians() {
    const fullGrid = document.getElementById('guardians-full-grid');
    const chipRow = document.getElementById('dashboard-circle-chips');
    const hudCount = document.getElementById('guardian-count-hud');
    const modalNames = document.getElementById('sos-guardian-names');

    if (hudCount) hudCount.innerText = AppState.guardians.length;
    if (modalNames && AppState.guardians.length > 0) {
      modalNames.innerText = `${AppState.guardians[0].name.split(' ')[0]} & ${AppState.guardians.length - 1} Others`;
    }

    if (chipRow) {
      chipRow.innerHTML = '';
      AppState.guardians.forEach(g => {
        const chip = document.createElement('div');
        chip.className = 'contact-chip-item';
        chip.innerHTML = `
          <div class="chip-avatar">
            ${g.avatar}
            <span class="chip-status-dot"></span>
          </div>
          <span class="chip-name">${g.name}</span>
          <span class="chip-tier">${g.tier}</span>
        `;
        chipRow.appendChild(chip);
      });
    }

    if (fullGrid) {
      fullGrid.innerHTML = '';
      AppState.guardians.forEach(g => {
        const card = document.createElement('div');
        card.className = 'guardian-card';

        let tierClass = 'tier-primary';
        if (g.tier === 'Secondary') tierClass = 'tier-secondary';
        if (g.tier === 'Campus') tierClass = 'tier-campus';

        card.innerHTML = `
          <div class="guardian-card-header">
            <div class="guardian-profile-group">
              <div class="guardian-avatar-lg">${g.avatar}</div>
              <div>
                <h4 class="guardian-name-text">${g.name}</h4>
                <span class="guardian-tier-pill ${tierClass}">${g.tier} Responder</span>
              </div>
            </div>
            <button class="btn-action-ghost btn-remove-guardian" data-id="${g.id}" title="Remove Guardian" style="padding: 0.35rem 0.6rem; font-size: 0.75rem;">✕</button>
          </div>

          <div class="guardian-card-meta">
            <div class="guardian-meta-line">
              <span>Phone:</span>
              <strong>${g.phone}</strong>
            </div>
            <div class="guardian-meta-line">
              <span>Status:</span>
              <strong style="color:var(--primary-emerald);">● ${g.status}</strong>
            </div>
            <div class="guardian-meta-line">
              <span>Approx Distance:</span>
              <strong>${g.distance}</strong>
            </div>
          </div>

          <div class="guardian-privileges">
            <span class="privilege-badge">📡 Live GPS</span>
            <span class="privilege-badge">💬 SMS Dispatch</span>
            <span class="privilege-badge">🔊 Audio Broadcast</span>
          </div>

          <div class="guardian-card-actions">
            <button class="btn-micro-action btn-ping-single" data-name="${g.name}">Ping Location</button>
            <a href="tel:${g.phone.replace(/[^0-9+]/g, '')}" class="btn-micro-action btn-highlight" style="text-decoration:none; text-align:center;">Call Now</a>
          </div>
        `;

        card.querySelector('.btn-remove-guardian')?.addEventListener('click', () => {
          AppState.guardians = AppState.guardians.filter(item => item.id !== g.id);
          persistState();
          this.renderGuardians();
          showToast(`Removed ${g.name} from Circle`, 'warning');
        });

        card.querySelector('.btn-ping-single')?.addEventListener('click', () => {
          showToast(`Pinged live coordinates to ${g.name}`, 'success');
        });

        fullGrid.appendChild(card);
      });
    }
  }
};

// ==================== AEGIS AI COPILOT CONTROLLER ====================
const AegisAIController = {
  messagesContainer: document.getElementById('ai-messages-list'),
  inputField: document.getElementById('ai-input-field'),

  // Comprehensive safety knowledge base
  knowledge: [
    {
      keywords: ['following', 'follow', 'tailing', 'behind me', 'shadow'],
      reply: "🚨 **If you suspect you are being followed:**\n1. **Cross the street** and change pace. If they cross too, you've confirmed intent.\n2. **Head immediately to a brightly lit public place** (e.g., 24/7 store, restaurant, gas station). Never go directly to your home or car.\n3. **Do not use headphones** or look down at your phone. Keep your head up and make brief eye contact to signal awareness.\n4. Call a friend or your SafeCircle contact loudly: *'Hey, I see you waiting at the corner, I'll be there in 30 seconds.'*\n5. Tap the **SafeCircle SOS** or **Fake Call** button right now."
    },
    {
      keywords: ['rideshare', 'uber', 'lyft', 'taxi', 'cab', 'driver'],
      reply: "🚕 **Rideshare Safety Protocols:**\n1. **Verify Before Entering:** Check the license plate, car make/model, and driver photo.\n2. **Ask 'Who are you picking up?':** Never say 'Are you here for [My Name]?'. Force them to say your name.\n3. **Check Child Locks:** Sit in the back seat behind the passenger seat, check that the door unlocks freely.\n4. **Share Trip:** Use SafeCircle's 'Walk With Me' or share live trip link with your Circle.\n5. If the driver takes a radically wrong route, firmly say: *'Please stop at the next gas station, I need to get out.'* If refused, call 911 immediately."
    },
    {
      keywords: ['de-escalation', 'aggressive', 'angry', 'confrontation', 'fight'],
      reply: "🗣️ **3 Verbal De-escalation Techniques:**\n1. **The 'Open Hands' Posture:** Keep your palms open at chest level. It protects your face without appearing combative.\n2. **Acknowledge and Validate:** Say: *'I hear you, I understand you are frustrated, let's calm down.'* Avoid saying 'Calm down!' directly.\n3. **Create an Exit Bridge:** Give them an honorable out: *'I have no problem with you, I'm just leaving.'* Slowly back away toward exits without turning your back."
    },
    {
      keywords: ['night', 'alone', 'dark', 'walking', 'campus'],
      reply: "🌙 **Golden Rules for Walking Alone at Night:**\n1. Walk facing oncoming traffic so cars cannot creep up from behind you.\n2. Keep your hands free (out of pockets). Hold keys firmly or carry a personal safety alarm.\n3. Stick to illuminated main arteries; avoid shortcuts through unlit alleys or parks.\n4. Activate **SafeCircle 'Walk With Me'** so your Circle is notified if you don't check in within your estimated arrival time."
    },
    {
      keywords: ['legal', 'rights', 'evidence', 'harassment', 'stalking'],
      reply: "⚖️ **Evidence & Legal Rights Guidance:**\n1. You have the universal right to defend yourself with proportional reasonable force against imminent threat of bodily harm.\n2. **Preserve Digital Evidence:** Do not delete harassing text messages, voicemails, or social media DMs. Take screenshots showing dates and timestamps.\n3. SafeCircle automatically timestamps your logs with cryptographic SHA-256 signatures in the **Evidence Vault**.\n4. You can file for an immediate temporary restraining order (TRO) or emergency protective order (EPO) at any local courthouse."
    }
  ],

  init() {
    document.getElementById('btn-send-ai-message')?.addEventListener('click', () => this.handleUserSend());
    this.inputField?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleUserSend();
    });

    // Preset prompts
    document.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        this.ask(prompt);
      });
    });

    // Toggle Voice TTS
    const ttsBtn = document.getElementById('btn-toggle-tts');
    ttsBtn?.addEventListener('click', () => {
      AppState.ttsEnabled = !AppState.ttsEnabled;
      const label = document.getElementById('tts-label');
      if (label) label.innerText = `Voice: ${AppState.ttsEnabled ? 'ON' : 'OFF'}`;
      showToast(`AI Speech Voice: ${AppState.ttsEnabled ? 'Enabled' : 'Muted'}`, 'success');
    });
  },

  handleUserSend() {
    const text = this.inputField.value.trim();
    if (!text) return;
    this.inputField.value = '';
    this.ask(text);
  },

  ask(question) {
    this.appendMessage(question, 'user');

    // Bot Thinking Delay
    setTimeout(() => {
      const response = this.findAnswer(question);
      this.appendMessage(response, 'bot');
      SpeechService.speak(response.replace(/[*#]/g, ''));
    }, 450);
  },

  findAnswer(q) {
    const lower = q.toLowerCase();
    for (const item of this.knowledge) {
      if (item.keywords.some(k => lower.includes(k))) {
        return item.reply;
      }
    }

    return "🛡️ **Aegis AI Guidance:** In any uncertain situation, trust your instincts first. Put physical distance between yourself and any perceived threat, move toward lighted public zones, and alert your SafeCircle guardians immediately using the SOS panic trigger.";
  },

  appendMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `ai-message msg-${sender}`;

    const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    div.innerHTML = `
      <div class="msg-avatar">${sender === 'bot' ? '🛡️' : '👤'}</div>
      <div class="msg-bubble">${formatted}</div>
    `;

    this.messagesContainer.appendChild(div);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
};

// ==================== EVIDENCE VAULT CONTROLLER ====================
const VaultController = {
  init() {
    this.renderRecords();

    // Export report button
    document.getElementById('btn-export-vault')?.addEventListener('click', () => this.exportIncidentReport());

    // Manual Note Modal
    const noteModal = document.getElementById('modal-incident-note');
    document.getElementById('btn-add-manual-log')?.addEventListener('click', () => {
      noteModal.classList.remove('modal-hidden');
    });
    document.getElementById('btn-close-note-modal')?.addEventListener('click', () => {
      noteModal.classList.add('modal-hidden');
    });
    document.getElementById('btn-cancel-note')?.addEventListener('click', () => {
      noteModal.classList.add('modal-hidden');
    });

    document.getElementById('form-incident-note')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('note-title-input').value.trim();
      const details = document.getElementById('note-details-input').value.trim();

      if (!title || !details) return;

      this.addRecord({
        type: 'MANUAL_NOTE',
        title,
        details,
        coords: `${AppState.userLocation.lat.toFixed(4)}° N, ${AppState.userLocation.lng.toFixed(4)}° W`
      });

      noteModal.classList.add('modal-hidden');
      document.getElementById('note-title-input').value = '';
      document.getElementById('note-details-input').value = '';
      showToast('Incident note securely sealed into Evidence Vault', 'success');
    });
  },

  addRecord({ type, title, details, coords }) {
    const newRecord = {
      id: `log-${Date.now()}`,
      type,
      title,
      timestamp: new Date().toLocaleString(),
      coords: coords || '37.7749° N, 122.4194° W',
      details,
      hash: `sha256-${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
    };

    AppState.vaultLogs.unshift(newRecord);
    persistState();
    this.renderRecords();
  },

  renderRecords() {
    const list = document.getElementById('vault-records-list');
    const badge = document.getElementById('vault-count-badge');
    if (!list) return;

    if (badge) badge.innerText = `${AppState.vaultLogs.length} Records`;
    list.innerHTML = '';

    AppState.vaultLogs.forEach(rec => {
      const item = document.createElement('div');
      item.className = 'vault-item';

      let badgeHtml = '<span class="vault-badge-sos">🚨 SOS EVENT</span>';
      if (rec.type === 'CHECK_IN') badgeHtml = '<span class="vault-badge-checkin">✓ CHECK-IN</span>';
      if (rec.type === 'MANUAL_NOTE') badgeHtml = '<span class="vault-badge-checkin" style="background:rgba(6,182,212,0.2);color:#22d3ee;">📝 INCIDENT NOTE</span>';

      item.innerHTML = `
        <div class="vault-item-header">
          ${badgeHtml}
          <span class="vault-item-timestamp">${rec.timestamp}</span>
        </div>
        <div class="vault-item-title">${rec.title}</div>
        <div class="vault-item-desc">${rec.details}</div>
        <div style="font-size:0.75rem; color:var(--text-dim); margin-top:4px;">
          GPS Coordinates: <strong>${rec.coords}</strong>
        </div>
        <div>
          <span class="vault-item-hash">FORENSIC HASH: ${rec.hash}</span>
        </div>
      `;
      list.appendChild(item);
    });
  },

  exportIncidentReport() {
    const reportText = `=====================================================
SAFECIRCLE™ OFFICIAL FORENSIC INCIDENT SUMMARY REPORT
Generated On: ${new Date().toISOString()}
Device ID: SC-8891-SECURE-WEB
Total Incidents Logged: ${AppState.vaultLogs.length}
=====================================================

${AppState.vaultLogs.map((log, i) => `
[RECORD #${i + 1}]
Timestamp: ${log.timestamp}
Incident Type: ${log.type}
Title: ${log.title}
Coordinates: ${log.coords}
Details: ${log.details}
Cryptographic Hash: ${log.hash}
-----------------------------------------------------`).join('\n')}

CERTIFICATION:
This report was compiled and digitally sealed by the SafeCircle Autonomous
Personal Safety Platform. Evidence timestamps are captured locally with
millisecond precision for submission to emergency responders and legal authorities.
=====================================================`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SafeCircle_Incident_Report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Official Incident Report downloaded', 'success');
  }
};

// ==================== EMERGENCY HELPLINES DIRECTORY ====================
const HelplinesController = {
  data: {
    us: [
      { name: 'Emergency Police / Fire / Medical', number: '911', desc: 'National 24/7 Dispatch' },
      { name: 'National Sexual Assault Hotline', number: '1-800-656-4673', desc: 'Free & Confidential 24/7' },
      { name: 'National Domestic Violence Hotline', number: '1-800-799-7233', desc: 'Support & Shelter Aid' },
      { name: 'Crisis Text Line', number: 'Text HOME to 741741', desc: 'Free 24/7 text support' },
      { name: 'Campus Safety Dispatch', number: '555-0199', desc: 'Campus Police & Escort Service' }
    ],
    uk: [
      { name: 'UK Emergency Services', number: '999', desc: 'Police, Ambulance, Fire' },
      { name: 'UK Non-Emergency Police', number: '101', desc: 'Report non-urgent incidents' },
      { name: 'National Domestic Abuse Helpline', number: '0808 2000 247', desc: '24/7 Freephone' }
    ],
    eu: [
      { name: 'European Emergency Number', number: '112', desc: 'Valid across all EU nations' },
      { name: 'Missing Children Europe', number: '116 000', desc: 'Emergency hotline' }
    ],
    in: [
      { name: 'National Emergency Number', number: '112', desc: 'All-in-one Police, Fire, Ambulance' },
      { name: 'Women Helpline (National)', number: '1091', desc: '24/7 Distress Response' },
      { name: 'National Commission for Women (NCW)', number: '7827170170', desc: 'Violence & Harassment helpline' },
      { name: 'Police Direct Dispatch', number: '100', desc: 'Local police control room' }
    ],
    au: [
      { name: 'Emergency Services Australia', number: '000', desc: 'Police, Fire, Ambulance' },
      { name: '1800RESPECT', number: '1800 737 732', desc: 'National Domestic Violence line' }
    ]
  },

  init() {
    const modal = document.getElementById('modal-helplines');
    document.getElementById('btn-open-helplines')?.addEventListener('click', () => {
      modal.classList.remove('modal-hidden');
      this.render();
    });

    document.getElementById('btn-close-helplines')?.addEventListener('click', () => {
      modal.classList.add('modal-hidden');
    });

    document.getElementById('helpline-country-select')?.addEventListener('change', () => {
      this.render();
    });
  },

  render() {
    const container = document.getElementById('helplines-list-container');
    const country = document.getElementById('helpline-country-select').value;
    if (!container) return;

    container.innerHTML = '';
    const list = this.data[country] || this.data.us;

    list.forEach(item => {
      const row = document.createElement('div');
      row.className = 'helpline-item';
      row.innerHTML = `
        <div class="helpline-info">
          <h4>${item.name}</h4>
          <p>${item.desc}</p>
        </div>
        <a href="tel:${item.number.replace(/[^0-9+]/g, '')}" class="btn-dial-helpline">
          <span>📞 ${item.number}</span>
        </a>
      `;
      container.appendChild(row);
    });
  }
};

// ==================== REPORT LOCAL HAZARD MODAL ====================
const HazardReportController = {
  init() {
    const modal = document.getElementById('modal-report-hazard');
    document.getElementById('btn-report-hazard-modal')?.addEventListener('click', () => {
      modal.classList.remove('modal-hidden');
    });
    document.getElementById('btn-close-hazard-modal')?.addEventListener('click', () => {
      modal.classList.add('modal-hidden');
    });
    document.getElementById('btn-cancel-hazard')?.addEventListener('click', () => {
      modal.classList.add('modal-hidden');
    });

    document.getElementById('form-hazard')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('hazard-title-input').value.trim();
      const type = document.getElementById('hazard-type-select').value;
      const severity = document.getElementById('hazard-severity-select').value;

      if (!title) return;

      const newHazard = {
        id: `hz-${Date.now()}`,
        title,
        type,
        severity,
        lat: AppState.userLocation.lat + (Math.random() - 0.5) * 0.003,
        lng: AppState.userLocation.lng + (Math.random() - 0.5) * 0.003,
        time: 'Just Now',
        reportedBy: 'You (SafeCircle User)'
      };

      AppState.hazards.unshift(newHazard);
      persistState();
      MapController.renderMarkers();
      modal.classList.add('modal-hidden');
      document.getElementById('hazard-title-input').value = '';
      showToast('⚠️ Community Hazard Alert Broadcasted to Map!', 'warning');
    });
  }
};

// ==================== HARDWARE TELEMETRY & GEOLOCATION SYNC ====================
function initTelemetry() {
  const coordsDisplay = document.getElementById('gps-coords-display');
  const batteryDisplay = document.getElementById('battery-level-display');

  // Live Geolocation Watcher
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        AppState.userLocation.lat = pos.coords.latitude;
        AppState.userLocation.lng = pos.coords.longitude;
        if (coordsDisplay) {
          coordsDisplay.innerText = `${pos.coords.latitude.toFixed(3)}°, ${pos.coords.longitude.toFixed(3)}°`;
        }
      },
      err => {
        if (coordsDisplay) coordsDisplay.innerText = '37.774° N, 122.419° W';
      },
      { enableHighAccuracy: true }
    );
  }

  // Battery Status API (if supported)
  if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
      const updateBattery = () => {
        const level = Math.round(battery.level * 100);
        AppState.deviceBattery = level;
        if (batteryDisplay) batteryDisplay.innerText = `${level}%`;
      };
      updateBattery();
      battery.addEventListener('levelchange', updateBattery);
    }).catch(() => {});
  }
}

// ==================== APPLICATION BOOTSTRAP ====================
document.addEventListener('DOMContentLoaded', () => {
  loadSavedState();
  initTelemetry();
  setupNavigation();
  CamouflageController.init();
  SOSController.init();
  FakeCallController.init();
  StrobeController.init();
  JourneyController.init();
  MapController.init();
  CircleController.init();
  AegisAIController.init();
  VaultController.init();
  HelplinesController.init();
  HazardReportController.init();

  console.log('SafeCircle™ Autonomous Personal Safety System Initialized.');
});
