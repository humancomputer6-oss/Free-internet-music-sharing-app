import { EqualizerSettings, SynthTrackConfig, Track } from '../types';

export class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  
  // 5-band EQ filters
  private eqFilters: {
    low: BiquadFilterNode | null;
    lowMid: BiquadFilterNode | null;
    mid: BiquadFilterNode | null;
    highMid: BiquadFilterNode | null;
    high: BiquadFilterNode | null;
  } = {
    low: null,
    lowMid: null,
    mid: null,
    highMid: null,
    high: null,
  };

  // HTML5 audio playback for audio files / blobs
  private audioElement: HTMLAudioElement | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;

  // Synthesizer playback state
  private isSynthPlaying: boolean = false;
  private currentTrack: Track | null = null;
  private synthTimerId: number | null = null;
  private synthStartTime: number = 0;
  private synthCurrentSec: number = 0;
  private synthTotalSec: number = 180;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private scheduledEvents: { stop: () => void }[] = [];

  // Listeners
  private timeUpdateCallbacks: ((time: number, duration: number) => void)[] = [];
  private stateChangeCallbacks: ((isPlaying: boolean) => void)[] = [];
  private trackEndCallbacks: (() => void)[] = [];

  private isPausedByUser: boolean = false;

  private constructor() {
    // Lazily initialized on first user interaction
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;

      // Analyser Node
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      // 5-band EQ
      this.eqFilters.low = this.ctx.createBiquadFilter();
      this.eqFilters.low.type = 'lowshelf';
      this.eqFilters.low.frequency.value = 60;

      this.eqFilters.lowMid = this.ctx.createBiquadFilter();
      this.eqFilters.lowMid.type = 'peaking';
      this.eqFilters.lowMid.frequency.value = 250;
      this.eqFilters.lowMid.Q.value = 1.0;

      this.eqFilters.mid = this.ctx.createBiquadFilter();
      this.eqFilters.mid.type = 'peaking';
      this.eqFilters.mid.frequency.value = 1000;
      this.eqFilters.mid.Q.value = 1.0;

      this.eqFilters.highMid = this.ctx.createBiquadFilter();
      this.eqFilters.highMid.type = 'peaking';
      this.eqFilters.highMid.frequency.value = 4000;
      this.eqFilters.highMid.Q.value = 1.0;

      this.eqFilters.high = this.ctx.createBiquadFilter();
      this.eqFilters.high.type = 'highshelf';
      this.eqFilters.high.frequency.value = 12000;

      // Connect EQ chain: Low -> LowMid -> Mid -> HighMid -> High -> Analyser -> MasterGain -> Destination
      this.eqFilters.low.connect(this.eqFilters.lowMid);
      this.eqFilters.lowMid.connect(this.eqFilters.mid);
      this.eqFilters.mid.connect(this.eqFilters.highMid);
      this.eqFilters.highMid.connect(this.eqFilters.high);
      this.eqFilters.high.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Setup audio element
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';

      this.mediaElementSource = this.ctx.createMediaElementSource(this.audioElement);
      this.mediaElementSource.connect(this.eqFilters.low);

      this.audioElement.ontimeupdate = () => {
        if (!this.audioElement) return;
        this.notifyTimeUpdate(this.audioElement.currentTime, this.audioElement.duration || 0);
      };

      this.audioElement.onended = () => {
        this.notifyEnded();
      };
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public async playTrack(track: Track, startFromSeconds: number = 0): Promise<void> {
    const ctx = this.initContext();
    this.stopCurrent();
    this.currentTrack = track;
    this.isPausedByUser = false;

    if (track.audioBlobUrl) {
      // File-based playback (User upload, recording, or audio stream)
      if (this.audioElement) {
        this.audioElement.src = track.audioBlobUrl;
        this.audioElement.currentTime = startFromSeconds;
        try {
          await this.audioElement.play();
          this.notifyStateChange(true);
        } catch (e) {
          console.warn('Audio play request failed or was interrupted', e);
        }
      }
    } else {
      // Procedural synthesizer playback (Synthwave, Lo-Fi, Ambient, Chiptune, Sonic Lab)
      this.synthTotalSec = track.duration || 180;
      this.synthCurrentSec = startFromSeconds;
      this.synthStartTime = ctx.currentTime - startFromSeconds;
      this.isSynthPlaying = true;
      this.notifyStateChange(true);
      this.startSynthLoop(track);
    }
  }

  public pause(): void {
    this.isPausedByUser = true;
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
    if (this.isSynthPlaying) {
      this.isSynthPlaying = false;
      if (this.synthTimerId) {
        window.cancelAnimationFrame(this.synthTimerId);
        this.synthTimerId = null;
      }
      this.clearScheduledEvents();
    }
    this.notifyStateChange(false);
  }

  public resume(): void {
    if (!this.currentTrack) return;
    this.isPausedByUser = false;
    this.initContext();

    if (this.currentTrack.audioBlobUrl && this.audioElement) {
      this.audioElement.play().catch(console.warn);
      this.notifyStateChange(true);
    } else if (this.currentTrack.synthConfig || this.currentTrack.stepSequencerData) {
      this.isSynthPlaying = true;
      if (this.ctx) {
        this.synthStartTime = this.ctx.currentTime - this.synthCurrentSec;
      }
      this.notifyStateChange(true);
      this.startSynthLoop(this.currentTrack);
    }
  }

  public seek(seconds: number): void {
    if (this.currentTrack?.audioBlobUrl && this.audioElement) {
      this.audioElement.currentTime = seconds;
      this.notifyTimeUpdate(seconds, this.audioElement.duration || this.currentTrack.duration);
    } else if (this.isSynthPlaying || this.currentTrack) {
      this.synthCurrentSec = seconds;
      if (this.ctx) {
        this.synthStartTime = this.ctx.currentTime - seconds;
      }
      this.clearScheduledEvents();
      this.notifyTimeUpdate(seconds, this.synthTotalSec);
    }
  }

  public setVolume(volume: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public setEq(settings: EqualizerSettings): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.eqFilters.low) this.eqFilters.low.gain.setValueAtTime(settings.low, now);
    if (this.eqFilters.lowMid) this.eqFilters.lowMid.gain.setValueAtTime(settings.lowMid, now);
    if (this.eqFilters.mid) this.eqFilters.mid.gain.setValueAtTime(settings.mid, now);
    if (this.eqFilters.highMid) this.eqFilters.highMid.gain.setValueAtTime(settings.highMid, now);
    if (this.eqFilters.high) this.eqFilters.high.gain.setValueAtTime(settings.high, now);
  }

  public isPlaying(): boolean {
    if (this.audioElement && !this.audioElement.paused) return true;
    return this.isSynthPlaying;
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  private stopCurrent(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.isSynthPlaying = false;
    if (this.synthTimerId) {
      window.cancelAnimationFrame(this.synthTimerId);
      this.synthTimerId = null;
    }
    this.clearScheduledEvents();
  }

  private clearScheduledEvents(): void {
    this.scheduledEvents.forEach(e => e.stop());
    this.scheduledEvents = [];
  }

  /* -------------------------------------------------------------
     PROCEDURAL SYNTHESIZER ENGINE
     ------------------------------------------------------------- */
  private startSynthLoop(track: Track): void {
    if (!this.ctx || !this.isSynthPlaying) return;
    const bpm = track.bpm || 110;
    const secondsPer16th = 60 / (bpm * 4);
    this.nextNoteTime = this.ctx.currentTime;
    this.currentStep = Math.floor((this.synthCurrentSec / secondsPer16th) % 64);

    const scheduler = () => {
      if (!this.isSynthPlaying || !this.ctx) return;

      const elapsed = this.ctx.currentTime - this.synthStartTime;
      this.synthCurrentSec = elapsed;

      if (this.synthCurrentSec >= this.synthTotalSec) {
        this.synthCurrentSec = 0;
        this.synthStartTime = this.ctx.currentTime;
        this.notifyEnded();
        return;
      }

      this.notifyTimeUpdate(this.synthCurrentSec, this.synthTotalSec);

      // Lookahead: schedule notes up to 0.15s ahead
      while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
        this.scheduleStep(track, this.currentStep, this.nextNoteTime);
        this.nextNoteTime += secondsPer16th;
        this.currentStep = (this.currentStep + 1) % 64;
      }

      this.synthTimerId = window.requestAnimationFrame(scheduler);
    };

    scheduler();
  }

  private scheduleStep(track: Track, step: number, time: number): void {
    if (!this.ctx || !this.eqFilters.low) return;
    const inputNode = this.eqFilters.low;
    const synthConfig = track.synthConfig || {
      type: 'synthwave',
      bpm: track.bpm || 120,
      rootFreq: 220,
      scale: [0, 3, 5, 7, 10],
      patternLength: 4,
    };

    if (track.stepSequencerData) {
      // Step sequencer custom beat (Kick, Snare, Cl Hat, Op Hat, Clap, Bass, Synth)
      const data = track.stepSequencerData;
      const step16 = step % 16;
      if (data[0]?.[step16]) this.triggerKick(time, inputNode);
      if (data[1]?.[step16]) this.triggerSnare(time, inputNode);
      if (data[2]?.[step16]) this.triggerClosedHat(time, inputNode);
      if (data[3]?.[step16]) this.triggerOpenHat(time, inputNode);
      if (data[4]?.[step16]) this.triggerClap(time, inputNode);
      if (data[5]?.[step16]) this.trigger808Bass(time, 55, inputNode);
      if (data[6]?.[step16]) this.triggerLead(time, 440 * Math.pow(2, ((step16 % 5) * 3) / 12), inputNode);
      return;
    }

    // Genre-tailored synthesizer arrangements
    switch (synthConfig.type) {
      case 'synthwave':
        this.renderSynthwavePattern(step, time, inputNode);
        break;
      case 'lofi':
        this.renderLofiPattern(step, time, inputNode);
        break;
      case 'ambient':
        this.renderAmbientPattern(step, time, inputNode);
        break;
      case 'chiptune':
        this.renderChiptunePattern(step, time, inputNode);
        break;
      case 'indie':
      default:
        this.renderIndiePattern(step, time, inputNode);
        break;
    }
  }

  /* --- Synthwave: Retro 80s gated drums, rolling synth bass, lush brass pads --- */
  private renderSynthwavePattern(step: number, time: number, dest: AudioNode): void {
    // Four on the floor kick
    if (step % 4 === 0) {
      this.triggerKick(time, dest, 0.9);
    }
    // Gated Snare on 4 and 12
    if (step % 16 === 4 || step % 16 === 12) {
      this.triggerSnare(time, dest, 0.85);
    }
    // 16th rolling synth bass (A minor bassline)
    const bassNotes = [55, 55, 55, 55, 65.41, 65.41, 65.41, 65.41, 49, 49, 49, 49, 58.27, 58.27, 58.27, 58.27];
    const bassFreq = bassNotes[Math.floor(step / 4) % bassNotes.length];
    this.triggerSynthwaveBass(time, bassFreq, dest);

    // Chords on bar boundaries
    if (step % 16 === 0) {
      const chordRoots = [220, 261.63, 196, 246.94]; // Am, C, G, Em
      const root = chordRoots[Math.floor(step / 16) % chordRoots.length];
      this.triggerSynthPad(time, [root, root * 1.189, root * 1.498], 1.8, dest);
    }

    // Arpeggiated melody on every other 16th
    if (step % 2 === 0) {
      const arpScales = [440, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 523.25];
      const noteFreq = arpScales[(step / 2) % arpScales.length];
      this.triggerPluckLead(time, noteFreq, dest, 0.25);
    }
  }

  /* --- Lo-Fi Chill: Vinyl crackle, warm rhodes 7ths, lazy boom-bap swing --- */
  private renderLofiPattern(step: number, time: number, dest: AudioNode): void {
    // Boom-bap kick: beats 0, 10
    if (step % 16 === 0 || step % 16 === 10) {
      this.triggerLofiKick(time, dest);
    }
    // Snare on 4 and 12 with slight lag
    if (step % 16 === 4 || step % 16 === 12) {
      this.triggerRimSnare(time, dest);
    }
    // Soft closed hat with velocity variation
    if (step % 2 === 0) {
      const vel = step % 4 === 2 ? 0.35 : 0.2;
      this.triggerClosedHat(time, dest, vel);
    }
    // Warm Rhodes electric piano chords (C#m9, F#m7, B9, Emaj7)
    if (step % 16 === 0) {
      const lofiChords = [
        [138.59, 164.81, 207.65, 246.94], // C#m7
        [185.00, 220.00, 277.18, 329.63], // F#m7
        [123.47, 155.56, 185.00, 220.00], // B7
        [164.81, 207.65, 246.94, 311.13], // Emaj7
      ];
      const chord = lofiChords[Math.floor(step / 16) % lofiChords.length];
      this.triggerRhodesChord(time, chord, dest);
    }
    // Sub bass note
    if (step % 8 === 0) {
      const bassFreqs = [69.3, 92.5, 61.7, 82.4];
      const bf = bassFreqs[Math.floor(step / 16) % bassFreqs.length];
      this.trigger808Bass(time, bf, dest, 0.4);
    }
  }

  /* --- Ambient: Deep meditative sub drone, sparkling bells, celestial sweeps --- */
  private renderAmbientPattern(step: number, time: number, dest: AudioNode): void {
    // Soft atmospheric bell every 4 steps
    if (step % 8 === 0 || step % 12 === 0) {
      const bellFreqs = [587.33, 659.25, 880, 987.77, 1174.66, 1318.51];
      const freq = bellFreqs[Math.floor(step / 4) % bellFreqs.length];
      this.triggerBellChime(time, freq, dest);
    }
    // Deep drone swell on bar 0 and 32
    if (step % 32 === 0) {
      this.triggerAmbientDrone(time, 87.31, dest); // F2 deep drone
    }
  }

  /* --- Chiptune: 8-bit retro pulse waves and noise bursts --- */
  private renderChiptunePattern(step: number, time: number, dest: AudioNode): void {
    if (step % 8 === 0) {
      this.trigger8BitNoise(time, dest, 'kick');
    }
    if (step % 8 === 4) {
      this.trigger8BitNoise(time, dest, 'snare');
    }
    // Rapid square arpeggio
    const arpNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    const freq = arpNotes[step % arpNotes.length];
    this.triggerSquareLead(time, freq, dest);
  }

  /* --- Indie Electronic: Four-on-the-floor, pluck synth arp, vocal formant filter --- */
  private renderIndiePattern(step: number, time: number, dest: AudioNode): void {
    if (step % 4 === 0) {
      this.triggerKick(time, dest, 0.8);
    }
    if (step % 16 === 4 || step % 16 === 12) {
      this.triggerClap(time, dest, 0.7);
    }
    if (step % 2 === 1) {
      this.triggerClosedHat(time, dest, 0.28);
    }
    if (step % 4 === 2) {
      this.triggerSynthwaveBass(time, 73.42, dest);
    }
    if (step % 4 === 0) {
      const chords = [
        [293.66, 349.23, 440], // Dm
        [261.63, 329.63, 392], // C
        [220, 261.63, 329.63], // Am
        [246.94, 311.13, 370]  // Bdim
      ];
      this.triggerSynthPad(time, chords[Math.floor(step / 16) % chords.length], 0.8, dest);
    }
  }

  /* -------------------------------------------------------------
     SYNTHESIZER SOUND GENERATORS
     ------------------------------------------------------------- */
  private triggerKick(time: number, dest: AudioNode, gainVal = 0.85): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  private triggerLofiKick(time: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(95, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.18);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.26);
  }

  private triggerSnare(time: number, dest: AudioNode, gainVal = 0.7): void {
    if (!this.ctx) return;
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 900;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + 0.19);
  }

  private triggerRimSnare(time: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.08);

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.11);
  }

  private triggerClosedHat(time: number, dest: AudioNode, gainVal = 0.25): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  private triggerOpenHat(time: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + 0.25);
  }

  private triggerClap(time: number, dest: AudioNode, gainVal = 0.5): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + 0.15);
  }

  private trigger808Bass(time: number, freq: number, dest: AudioNode, gainVal = 0.5): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.62);
  }

  private triggerSynthwaveBass(time: number, freq: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + 0.18);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  private triggerSynthPad(time: number, freqs: number[], duration: number, dest: AudioNode): void {
    if (!this.ctx) return;
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      // Subtle detune for lush analog chorus effect
      osc.frequency.setValueAtTime(freq * (1 + (idx - 1) * 0.003), time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, time);
      filter.frequency.linearRampToValueAtTime(600, time + duration);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    });
  }

  private triggerRhodesChord(time: number, freqs: number[], dest: AudioNode): void {
    if (!this.ctx) return;
    freqs.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.14, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.6);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + 1.65);
    });
  }

  private triggerPluckLead(time: number, freq: number, dest: AudioNode, gainVal = 0.2): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + 0.18);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  private triggerLead(time: number, freq: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  private triggerBellChime(time: number, freq: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.16, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 3.2);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 3.3);
  }

  private triggerAmbientDrone(time: number, freq: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.2, time + 2.0);
    gain.gain.linearRampToValueAtTime(0.001, time + 7.5);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 8.0);
  }

  private triggerSquareLead(time: number, freq: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  private trigger8BitNoise(time: number, dest: AudioNode, type: 'kick' | 'snare'): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'kick') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.09);
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    }

    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.11);
  }

  /* -------------------------------------------------------------
     OBSERVERS & EVENTS
     ------------------------------------------------------------- */
  public onTimeUpdate(cb: (time: number, duration: number) => void): () => void {
    this.timeUpdateCallbacks.push(cb);
    return () => {
      this.timeUpdateCallbacks = this.timeUpdateCallbacks.filter(c => c !== cb);
    };
  }

  public onPlayStateChange(cb: (isPlaying: boolean) => void): () => void {
    this.stateChangeCallbacks.push(cb);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(c => c !== cb);
    };
  }

  public onEnded(cb: () => void): () => void {
    this.trackEndCallbacks.push(cb);
    return () => {
      this.trackEndCallbacks = this.trackEndCallbacks.filter(c => c !== cb);
    };
  }

  private notifyTimeUpdate(time: number, duration: number): void {
    this.timeUpdateCallbacks.forEach(cb => cb(time, duration));
  }

  private notifyStateChange(isPlaying: boolean): void {
    this.stateChangeCallbacks.forEach(cb => cb(isPlaying));
  }

  private notifyEnded(): void {
    this.trackEndCallbacks.forEach(cb => cb());
  }
}
