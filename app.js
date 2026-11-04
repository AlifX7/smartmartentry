/**
 * SmartMart AI — Mobile Minimal NFC & QR Entrance Screen
 * 2-Step Animation: "Welcome" -> "Access Granted"
 * Colors: White, Blue, Green, Yellow, Black, Grey
 * Hardware Web Serial / SmartMart Hub Integration
 */

// ============================================================================
// 1. STATE & AUDIO SYNTHESIS
// ============================================================================
function gate(cmd){
  if(window.parent !== window) window.parent.postMessage({smartmart:true, cmd}, "*");
}
gate("E");
const AppState = {
  currentCustomer: {
    name: 'Pooja Nair',
    id: 'SM-CUST-1001',
    tag: 'SmartPass Prime VIP',
    isAllowed: true
  },
  audioEnabled: true,
  countdownTimer: null,
  countdownSeconds: 6
};

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try { audioCtx = new AudioContextClass(); } catch (e) {}
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    try { audioCtx.resume().catch(() => {}); } catch (e) {}
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
      gain.gain.setValueAtTime(0.09, now + idx * 0.08);
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

// 3. Gate Lock tone (Relock phase)
function playGateLockTone() {
  if (!AppState.audioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {}
}

// 4. Access Denied Buzz
function playDeniedTone() {
  if (!AppState.audioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.12].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now + offset);
      gain.gain.setValueAtTime(0.08, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.11);
    });
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
// 2. PARENT SMARTMART HUB POSTMESSAGE DISPATCH
// ============================================================================

function sendCommandToHub(cmd) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ smartmart: true, cmd: cmd }, '*');
      console.log(`[SmartMart Entry] Dispatched command '${cmd}' to Hub/Arduino`);
    }
  } catch (e) {
    console.warn('[SmartMart Entry] Could not send command to hub:', e);
  }
}

// Inbound messages from SmartMart Hub (when physical RFID card is tapped on Arduino)
window.addEventListener('message', (e) => {
  const d = e.data;
  if (d && d.smartmart && d.type === 'card' && d.uid) {
    handlePhysicalCardScanned(d.uid);
  }
});

function handlePhysicalCardScanned(uid) {
  const formattedUid = uid.toUpperCase();
  const name = `Shopper #${formattedUid.slice(-4)}`;
  switchCustomer(name, `SM-CARD-${formattedUid.slice(-4)}`, 'NFC SmartPass Active', true);
}

// ============================================================================
// 3. TWO-STEP ANIMATION: "WELCOME" THEN "ACCESS GRANTED"
// ============================================================================

function triggerSequence() {
  const welcomeBox = document.getElementById('step-welcome-box');
  const grantedBox = document.getElementById('step-granted-box');
  const deniedBox = document.getElementById('step-denied-box');
  const orb = document.getElementById('central-nfc-orb');
  const icon = document.getElementById('central-nfc-icon');
  const gateVisual = document.getElementById('turnstile-gate-visual');

  if (!welcomeBox || !grantedBox) return;

  // Clear previous countdown
  if (AppState.countdownTimer) {
    clearInterval(AppState.countdownTimer);
    AppState.countdownTimer = null;
  }

  // Handle Denied Persona
  if (!AppState.currentCustomer.isAllowed) {
    welcomeBox.classList.add('hidden');
    grantedBox.classList.add('hidden');
    if (deniedBox) deniedBox.classList.remove('hidden');

    if (orb) {
      orb.classList.remove('state-granted');
      orb.classList.add('state-denied');
    }
    if (icon) icon.textContent = 'close';
    if (gateVisual) gateVisual.classList.remove('gate-open');

    playDeniedTone();
    try { if (navigator && navigator.vibrate) navigator.vibrate([60, 40, 60]); } catch (e) {}

    // Auto reset to ready after 3.5s
    setTimeout(resetToIdle, 3500);
    return;
  }

  // -------------------------------------------------------------
  // STAGE 1: SHOW "WELCOME" (Blue Phase)
  // -------------------------------------------------------------
  welcomeBox.classList.remove('hidden');
  grantedBox.classList.add('hidden');
  if (deniedBox) deniedBox.classList.add('hidden');

  if (orb) {
    orb.classList.remove('state-granted', 'state-denied');
  }
  if (icon) {
    icon.textContent = 'sensors';
  }
  if (gateVisual) {
    gateVisual.classList.remove('gate-open');
  }

  // Play initial NFC tap chime & haptic
  playNfcTapTone();
  try { if (navigator && navigator.vibrate) navigator.vibrate([30, 40]); } catch (e) {}

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

    // Tell SmartMart Hub & Arduino: Turnstile Unlock ('E' or 'U')
    sendCommandToHub('E');

    // Play gate unlock tone + second haptic confirmation
    playGateUnlockTone();
    try { if (navigator && navigator.vibrate) navigator.vibrate([40, 80]); } catch (e) {}

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
      relockGate();
    }
  }, 1000);
}

