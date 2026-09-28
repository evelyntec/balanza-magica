/**
 * "Balanza de las fórmulas" — ecuaciones de primer grado a · x + b = c.
 * OA MA06-11: resolver ecuaciones de primer grado con una incógnita usando
 * una balanza, la correspondencia 1 a 1 entre los términos de cada lado y
 * procedimientos formales.
 *
 * Niveles 1 a 3: balanza con cajas iguales (quitar lo mismo de ambos lados y
 * repartir en grupos iguales). Niveles 4 y 5: procedimiento formal escrito
 * paso a paso; el paso intermedio también se evalúa (Vlassis, 2002; Kieran, 1992).
 */

import type { Azar } from '../azar';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export type FormaDosPasos = 'ax+b=c' | 'b+ax=c' | 'c=ax+b' | 'ax-b=c' | 'ax=c';

export interface PublicoDosPasos {
  forma: FormaDosPasos;
  a: number;
  b: number;
  c: number;
  letra: string;
  representacion: 'balanza' | 'formal';
}

export interface SecretoDosPasos {
  x: number;
  /** Valor de a · x (el paso intermedio). */
  ax: number;
}

export interface RespuestaDosPasos {
  intermedio?: number;
  x: number;
}

const termino = (a: number, L: string) => (a === 1 ? L : `${a}${L}`);

export function textoDosPasos(p: Pick<PublicoDosPasos, 'forma' | 'a' | 'b' | 'c' | 'letra'>, x?: number): string {
  const ax = x === undefined ? termino(p.a, p.letra) : `${p.a} · ${x}`;
  switch (p.forma) {
    case 'ax=c':
      return `${ax} = ${p.c}`;
    case 'ax+b=c':
      return `${ax} + ${p.b} = ${p.c}`;
    case 'b+ax=c':
      return `${p.b} + ${ax} = ${p.c}`;
    case 'c=ax+b':
      return `${p.c} = ${ax} + ${p.b}`;
    case 'ax-b=c':
      return `${ax} − ${p.b} = ${p.c}`;
  }
}

export const restaConstante = (f: FormaDosPasos) => f === 'ax-b=c';

