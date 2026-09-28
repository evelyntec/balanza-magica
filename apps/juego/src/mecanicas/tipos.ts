import type { ReactNode } from 'react';
import type { CierreItem, Pista, ResultadoPesada, VistaItem } from '@balanza/nucleo';

export interface PropsMecanica {
  item: VistaItem;
  /** Entrada deshabilitada (esperando al servidor, leyendo o mostrando resultado). */
  bloqueado: boolean;
  /** Ejercicio terminado: mostrar la solución. */
  cierre: CierreItem | null;
  /** Pistas reveladas (algunas activan ayudas visuales). */
  pistas: Pista[];
  /** Se incrementa al pedir reintento (para animar). */
  reintentos: number;
  /** Última pesada respondida por el servidor (mecánica equilibrar). */
  ultimaPesada: { propuesta: number; resultado: ResultadoPesada } | null;
  estiloBalanza: string | undefined;
  alResponder: (respuesta: unknown) => void;
  alPesar: (propuesta: number) => void;
  /** Controles comunes (pistas, nivel) que van al pie del panel. */
  pie: ReactNode;
}

export const tieneAyuda = (pistas: Pista[], ayuda: NonNullable<Pista['ayudaVisual']>): Pista | undefined =>
  pistas.find((p) => p.ayudaVisual === ayuda);
