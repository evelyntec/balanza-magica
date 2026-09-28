/**
 * "La balanza inclinada" — inecuaciones de un paso.
 * OA MA04-14: resolver ecuaciones e inecuaciones de un paso que involucren
 * adiciones y sustracciones, comprobando los resultados en forma pictórica y
 * simbólica del 0 al 100. Prepara MA05-15.
 *
 * La respuesta es un CONJUNTO: hay que marcar en la recta numérica todos los
 * números que cumplen. Errores típicos (Pacheco et al. 2024; Garrote et al.
 * 2004): resolverla como ecuación (un solo valor), incluir el borde, marcar
 * el lado contrario y no reconocer que 20 > □ + 5 es lo mismo que □ + 5 < 20.
 */

import type { Azar } from '../azar';
import { SIMBOLOS, NOMBRE_SIMBOLO } from './ecuacion';
import { type ItemGenerado, type Mecanica } from './mecanica';

export type FormaInecuacion = 'x+a<b' | 'x+a>b' | 'x-a<b' | 'x-a>b' | 'b>x+a' | 'b<x+a';

export interface PublicoInecuacion {
  forma: FormaInecuacion;
  a: number;
  b: number;
  simbolo: string;
  /** Números que se muestran en la recta (ambos incluidos). */
  desde: number;
  hasta: number;
  representacion: 'balanza' | 'recta';
  contexto?: string;
}

export interface SecretoInecuacion {
  soluciones: number[];
  /** Valor que haría la igualdad (el "borde"). */
  borde: number;
}

export function textoInecuacion(p: Pick<PublicoInecuacion, 'forma' | 'a' | 'b' | 'simbolo'>, x?: number): string {
  const s = x === undefined ? p.simbolo : String(x);
  switch (p.forma) {
    case 'x+a<b':
      return `${s} + ${p.a} < ${p.b}`;
    case 'x+a>b':
      return `${s} + ${p.a} > ${p.b}`;
    case 'x-a<b':
      return `${s} − ${p.a} < ${p.b}`;
    case 'x-a>b':
      return `${s} − ${p.a} > ${p.b}`;
    case 'b>x+a':
      return `${p.b} > ${s} + ${p.a}`;
    case 'b<x+a':
      return `${p.b} < ${s} + ${p.a}`;
  }
}

/** ¿El número x cumple la inecuación? */
export function cumple(forma: FormaInecuacion, a: number, b: number, x: number): boolean {
  switch (forma) {
    case 'x+a<b':
    case 'b>x+a':
      return x + a < b;
    case 'x+a>b':
    case 'b<x+a':
      return x + a > b;
    case 'x-a<b':
      return x - a < b;
    case 'x-a>b':
      return x - a > b;
  }
}

const esResta = (f: FormaInecuacion) => f === 'x-a<b' || f === 'x-a>b';
export const esMayor = (f: FormaInecuacion) => f === 'x+a>b' || f === 'x-a>b' || f === 'b<x+a';
/** Menor valor con sentido en 4° básico (sin negativos): 0, o a si hay que restarle a. */
const minimoDe = (f: FormaInecuacion, a: number) => (esResta(f) ? a : 0);

/** Descripción del conjunto solución COMPLETO (no solo lo visible en la recta). */
export function describirSoluciones(p: Pick<PublicoInecuacion, 'forma' | 'a' | 'desde' | 'hasta'>, borde: number): string {
  if (esMayor(p.forma)) return `cualquier número mayor que ${borde}: ${borde + 1}, ${borde + 2}, ${borde + 3}… y siguen para siempre`;
  const min = minimoDe(p.forma, p.a);
  const todos = borde - min;
  const lista = todos <= 5 ? Array.from({ length: todos }, (_, i) => min + i).join(', ') : `${min}, ${min + 1}, …, ${borde - 1}`;
  return `cualquier número desde ${min} hasta ${borde - 1} (${lista})${p.desde > min ? '. En la recta solo se ven algunos' : ''}`;
}

const ANCHO = 12; // 13 números en la recta: caben bien en un celular

