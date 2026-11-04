import { chartOffsetMs, difficulties, makeDemoChart } from '../core/chart';
import type { DifficultyId } from '../core/types';

/** Original showcase tune, synthesized locally. No remote audio or server is used. */
export function makeDemoAudio(id: DifficultyId): Blob {
  const sampleRate = 16000;
  const notes = makeDemoChart(id);
  const beat = 60 / difficulties[id].bpm;
  const duration = Math.max(...notes.map(n => (n.time + (n.duration || 0)) / 1000)) + 2;
  const samples = new Float32Array(Math.ceil(duration * sampleRate));
  const roots = [48, 53, 55, 51];
  const melody = [0, 7, 12, 15, 7, 12, 19, 12];
  const voice = (start: number, length: number, midi: number, level: number, bass = false) => {
    const from = Math.floor(start * sampleRate), count = Math.floor(length * sampleRate);
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    for (let i = 0; i < count && from + i < samples.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(1, t / .008) * Math.pow(Math.max(0, 1 - t / length), bass ? 1.8 : 2.3);
      samples[from + i] += level * envelope * (Math.sin(2 * Math.PI * freq * t) + .22 * Math.sin(4 * Math.PI * freq * t));
    }
  };
  for (let step = 0; chartOffsetMs / 1000 + step * beat / 2 < duration - 1; step++) {
    const start = chartOffsetMs / 1000 + step * beat / 2;
    const root = roots[Math.floor(step / 16) % roots.length];
    voice(start, beat * .7, root + melody[step % melody.length] + 12, .15);
    if (step % 4 === 0) voice(start, beat * 1.7, root - 12, .23, true);
    const drumLength = Math.floor(sampleRate * .06);
    for (let j = 0; j < drumLength && Math.floor(start * sampleRate) + j < samples.length; j++) {
      const t = j / sampleRate, envelope = Math.exp(-t * 65);
      const kick = step % 4 === 0 ? Math.sin(2 * Math.PI * (80 * t - 150 * t * t)) * .3 : 0;
      const tick = Math.sin(j * 1.731) * Math.sin(j * 2.23) * .04;
      samples[Math.floor(start * sampleRate) + j] += (kick + tick) * envelope;
    }
  }
  const buffer = new ArrayBuffer(44 + samples.length * 2), view = new DataView(buffer);
  const ascii = (at: number, value: string) => [...value].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  ascii(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, 'data'); view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, s)) * 32767), true));
  return new Blob([buffer], { type: 'audio/wav' });
}
