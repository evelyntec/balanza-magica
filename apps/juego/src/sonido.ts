/**
 * Efectos de sonido sintetizados con Web Audio (sin archivos: carga
 * instantánea y funciona sin conexión).
 */

let contexto: AudioContext | null = null;
let activo = true;

export function activarSonido(valor: boolean): void {
  activo = valor;
}

function ctx(): AudioContext | null {
  if (!activo) return null;
  try {
    const Clase = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Clase) return null;
    contexto ??= new Clase();
    if (contexto.state === 'suspended') void contexto.resume();
    return contexto;
  } catch {
    return null;
  }
}

interface Nota {
  frecuencia: number;
  inicio: number;
  duracion: number;
  tipo?: OscillatorType;
  volumen?: number;
  deslizarA?: number;
}

function tocar(notas: Nota[]): void {
  const c = ctx();
  if (!c) return;
  const ahora = c.currentTime;
  const maestro = c.createGain();
  maestro.gain.value = 0.18;
  maestro.connect(c.destination);
  for (const n of notas) {
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = n.tipo ?? 'sine';
    osc.frequency.setValueAtTime(n.frecuencia, ahora + n.inicio);
    if (n.deslizarA) osc.frequency.exponentialRampToValueAtTime(n.deslizarA, ahora + n.inicio + n.duracion);
    const v = n.volumen ?? 1;
    env.gain.setValueAtTime(0.0001, ahora + n.inicio);
    env.gain.exponentialRampToValueAtTime(v, ahora + n.inicio + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, ahora + n.inicio + n.duracion);
    osc.connect(env).connect(maestro);
    osc.start(ahora + n.inicio);
    osc.stop(ahora + n.inicio + n.duracion + 0.05);
  }
}

export const sonidos = {
  toque: () => tocar([{ frecuencia: 660, inicio: 0, duracion: 0.07, tipo: 'triangle', volumen: 0.5 }]),
  cubo: () => tocar([{ frecuencia: 520, inicio: 0, duracion: 0.09, tipo: 'square', volumen: 0.25, deslizarA: 780 }]),
  quitar: () => tocar([{ frecuencia: 600, inicio: 0, duracion: 0.09, tipo: 'square', volumen: 0.2, deslizarA: 380 }]),
  balanza: () =>
    tocar([
      { frecuencia: 180, inicio: 0, duracion: 0.35, tipo: 'sawtooth', volumen: 0.12, deslizarA: 120 },
      { frecuencia: 240, inicio: 0.05, duracion: 0.3, tipo: 'triangle', volumen: 0.15, deslizarA: 200 },
    ]),
  equilibrio: () =>
    tocar([
      { frecuencia: 784, inicio: 0, duracion: 0.25 },
      { frecuencia: 1175, inicio: 0.08, duracion: 0.4, volumen: 0.7 },
      { frecuencia: 1568, inicio: 0.16, duracion: 0.5, volumen: 0.4 },
    ]),
  correcto: () =>
    tocar([
      { frecuencia: 523, inicio: 0, duracion: 0.12, tipo: 'triangle' },
      { frecuencia: 659, inicio: 0.1, duracion: 0.12, tipo: 'triangle' },
      { frecuencia: 784, inicio: 0.2, duracion: 0.25, tipo: 'triangle' },
    ]),
  perfecto: () =>
    tocar([
      { frecuencia: 523, inicio: 0, duracion: 0.1, tipo: 'triangle' },
      { frecuencia: 659, inicio: 0.08, duracion: 0.1, tipo: 'triangle' },
      { frecuencia: 784, inicio: 0.16, duracion: 0.1, tipo: 'triangle' },
      { frecuencia: 1047, inicio: 0.24, duracion: 0.35, tipo: 'triangle' },
      { frecuencia: 2093, inicio: 0.3, duracion: 0.3, volumen: 0.25 },
    ]),
  incorrecto: () =>
    tocar([
      { frecuencia: 330, inicio: 0, duracion: 0.18, tipo: 'triangle', volumen: 0.6 },
      { frecuencia: 262, inicio: 0.14, duracion: 0.3, tipo: 'triangle', volumen: 0.6 },
    ]),
  moneda: () =>
    tocar([
      { frecuencia: 988, inicio: 0, duracion: 0.08, tipo: 'square', volumen: 0.25 },
      { frecuencia: 1319, inicio: 0.07, duracion: 0.25, tipo: 'square', volumen: 0.25 },
    ]),
  nivel: () =>
    tocar([
      { frecuencia: 392, inicio: 0, duracion: 0.1, tipo: 'triangle' },
      { frecuencia: 523, inicio: 0.1, duracion: 0.1, tipo: 'triangle' },
      { frecuencia: 659, inicio: 0.2, duracion: 0.1, tipo: 'triangle' },
      { frecuencia: 784, inicio: 0.3, duracion: 0.3, tipo: 'triangle' },
    ]),
  golpeJefe: () =>
    tocar([
      { frecuencia: 150, inicio: 0, duracion: 0.2, tipo: 'sawtooth', volumen: 0.4, deslizarA: 60 },
      { frecuencia: 900, inicio: 0, duracion: 0.1, tipo: 'square', volumen: 0.2, deslizarA: 300 },
    ]),
  fanfarria: () =>
    tocar([
      { frecuencia: 523, inicio: 0, duracion: 0.15, tipo: 'triangle' },
      { frecuencia: 523, inicio: 0.16, duracion: 0.1, tipo: 'triangle' },
      { frecuencia: 523, inicio: 0.28, duracion: 0.1, tipo: 'triangle' },
      { frecuencia: 698, inicio: 0.4, duracion: 0.5, tipo: 'triangle' },
      { frecuencia: 880, inicio: 0.4, duracion: 0.5, tipo: 'sine', volumen: 0.5 },
      { frecuencia: 1047, inicio: 0.6, duracion: 0.6, tipo: 'sine', volumen: 0.4 },
    ]),
  pista: () => tocar([{ frecuencia: 880, inicio: 0, duracion: 0.3, volumen: 0.4, deslizarA: 1320 }]),
};
