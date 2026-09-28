/**
 * Generador de números pseudoaleatorios reproducible (xoshiro128**).
 *
 * El servidor crea una semilla secreta por ejercicio: con la misma semilla
 * se obtiene exactamente el mismo ejercicio, lo que permite auditar y testear.
 */

export interface Azar {
  /** Número en [0, 1). */
  siguiente(): number;
  /** Entero en [min, max], ambos incluidos. */
  entero(min: number, max: number): number;
  /** Elemento al azar de una lista no vacía. */
  elegir<T>(lista: readonly T[]): T;
  /** Copia barajada (Fisher–Yates). */
  barajar<T>(lista: readonly T[]): T[];
  /** true con probabilidad p. */
  probabilidad(p: number): boolean;
  /** Elige según pesos relativos. */
  elegirPonderado<T>(opciones: readonly (readonly [T, number])[]): T;
}

/** Hash de texto a cuatro enteros de 32 bits (cyrb128). */
function cyrb128(texto: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < texto.length; i++) {
    const k = texto.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export function crearAzar(semilla: string): Azar {
  let [a, b, c, d] = cyrb128(semilla);
  if ((a | b | c | d) === 0) a = 1;

  const siguiente = (): number => {
    const t = b << 9;
    let r = Math.imul(b, 5);
    r = Math.imul((r << 7) | (r >>> 25), 9);
    c ^= a;
    d ^= b;
    b ^= c;
    a ^= d;
    c ^= t;
    d = (d << 11) | (d >>> 21);
    return (r >>> 0) / 4294967296;
  };

  const entero = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`Rango inválido: [${min}, ${max}]`);
    }
    return min + Math.floor(siguiente() * (max - min + 1));
  };

  const elegir = <T>(lista: readonly T[]): T => {
    if (lista.length === 0) throw new RangeError('No se puede elegir de una lista vacía');
    return lista[entero(0, lista.length - 1)] as T;
  };

  const barajar = <T>(lista: readonly T[]): T[] => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = entero(0, i);
      [copia[i], copia[j]] = [copia[j] as T, copia[i] as T];
    }
    return copia;
  };

  const probabilidad = (p: number): boolean => siguiente() < p;

  const elegirPonderado = <T>(opciones: readonly (readonly [T, number])[]): T => {
    const total = opciones.reduce((s, [, peso]) => s + peso, 0);
    if (opciones.length === 0 || total <= 0) throw new RangeError('Pesos inválidos');
    let r = siguiente() * total;
    for (const [valor, peso] of opciones) {
      r -= peso;
      if (r < 0) return valor;
    }
    return (opciones[opciones.length - 1] as readonly [T, number])[0];
  };

  return { siguiente, entero, elegir, barajar, probabilidad, elegirPonderado };
}

/** Bytes aleatorios criptográficamente seguros (Node ≥ 20 y navegadores). */
export function bytesAleatorios(n: number): Uint8Array {
  const bytes = new Uint8Array(n);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/** Texto aleatorio seguro en base64url, útil para semillas, tokens e ids. */
export function textoAleatorio(nBytes = 16): string {
  return aBase64Url(bytesAleatorios(nBytes));
}

export function aBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
