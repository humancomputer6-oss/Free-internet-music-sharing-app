import { Track } from '../types';

/**
 * Encodes audio buffer into standard PCM 16-bit stereo WAV format blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + length, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, length, true);

  // Write interleaved PCM samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Renders synthesized audio or beat sequencer offline into a downloadable WAV file
 */
export async function exportTrackToWav(track: Track, durationSeconds: number = 24): Promise<Blob> {
  const sampleRate = 44100;
  const renderLength = Math.min(60, durationSeconds || 24);
  const totalFrames = sampleRate * renderLength;

  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.85;
  masterGain.connect(offlineCtx.destination);

  const bpm = track.bpm || 120;
  const secondsPer16th = 60 / (bpm * 4);
  const totalSteps = Math.floor(renderLength / secondsPer16th);

  for (let step = 0; step < totalSteps; step++) {
    const time = step * secondsPer16th;

    if (track.stepSequencerData) {
      const data = track.stepSequencerData;
      const step16 = step % 16;
      if (data[0]?.[step16]) renderOfflineKick(offlineCtx, time, masterGain);
      if (data[1]?.[step16]) renderOfflineSnare(offlineCtx, time, masterGain);
      if (data[2]?.[step16]) renderOfflineHat(offlineCtx, time, masterGain);
      if (data[3]?.[step16]) renderOfflineClap(offlineCtx, time, masterGain);
      if (data[4]?.[step16]) renderOfflineBass(offlineCtx, time, 55, masterGain);
      if (data[5]?.[step16]) renderOfflinePluck(offlineCtx, time, 440 * Math.pow(2, ((step16 % 5) * 3) / 12), masterGain);
    } else {
      // General genre pattern render
      const type = track.synthConfig?.type || 'synthwave';
      if (type === 'synthwave') {
        if (step % 4 === 0) renderOfflineKick(offlineCtx, time, masterGain);
        if (step % 16 === 4 || step % 16 === 12) renderOfflineSnare(offlineCtx, time, masterGain);
        const bassFreq = [55, 55, 65.4, 49][Math.floor(step / 16) % 4];
        renderOfflineBass(offlineCtx, time, bassFreq, masterGain);
        if (step % 2 === 0) {
          const melody = [440, 523.2, 659.2, 784, 880][(step / 2) % 5];
          renderOfflinePluck(offlineCtx, time, melody, masterGain);
        }
      } else if (type === 'lofi') {
        if (step % 16 === 0 || step % 16 === 10) renderOfflineKick(offlineCtx, time, masterGain, 0.7);
        if (step % 16 === 4 || step % 16 === 12) renderOfflineSnare(offlineCtx, time, masterGain, 0.5);
        if (step % 2 === 0) renderOfflineHat(offlineCtx, time, masterGain);
        if (step % 8 === 0) renderOfflineRhodes(offlineCtx, time, [138.59, 164.81, 207.65, 246.94], masterGain);
      } else {
        if (step % 4 === 0) renderOfflineKick(offlineCtx, time, masterGain);
        if (step % 16 === 4 || step % 16 === 12) renderOfflineSnare(offlineCtx, time, masterGain);
        if (step % 2 === 1) renderOfflineHat(offlineCtx, time, masterGain);
      }
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWav(renderedBuffer);
}

function renderOfflineKick(ctx: OfflineAudioContext, time: number, dest: AudioNode, gainVal = 0.85): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
  gain.gain.setValueAtTime(gainVal, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.3);
}

function renderOfflineSnare(ctx: OfflineAudioContext, time: number, dest: AudioNode, gainVal = 0.6): void {
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 800;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainVal, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start(time);
  noise.stop(time + 0.17);
}

function renderOfflineHat(ctx: OfflineAudioContext, time: number, dest: AudioNode): void {
  const bufferSize = ctx.sampleRate * 0.04;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start(time);
  noise.stop(time + 0.05);
}

function renderOfflineClap(ctx: OfflineAudioContext, time: number, dest: AudioNode): void {
  const bufferSize = ctx.sampleRate * 0.14;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1300;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.45, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start(time);
  noise.stop(time + 0.14);
}

function renderOfflineBass(ctx: OfflineAudioContext, time: number, freq: number, dest: AudioNode): void {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, time);
  filter.frequency.exponentialRampToValueAtTime(140, time + 0.15);
  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.2);
}

function renderOfflinePluck(ctx: OfflineAudioContext, time: number, freq: number, dest: AudioNode): void {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, time);
  filter.frequency.exponentialRampToValueAtTime(300, time + 0.18);
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.19);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.21);
}

function renderOfflineRhodes(ctx: OfflineAudioContext, time: number, freqs: number[], dest: AudioNode): void {
  freqs.forEach(freq => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 1.25);
  });
}
