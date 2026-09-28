import { useEffect, useRef, useState } from 'react';

export function prefiereMenosMovimiento(): boolean {
  if (typeof window === 'undefined') return false;
  if (document.documentElement.dataset.movimiento === 'reducido') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Valor animado con física de resorte amortiguado (para la balanza):
 * se pasa un poco del objetivo y se acomoda, como una balanza real.
 */
export function useResorte(objetivo: number, rigidez = 120, amortiguacion = 9): number {
  const [valor, setValor] = useState(objetivo);
  const estado = useRef({ x: objetivo, v: 0 });
  const cuadro = useRef<number | null>(null);

  useEffect(() => {
    if (prefiereMenosMovimiento()) {
      estado.current = { x: objetivo, v: 0 };
      setValor(objetivo);
      return;
    }
    let ultimo = performance.now();
    const paso = (ahora: number) => {
      const dt = Math.min(0.032, (ahora - ultimo) / 1000);
      ultimo = ahora;
      const s = estado.current;
      const fuerza = -rigidez * (s.x - objetivo) - amortiguacion * s.v;
      s.v += fuerza * dt;
      s.x += s.v * dt;
      if (Math.abs(s.x - objetivo) < 0.01 && Math.abs(s.v) < 0.01) {
        s.x = objetivo;
        s.v = 0;
        setValor(objetivo);
        cuadro.current = null;
        return;
      }
      setValor(s.x);
      cuadro.current = requestAnimationFrame(paso);
    };
    cuadro.current = requestAnimationFrame(paso);
    return () => {
      if (cuadro.current !== null) cancelAnimationFrame(cuadro.current);
    };
  }, [objetivo, rigidez, amortiguacion]);

  return valor;
}
