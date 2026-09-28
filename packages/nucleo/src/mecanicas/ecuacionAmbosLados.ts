/**
 * "Balanzas de doble carga" — la incógnita a ambos lados.
 * OA MA08-8: modelar situaciones usando ecuaciones lineales de la forma
 * ax = b + cx; a(x + b) = c; ax + b = cx + d.
 *
 * Niveles 1 a 3: balanza con cajas en ambos platillos (quitar una caja de
 * cada lado, quitar pesas y repartir). Niveles 4 y 5: procedimiento formal,
 * con paréntesis, negativos y soluciones negativas. Se evalúa el paso
 * "kx = m". Errores típicos (Kieran, 1992; Vlassis, 2002; Filloy y Rojano,
 * 1989): sumar en vez de restar los términos con x, aplicar mal la
 * distributiva y equivocar el signo al despejar.
 */

import type { Azar } from '../azar';
import { lineal, num, numP } from './lineal';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export interface PublicoAmbosLados {
  forma: 'ambos' | 'parentesis';
  /** ambos: a·x + b = c·x + d.  parentesis: a·(x + b) = c. */
  a: number;
  b: number;
  c: number;
  d: number;
  letra: string;
  representacion: 'balanza' | 'formal';
}

export interface SecretoAmbosLados {
  x: number;
  k: number;
  m: number;
}

export interface RespuestaAmbosLados {
  k?: number;
  m?: number;
  x: number;
}

export function textoAmbosLados(p: Pick<PublicoAmbosLados, 'forma' | 'a' | 'b' | 'c' | 'd' | 'letra'>, x?: number): string {
  const L = p.letra;
  if (p.forma === 'parentesis') {
    const dentro = x === undefined ? `${L} ${p.b < 0 ? '−' : '+'} ${Math.abs(p.b)}` : `${numP(x)} ${p.b < 0 ? '−' : '+'} ${Math.abs(p.b)}`;
    return `${p.a === 1 ? '' : p.a}(${dentro}) = ${num(p.c)}`;
  }
  if (x === undefined) return `${lineal(p.a, p.b, L)} = ${lineal(p.c, p.d, L)}`;
  const lado = (k: number, n: number) => `${k === 1 ? '' : `${num(k)} · `}${numP(x)}${n === 0 ? '' : ` ${n < 0 ? '−' : '+'} ${Math.abs(n)}`}`;
  return `${lado(p.a, p.b)} = ${lado(p.c, p.d)}`;
}

