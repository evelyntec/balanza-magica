/**
 * "Desigualdades del rey" — inecuaciones lineales.
 * OA MA08-9: resolver inecuaciones lineales con coeficientes racionales en
 * el contexto de la resolución de problemas, por medio de representaciones
 * gráficas y simbólicas.
 *
 * Aparece el error más característico de 8°: no invertir el signo al
 * multiplicar o dividir por un número negativo (Tsamir y Bazzini, 2004).
 * La solución se dibuja en la recta, que ahora incluye negativos.
 */

import type { Azar } from '../azar';
import type { RespuestaGrafico, SecretoGrafico, TipoGrafico } from './graficoSolucion';
import { lineal, num } from './lineal';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export type FormaLineal = 'ax+b?c' | 'ax+b?cx+d' | 'x/a+b?c';

export interface PublicoInecLineal {
  forma: FormaLineal;
  a: number;
  b: number;
  c: number;
  d: number;
  relacion: '<' | '>';
  letra: string;
  texto: string;
  desde: number;
  hasta: number;
  marca: number;
  /** La recta y la respuesta admiten negativos. */
  negativos: true;
}

export function textoInecLineal(p: Pick<PublicoInecLineal, 'forma' | 'a' | 'b' | 'c' | 'd' | 'relacion' | 'letra'>, x?: number): string {
  const L = x === undefined ? p.letra : `(${num(x)})`;
  const izq =
    p.forma === 'x/a+b?c'
      ? `${L}/${p.a}${p.b === 0 ? '' : ` ${p.b < 0 ? '−' : '+'} ${Math.abs(p.b)}`}`
      : x === undefined
        ? lineal(p.a, p.b, L)
        : `${num(p.a)} · ${L}${p.b === 0 ? '' : ` ${p.b < 0 ? '−' : '+'} ${Math.abs(p.b)}`}`;
  const der = p.forma === 'ax+b?cx+d' ? (x === undefined ? lineal(p.c, p.d, L) : `${num(p.c)} · ${L}${p.d === 0 ? '' : ` ${p.d < 0 ? '−' : '+'} ${Math.abs(p.d)}`}`) : num(p.c);
  return `${izq} ${p.relacion} ${der}`;
}

/** Coeficiente de x después de juntar (su signo decide si se invierte la desigualdad). */
export const coeficienteFinal = (p: Pick<PublicoInecLineal, 'forma' | 'a' | 'c'>) => (p.forma === 'ax+b?cx+d' ? p.a - p.c : p.a);

