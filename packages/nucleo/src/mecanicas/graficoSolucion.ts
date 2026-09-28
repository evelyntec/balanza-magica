/**
 * "Espejismos" — ¿un solo número o muchos? Graficar en la recta numérica la
 * solución de una ecuación (un punto lleno) o de una inecuación (círculo
 * vacío y flecha).
 * OA MA05-15: resolver problemas, usando ecuaciones e inecuaciones de un paso,
 * que involucren adiciones y sustracciones, en forma pictórica y simbólica.
 *
 * Ecuaciones e inecuaciones se mezclan a propósito: la o el estudiante debe
 * decidir qué tipo de conjunto solución corresponde (Garrote, Hidalgo y
 * Blanco, 2004). Números hasta 1000, como en 5°.
 * Un número mal ubicado en la recta se puede adivinar; por eso el borde se
 * ESCRIBE y la recta solo lo dibuja.
 */

import type { Azar } from '../azar';
import { SIMBOLOS, NOMBRE_SIMBOLO } from './ecuacion';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export type Relacion = '=' | '<' | '>';
export type TipoGrafico = 'punto' | 'izquierda' | 'derecha';

export interface PublicoGrafico {
  /** true: "□ + a < b"; false: "b > □ + a". */
  incognitaPrimero: boolean;
  op: '+' | '-';
  /** Signo tal como está escrito. */
  relacion: Relacion;
  a: number;
  b: number;
  simbolo: string;
  /** Tramo visible de la recta y distancia entre marcas. */
  desde: number;
  hasta: number;
  marca: number;
  contexto?: string;
}

export interface SecretoGrafico {
  borde: number;
  tipo: TipoGrafico;
}

export interface RespuestaGrafico {
  valor: number;
  tipo: TipoGrafico;
}

const invertir = (r: Relacion): Relacion => (r === '<' ? '>' : r === '>' ? '<' : '=');
const SIGNO: Record<Relacion, string> = { '=': '=', '<': '<', '>': '>' };

export function textoGrafico(p: Pick<PublicoGrafico, 'incognitaPrimero' | 'op' | 'relacion' | 'a' | 'b' | 'simbolo'>, x?: number): string {
  const e = `${x === undefined ? p.simbolo : x} ${p.op === '+' ? '+' : '−'} ${p.a}`;
  return p.incognitaPrimero ? `${e} ${SIGNO[p.relacion]} ${p.b}` : `${p.b} ${SIGNO[p.relacion]} ${e}`;
}

/** Relación de la expresión con la incógnita respecto de b (□ ± a  ?  b). */
export const relacionEfectiva = (p: Pick<PublicoGrafico, 'incognitaPrimero' | 'relacion'>): Relacion =>
  p.incognitaPrimero ? p.relacion : invertir(p.relacion);

export function resolverGrafico(p: Pick<PublicoGrafico, 'incognitaPrimero' | 'op' | 'relacion' | 'a' | 'b'>): SecretoGrafico {
  const borde = p.op === '+' ? p.b - p.a : p.b + p.a;
  const r = relacionEfectiva(p);
  return { borde, tipo: r === '=' ? 'punto' : r === '<' ? 'izquierda' : 'derecha' };
}

function contexto(op: '+' | '-', r: Relacion, a: number, b: number, azar: Azar): string {
  const quien = azar.elegir(['Gatito', 'Sofía', 'Tomás', 'Amanda', 'Benjamín', 'Josefa']);
  if (op === '+' && r === '<') return `Un camello puede cargar menos de ${b} kg. Ya lleva ${a} kg. ¿Cuántos kilos □ más le pueden poner?`;
  if (op === '+' && r === '>') return `Para cruzar el desierto, la caravana necesita más de ${b} litros de agua. Ya tiene ${a} litros. ¿Cuántos litros □ más debe conseguir?`;
  if (op === '+') return `La caravana recorrió □ km el lunes y ${a} km el martes. En total recorrió ${b} km. ¿Cuántos km recorrió el lunes?`;
  if (r === '>') return `${quien} gastó ${a} monedas en el oasis y le quedaron más de ${b}. ¿Cuántas monedas □ podía tener antes de comprar?`;
  return `En el mercado del oasis se vendieron ${a} dátiles y quedaron ${b}. ¿Cuántos dátiles □ había al principio?`;
}

