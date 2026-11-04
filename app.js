/**
 * SmartMart AI — Mobile Minimal NFC Screen
 * 2-Step Animation: "Welcome" -> "Access Granted"
 * Colors: White, Blue, Green, Yellow, Black, Grey
 */

// ============================================================================
// 1. STATE & AUDIO SYNTHESIS
// ============================================================================

const AppState = {
  currentCustomer: {
    name: 'Pooja Nair',
    id: 'SM-CUST-1001',
    tag: 'SmartPass Active',
    isGuest: false
  },
  audioEnabled: true,
  countdownTimer: null,
  countdownSeconds: 6
};

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. NFC Tap chime (Blue / Welcome phase)
function playNfcTapTone() {
  if (!AppState.audioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [659.25, 987.77].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.1, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.32);
    });
  } catch (e) {}
}

// 2. Gate Unlock chime (Green / Access Granted phase)
function playGateUnlockTone() {
  if (!AppState.audioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Mechanical relay click
    const relayOsc = ctx.createOscillator();
    const relayGain = ctx.createGain();
    relayOsc.type = 'square';
    relayOsc.frequency.setValueAtTime(160, now);
    relayGain.gain.setValueAtTime(0.08, now);
    relayGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    relayOsc.connect(relayGain);
    relayGain.connect(ctx.destination);
    relayOsc.start(now);
    relayOsc.stop(now + 0.07);

    // Harmonic celebration note: E6 (1318.51Hz)
    setTimeout(() => {
      if (!AppState.audioEnabled) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.48);
    }, 70);
  } catch (e) {}
}

function toggleAudio() {
  AppState.audioEnabled = !AppState.audioEnabled;
  const icon = document.getElementById('sound-icon');
  if (icon) {
    icon.textContent = AppState.audioEnabled ? 'volume_up' : 'volume_off';
  }
}

// ============================================================================
// 2. TWO-STEP ANIMATION: "WELCOME" THEN "ACCESS GRANTED"
// ============================================================================

function triggerSequence() {
  const welcomeBox = document.getElementById('step-welcome-box');
  const grantedBox = document.getElementById('step-granted-box');
  const orb = document.getElementById('central-nfc-orb');
  const icon = document.getElementById('central-nfc-icon');
  const gateVisual = document.getElementById('turnstile-gate-visual');

  if (!welcomeBox || !grantedBox) return;

  // Clear previous countdown
  if (AppState.countdownTimer) {
    clearInterval(AppState.countdownTimer);
    AppState.countdownTimer = null;
  }

  // -------------------------------------------------------------
  // STAGE 1: SHOW "WELCOME" (Blue Phase)
  // -------------------------------------------------------------
  welcomeBox.classList.remove('hidden');
  grantedBox.classList.add('hidden');

  if (orb) {
    orb.classList.remove('state-granted');
  }
  if (icon) {
    icon.textContent = 'sensors';
  }
  if (gateVisual) {
    gateVisual.classList.remove('gate-open');
  }

  // Play initial NFC tap chime & haptic
  playNfcTapTone();
  if (navigator.vibrate) {
    navigator.vibrate([30, 40]);
  }

  // -------------------------------------------------------------
  // STAGE 2: TRANSITION TO "ACCESS GRANTED" (Green Phase)
  // -------------------------------------------------------------
  setTimeout(() => {
    welcomeBox.classList.add('hidden');
    grantedBox.classList.remove('hidden');

    if (orb) {
      orb.classList.add('state-granted');
    }
    if (icon) {
      icon.textContent = 'check';
    }
    if (gateVisual) {
      gateVisual.classList.add('gate-open');
    }

    // Play gate unlock tone + second haptic confirmation
    playGateUnlockTone();
    if (navigator.vibrate) {
      navigator.vibrate([40, 80]);
    }

    // Start 6s Countdown
    startGateCountdown();
  }, 750);
}

function startGateCountdown() {
  AppState.countdownSeconds = 6;
  const timerDisplay = document.getElementById('countdown-val');
  if (timerDisplay) timerDisplay.textContent = `${AppState.countdownSeconds}s`;

  AppState.countdownTimer = setInterval(() => {
    AppState.countdownSeconds--;
    if (timerDisplay) {
      if (AppState.countdownSeconds > 0) {
        timerDisplay.textContent = `${AppState.countdownSeconds}s`;
      } else {
        timerDisplay.textContent = 'HOLD';
      }
    }

    if (AppState.countdownSeconds <= 0) {
      clearInterval(AppState.countdownTimer);
      AppState.countdownTimer = null;
    }
  }, 1000);
}

// ============================================================================
// 3. CUSTOMER SWITCHING & NFC SIMULATOR
// ============================================================================

function switchCustomer(name, id, tag) {
  AppState.currentCustomer = {
    name: name,
    id: id,
    tag: tag,
    isGuest: id.includes('GUEST')
  };

  // Update text
  const nameEl = document.getElementById('customer-name-display');
  const idEl = document.getElementById('customer-id-display');
  const tagBadge = document.getElementById('pass-type-badge');

  if (nameEl) nameEl.textContent = name;
  if (idEl) idEl.textContent = id;
  if (tagBadge) {
    tagBadge.textContent = tag;
    if (AppState.currentCustomer.isGuest) {
      tagBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300';
    } else {
      tagBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  }

  // Update chip active styles
  const chips = document.querySelectorAll('.cust-chip');
  chips.forEach(chip => {
    if (chip.textContent.trim() === name) {
      chip.className = 'cust-chip px-2.5 py-1 rounded-xl bg-blue-600 text-white font-bold text-xs whitespace-nowrap shadow-sm';
    } else if (chip.textContent.includes('Guest') && name.includes('Guest')) {
      chip.className = 'cust-chip px-2.5 py-1 rounded-xl bg-amber-400 text-slate-900 border border-amber-500 font-extrabold text-xs whitespace-nowrap shadow-sm';
    } else {
      chip.className = 'cust-chip px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs whitespace-nowrap';
    }
  });

  // Re-trigger the Welcome -> Access Granted sequence!
  triggerSequence();
}

// Parse URL Parameters (e.g. ?name=Vikram+Sethi&id=SM-CUST-1002)
function parseUrlParameters() {
  try {
    const params = new URLSearchParams(window.location.search);
    const paramName = params.get('name') || params.get('customer');
    const paramId = params.get('id');

    if (paramName) {
      const decodedName = decodeURIComponent(paramName);
      const decodedId = paramId ? decodeURIComponent(paramId) : 'SM-PASS-NFC';
      const tag = decodedName.toLowerCase().includes('guest') ? 'Guest Token' : 'SmartPass Active';
      switchCustomer(decodedName, decodedId, tag);
    }
  } catch (e) {}
}

// Hardware Web NFC listener on Android devices
async function initWebNfc() {
  if ('NDEFReader' in window) {
    try {
      const ndef = new window.NDEFReader();
      await ndef.scan();
      ndef.addEventListener('reading', ({ message, serialNumber }) => {
        let tagText = `Customer #${serialNumber.slice(-4)}`;
        for (const record of message.records) {
          if (record.recordType === 'text') {
            const dec = new TextDecoder(record.encoding);
            tagText = dec.decode(record.data);
          }
        }
        switchCustomer(tagText, `SM-NFC-${serialNumber.slice(-4)}`, 'NFC Hardware Tag');
      });
    } catch (e) {}
  }
}

// ============================================================================
// 4. BOOTSTRAP ON LOAD
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  parseUrlParameters();
  initWebNfc();

  // Trigger Welcome -> Access Granted sequence immediately on open!
  setTimeout(() => {
    triggerSequence();
  }, 250);
});
