// Sound

// Noise buffers are pooled per duration (NOISE_POOL_SIZE variants each, picked
// at random) instead of refilling a fresh buffer with Math.random() on every
// shot - the 3.5 s rocketWhoosh buffer alone is ~170k samples.
const NOISE_POOL_SIZE = 3;
const _noisePool = new Map();
function noiseBuffer(duration = 2) {
  let pool = _noisePool.get(duration);
  if (!pool) { pool = []; _noisePool.set(duration, pool); }
  if (pool.length < NOISE_POOL_SIZE) {
    const b = makeNoiseBuffer(duration);
    pool.push(b);
    return b;
  }
  return pool[(Math.random() * pool.length) | 0];
}

function makeNoiseBuffer(duration) {
  const buffer = audioCtx.createBuffer(
    1,
    audioCtx.sampleRate * duration,
    audioCtx.sampleRate
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Sound effects

// 1. Rocket-launch whoosh
function rocketWhoosh(n) {
  const now = audioCtx.currentTime;

  const source = audioCtx.createBufferSource();
  source.buffer = noiseBuffer(3.5);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 2;

  const gain = audioCtx.createGain();

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  if(n==1) {
	  // Rising engine/air-rush character
	  filter.frequency.setValueAtTime(180, now);
	  filter.frequency.exponentialRampToValueAtTime(5000, now + 0.2);

	  gain.gain.setValueAtTime(0.001, now);
	  gain.gain.exponentialRampToValueAtTime(0.1, now + 0.15);
	  gain.gain.exponentialRampToValueAtTime(0.001, now + 3.3);

	  source.start(now);
	  source.stop(now + 2.5);
	}else{
	  filter.frequency.setValueAtTime(280, now);
	  filter.frequency.exponentialRampToValueAtTime(8000, now + 0.7);
      filter.frequency.exponentialRampToValueAtTime(1000, now + 3.1);
	  
	  gain.gain.setValueAtTime(0.02, now);
	  gain.gain.exponentialRampToValueAtTime(0.5, now + 0.25);
	  gain.gain.exponentialRampToValueAtTime(0.1, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.5, now + 1.5);
	  gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
	  
	  source.start(now);
	  source.stop(now + 3.5);
	}
}

// 2. Distant gunfire
// Full volume inside DISTANT_GUNFIRE_REF metres, then falls off as 1/distance
// (0.2x at the 1500 m cutoff).
const DISTANT_GUNFIRE_REF = 300;
function distantGunfire(dist=1000) { // time delay
  if (dist>1500) return;
  let t=dist/400;
  const now = audioCtx.currentTime+t;
  // A short, filtered noise burst gives the distant "crack".
  function shot(time, volume) {
    const source = audioCtx.createBufferSource();
    source.buffer = noiseBuffer(0.18);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500+Math.random()*20+1000/dist;
    filter.Q.value = 2;

    const gain = audioCtx.createGain();

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    source.start(time);       // `time` already includes the travel delay t (see `now`)
    source.stop(time + 0.18);
  }

  // Irregular timing makes it sound less mechanical.
  const atten = Math.min(1, DISTANT_GUNFIRE_REF / Math.max(dist, 1));
  shot(now, 0.13 * atten);
  shot(now + 0.42, 0.10 * atten);
  shot(now + 1.05, 0.15 * atten);
  shot(now + 1.72, 0.08 * atten);
}

// 3. Nearby explosion
function nearbyExplosion(dist=100) {
  if (dist>1800) return;
  let t=dist/400;

  const now = audioCtx.currentTime+t;
  if (dist<100)dist=100;
  // Low-frequency thump
  const osc = audioCtx.createOscillator();
  const thumpGain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

  thumpGain.gain.setValueAtTime(0.001, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.8*(100/dist), now + 0.01);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);


  osc.connect(thumpGain);
  thumpGain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 1.1);

  // Broadband debris/impact noise
  const source = audioCtx.createBufferSource();
  source.buffer = noiseBuffer(1.5);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(7000*100/dist, now);
  filter.frequency.exponentialRampToValueAtTime(3000*100/dist, now + 1.2);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.65, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  source.start(now);
  source.stop(now + 1.5);
}

