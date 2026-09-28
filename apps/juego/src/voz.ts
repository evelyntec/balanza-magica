/**
 * Lectura en voz alta de consignas (Web Speech API), clave para 1° y 2°
 * básico, que aún están aprendiendo a leer. Prefiere voces en español de
 * Chile o Latinoamérica.
 */

let vozElegida: SpeechSynthesisVoice | null = null;
let velocidad = 0.95;

export function vozDisponible(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function elegirVoz(): SpeechSynthesisVoice | null {
  if (!vozDisponible()) return null;
  const voces = window.speechSynthesis.getVoices();
  const preferencias = ['es-CL', 'es-419', 'es-MX', 'es-US', 'es-AR', 'es-CO', 'es-ES', 'es'];
  for (const p of preferencias) {
    const v = voces.find((x) => x.lang.replace('_', '-').toLowerCase().startsWith(p.toLowerCase()));
    if (v) return v;
  }
  return null;
}

if (vozDisponible()) {
  vozElegida = elegirVoz();
  window.speechSynthesis.onvoiceschanged = () => {
    vozElegida = elegirVoz();
  };
}

export function ajustarVelocidad(v: number): void {
  velocidad = Math.min(1.3, Math.max(0.6, v));
}

/** Convierte símbolos a palabras para que la voz los lea bien. */
export function textoParaVoz(texto: string): string {
  return texto
    .replace(/□/g, ' caja ')
    .replace(/−/g, ' menos ')
    .replace(/\+/g, ' más ')
    .replace(/</g, ' es menor que ')
    .replace(/>/g, ' es mayor que ')
    .replace(/=/g, ' es igual a ')
    .replace(/°/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hablar(texto: string): void {
  if (!vozDisponible() || !texto) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(textoParaVoz(texto));
    u.lang = vozElegida?.lang ?? 'es-CL';
    if (vozElegida) u.voice = vozElegida;
    u.rate = velocidad;
    u.pitch = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    // La voz es un apoyo: si falla, el juego sigue.
  }
}

export function callar(): void {
  if (vozDisponible()) window.speechSynthesis.cancel();
}