/** Genera un ejercicio; con historia (nivel 4 por defecto) la incógnita va a la izquierda. */
export function generarGrafico(nivel: number, azar: Azar, conHistoria = nivel === 4): ItemGenerado<PublicoGrafico, SecretoGrafico> {
    const tope = nivel === 1 ? 100 : nivel === 2 ? 500 : 1000;
    const marca = nivel === 1 ? 10 : nivel === 2 ? 50 : nivel === 5 ? azar.elegir([50, 100]) : 100;
    for (let intento = 0; intento < 500; intento++) {
      const op: '+' | '-' = nivel === 1 ? '+' : azar.elegir(['+', '+', '-'] as const);
      const incognitaPrimero = !conHistoria && (nivel === 3 || nivel === 5) ? azar.probabilidad(0.5) : true;
      // Con resta solo "=" o ">" efectivos: "□ − 30 < 50" dejaría fuera los números menores que 30.
      const efectiva: Relacion = op === '-' ? azar.elegir(['=', '>'] as const) : azar.elegir(['=', '<', '>'] as const);
      const relacion = incognitaPrimero ? efectiva : invertir(efectiva);
      let a: number;
      let b: number;
      if (op === '+') {
        b = azar.entero(Math.max(15, Math.floor(tope / 5)), tope);
        a = azar.entero(3, b - 5);
      } else {
        const borde = azar.entero(Math.max(20, Math.floor(tope / 5)), tope);
        a = azar.entero(3, borde - 5);
        b = borde - a;
      }
      const publicoBase = { incognitaPrimero, op, relacion, a, b };
      const { borde, tipo } = resolverGrafico(publicoBase);
      if (borde < 2 || borde === a || borde === b || a === b) continue;
      const k = azar.entero(1, 8);
      const desde = Math.max(0, (Math.floor(borde / marca) - k) * marca);
      const hasta = desde + 10 * marca;
      const simbolo = conHistoria ? '□' : azar.elegir(SIMBOLOS);
      const publico: PublicoGrafico = { ...publicoBase, simbolo, desde, hasta, marca };
      if (conHistoria) publico.contexto = contexto(op, efectiva, a, b, azar);
      const consigna = '¿Un solo número o muchos? Escribe el borde y elige cómo se dibuja la solución.';
      return {
        tipo: 'grafico_solucion',
        nivel,
        consigna,
        voz: `${publico.contexto ?? ''} Resuelve ${textoGrafico(publico)}, donde el ${NOMBRE_SIMBOLO[simbolo]} es el número desconocido. ¿Es un solo número o son muchos? Escribe el número del borde y elige cómo se dibuja la solución en la recta.`,
        publico,
        secreto: { borde, tipo },
        relacional: !incognitaPrimero,
      };
    }
    throw new Error('No se pudo generar el gráfico de solución');
}