// 4. Chain gun
function chainGun(source='player', dist=0) {
  if (dist>1800) return;
  let t=dist/400;
  let vol=9/(dist>10?dist:10);
  const now = audioCtx.currentTime+t;

  // Layer 1: sharp broadband crack — the transient "snap" of the round leaving the barrel.
  const crack = audioCtx.createBufferSource();
  crack.buffer = noiseBuffer(0.05);
  const crackFilter = audioCtx.createBiquadFilter();
  crackFilter.type = "bandpass";
  crackFilter.frequency.value = 1500;
  crackFilter.Q.value = 0.8;
  const crackGain = audioCtx.createGain();
  crack.connect(crackFilter);
  crackFilter.connect(crackGain);
  crackGain.connect(audioCtx.destination);
  crackGain.gain.setValueAtTime(0.001, now);
  crackGain.gain.exponentialRampToValueAtTime(vol, now + 0.004);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  crack.start(now);
  crack.stop(now + 0.05);

  // Layer 2: low punchy body — a fast downward-sweeping thump giving the round its "cannon" weight.
  const body = audioCtx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(source==='player'?160:210, now);
  body.frequency.exponentialRampToValueAtTime(48, now + 0.09);
  const bodyGain = audioCtx.createGain();
  body.connect(bodyGain);
  bodyGain.connect(audioCtx.destination);
  bodyGain.gain.setValueAtTime(0.001, now);
  bodyGain.gain.exponentialRampToValueAtTime(vol, now + 0.01);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  
  body.start(now);
  body.stop(now + 0.16);

  // Layer 3: filtered noise boom — fills out the low end for a fuller, louder report.
  // Same overall envelope timing as before (~0.19s), just heavier and darker.
  const boom = audioCtx.createBufferSource();
  boom.buffer = noiseBuffer(0.2);
  const boomFilter = audioCtx.createBiquadFilter();
  boomFilter.type = "lowpass";
  boomFilter.frequency.setValueAtTime(1000, now);
  boomFilter.frequency.exponentialRampToValueAtTime(130, now + 0.18);
  boomFilter.Q.value = 0.7;
  const boomGain = audioCtx.createGain();
  boom.connect(boomFilter);
  boomFilter.connect(boomGain);
  boomGain.connect(audioCtx.destination);
  boomGain.gain.setValueAtTime(0.001, now);
  boomGain.gain.exponentialRampToValueAtTime(vol, now + 0.008);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
  boom.start(now);
  boom.stop(now + 0.2);
}

// 5. Engine start — rising square wave "spool-up" tone.
function engineStartTone(){
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(70, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 3.5);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 3.6);
}

// 6. Engine stop — falling square wave "spool-down" tone.
function engineStopTone(){
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(700, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + 3.5);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 2.1);
}

// 7. Continuous rotor + engine loop audio.
// Created once per mission (initLoopAudio), updated every frame from
// updatePlayer() with the current rotorRpm/engFactor, and torn down when
// the mission ends (stopLoopAudio).
let loopAudio = null;
const ENGINE_PULSE_DEPTH = 0.18; // gentle +/- amplitude pulsing of the engine bed
const ENGINE_LOOP_SCALE  = 1.2;  // engine bed loudness; tune by ear (0 = silent)

// Wind rush: driven by TOTAL airspeed (not excess over any limit). Silent at
// or below WIND_START_SPEED, then rises smoothly, reaching full level (and
// its brightest/whistliest) at WIND_FULL_SPEED.
const WIND_START_SPEED = 40;    // m/s
const WIND_FULL_SPEED  = 140;   // m/s
const WIND_MAX         = 0.18;  // wind bed loudness at full speed; tune by ear
const WIND_WHISTLE     = 1.5;   // thin whistle mixed over the bed at speed (0 = none)
const WIND_GUST_DEPTH  = 0.25;  // slow +/- gusting of the wind level