export const inecuacionLineal: Mecanica<PublicoInecLineal, SecretoGrafico, RespuestaGrafico> = {
  tipo: 'inecuacion_lineal',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoInecLineal, SecretoGrafico> {
    for (let intento = 0; intento < 500; intento++) {
      const forma: FormaLineal =
        nivel === 1 ? 'ax+b?c' : nivel === 2 ? azar.elegir(['ax+b?c', 'x/a+b?c'] as const) : nivel === 3 ? 'ax+b?c' : nivel === 4 ? 'ax+b?cx+d' : azar.elegir(['ax+b?c', 'x/a+b?c', 'ax+b?cx+d'] as const);
      const relacion = azar.elegir(['<', '>'] as const);
      const letra = nivel <= 2 ? 'x' : azar.elegir(['x', 'y', 'n', 'p']);
      const borde = nivel <= 2 ? azar.entero(1, 20) : azar.entero(-12, 15);
      let a: number;
      let b: number;
      let c: number;
      let d = 0;
      if (forma === 'x/a+b?c') {
        a = azar.entero(2, 5);
        if (borde % a !== 0) continue;
        b = azar.entero(-10, 12);
        c = borde / a + b;
      } else if (forma === 'ax+b?c') {
        a = nivel <= 2 ? azar.entero(2, 6) : azar.elegir([-6, -5, -4, -3, -2, 2, 3, 4, 5]);
        if (nivel === 3 && a > 0 && azar.probabilidad(0.6)) a = -a; // la trampa del negativo, a menudo
        b = nivel <= 2 ? azar.entero(1, 15) : azar.entero(-15, 15);
        c = a * borde + b;
      } else {
        a = azar.entero(-5, 8);
        c = azar.entero(-5, 8);
        if (a === 0 || c === 0 || a === c) continue;
        b = azar.entero(-15, 15);
        d = (a - c) * borde + b;
      }
      if (Math.abs(c) > 150 || Math.abs(d) > 150) continue;
      const k = coeficienteFinal({ forma, a, c });
      const menor = (relacion === '<') === k > 0;
      const tipo: TipoGrafico = menor ? 'izquierda' : 'derecha';
      const marca = Math.abs(borde) <= 12 ? 2 : 5;
      const desde = (Math.floor(borde / marca) - azar.entero(2, 8)) * marca;
      const base = { forma, a, b, c, d, relacion, letra };
      const texto = textoInecLineal(base);
      return {
        tipo: 'inecuacion_lineal',
        nivel,
        consigna: 'Resuelve la inecuación: escribe el borde y dibuja la solución. ¡Ojo con los negativos!',
        voz: `Resuelve ${texto.replace('/', ' dividido por ')}. Escribe el borde y elige cómo se dibuja la solución.`,
        publico: { ...base, texto, desde, hasta: desde + 10 * marca, marca, negativos: true },
        secreto: { borde, tipo },
        relacional: forma === 'ax+b?cx+d',
      };
    }
    throw new Error('No se pudo generar la inecuación');
  },

  validarRespuesta(r: unknown): RespuestaGrafico | null {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    const { valor, tipo } = r as Record<string, unknown>;
    if (!esEnteroEn(valor, -99999, 99999)) return null;
    if (tipo !== 'punto' && tipo !== 'izquierda' && tipo !== 'derecha') return null;
    return { valor, tipo };
  },

  evaluar(publico, secreto, r) {
    const solucion = this.solucion(publico, secreto);
    const { borde, tipo } = secreto;
    const L = publico.letra;
    const k = coeficienteFinal(publico);
    if (r.valor === borde && r.tipo === tipo) {
      return {
        correcto: true,
        mensaje: `¡Muy bien! ${L} ${tipo === 'izquierda' ? '<' : '>'} ${num(borde)}.${k < 0 ? ' Al dividir por un negativo, la desigualdad se invirtió.' : ''}`,
        solucion,
      };
    }
    if (r.valor === borde && r.tipo === 'punto') {
      return { correcto: false, diagnostico: 'inecuacion_igualdad', mensaje: `${num(borde)} es el borde, pero no hay "=": son muchos números. Círculo vacío y flecha.`, solucion };
    }
    if (r.valor === borde) {
      if (k < 0) {
        return {
          correcto: false,
          diagnostico: 'inecuacion_no_invierte',
          mensaje: `El borde está bien, pero al dividir por ${num(k)} (un número NEGATIVO) la desigualdad se invierte. Compruébalo con ${num(borde + 1)}.`,
          solucion,
        };
      }
      return { correcto: false, diagnostico: 'inecuacion_direccion', mensaje: `El borde está bien, pero la flecha va al otro lado. Prueba con ${num(borde + 1)}.`, solucion };
    }
    if (r.valor === -borde && borde !== 0) {
      return { correcto: false, diagnostico: 'signo_despeje', mensaje: `El número está bien, pero su signo no. Revisa la división con signos.`, solucion };
    }
    return { correcto: false, diagnostico: 'generico', mensaje: `Resuelve como si fuera una ecuación para hallar el borde y comprueba reemplazando en ${publico.texto}.`, solucion };
  },

  solucion(publico, secreto) {
    const L = publico.letra;
    const k = coeficienteFinal(publico);
    const rel = secreto.tipo === 'izquierda' ? '<' : '>';
    return {
      simbolico: `${publico.texto}  →  ${L} ${rel} ${num(secreto.borde)}`,
      explicacion: `${k < 0 ? `Se divide por ${num(k)}, que es negativo: la desigualdad se invierte. ` : ''}Círculo vacío en ${num(secreto.borde)} y flecha hacia la ${secreto.tipo}.`,
      respuesta: { valor: secreto.borde, tipo: secreto.tipo },
    };
  },

  pistas(publico, secreto) {
    const k = coeficienteFinal(publico);
    return [
      { nivel: 1, texto: 'Despeja como en una ecuación: deja la letra sola en un lado. Pero atención si multiplicas o divides por un negativo.' },
      {
        nivel: 2,
        texto: `El borde es ${num(secreto.borde)}.${k < 0 ? ` Vas a dividir por ${num(k)}: ¡la desigualdad se da vuelta!` : ''}`,
        ayudaVisual: 'mostrarTotales',
        valor: secreto.borde,
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: { texto: '−2x + 5 < 11', pasos: ['Restamos 5: −2x < 6.', 'Dividimos por −2 (negativo): x > −3. ¡Se invierte!', 'Comprobamos con 0: 5 < 11 ✔.'] },
      },
    ];
  },
};
