import { sonidos } from '../sonido';

/** Botón que alterna el signo de un número (+ / −). */
export function BotonSigno({ signo, alCambiar, deshabilitado, etiqueta }: { signo: '+' | '-'; alCambiar: () => void; deshabilitado: boolean; etiqueta: string }) {
  return (
    <button
      type="button"
      className="boton boton--chico boton--violeta formula__signo"
      aria-label={`${etiqueta}: ${signo === '+' ? 'más' : 'menos'}. Tocar para cambiar`}
      disabled={deshabilitado}
      onClick={() => {
        sonidos.toque();
        alCambiar();
      }}
    >
      {signo === '+' ? '+' : '−'}
    </button>
  );
}

export const conSigno = (signo: '+' | '-', v: number) => (signo === '-' ? -v : v);
export const texto = (n: number) => (n < 0 ? `−${-n}` : String(n));