// Brown noise via a leaky integrator over white noise — much "airier" and
// less hissy than flat white noise, good raw material for a rotor whoosh.
function brownNoiseBuffer(duration = 2){
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++){
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5; // compensate for the integrator's level loss
  }
  return buffer;
}

// Shapes a sine into a narrow one-sided spike: only values near the peak of
// the sine survive the x^k curve, so a smooth oscillator becomes a single
// sharp pulse once per cycle instead of a slow sinusoidal swell.
function pulseShaperCurve(k = 14){
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++){
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = x > 0 ? Math.pow(x, k) : 0;
  }
  return curve;
}

function initLoopAudio(){
  if (loopAudio) stopLoopAudio();

  // --- Rotor: filtered brown noise for an airy "whoosh" body, with a sharp
  // gate pulsing once per revolution so each blade pass reads as a quick
  // gust rather than a droning tone.
  const rotorNoise = audioCtx.createBufferSource();
  rotorNoise.buffer = brownNoiseBuffer(2);
  rotorNoise.loop = true;

  const rotorFilter = audioCtx.createBiquadFilter();
  rotorFilter.type = "lowpass";
  rotorFilter.frequency.value = 260;
  rotorFilter.Q.value = 0.6;

  // pulseOsc ticks once per rotor revolution; pulseShaper turns each cycle
  // into a brief spike (0..1) which rides on top of pulseGate's baseline
  // gain value (audio-rate signals add to an AudioParam's scheduled value),
  // gating the noise bed open for a fast whoosh and mostly-closed between.
  const pulseOsc = audioCtx.createOscillator();
  pulseOsc.type = "sine";
  pulseOsc.frequency.value = 3;
  const pulseShaper = audioCtx.createWaveShaper();
  pulseShaper.curve = pulseShaperCurve(14);
  const pulseScale = audioCtx.createGain();
  pulseScale.gain.value = 0.85;
  const pulseGate = audioCtx.createGain();
  pulseGate.gain.value = 0.1; // quiet continuous whoosh floor between pulses
  pulseOsc.connect(pulseShaper);
  pulseShaper.connect(pulseScale);
  pulseScale.connect(pulseGate.gain);

  const rotorGain = audioCtx.createGain();
  rotorGain.gain.value = 0.0001;

  rotorNoise.connect(rotorFilter);
  rotorFilter.connect(pulseGate);
  pulseGate.connect(rotorGain);
  rotorGain.connect(audioCtx.destination);

  rotorNoise.start();
  pulseOsc.start();

const engineSource = audioCtx.createBufferSource();
engineSource.buffer = noiseBuffer(2);
engineSource.loop = true;

// Low rumble
const rumble = audioCtx.createBiquadFilter();
rumble.type = "lowpass";
rumble.frequency.value = 140;
rumble.Q.value = 0.7;

// Growling body
const growl = audioCtx.createBiquadFilter();
growl.type = "bandpass";
growl.frequency.value = 290;
growl.Q.value = 0.7;

// Gentle engine "pulsing"
const lfo = audioCtx.createOscillator();
lfo.type = "triangle";
lfo.frequency.value = 12; // ~3000 RPM / 4-cylinder-ish feel

const lfoGain = audioCtx.createGain();
lfoGain.gain.value = ENGINE_PULSE_DEPTH;

const engineGain = audioCtx.createGain();
engineGain.gain.value = 0.0005;

// The LFO drives its OWN gain stage (centred on 1.0, so x(1 +/- depth)).
// Previously it was added straight onto engineGain.gain, where +/-0.18 swamped
// the 0-0.09 volume range: the engine was equally loud (and chopping) with
// the engines off, and throttle barely changed it.
const engineMod = audioCtx.createGain();
engineMod.gain.value = 1;
lfo.connect(lfoGain);
lfoGain.connect(engineMod.gain);

engineSource
  .connect(rumble)
  .connect(growl)
  .connect(engineMod)
  .connect(engineGain)
  .connect(audioCtx.destination);

lfo.start();
engineSource.start();

// --- Wind: white noise -> high-pass -> band-pass (centre rises with speed)
// -> gust modulation -> volume. A narrow high-Q band-pass of the same noise is
// mixed in as a faint whistle that only builds at higher speeds.
const windSource = audioCtx.createBufferSource();
windSource.buffer = noiseBuffer(3);
windSource.loop = true;

const windHP = audioCtx.createBiquadFilter();
windHP.type = "highpass";
windHP.frequency.value = 120;
windHP.Q.value = 0.5;

const windFilter = audioCtx.createBiquadFilter();
windFilter.type = "bandpass";
windFilter.frequency.value = 400;
windFilter.Q.value = 0.7;

const whistleFilter = audioCtx.createBiquadFilter();
whistleFilter.type = "bandpass";
whistleFilter.frequency.value = 1600;
whistleFilter.Q.value = 14;
const whistleGain = audioCtx.createGain();
whistleGain.gain.value = 0;

// Slow gusting: own gain stage centred on 1.0 (see the engine LFO note above).
const windMod = audioCtx.createGain();
windMod.gain.value = 1;
const windLfo = audioCtx.createOscillator();
windLfo.type = "sine";
windLfo.frequency.value = 0.45;
const windLfoGain = audioCtx.createGain();
windLfoGain.gain.value = WIND_GUST_DEPTH;
windLfo.connect(windLfoGain);
windLfoGain.connect(windMod.gain);

const windGain = audioCtx.createGain();
windGain.gain.value = 0.0001;

windSource.connect(windHP);
windHP.connect(windFilter);
windFilter.connect(windMod);
windSource.connect(whistleFilter);
whistleFilter.connect(whistleGain);
whistleGain.connect(windMod);
windMod.connect(windGain);
windGain.connect(audioCtx.destination);

windSource.start();
windLfo.start();

  loopAudio = {
    rotorNoise, pulseOsc, rotorGain, rotorFilter,
    engineSource, engineGain, rumble, growl, lfo,
    windSource, windLfo, windGain, windFilter, whistleGain
  };
}