export const ecuacionAmbosLados: Mecanica<PublicoAmbosLados, SecretoAmbosLados, RespuestaAmbosLados> = {
  tipo: 'ecuacion_ambos_lados',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoAmbosLados, SecretoAmbosLados> {
    const letra = nivel <= 2 ? 'x' : azar.elegir(['x', 'y', 'n', 'm', 'z']);
    for (let intento = 0; intento < 500; intento++) {
      let p: PublicoAmbosLados;
      let x: number;
      if (nivel <= 3) {
        // Balanza: todo natural; las cajas del lado más pesado en x pueden quedar a la derecha (nivel 3).
        const a = azar.entero(nivel === 1 ? 2 : 3, nivel === 1 ? 4 : 6);
        const c = azar.entero(1, a - 1);
        x = azar.entero(nivel === 1 ? 1 : 2, nivel === 1 ? 8 : 12);
        const b = azar.entero(nivel === 1 ? 0 : 1, nivel === 1 ? 9 : 15);
        const d = (a - c) * x + b;
        p = nivel === 3 && azar.probabilidad(0.5) ? { forma: 'ambos', a: c, b: d, c: a, d: b, letra, representacion: 'balanza' } : { forma: 'ambos', a, b, c, d, letra, representacion: 'balanza' };
      } else if (azar.probabilidad(nivel === 4 ? 0.35 : 0.3)) {
        const a = azar.entero(2, 9);
        x = nivel === 4 ? azar.entero(1, 15) : azar.entero(-10, 12);
        let b = azar.entero(1, 12) * (nivel === 5 && azar.probabilidad(0.5) ? -1 : 1);
        if (x + b === 0) b += 1;
        p = { forma: 'parentesis', a, b, c: a * (x + b), d: 0, letra, representacion: 'formal' };
      } else {
        const a = azar.entero(-6, 9);
        const c = azar.entero(-6, 9);
        if (a === c || a === 0 || c === 0) continue;
        if (nivel === 4 && (a < 0 || c < 0)) continue;
        x = nivel === 4 ? azar.entero(1, 15) : azar.entero(-10, 12);
        const b = nivel === 4 ? azar.entero(1, 30) : azar.entero(-20, 20);
        const d = (a - c) * x + b;
        if (nivel === 4 && d < 0) continue;
        p = { forma: 'ambos', a, b, c, d, letra, representacion: 'formal' };
      }
      if (x === 0) continue;
      const k = p.forma === 'parentesis' ? p.a : p.a - p.c;
      const m = p.forma === 'parentesis' ? p.c - p.a * p.b : p.d - p.b;
      if (Math.abs(m) > 300) continue;
      const consigna =
        p.representacion === 'balanza'
          ? `¿Cuánto pesa cada caja ${letra}? Quita cajas y pesas de ambos lados hasta dejar las cajas solas.`
          : `Resuelve paso a paso: primero deja todos los términos con ${letra} en un lado y los números en el otro.`;
      return {
        tipo: 'ecuacion_ambos_lados',
        nivel,
        consigna,
        voz: `Resuelve la ecuación ${textoAmbosLados(p)}. ${consigna}`,
        publico: p,
        secreto: { x, k, m },
      };
    }
    throw new Error('No se pudo generar la ecuación');
  },

  validarRespuesta(r: unknown, publico): RespuestaAmbosLados | null {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    const { k, m, x } = r as Record<string, unknown>;
    if (!esEnteroEn(x, -9999, 9999)) return null;
    if (publico.representacion === 'formal') {
      if (!esEnteroEn(k, -999, 999) || !esEnteroEn(m, -9999, 9999)) return null;
      return { k, m, x };
    }
    if (k !== undefined || m !== undefined) return null;
    return { x };
  },

  evaluar(publico, secreto, r) {
    const solucion = this.solucion(publico, secreto);
    const L = publico.letra;
    const { a, b, c, d } = publico;
    // El paso kx = m se acepta en cualquiera de los dos lados (3x = 12 o −3x = −12).
    const pasoBien =
      publico.representacion !== 'formal' ||
      (r.k === secreto.k && r.m === secreto.m) ||
      (r.k === -secreto.k && r.m === -secreto.m) ||
      (publico.forma === 'parentesis' && publico.c % publico.a === 0 && Math.abs(r.k ?? 0) === 1 && r.m === (r.k ?? 0) * secreto.x);
    const comprobar = `Comprueba: con ${L} = ${num(r.x)} queda ${textoAmbosLados(publico, r.x)}. ¿Es verdad?`;
    if (pasoBien && r.x === secreto.x) {
      return { correcto: true, mensaje: `¡Equilibrio! ${L} = ${num(secreto.x)}. Comprobamos: ${textoAmbosLados(publico, secreto.x)} ✔`, solucion };
    }
    if (publico.forma === 'ambos') {
      if (a + c !== 0 && (r.k === a + c || ((d - b) % (a + c) === 0 && r.x === (d - b) / (a + c) && r.x !== secreto.x))) {
        return {
          correcto: false,
          diagnostico: 'ambos_lados_suma',
          mensaje: `Para sacar ${lineal(c, 0, L)} del otro lado hay que RESTARLO en ambos lados, no sumarlo: ${lineal(a, 0, L)} − ${numP(c)}${L}.`,
          solucion,
        };
      }
      if (r.m === d + b || r.m === -(d + b)) {
        return { correcto: false, diagnostico: 'operacion_inversa', mensaje: `Para sacar el ${num(b)} hay que hacer la operación inversa en ambos lados. ${comprobar}`, solucion };
      }
    } else {
      if ((r.k === a && r.m === c - b) || ((c - b) % a === 0 && r.x === (c - b) / a && r.x !== secreto.x)) {
        return {
          correcto: false,
          diagnostico: 'parentesis_distributiva',
          mensaje: `${a}(${L} ${b < 0 ? '−' : '+'} ${Math.abs(b)}) = ${a}${L} ${b < 0 ? '−' : '+'} ${a * Math.abs(b)}: el ${a} multiplica a los DOS términos del paréntesis.`,
          solucion,
        };
      }
    }
    if (r.x === secreto.m && secreto.k !== 1 && secreto.k !== -1) {
      return { correcto: false, diagnostico: 'ecuacion_sin_dividir', mensaje: `Llegaste a ${num(secreto.k)}${L} = ${num(secreto.m)}; falta dividir por ${numP(secreto.k)}.`, solucion };
    }
    if (r.x === -secreto.x) {
      return { correcto: false, diagnostico: 'signo_despeje', mensaje: `El número está bien, pero el signo no. Revisa la división: ${num(secreto.m)} ÷ ${numP(secreto.k)}. ${comprobar}`, solucion };
    }
    if (!pasoBien && r.x === secreto.x) {
      return { correcto: false, diagnostico: 'generico', mensaje: `Tu ${L} está bien, pero el paso intermedio no: ¿cuántas ${L} quedan en un lado y cuánto en el otro?`, solucion };
    }
    return { correcto: false, diagnostico: 'generico', mensaje: comprobar, solucion };
  },

  solucion(publico, secreto) {
    const L = publico.letra;
    const { k, m, x } = secreto;
    const primero =
      publico.forma === 'parentesis'
        ? `${lineal(publico.a, publico.a * publico.b, L)} = ${num(publico.c)}  →  `
        : '';
    return {
      simbolico: `${primero}${k === 1 ? '' : num(k)}${L} = ${num(m)}  →  ${L} = ${num(x)}`,
      explicacion:
        publico.forma === 'parentesis'
          ? `Primero se aplica la distributiva; después se despeja ${L}.`
          : `Se juntan los términos con ${L} en un lado (restando ${lineal(publico.c, 0, L)}) y los números en el otro; después se divide.`,
      respuesta: publico.representacion === 'formal' ? { k, m, x } : { x },
    };
  },

  pistas(publico, secreto) {
    const L = publico.letra;
    const { a, b, c } = publico;
    return [
      {
        nivel: 1,
        texto:
          publico.forma === 'parentesis'
            ? `Primero multiplica: el ${a} multiplica a ${L} y también al ${num(b)}.`
            : `Hay ${L} en los dos lados. Resta ${lineal(c, 0, L)} en ambos lados para que las ${L} queden en uno solo.`,
      },
      {
        nivel: 2,
        texto: `Llegas a ${secreto.k === 1 ? '' : num(secreto.k)}${L} = ${num(secreto.m)}. ¿Cuánto vale una ${L}?`,
        ayudaVisual: 'mostrarTotales',
        valor: Math.abs(secreto.m),
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: '5x + 3 = 2x + 15',
          pasos: ['Quitamos 2x de ambos lados: 3x + 3 = 15.', 'Quitamos 3: 3x = 12.', 'Dividimos por 3: x = 4. Comprobamos: 23 = 23 ✔'],
        },
      },
    ];
  },
};
