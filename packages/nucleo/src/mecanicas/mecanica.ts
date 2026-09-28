import type { Azar } from '../azar';
import type { Evaluacion, Pista, ResultadoPesada, Solucion, TipoItem } from '../tipos';

export interface ContextoGeneracion {
  /** Isla (1 a 8), que corresponde al nivel escolar del contenido. */
  isla: number;
  /** Ejercicio con apoyo visual desde el inicio (tras errores seguidos). */
  andamiaje: boolean;
  /** Tipo del ejercicio anterior (para variar en etapas mixtas). */
  anterior?: TipoItem;
}

export interface ItemGenerado<P = unknown, S = unknown> {
  tipo: TipoItem;
  nivel: number;
  /** Instrucción breve que se muestra en pantalla. */
  consigna: string;
  /** Texto para leer en voz alta (describe también la escena). */
  voz: string;
  /** Lo que ve la o el estudiante. Nunca contiene la respuesta si no es deducible. */
  publico: P;
  /** Solo lo conoce el servidor. */
  secreto: S;
  /** Ejercicio que se resuelve mejor con pensamiento relacional que calculando. */
  relacional?: boolean;
}

export type ModoRespuesta = 'eleccion' | 'escrita' | 'pesada';

export interface Mecanica<P = any, S = any, R = any> {
  tipo: TipoItem;
  modo: ModoRespuesta;
  /** Intentos de respuesta permitidos (en modo pesada: pesadas). */
  maxIntentos: number;
  generar(nivel: number, azar: Azar, ctx: ContextoGeneracion): ItemGenerado<P, S>;
  /** Valida estrictamente la forma de la respuesta. null = respuesta malformada. */
  validarRespuesta(respuesta: unknown, publico: P): R | null;
  evaluar(publico: P, secreto: S, respuesta: R): Evaluacion;
  solucion(publico: P, secreto: S): Solucion;
  pistas(publico: P, secreto: S): [Pista, Pista, Pista];
  /** Solo mecánicas de modo "pesada". */
  pesar?(publico: P, secreto: S, propuesta: number): ResultadoPesada;
  validarPropuesta?(propuesta: unknown, publico: P): number | null;
}

// ---------------------------------------------------------------------------
// Utilidades de generación
// ---------------------------------------------------------------------------

/** Descompone total en `partes` enteros ≥ min (composición aleatoria). */
export function descomponer(total: number, partes: number, azar: Azar, min = 1): number[] {
  if (partes < 1 || total < partes * min) throw new RangeError(`No se puede descomponer ${total} en ${partes} partes ≥ ${min}`);
  const resultado: number[] = [];
  let resto = total;
  for (let i = partes; i > 1; i--) {
    const maximo = resto - (i - 1) * min;
    const v = azar.entero(min, maximo);
    resultado.push(v);
    resto -= v;
  }
  resultado.push(resto);
  return azar.barajar(resultado);
}

export const esEnteroEn = (x: unknown, min: number, max: number): x is number =>
  typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;

export function arregloDeEnteros(x: unknown, largo: number, min: number, max: number): number[] | null {
  if (!Array.isArray(x) || x.length !== largo) return null;
  return x.every((v) => esEnteroEn(v, min, max)) ? (x as number[]) : null;
}

export const plural = (n: number, singular: string, pluralTexto = `${singular}s`): string =>
  `${n} ${n === 1 ? singular : pluralTexto}`;