function updateLoopAudio(rotorRpm, engFactor, anyEngineOn, climb, alt, airspeed){
  if (!loopAudio) return;
  const now = audioCtx.currentTime;
  const rpm = Math.max(0, rotorRpm ?? 0);

  // Rotor: whoosh volume + filter brighten with RPM; revolution rate (and
  // so the whoosh pulse rate) rises with it too. Silent when not spinning.
  const rotorVol = rpm > 0.03 ? Math.min(0.24, 0.05 + rpm * 0.2) : 0;
  loopAudio.rotorGain.gain.setTargetAtTime(rotorVol, now, 0.15);
  loopAudio.rotorFilter.frequency.setTargetAtTime(1200 + rpm * 500 + Math.max(climb*300,-300) + Math.min(Math.max(alt,0)*20, 900), now, 0.2);
  loopAudio.pulseOsc.frequency.setTargetAtTime(2 + rpm * 8, now, 0.2);

  // Engine roar: present whenever at least one engine is running, scaled by
  // combined power, deliberately kept quiet relative to the rotor and effects.
  const ef = Math.max(0, Math.min(1, engFactor ?? 0));
  const engineVol = anyEngineOn ? Math.min(0.09, 0.02 + ef * 0.07) : 0;
  loopAudio.growl.frequency.setTargetAtTime(180 + ef * 300,now,0.3);
  loopAudio.rumble.frequency.setTargetAtTime(100 + ef * 60,now,0.4);
  loopAudio.engineGain.gain.setTargetAtTime(engineVol * ENGINE_LOOP_SCALE, now, 0.25);

  // Wind rush from total airspeed: 0 at WIND_START_SPEED, 1 at WIND_FULL_SPEED.
  // Volume, filter brightness and whistle all build with it; the target
  // smoothing means it fades in/out rather than gating at the threshold.
  const wt = Math.max(0, Math.min(1, ((airspeed ?? 0) - WIND_START_SPEED) / (WIND_FULL_SPEED - WIND_START_SPEED)));
  loopAudio.windGain.gain.setTargetAtTime(Math.max(0.0001, WIND_MAX * Math.pow(wt, 0.8)), now, 0.35);
  loopAudio.windFilter.frequency.setTargetAtTime(400 + wt * 2200, now, 0.35);
  loopAudio.whistleGain.gain.setTargetAtTime(WIND_WHISTLE * wt, now, 0.5);
}