export const ecuacionDosPasos: Mecanica<PublicoDosPasos, SecretoDosPasos, RespuestaDosPasos> = {
  tipo: 'ecuacion_dos_pasos',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoDosPasos, SecretoDosPasos> {
    const letra = nivel <= 2 ? 'x' : azar.elegir(['x', 'n', 'y', 'm', 'p']);
    let forma: FormaDosPasos;
    let a: number;
    let x: number;
    let b: number;
    switch (nivel) {
      case 1:
        forma = azar.probabilidad(0.4) ? 'ax=c' : 'ax+b=c';
        a = azar.entero(2, 4);
        x = azar.entero(2, 10);
        b = forma === 'ax=c' ? 0 : azar.entero(1, 9);
        break;
      case 2:
        forma = azar.elegir(['ax+b=c', 'b+ax=c'] as const);
        a = azar.entero(2, 5);
        x = azar.entero(3, 12);
        b = azar.entero(2, 20);
        break;
      case 3:
        forma = azar.elegir(['ax+b=c', 'b+ax=c', 'c=ax+b'] as const);
        a = azar.entero(2, 6);
        x = azar.entero(4, 15);
        b = azar.entero(5, 40);
        break;
      case 4:
        forma = azar.elegir(['ax+b=c', 'b+ax=c', 'c=ax+b'] as const);
        a = azar.entero(2, 9);
        x = azar.entero(3, 20);
        b = azar.entero(5, 60);
        break;
      default:
        forma = azar.elegir(['ax-b=c', 'ax-b=c', 'c=ax+b', 'b+ax=c'] as const);
        a = azar.entero(3, 9);
        x = azar.entero(4, 25);
        b = azar.entero(5, 60);
    }
    const ax = a * x;
    if (forma === 'ax-b=c' && b >= ax) b = azar.entero(1, ax - 1);
    const c = forma === 'ax-b=c' ? ax - b : ax + b;
    const representacion = nivel <= 3 ? 'balanza' : 'formal';
    const publico: PublicoDosPasos = { forma, a, b, c, letra, representacion };
    const consigna =
      representacion === 'balanza'
        ? `¿Cuánto pesa cada caja ${letra}? Usa la balanza: quita lo mismo de ambos lados y reparte en grupos iguales.`
        : `Resuelve paso a paso: primero despeja ${termino(a, letra)} y después ${letra}.`;
    return {
      tipo: 'ecuacion_dos_pasos',
      nivel,
      consigna,
      voz: `Resuelve la ecuación ${textoDosPasos(publico)}. ${consigna}`,
      publico,
      secreto: { x, ax },
    };
  },

  validarRespuesta(r: unknown, publico): RespuestaDosPasos | null {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    const { intermedio, x } = r as Record<string, unknown>;
    if (!esEnteroEn(x, 0, 9999)) return null;
    if (publico.representacion === 'formal') {
      if (!esEnteroEn(intermedio, 0, 9999)) return null;
      return { intermedio, x };
    }
    if (intermedio !== undefined) return null;
    return { x };
  },

  evaluar(publico, secreto, r) {
    const solucion = this.solucion(publico, secreto);
    const { a, b, c } = publico;
    const L = publico.letra;
    const resta = restaConstante(publico.forma);
    const intermedioBien = publico.representacion !== 'formal' || r.intermedio === secreto.ax;
    const comprobar = `Comprueba: si ${L} = ${r.x}, queda ${textoDosPasos(publico, r.x)}. ¿Es verdad?`;
    if (intermedioBien && r.x === secreto.x) {
      return { correcto: true, mensaje: `¡Resuelto! ${L} = ${secreto.x}. Comprobamos: ${textoDosPasos(publico, secreto.x)} ✔`, solucion };
    }
    const inversaEquivocada = resta ? c - b : c + b;
    if (publico.forma !== 'ax=c' && (r.intermedio === inversaEquivocada || (inversaEquivocada % a === 0 && r.x === inversaEquivocada / a))) {
      return {
        correcto: false,
        diagnostico: 'operacion_inversa',
        mensaje: `Para quitar el ${b} que ${resta ? 'se resta' : 'se suma'}, hay que ${resta ? 'SUMAR' : 'RESTAR'} ${b} en ambos lados. ${comprobar}`,
        solucion,
      };
    }
    if (r.x === secreto.ax && a > 1) {
      return {
        correcto: false,
        diagnostico: 'ecuacion_sin_dividir',
        mensaje: `${secreto.ax} es lo que pesan las ${a} cajas juntas. Falta repartir en ${a} grupos iguales: ${secreto.ax} ÷ ${a}.`,
        solucion,
      };
    }
    if (publico.forma !== 'ax=c' && c % a === 0 && (r.x === c / a - b || r.x === c / a + b)) {
      return {
        correcto: false,
        diagnostico: 'ecuacion_orden',
        mensaje: `Dividiste ${c} ÷ ${a} antes de quitar el ${b}, pero el ${b} no está multiplicado por ${a}. Primero quita el ${b} de ambos lados. ${comprobar}`,
        solucion,
      };
    }
    if (publico.representacion === 'formal' && r.x === secreto.x) {
      return { correcto: false, diagnostico: 'generico', mensaje: `Tu ${L} está bien, pero el paso intermedio no: ¿cuánto vale ${termino(a, L)}?`, solucion };
    }
    return { correcto: false, diagnostico: 'generico', mensaje: comprobar, solucion };
  },

  solucion(publico, secreto) {
    const { a, b, c } = publico;
    const L = publico.letra;
    const resta = restaConstante(publico.forma);
    const pasos =
      publico.forma === 'ax=c'
        ? `${termino(a, L)} = ${c}  →  ${L} = ${c} ÷ ${a} = ${secreto.x}`
        : `${termino(a, L)} = ${c} ${resta ? '+' : '−'} ${b} = ${secreto.ax}  →  ${L} = ${secreto.ax} ÷ ${a} = ${secreto.x}`;
    return {
      simbolico: pasos,
      explicacion:
        publico.forma === 'ax=c'
          ? `Se reparte en ${a} grupos iguales: cada ${L} vale ${secreto.x}.`
          : `Primero se ${resta ? 'suma' : 'resta'} ${b} en ambos lados; después se reparte en ${a} grupos iguales.`,
      respuesta: publico.representacion === 'formal' ? { intermedio: secreto.ax, x: secreto.x } : { x: secreto.x },
    };
  },

  pistas(publico, secreto) {
    const { a, b, c } = publico;
    const L = publico.letra;
    const resta = restaConstante(publico.forma);
    return [
      {
        nivel: 1,
        texto:
          publico.forma === 'ax=c'
            ? `Hay ${a} cajas iguales que juntas pesan ${c}. ¿Cuánto pesa cada una?`
            : `Primero deja solas las cajas: ${resta ? 'suma' : 'quita'} ${b} en ambos lados. Después reparte.`,
      },
      {
        nivel: 2,
        texto: publico.forma === 'ax=c' ? `Reparte ${c} en ${a} grupos iguales.` : `${termino(a, L)} = ${c} ${resta ? '+' : '−'} ${b} = ${secreto.ax}. ¿Cuánto vale una sola ${L}?`,
        ayudaVisual: 'mostrarTotales',
        valor: secreto.ax,
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: { texto: '3x + 5 = 26', pasos: ['Quitamos 5 de ambos lados: 3x = 21.', 'Repartimos en 3 grupos: x = 21 ÷ 3 = 7.', 'Comprobamos: 3 · 7 + 5 = 26 ✔'] },
      },
    ];
  },
};
