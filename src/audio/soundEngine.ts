/**
 * Web Audio API synthesizer for Neon Cube Rush
 * Generates dynamic rhythm music tracks and responsive sound effects.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private isPlayingMusic = false;
  private currentTrackId = 0;
  private currentBpm = 130;
  private nextNoteTime = 0;
  private currentStep = 0;
  private schedulerTimer: number | null = null;

  // Real-time beat reaction
  public onBeatCallbacks: Array<(beatIndex: number, isDownbeat: boolean) => void> = [];

  private musicVolumeVal = 0.7;
  private sfxVolumeVal = 0.8;

  constructor() {
    // Lazy initialize on first interaction
  }

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolumeVal;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolumeVal;
      this.sfxGain.connect(this.masterGain);
    } catch {
      console.warn('Web Audio API not supported');
    }
  }

  public setVolumes(musicVol: number, sfxVol: number) {
    this.musicVolumeVal = Math.max(0, Math.min(1, musicVol));
    this.sfxVolumeVal = Math.max(0, Math.min(1, sfxVol));

    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolumeVal, this.ctx.currentTime, 0.05);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolumeVal, this.ctx.currentTime, 0.05);
    }
  }

  // ---------- SFX GENERATION ----------

  public playJump() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playDoubleJump() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(580, now);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.19);
    osc2.stop(now + 0.19);
  }

  public playOrbJump() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1350, now + 0.22);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playPadBounce() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playGravityFlip() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playPortal() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.25);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playCoin() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.35, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.26);
    });
  }

  public playDeath() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // White noise blast + sub drop
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    // Sub thump
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(130, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);

    noise.start(now);
    sub.start(now);
    noise.stop(now + 0.36);
    sub.stop(now + 0.36);
  }

  public playVictory() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C Major arpeggio + fanfare
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.3, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.65);
    });
  }

  public playClick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // ---------- PROCEDURAL RHYTHM MUSIC ENGINE ----------

  public startMusic(trackId = 0, bpm = 130) {
    this.init();
    this.stopMusic();

    this.isPlayingMusic = true;
    this.currentTrackId = trackId;
    this.currentBpm = bpm;
    this.currentStep = 0;

    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
      this.scheduleLoop();
    }
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  private scheduleLoop = () => {
    if (!this.isPlayingMusic || !this.ctx) return;

    const lookAhead = 0.1; // seconds
    const secondsPerStep = (60.0 / this.currentBpm) / 4; // 16th notes

    while (this.nextNoteTime < this.ctx.currentTime + lookAhead) {
      this.playStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += secondsPerStep;
      this.currentStep = (this.currentStep + 1) % 64;
    }

    this.schedulerTimer = window.setTimeout(this.scheduleLoop, 25);
  };

  private playStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    const beatIndex = Math.floor(step / 4);
    const is16th = step % 4;
    const isQuarter = is16th === 0;
    const isDownbeat = step % 16 === 0;

    // Trigger visual callback
    if (isQuarter) {
      setTimeout(() => {
        this.onBeatCallbacks.forEach(cb => cb(beatIndex, isDownbeat));
      }, Math.max(0, (time - this.ctx!.currentTime) * 1000));
    }

    // Drum Patterns based on Track
    // Kick on beats 0, 4, 8, 12 (4-on-the-floor) or variations
    if (isQuarter) {
      this.triggerKick(time);
    }

    // Snare / Clap on beat 4 and 12 (2 and 4 in 4/4)
    if (step % 8 === 4) {
      this.triggerSnare(time);
    }

    // Hi-hats on off-beats (step 2, 6, 10, 14...) or rolling 16ths
    if (step % 2 === 0) {
      const isAccent = isQuarter;
      this.triggerHiHat(time, isAccent);
    }

    // Synth Bassline and Leads per track
    this.playTrackNotes(this.currentTrackId, step, time);
  }

  private playTrackNotes(trackId: number, step: number, time: number) {
    // Scales:
    // Track 0 (Cyber Genesis - Easy): F minor / C minor synthwave [F2, Ab2, Bb2, C3, Eb3]
    // Track 1 (Neon Inferno - Normal): D minor dark electro [D2, F2, G2, A2, C3]
    // Track 2 (Quantum Overdrive - Hard): E minor high energy D&B [E2, G2, A2, B2, D3]
    // Track 3 (Editor Chill): A minor chillwave [A2, C3, D3, E3, G3]

    const rootFreqs = [
      [87.31, 103.83, 116.54, 130.81, 155.56, 174.61], // F
      [73.42, 87.31, 98.00, 110.00, 130.81, 146.83],  // D
      [82.41, 98.00, 110.00, 123.47, 146.83, 164.81], // E
      [110.00, 130.81, 146.83, 164.81, 196.00, 220.0] // A
    ];

    const currentScale = rootFreqs[trackId % rootFreqs.length];

    // Bassline (Every 8th note or galloping rhythm)
    if (step % 2 === 0) {
      const bar = Math.floor(step / 16);
      const bassIndex = (bar + Math.floor(step / 4)) % currentScale.length;
      const bassFreq = currentScale[bassIndex];
      this.triggerBass(bassFreq, time, 0.12);
    }

    // Melodic Arpeggio on 16th notes
    if (trackId === 2 || (trackId === 1 && step >= 16) || (trackId === 0 && step % 2 === 1)) {
      const arpNotes = [0, 2, 4, 3, 1, 4, 2, 5];
      const noteIdx = arpNotes[step % arpNotes.length] % currentScale.length;
      const leadFreq = currentScale[noteIdx] * 4; // Higher octave
      this.triggerLead(leadFreq, time, 0.08);
    }
  }

  private triggerKick(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.14);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  private triggerSnare(time: number) {
    if (!this.ctx || !this.musicGain) return;

    // Noise component
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    // Tone body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.09);

    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);

    noise.start(time);
    osc.start(time);
    noise.stop(time + 0.15);
    osc.stop(time + 0.15);
  }

  private triggerHiHat(time: number, isAccent: boolean) {
    if (!this.ctx || !this.musicGain) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * (isAccent ? 0.06 : 0.03));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isAccent ? 0.2 : 0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isAccent ? 0.05 : 0.025));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.07);
  }

  private triggerBass(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, time + duration);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private triggerLead(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 2, time);
    filter.Q.value = 2.5;

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }
}

export const soundEngine = new SoundEngine();