function stopLoopAudio(){
  if (!loopAudio) return;
  const now = audioCtx.currentTime;
  const { rotorNoise, pulseOsc, rotorGain, engineSource, engineGain, lfo,
          windSource, windLfo, windGain } = loopAudio;
  rotorGain.gain.setTargetAtTime(0.0001, now, 0.08);
  engineGain.gain.setTargetAtTime(0.0001, now, 0.08);
  windGain.gain.setTargetAtTime(0.0001, now, 0.08);
  rotorNoise.stop(now + 0.4);
  pulseOsc.stop(now + 0.4);
  engineSource.stop(now + 0.4);
  lfo.stop(now + 0.4);
  windSource.stop(now + 0.4);
  windLfo.stop(now + 0.4);
  loopAudio = null;
}

// 8. Radar Jammer
function radarJammer(){
    const now = audioCtx.currentTime;
	const osc = audioCtx.createOscillator(); 
	const filter = audioCtx.createBiquadFilter(); 
	const gain = audioCtx.createGain(); 
	const lfo = audioCtx.createOscillator(); 
	const lfoGain = audioCtx.createGain(); 
	const lfoFilter = audioCtx.createBiquadFilter();
	osc.type = "sawtooth"; 
	osc.frequency.value = 640; 
	filter.type = "lowpass"; 
	filter.frequency.value = 800; 
	filter.Q.value = 2.3; 
	gain.gain.value = 0.07; 
	lfo.type = "square";
	lfo.frequency.value = 12; 
	lfoGain.gain.value = 0.06; 
	lfoFilter.type="lowpass";
	lfoFilter.frequency.value = 25;
	lfoFilter.Q.value=2;
	lfo.connect(lfoFilter);
	osc.connect(filter); 
	filter.connect(gain); 
	gain.connect(audioCtx.destination);
	lfo.connect(lfoGain); 
	lfoGain.connect(gain.gain); 
	osc.start(); 
	lfo.start();
	gain.gain.exponentialRampToValueAtTime(0.06, now + 0.45);
	gain.gain.exponentialRampToValueAtTime(0.001, now + 0.451);
	osc.stop(now+0.452);
	lfo.stop(now+0.452);
}

// 8. IR Jammer
function irJammer(){
    const now = audioCtx.currentTime;
	const osc = audioCtx.createOscillator(); 
	const filter = audioCtx.createBiquadFilter(); 
	const gain = audioCtx.createGain(); 
	const lfo = audioCtx.createOscillator(); 
	const lfoGain = audioCtx.createGain(); 
	const lfoFilter = audioCtx.createBiquadFilter();
	osc.type = "square"; 
	osc.frequency.value = 440; 
	filter.type = "lowpass"; 
	filter.frequency.value = 900; 
	filter.Q.value = 2.3; 
	gain.gain.value = 0.07; 
	lfo.type = "sawtooth";
	lfo.frequency.value = 2.5; 
	lfoGain.gain.value = 200; 
	lfoFilter.type="lowpass";
	lfoFilter.frequency.value = 12;
	lfoFilter.Q.value=2;
	//lfo.connect(lfoFilter);
	osc.connect(filter); 
	filter.connect(gain); 
	gain.connect(audioCtx.destination);
	lfo.connect(lfoGain); 
	lfoGain.connect(osc.frequency); 
	osc.start(); 
	lfo.start();
	gain.gain.exponentialRampToValueAtTime(0.06, now + 1.35);
	gain.gain.exponentialRampToValueAtTime(0.001, now + 1.351);
	osc.stop(now+1.352);
	lfo.stop(now+1.352);
}

