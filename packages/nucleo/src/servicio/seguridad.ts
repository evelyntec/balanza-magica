/**
 * Utilidades de seguridad con Web Crypto (funciona igual en Node y en el
 * navegador): hash de claves con PBKDF2, hash de tokens y comparación en
 * tiempo constante.
 */

import { aBase64Url, bytesAleatorios, textoAleatorio } from '../azar';

const ITERACIONES = 120_000;

const codificador = new TextEncoder();

function desdeBase64Url(texto: string): Uint8Array {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((texto.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function hashClave(clave: string, sal?: string, iteraciones = ITERACIONES): Promise<{ hash: string; sal: string }> {
  const salBytes = sal ? desdeBase64Url(sal) : bytesAleatorios(16);
  const material = await globalThis.crypto.subtle.importKey('raw', codificador.encode(clave), 'PBKDF2', false, ['deriveBits']);
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salBytes as BufferSource, iterations: iteraciones },
    material,
    256,
  );
  return { hash: aBase64Url(new Uint8Array(bits)), sal: aBase64Url(salBytes) };
}

export async function verificarClave(clave: string, hash: string, sal: string, iteraciones = ITERACIONES): Promise<boolean> {
  const calculado = await hashClave(clave, sal, iteraciones);
  return compararSeguro(calculado.hash, hash);
}

export async function sha256(texto: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', codificador.encode(texto));
  return aBase64Url(new Uint8Array(digest));
}

/** Comparación en tiempo constante (no revela cuántos caracteres coinciden). */
export function compararSeguro(a: string, b: string): boolean {
  const largo = Math.max(a.length, b.length);
  let diferencia = a.length ^ b.length;
  for (let i = 0; i < largo; i++) diferencia |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diferencia === 0;
}

export const nuevoToken = (): string => textoAleatorio(32);
export const nuevoId = (): string => textoAleatorio(12);

const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Código de curso de 6 caracteres sin letras confundibles (0/O, 1/I). */
export function nuevoCodigoCurso(): string {
  const bytes = bytesAleatorios(6);
  return Array.from(bytes, (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join('');
}

// ---------------------------------------------------------------------------
// Clave de figuras y apodos
// ---------------------------------------------------------------------------

/** Figuras disponibles para la clave (3 en orden, con repetición: 729 combinaciones + bloqueo). */
export const FIGURAS_CLAVE = ['gato', 'perro', 'conejo', 'pato', 'oso', 'zorro', 'buho', 'pez', 'tortuga'] as const;
export type FiguraClave = (typeof FIGURAS_CLAVE)[number];

export function claveValida(clave: unknown): clave is FiguraClave[] {
  return (
    Array.isArray(clave) &&
    clave.length === 3 &&
    clave.every((f) => typeof f === 'string' && (FIGURAS_CLAVE as readonly string[]).includes(f))
  );
}

export const textoClave = (clave: readonly string[]): string => clave.join('-');

export const AVATARES = ['gatito', 'gatita-violeta', 'gatito-dorado', 'gatita-fucsia', 'gatito-negro', 'gatita-roja'] as const;

export function normalizarApodo(apodo: string): string {
  return apodo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Palabras que no se permiten en apodos (lista básica, ampliable). */
const BLOQUEADAS = [
  'weon', 'hueon', 'wn', 'ctm', 'csm', 'conchetumare', 'culiao', 'culiado', 'puta', 'puto', 'mierda', 'pico', 'raja',
  'maricon', 'aweonao', 'aweonado', 'weona', 'saco', 'tonto', 'tonta', 'idiota', 'estupido', 'estupida', 'caca', 'poto',
  'nazi', 'sexo', 'porno', 'admin', 'profesora', 'profesor', 'docente',
];

export function validarApodo(apodo: unknown): { ok: true; apodo: string; clave: string } | { ok: false; motivo: string } {
  if (typeof apodo !== 'string') return { ok: false, motivo: 'Escribe un apodo.' };
  const limpio = apodo.replace(/\s+/g, ' ').trim();
  if (limpio.length < 3 || limpio.length > 20) return { ok: false, motivo: 'El apodo debe tener entre 3 y 20 letras.' };
  if (!/^[\p{L}\p{N} ]+$/u.test(limpio)) return { ok: false, motivo: 'Usa solo letras, números y espacios.' };
  const clave = normalizarApodo(limpio);
  const palabras = clave.replace(/[0-9]/g, ' ').split(' ').filter(Boolean);
  const junto = clave.replace(/[^a-z]/g, '');
  if (palabras.some((p) => BLOQUEADAS.includes(p)) || BLOQUEADAS.some((b) => b.length >= 5 && junto.includes(b))) {
    return { ok: false, motivo: 'Ese apodo no está permitido. Elige otro.' };
  }
  return { ok: true, apodo: limpio, clave };
}

const ADJETIVOS = ['Veloz', 'Brillante', 'Curioso', 'Valiente', 'Alegre', 'Astuto', 'Mágico', 'Estelar', 'Sabio', 'Genial'];
const ANIMALES = ['Tigre', 'Cóndor', 'Pudú', 'Huemul', 'Delfín', 'Zorro', 'Búho', 'Lince', 'Colibrí', 'Pingüino', 'Puma', 'Chinchilla'];

/** Apodos divertidos que no revelan la identidad (recomendados). */
export function sugerirApodos(cantidad = 4): string[] {
  const bytes = bytesAleatorios(cantidad * 3);
  return Array.from({ length: cantidad }, (_, i) => {
    const animal = ANIMALES[(bytes[i * 3] as number) % ANIMALES.length];
    const adjetivo = ADJETIVOS[(bytes[i * 3 + 1] as number) % ADJETIVOS.length];
    const numero = ((bytes[i * 3 + 2] as number) % 90) + 10;
    return `${animal} ${adjetivo} ${numero}`;
  });
}