function contexto(forma: FormaInecuacion, a: number, b: number, azar: Azar): string | undefined {
  const nombre = azar.elegir(['Sofía', 'Tomás', 'Amanda', 'Benjamín', 'Gatito', 'Josefa']);
  if (forma === 'x+a<b') return `${nombre} tiene ${a} láminas en su álbum. Si pega □ láminas más, tendrá menos de ${b}. ¿Qué números pueden ir en □?`;
  if (forma === 'x+a>b') return `Para ganar la medalla se necesitan más de ${b} puntos. ${nombre} ya tiene ${a}. ¿Cuántos puntos □ más puede conseguir para ganar?`;
  return undefined;
}

export const inecuacion: Mecanica<PublicoInecuacion, SecretoInecuacion, number[]> = {
  tipo: 'inecuacion',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoInecuacion, SecretoInecuacion> {
    for (let intento = 0; intento < 500; intento++) {
      let forma: FormaInecuacion;
      let tope: number;
      let representacion: PublicoInecuacion['representacion'] = 'recta';
      if (nivel === 1) {
        forma = 'x+a<b';
        tope = 25;
        representacion = 'balanza';
      } else if (nivel === 2) {
        forma = 'x+a>b';
        tope = 30;
        representacion = 'balanza';
      } else if (nivel === 3) {
        forma = azar.elegir(['x-a<b', 'x-a>b'] as const);
        tope = 60;
      } else if (nivel === 4) {
        forma = azar.elegir(['x+a<b', 'x+a>b'] as const);
        tope = 50;
      } else {
        forma = azar.elegir(['b>x+a', 'b<x+a', 'x-a>b', 'x-a<b'] as const);
        tope = 100;
      }
      const a = azar.entero(2, Math.floor(tope / 2));
      const b = azar.entero(a + 3, tope);
      const borde = esResta(forma) ? b + a : b - a;
      if (borde > 100) continue;
      // Ventana de 13 números con el borde adentro y al menos 3 soluciones y 3 no soluciones.
      const minimo = minimoDe(forma, a);
      // Si todas las soluciones de un "<" caben en la recta, se muestran todas.
      const desde = !esMayor(forma) && borde - minimo <= ANCHO - 2 ? minimo : Math.max(minimo, borde - azar.entero(3, ANCHO - 3));
      const hasta = desde + ANCHO;
      if (hasta > 100) continue;
      const numeros = Array.from({ length: ANCHO + 1 }, (_, i) => desde + i);
      const soluciones = numeros.filter((x) => cumple(forma, a, b, x));
      if (soluciones.length < 3 || soluciones.length > ANCHO - 2) continue;
      // Las historias usan □ en el texto.
      const simbolo = nivel === 4 ? '□' : azar.elegir(SIMBOLOS);
      const publico: PublicoInecuacion = { forma, a, b, simbolo, desde, hasta, representacion };
      const texto = nivel === 4 ? contexto(forma, a, b, azar) : undefined;
      if (texto) publico.contexto = texto;
      return {
        tipo: 'inecuacion',
        nivel,
        consigna: `Marca en esta recta TODOS los números que puede ser ${simbolo}.`,
        voz: `${texto ?? ''} ${textoInecuacion(publico)}. Marca en la recta todos los números que puede ser el ${NOMBRE_SIMBOLO[simbolo]}. Puede haber muchos.`,
        publico,
        secreto: { soluciones, borde },
        relacional: forma === 'b>x+a' || forma === 'b<x+a',
      };
    }
    throw new Error('No se pudo generar la inecuación');
  },

  validarRespuesta(r: unknown, publico): number[] | null {
    if (!Array.isArray(r) || r.length > publico.hasta - publico.desde + 1) return null;
    if (!r.every((v) => typeof v === 'number' && Number.isInteger(v) && v >= publico.desde && v <= publico.hasta)) return null;
    if (new Set(r).size !== r.length) return null;
    return [...(r as number[])].sort((x, y) => x - y);
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    const esperadas = secreto.soluciones;
    const igual = respuesta.length === esperadas.length && respuesta.every((v, i) => v === esperadas[i]);
    if (igual) {
      return {
        correcto: true,
        mensaje: `¡Excelente! Marcaste todos los de la recta. ${publico.simbolo} puede ser ${describirSoluciones(publico, secreto.borde)}. Una inecuación tiene muchas soluciones.`,
        solucion,
      };
    }
    const todos = Array.from({ length: publico.hasta - publico.desde + 1 }, (_, i) => publico.desde + i);
    const noSoluciones = todos.filter((x) => !esperadas.includes(x));
    const comprobar = `Comprueba cada número: reemplázalo en ${textoInecuacion(publico)} y mira si es verdad.`;
    if (respuesta.length === 1 && respuesta[0] === secreto.borde) {
      return {
        correcto: false,
        diagnostico: 'inecuacion_igualdad',
        mensaje: `Con ${secreto.borde} los dos lados quedan IGUALES, y la inecuación pide ${publico.forma.includes('<') ? 'menor' : 'mayor'}. Además, no hay una sola respuesta: busca todos los números que cumplen.`,
        solucion,
      };
    }
    if (respuesta.length > 0 && respuesta.every((v) => esperadas.includes(v)) && respuesta.length < esperadas.length) {
      return {
        correcto: false,
        diagnostico: 'inecuacion_un_valor',
        mensaje: `Los números que marcaste cumplen, ¡pero hay más! Una inecuación puede tener muchas soluciones. ${comprobar}`,
        solucion,
      };
    }
    if (respuesta.includes(secreto.borde) && esperadas.every((v) => respuesta.includes(v)) && respuesta.length === esperadas.length + 1) {
      return {
        correcto: false,
        diagnostico: 'inecuacion_borde',
        mensaje: `¡Casi! ${secreto.borde} no sirve: con ${secreto.borde} los dos lados son iguales, y no ${publico.forma.includes('<') ? 'menores' : 'mayores'}.`,
        solucion,
      };
    }
    const lado = respuesta.filter((v) => noSoluciones.includes(v)).length;
    if (lado >= Math.max(2, respuesta.length - 1) && !respuesta.some((v) => esperadas.includes(v))) {
      return {
        correcto: false,
        diagnostico: 'inecuacion_direccion',
        mensaje: `Marcaste el lado contrario. Lee el signo con cuidado: ${publico.forma.includes('<') ? '"<" significa "es menor que"' : '">" significa "es mayor que"'}. ${comprobar}`,
        solucion,
      };
    }
    return { correcto: false, diagnostico: 'generico', mensaje: comprobar, solucion };
  },

  solucion(publico, secreto) {
    const s = secreto.soluciones;
    return {
      simbolico: `${textoInecuacion(publico)}  →  ${publico.simbolo} ${esMayor(publico.forma) ? '>' : '<'} ${secreto.borde}`,
      explicacion: `Con ${secreto.borde} los dos lados son iguales. ${publico.simbolo} puede ser ${describirSoluciones(publico, secreto.borde)}.`,
      respuesta: s,
    };
  },

  pistas(publico, secreto) {
    const mayor = esMayor(publico.forma);
    return [
      { nivel: 1, texto: `Primero busca el número que haría IGUALES los dos lados. Después piensa: ¿los que cumplen son más grandes o más chicos que ese?` },
      {
        nivel: 2,
        texto: `Con ${secreto.borde} los dos lados son iguales. Los que cumplen son los números ${mayor ? 'MAYORES' : 'MENORES'} que ${secreto.borde}.`,
        ayudaVisual: 'mostrarTotales',
        valor: secreto.borde,
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: { texto: '□ + 4 < 10', pasos: ['Con 6: 6 + 4 = 10, iguales. 6 no sirve.', 'Con 5: 5 + 4 = 9 < 10 ✔. Con 7: 11 < 10 ✘.', '□ puede ser 0, 1, 2, 3, 4 o 5.'] },
      },
    ];
  },
};