// 9. Missile warning
  function warningBell(freq = 405) {
	const now = audioCtx.currentTime;
    const partials = [1, 2.03, 3.04, 4.01, 5.014, 6.012];
    const vols = [0.19, 0.13, 0.16, 0.19, 0.02, 0.03];
    partials.forEach((mult, i) => {
      tone(freq * mult, now, 1.15 - i * 0.15, 'sine', vols[i] );
    });
  }
  
  function tone( freq, start, dur, type = 'sine', vol = 0.17, freqEnd = null ) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }
  
  // 10. Chaff / flare cartridge
  function cartridge() {
	const now = audioCtx.currentTime;
	const source = audioCtx.createBufferSource();
	source.buffer = noiseBuffer(0.25);

	const nfilter = audioCtx.createBiquadFilter();
	nfilter.type = "lowpass";
	nfilter.Q.value = 2;

	const ngain = audioCtx.createGain();

    const tosc = audioCtx.createOscillator();
    const tgain = audioCtx.createGain();
    tosc.type = 'square';
    tosc.frequency.value = 30;
    const tfilter = audioCtx.createBiquadFilter();
	tfilter.type = "lowpass";
	tfilter.Q.value = 4;
	tfilter.frequency.setValueAtTime(95, now);
	
	
	source.connect(nfilter)
	tosc.connect(tfilter);
	nfilter.connect(ngain);
	ngain.connect(audioCtx.destination);
	
	nfilter.frequency.setValueAtTime(480, now);
	nfilter.frequency.exponentialRampToValueAtTime(220, now + 0.15);

	ngain.gain.setValueAtTime(0.001, now);
	ngain.gain.exponentialRampToValueAtTime(1.5, now + 0.01);
	ngain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

	tgain.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    tgain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
	tosc.frequency.exponentialRampToValueAtTime(10, now + 0.9);
	tfilter.frequency.exponentialRampToValueAtTime(30, now + 0.9);
	
    tfilter.connect(tgain);   // was tosc.connect(tgain): bypassed the low-pass
    tgain.connect(audioCtx.destination)
	
	source.start(now);
	source.stop(now + 0.161);
;
    tosc.start(now+0.13);
    tosc.stop(now + 0.91);
  }
  
  // 11. Rotor alarm
function rotorAlarm(){
    const now = audioCtx.currentTime;
	const osc = audioCtx.createOscillator(); 
	const filter = audioCtx.createBiquadFilter(); 
	const gain = audioCtx.createGain(); 
	const lfo = audioCtx.createOscillator(); 
	const lfoGain = audioCtx.createGain(); 
	const lfoFilter = audioCtx.createBiquadFilter();
	osc.type = "sawtooth"; 
	osc.frequency.value = 450; 
	filter.type = "lowpass"; 
	filter.frequency.value = 900; 
	filter.Q.value = 2.3; 
	gain.gain.value = 0.07; 
	lfo.type = "square";
	lfo.frequency.value = 1.5; 
	lfoGain.gain.value = 50; 
	lfoFilter.type="lowpass";
	lfoFilter.frequency.value = 12;
	lfoFilter.Q.value=2;
	//lfo.connect(lfoFilter);
	osc.connect(filter); 
	filter.connect(gain); 
	gain.connect(audioCtx.destination);
	lfo.connect(lfoGain); 
	lfoGain.connect(osc.frequency); 
	osc.start(); 
	lfo.start();
	gain.gain.exponentialRampToValueAtTime(0.06, now + 1.25);
	gain.gain.exponentialRampToValueAtTime(0.001, now + 1.251);
	osc.stop(now+1.252);
	lfo.stop(now+1.252);
}