export const graficoSolucion: Mecanica<PublicoGrafico, SecretoGrafico, RespuestaGrafico> = {
  tipo: 'grafico_solucion',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar) {
    return generarGrafico(nivel, azar);
  },

  validarRespuesta(r: unknown): RespuestaGrafico | null {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    const { valor, tipo } = r as Record<string, unknown>;
    if (!esEnteroEn(valor, 0, 99999)) return null;
    if (tipo !== 'punto' && tipo !== 'izquierda' && tipo !== 'derecha') return null;
    return { valor, tipo };
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    const { borde, tipo } = secreto;
    const menor = tipo === 'izquierda';
    if (respuesta.valor === borde && respuesta.tipo === tipo) {
      return {
        correcto: true,
        mensaje:
          tipo === 'punto'
            ? `¡Exacto! Es una ecuación: solo ${borde} la cumple. Comprobamos: ${textoGrafico(publico, borde)} ✔`
            : `¡Muy bien! Es una inecuación: ${publico.simbolo} puede ser cualquier número ${menor ? 'menor' : 'mayor'} que ${borde}. El círculo va vacío porque con ${borde} los dos lados quedan iguales.`,
        solucion,
      };
    }
    if (respuesta.valor === borde) {
      if (respuesta.tipo === 'punto') {
        return {
          correcto: false,
          diagnostico: 'inecuacion_igualdad',
          mensaje: `Con ${borde} los dos lados quedan iguales, pero el signo no es "=". Es una inecuación: tiene muchas soluciones. Se dibuja con un círculo vacío y una flecha.`,
          solucion,
        };
      }
      if (tipo === 'punto') {
        return {
          correcto: false,
          diagnostico: 'ecuacion_rayo',
          mensaje: `Es una ecuación (tiene "="): solo UN número hace iguales los dos lados. Se dibuja con un punto lleno, sin flecha.`,
          solucion,
        };
      }
      return {
        correcto: false,
        diagnostico: 'inecuacion_direccion',
        mensaje: `El borde está bien, pero la flecha apunta al lado contrario. Prueba un número a cada lado de ${borde}: ¿cuál cumple?`,
        solucion,
      };
    }
    const directa = publico.op === '+' ? publico.b + publico.a : Math.abs(publico.b - publico.a);
    if (respuesta.valor === directa) {
      return {
        correcto: false,
        diagnostico: 'operacion_inversa',
        mensaje: `${publico.op === '+' ? 'Sumaste' : 'Restaste'} ${publico.a}, pero hay que usar la operación inversa. Reemplaza tu número en ${textoGrafico(publico)} y comprueba.`,
        solucion,
      };
    }
    return {
      correcto: false,
      diagnostico: 'generico',
      mensaje: `Busca el borde: el número que hace iguales los dos lados. Reemplázalo en ${textoGrafico(publico)} para comprobar.`,
      solucion,
    };
  },

  solucion(publico, secreto) {
    const { borde, tipo } = secreto;
    return {
      simbolico: tipo === 'punto' ? `${publico.simbolo} = ${borde}` : `${publico.simbolo} ${tipo === 'izquierda' ? '<' : '>'} ${borde}`,
      explicacion:
        tipo === 'punto'
          ? `Es una ecuación: un solo número, ${borde}. Punto lleno en ${borde}.`
          : `Es una inecuación: todos los números ${tipo === 'izquierda' ? 'menores' : 'mayores'} que ${borde}. Círculo vacío en ${borde} y flecha hacia la ${tipo}.`,
      respuesta: { valor: borde, tipo },
    };
  },

  pistas(publico, secreto) {
    const { borde, tipo } = secreto;
    const operacion = publico.op === '+' ? `${publico.b} − ${publico.a}` : `${publico.b} + ${publico.a}`;
    return [
      {
        nivel: 1,
        texto: 'Primero busca el borde: el número que haría iguales los dos lados. Después mira el signo: ¿es "=" o es "<" / ">"?',
      },
      {
        nivel: 2,
        texto:
          tipo === 'punto'
            ? `El borde es ${operacion}. Como hay un "=", solo ese número sirve.`
            : `El borde es ${operacion}. Prueba un número un poco más chico y uno un poco más grande que el borde: ¿cuál cumple?`,
        ayudaVisual: 'mostrarTotales',
        valor: borde,
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: '□ + 300 < 700',
          pasos: ['Borde: 700 − 300 = 400 (ahí los lados son iguales).', 'Con 399: 699 < 700 ✔. Con 401: 701 < 700 ✘.', 'Círculo vacío en 400 y flecha a la izquierda.'],
        },
      },
    ];
  },
};
