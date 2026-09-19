// Sound

function noiseBuffer(duration = 2) {
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
function distantGunfire(dist=1000) { // time delay
  if (dist>1500) return;
  let t=dist/400;
  const now = audioCtx.currentTime+t;
  // A short, filtered noise burst gives the distant "crack".
  function shot(time, volume = 0.10*1000/dist) {
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

    source.start(time+t);
    source.stop(time + 0.18+t);
  }

  // Irregular timing makes it sound less mechanical.
  shot(now, 0.13);
  shot(now + 0.42, 0.10);
  shot(now + 1.05, 0.15);
  shot(now + 1.72, 0.08);
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
  crackGain.gain.exponentialRampToValueAtTime(1.0, now + 0.004);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  crack.start(now);
  crack.stop(now + 0.05);

  // Layer 2: low punchy body — a fast downward-sweeping thump giving the round its "cannon" weight.
  const body = audioCtx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(source='player'?160:210, now);
  body.frequency.exponentialRampToValueAtTime(48, now + 0.09);
  const bodyGain = audioCtx.createGain();
  body.connect(bodyGain);
  bodyGain.connect(audioCtx.destination);
  bodyGain.gain.setValueAtTime(0.001, now);
  bodyGain.gain.exponentialRampToValueAtTime(1.1, now + 0.01);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  
  body.frequency.exponentialRampToValueAtTime(35, now + 0.17);
  bodyGain.gain.exponentialRampToValueAtTime(1.1, now + 0.151);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
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
  boomGain.gain.exponentialRampToValueAtTime(0.9, now + 0.008);
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
lfoGain.gain.value = 0.18;

const engineGain = audioCtx.createGain();
engineGain.gain.value = 0.0005;

// LFO modulates the gain slightly rather than fully gating it
lfo.connect(lfoGain);
lfoGain.connect(engineGain.gain);

engineSource
  .connect(rumble)
  .connect(growl)
  .connect(engineGain)
  .connect(audioCtx.destination);

lfo.start();
engineSource.start();

  loopAudio = {
    rotorNoise, pulseOsc, rotorGain, rotorFilter,
    engineSource, engineGain, rumble, growl
  };
}

function updateLoopAudio(rotorRpm, engFactor, anyEngineOn, climb, alt){
  if (!loopAudio) return;
  const now = audioCtx.currentTime;
  const rpm = Math.max(0, rotorRpm ?? 0);

  // Rotor: whoosh volume + filter brighten with RPM; revolution rate (and
  // so the whoosh pulse rate) rises with it too. Silent when not spinning.
  const rotorVol = rpm > 0.03 ? Math.min(0.24, 0.05 + rpm * 0.2) : 0;
  loopAudio.rotorGain.gain.setTargetAtTime(rotorVol, now, 0.15);
  loopAudio.rotorFilter.frequency.setTargetAtTime(1200 + rpm * 500 + Math.max(climb*300,-300) + Math.max(alt*20, 900), now, 0.2);
  loopAudio.pulseOsc.frequency.setTargetAtTime(2 + rpm * 8, now, 0.2);

  // Engine roar: present whenever at least one engine is running, scaled by
  // combined power, deliberately kept quiet relative to the rotor and effects.
  const ef = Math.max(0, Math.min(1, engFactor ?? 0));
  const engineVol = anyEngineOn ? Math.min(0.09, 0.02 + ef * 0.07) : 0;
  loopAudio.engineGain.gain.setTargetAtTime(engineVol, now, 0.25);
  loopAudio.growl.frequency.setTargetAtTime(180 + ef * 300,now,0.3);
  loopAudio.rumble.frequency.setTargetAtTime(100 + ef * 60,now,0.4);
  loopAudio.engineGain.gain.setTargetAtTime(engineVol * 0.6, now,0.25);}

function stopLoopAudio(){
  if (!loopAudio) return;
  const now = audioCtx.currentTime;
  const { rotorNoise, pulseOsc, rotorGain, engineSource, engineGain } = loopAudio;
  rotorGain.gain.setTargetAtTime(0.0001, now, 0.08);
  engineGain.gain.setTargetAtTime(0.0001, now, 0.08);
  rotorNoise.stop(now + 0.4);
  pulseOsc.stop(now + 0.4);
  engineSource.stop(now + 0.4);
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
	
    tosc.connect(tgain);
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