// Rotor over-speed damage: a bearing seizing / metal grinding on metal.
// One-shot (~0.5-0.65 s) and safe to call every time damage is applied - it
// ignores calls inside a short random gap so repeated calls chain into a
// continuous grind rather than stacking up. `intensity` 0..1 sets loudness.
// Layers: a ratcheting band-passed noise scrape that sweeps down, a wobbling
// low groan that drops in pitch as the bearing binds, and a faint scratchy squeal.
let _grindNext = 0;
function rotorGrind(intensity = 0.5) {
  const now = audioCtx.currentTime;
  if (now < _grindNext) return;
  _grindNext = now + 0.30 + Math.random() * 0.15;
  const k = Math.max(0, Math.min(1, intensity));
  const dur = 0.5 + Math.random() * 0.15;
  const peak = 0.08 + 0.14 * k;
  const end = now + dur + 0.05;

  const master = audioCtx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(peak, now + 0.04);
  master.gain.exponentialRampToValueAtTime(peak * 0.6, now + dur * 0.6);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  master.connect(audioCtx.destination);

  // Ratchet: a sawtooth LFO (0..1 ramps ~30-45 times a second) chops the scrape.
  const ratchet = audioCtx.createOscillator();
  ratchet.type = "sawtooth";
  ratchet.frequency.value = 30 + Math.random() * 15;

  // 1. Scrape
  const scrape = audioCtx.createBufferSource();
  scrape.buffer = noiseBuffer(0.7);
  const scrapeBP = audioCtx.createBiquadFilter();
  scrapeBP.type = "bandpass";
  scrapeBP.Q.value = 4;
  const f0 = 1100 + Math.random() * 500;
  scrapeBP.frequency.setValueAtTime(f0, now);
  scrapeBP.frequency.exponentialRampToValueAtTime(f0 * 0.6, now + dur);
  const chop = audioCtx.createGain();
  chop.gain.value = 0.5;
  const chopDepth = audioCtx.createGain();
  chopDepth.gain.value = 0.5;
  ratchet.connect(chopDepth);
  chopDepth.connect(chop.gain);
  const scrapeLevel = audioCtx.createGain();
  scrapeLevel.gain.value = 4;
  scrape.connect(scrapeBP);
  scrapeBP.connect(chop);
  chop.connect(scrapeLevel);
  scrapeLevel.connect(master);

  // 2. Groan
  const groan = audioCtx.createOscillator();
  groan.type = "sawtooth";
  groan.frequency.setValueAtTime(70, now);
  groan.frequency.exponentialRampToValueAtTime(38, now + dur);
  const wobble = audioCtx.createOscillator();
  wobble.type = "sine";
  wobble.frequency.value = 7;
  const wobbleDepth = audioCtx.createGain();
  wobbleDepth.gain.value = 6;
  wobble.connect(wobbleDepth);
  wobbleDepth.connect(groan.frequency);
  const groanLP = audioCtx.createBiquadFilter();
  groanLP.type = "lowpass";
  groanLP.frequency.value = 380;
  groanLP.Q.value = 1;
  const groanLevel = audioCtx.createGain();
  groanLevel.gain.value = 0.35;
  groan.connect(groanLP);
  groanLP.connect(groanLevel);
  groanLevel.connect(master);

  // 3. Squeal: scratchy because the ratchet LFO also jitters its pitch
  const squeal = audioCtx.createOscillator();
  squeal.type = "triangle";
  squeal.frequency.setValueAtTime(2300, now);
  squeal.frequency.exponentialRampToValueAtTime(1500, now + dur);
  const squealJitter = audioCtx.createGain();
  squealJitter.gain.value = 60;
  ratchet.connect(squealJitter);
  squealJitter.connect(squeal.frequency);
  const squealLevel = audioCtx.createGain();
  squealLevel.gain.value = 0.012 + 0.02 * k;
  squeal.connect(squealLevel);
  squealLevel.connect(master);

  scrape.start(now);
  groan.start(now);
  squeal.start(now);
  ratchet.start(now);
  wobble.start(now);
  scrape.stop(end);
  groan.stop(end);
  squeal.stop(end);
  ratchet.stop(end);
  wobble.stop(end);
}