function relockGate() {
  const gateVisual = document.getElementById('turnstile-gate-visual');
  if (gateVisual) gateVisual.classList.remove('gate-open');
  playGateLockTone();

  // Tell SmartMart Hub & Arduino: Gate is locked ('L')
  sendCommandToHub('L');

  setTimeout(resetToIdle, 600);
}

function resetToIdle() {
  const welcomeBox = document.getElementById('step-welcome-box');
  const grantedBox = document.getElementById('step-granted-box');
  const deniedBox = document.getElementById('step-denied-box');
  const orb = document.getElementById('central-nfc-orb');
  const icon = document.getElementById('central-nfc-icon');
  const gateVisual = document.getElementById('turnstile-gate-visual');

  if (welcomeBox) welcomeBox.classList.remove('hidden');
  if (grantedBox) grantedBox.classList.add('hidden');
  if (deniedBox) deniedBox.classList.add('hidden');

  if (orb) orb.classList.remove('state-granted', 'state-denied');
  if (icon) icon.textContent = 'sensors';
  if (gateVisual) gateVisual.classList.remove('gate-open');
}

// Manual Attendant Overrides
function manualGateUnlock() {
  AppState.currentCustomer.isAllowed = true;
  triggerSequence();
}

function manualGateLock() {
  if (AppState.countdownTimer) {
    clearInterval(AppState.countdownTimer);
    AppState.countdownTimer = null;
  }
  relockGate();
}

// ============================================================================
// 4. CUSTOMER SWITCHING & NFC SIMULATOR
// ============================================================================

function switchCustomer(name, id, tag, isAllowed = true) {
  AppState.currentCustomer = {
    name: name,
    id: id,
    tag: tag,
    isAllowed: isAllowed
  };

  // Update text
  const nameEl = document.getElementById('customer-name-display');
  const idEl = document.getElementById('customer-id-display');
  const tagBadge = document.getElementById('pass-type-badge');

  if (nameEl) nameEl.textContent = name;
  if (idEl) idEl.textContent = id;
  if (tagBadge) {
    tagBadge.textContent = tag;
    if (!isAllowed) {
      tagBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300';
    } else if (name.includes('Guest')) {
      tagBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300';
    } else {
      tagBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  }

  // Update chip active styles
  const chips = document.querySelectorAll('.cust-chip');
  chips.forEach(chip => {
    const text = chip.textContent.trim();
    if (text === name || (text.includes('Guest') && name.includes('Guest')) || (text.includes('Invalid') && !isAllowed)) {
      if (!isAllowed) {
        chip.className = 'cust-chip px-2.5 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs whitespace-nowrap shadow-xs';
      } else if (name.includes('Guest')) {
        chip.className = 'cust-chip px-2.5 py-1 rounded-xl bg-amber-400 text-slate-900 border border-amber-500 font-extrabold text-xs whitespace-nowrap shadow-xs';
      } else {
        chip.className = 'cust-chip px-2.5 py-1 rounded-xl bg-blue-600 text-white font-bold text-xs whitespace-nowrap shadow-xs';
      }
    } else {
      chip.className = 'cust-chip px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs whitespace-nowrap';
    }
  });

  // Re-trigger the Welcome -> Access Granted sequence!
  triggerSequence();
}


// Fullscreen Toggle
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
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
      const isAllowed = !decodedName.toLowerCase().includes('blocked');
      const tag = decodedName.toLowerCase().includes('guest') ? 'Guest Token (1hr)' : 'SmartPass Active';
      switchCustomer(decodedName, decodedId, tag, isAllowed);
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
        switchCustomer(tagText, `SM-NFC-${serialNumber.slice(-4)}`, 'NFC Hardware Tag', true);
      });
    } catch (e) {}
  }
}

// Keyboard shortcuts for Kiosk Operators
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    triggerSequence();
  } else if (e.key === '1') {
    switchCustomer('Pooja Nair', 'SM-CUST-1001', 'SmartPass Prime VIP', true);
  } else if (e.key === '2') {
    switchCustomer('Vikram Sethi', 'SM-CUST-1002', 'Express Member', true);
  } else if (e.key === '3') {
    switchCustomer('Ananya Iyer', 'SM-STAFF-004', 'Staff Master Key', true);
  } else if (e.key === '4') {
    switchCustomer('Aarav Sharma', 'SM-CUST-1005', 'SmartPass Active', true);
  } else if (e.key === '5') {
    switchCustomer('Guest Shopper', 'GUEST-PASS-99', 'Guest Token (1hr)', true);
  } else if (e.key === '6') {
    switchCustomer('Blocked Card', 'REVOKED-00', 'Inactive / Denied', false);
  } else if (e.key.toLowerCase() === 'm') {
    toggleAudio();
  } else if (e.key.toLowerCase() === 'f') {
    toggleFullScreen();
  } else if (e.key.toLowerCase() === 'o') {
    manualGateUnlock();
  } else if (e.key.toLowerCase() === 'l') {
    manualGateLock();
  }
});

// ============================================================================
// 5. BOOTSTRAP ON LOAD
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  parseUrlParameters();
  initWebNfc();

  // Trigger Welcome -> Access Granted sequence immediately on open!
  setTimeout(() => {
    triggerSequence();
  }, 250);
});