// Player craft destroyed: deep rolling rumble with a heavy impact thump and
// tearing-metal crunch, ~3 s. Played once from endMissionCrash() and carries on
// under the crash screen. CRASH_RUMBLE_VOLUME is the overall level (by estimate,
// tune by ear). Layers: sine thump dropping 75->26 Hz; sub triangle; low-passed
// brown noise whose cut-off sweeps down with a slow rolling tremolo; a short
// band-passed crunch burst plus a few random debris ticks.
const CRASH_RUMBLE_VOLUME = 0.7;
function crashRumble() {
  const now = audioCtx.currentTime;
  const dur = 3.0;
  const end = now + dur + 0.1;

  const master = audioCtx.createGain();
  master.gain.value = CRASH_RUMBLE_VOLUME;
  master.connect(audioCtx.destination);

  // 1. Impact thump
  const thump = audioCtx.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(75, now);
  thump.frequency.exponentialRampToValueAtTime(26, now + 0.6);
  const thumpGain = audioCtx.createGain();
  thumpGain.gain.setValueAtTime(0.0001, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
  thump.connect(thumpGain);
  thumpGain.connect(master);

  // 2. Sub-bass body
  const sub = audioCtx.createOscillator();
  sub.type = "triangle";
  sub.frequency.setValueAtTime(52, now);
  sub.frequency.exponentialRampToValueAtTime(30, now + dur);
  const subGain = audioCtx.createGain();
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.5, now + 0.03);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  sub.connect(subGain);
  subGain.connect(master);

  // 3. Rolling rumble
  const rumble = audioCtx.createBufferSource();
  rumble.buffer = brownNoiseBuffer(3);
  const rumbleLP = audioCtx.createBiquadFilter();
  rumbleLP.type = "lowpass";
  rumbleLP.Q.value = 0.8;
  rumbleLP.frequency.setValueAtTime(220, now);
  rumbleLP.frequency.exponentialRampToValueAtTime(55, now + dur);
  const roll = audioCtx.createGain();         // slow tremolo stage, centred on 0.75
  roll.gain.value = 0.75;
  const rollLfo = audioCtx.createOscillator();
  rollLfo.type = "sine";
  rollLfo.frequency.value = 8.5;
  const rollDepth = audioCtx.createGain();
  rollDepth.gain.value = 0.25;
  rollLfo.connect(rollDepth);
  rollDepth.connect(roll.gain);
  const rumbleGain = audioCtx.createGain();
  rumbleGain.gain.setValueAtTime(0.0001, now);
  rumbleGain.gain.exponentialRampToValueAtTime(1.0, now + 0.02);
  rumbleGain.gain.exponentialRampToValueAtTime(0.55, now + 0.7);
  rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  rumble.connect(rumbleLP);
  rumbleLP.connect(roll);
  roll.connect(rumbleGain);
  rumbleGain.connect(master);

  // 4. Crunch burst
  const crunch = audioCtx.createBufferSource();
  crunch.buffer = noiseBuffer(0.5);
  const crunchBP = audioCtx.createBiquadFilter();
  crunchBP.type = "bandpass";
  crunchBP.Q.value = 1.2;
  crunchBP.frequency.setValueAtTime(1100, now);
  crunchBP.frequency.exponentialRampToValueAtTime(260, now + 0.4);
  const crunchGain = audioCtx.createGain();
  crunchGain.gain.setValueAtTime(0.0001, now);
  crunchGain.gain.exponentialRampToValueAtTime(0.55, now + 0.008);
  crunchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  crunch.connect(crunchBP);
  crunchBP.connect(crunchGain);
  crunchGain.connect(master);

  // 5. Debris / tearing-metal ticks
  for (let i = 0; i < 5; i++) {
    const t0 = now + 0.08 + Math.random() * 0.9;
    const tick = audioCtx.createBufferSource();
    tick.buffer = noiseBuffer(0.2);
    const tickBP = audioCtx.createBiquadFilter();
    tickBP.type = "bandpass";
    tickBP.Q.value = 3;
    tickBP.frequency.value = 350 + Math.random() * 2000;
    const tickGain = audioCtx.createGain();
    tickGain.gain.setValueAtTime(0.0001, t0);
    tickGain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.005);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06 + Math.random() * 0.08);
    tick.connect(tickBP);
    tickBP.connect(tickGain);
    tickGain.connect(master);
    tick.start(t0);
    tick.stop(t0 + 0.2);
  }

  thump.start(now);
  sub.start(now);
  rumble.start(now);
  rollLfo.start(now);
  crunch.start(now);
  thump.stop(end);
  sub.stop(end);
  rumble.stop(end);
  rollLfo.stop(end);
  crunch.stop(now + 0.5);
}
