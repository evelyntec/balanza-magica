/**
 * "¿Hacia dónde baja?" — predecir equilibrio o desequilibrio.
 * OA MA01-12: describir la igualdad y la desigualdad como equilibrio y
 * desequilibrio usando una balanza, del 0 al 20.
 *
 * La balanza aparece trabada: se predice primero y luego Gatito la suelta.
 */

import type { Azar } from '../azar';
import { objetosDesde, pesoPlatillo, inclinacionDe, vozPlatillo, textoPlatillo, signoEntre } from '../balanza';
import type { Inclinacion, Objeto, Representacion } from '../tipos';
import { descomponer, type ContextoGeneracion, type ItemGenerado, type Mecanica } from './mecanica';

export interface PublicoInclinacion {
  izquierda: Objeto[];
  derecha: Objeto[];
  representacion: Representacion;
  /** En 2° básico en adelante se registra con <, = y >. */
  usaSignos: boolean;
}

export interface SecretoInclinacion {
  correcta: Inclinacion;
  totalIzquierda: number;
  totalDerecha: number;
}

const OPCIONES: readonly Inclinacion[] = ['izquierda', 'equilibrio', 'derecha'];

const nombreLado = (lado: Inclinacion): string => (lado === 'izquierda' ? 'izquierdo' : 'derecho');

/** Totales (L, R) coherentes con el resultado pedido. */
function totalesPara(resultado: Inclinacion, min: number, max: number, difMin: number, difMax: number, azar: Azar): [number, number] {
  if (resultado === 'equilibrio') {
    const t = azar.entero(min, max);
    return [t, t];
  }
  const dif = azar.entero(difMin, difMax);
  const mayor = azar.entero(min + dif, max);
  const menor = mayor - dif;
  return resultado === 'izquierda' ? [mayor, menor] : [menor, mayor];
}

function generarRelacional(resultado: Inclinacion, azar: Azar): [number[], number[]] {
  // Formas que invitan a comparar sin calcular todo.
  const forma = resultado === 'equilibrio' ? azar.elegir(['conmutativa', 'compensacion'] as const) : 'mismo_termino';
  if (forma === 'conmutativa') {
    const a = azar.entero(2, 12);
    const b = azar.entero(2, 20 - a);
    return [
      [a, b],
      [b, a],
    ];
  }
  if (forma === 'compensacion') {
    const a = azar.entero(3, 12);
    const b = azar.entero(3, 20 - a);
    const k = azar.entero(1, Math.min(2, b - 1));
    return [[a, b], [a + k, b - k]];
  }
  // mismo_termino: a + b  vs  a + c  (o c + a)
  const a = azar.entero(3, 11);
  let b = azar.entero(1, 20 - a);
  let c = azar.entero(1, 20 - a);
  while (b === c) c = azar.entero(1, 20 - a);
  if ((resultado === 'izquierda' && b < c) || (resultado === 'derecha' && b > c)) [b, c] = [c, b];
  const derecha = azar.probabilidad(0.5) ? [a, c] : [c, a];
  return [[a, b], derecha];
}

export const inclinacion: Mecanica<PublicoInclinacion, SecretoInclinacion, Inclinacion> = {
  tipo: 'inclinacion',
  modo: 'eleccion',
  maxIntentos: 1,

  generar(nivel: number, azar: Azar, ctx: ContextoGeneracion): ItemGenerado<PublicoInclinacion, SecretoInclinacion> {
    const resultado = azar.elegir(OPCIONES);
    let izquierda: Objeto[];
    let derecha: Objeto[];
    let representacion: Representacion = 'concreta';
    let relacional = false;

    switch (nivel) {
      case 1: {
        const [l, r] = totalesPara(resultado, 1, 10, 2, 6, azar);
        izquierda = objetosDesde([l], 'cubos');
        derecha = objetosDesde([r], 'cubos');
        break;
      }
      case 2: {
        const [l, r] = totalesPara(resultado, 3, 20, 1, 3, azar);
        izquierda = objetosDesde(descomponer(l, azar.entero(1, 2), azar), 'cubos');
        derecha = objetosDesde(descomponer(r, azar.entero(1, 2), azar), 'cubos');
        break;
      }
      case 3: {
        const [l, r] = totalesPara(resultado, 4, 20, 1, 4, azar);
        representacion = 'pictorica';
        izquierda = objetosDesde(descomponer(l, azar.entero(1, 2), azar), 'pesa');
        derecha = objetosDesde(descomponer(r, azar.entero(1, 2), azar), 'pesa');
        break;
      }
      case 4: {
        const [l, r] = totalesPara(resultado, 4, 20, 1, 3, azar);
        representacion = 'pictorica';
        const mezclar = (total: number): Objeto[] => {
          const [a, b] = descomponer(total, 2, azar) as [number, number];
          const objetos: Objeto[] = [{ tipo: 'cubos', cantidad: a, color: 0 }, { tipo: 'pesa', valor: b }];
          return azar.barajar(objetos);
        };
        izquierda = mezclar(l);
        derecha = mezclar(r);
        break;
      }
      default: {
        representacion = 'simbolica';
        relacional = true;
        const [l, r] = generarRelacional(resultado, azar);
        izquierda = objetosDesde(l, 'pesa');
        derecha = objetosDesde(r, 'pesa');
      }
    }

    const totalIzquierda = pesoPlatillo(izquierda);
    const totalDerecha = pesoPlatillo(derecha);
    const correcta = inclinacionDe(totalIzquierda, totalDerecha);

    return {
      tipo: 'inclinacion',
      nivel,
      consigna: '¿Hacia dónde se inclinará la balanza?',
      voz:
        `En el platillo izquierdo hay ${vozPlatillo(izquierda)}. En el platillo derecho hay ${vozPlatillo(derecha)}. ` +
        '¿Qué lado baja? ¿O quedará en equilibrio?',
      publico: { izquierda, derecha, representacion, usaSignos: ctx.isla >= 2 },
      secreto: { correcta, totalIzquierda, totalDerecha },
      relacional,
    };
  },

  validarRespuesta(r: unknown): Inclinacion | null {
    return typeof r === 'string' && (OPCIONES as readonly string[]).includes(r) ? (r as Inclinacion) : null;
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    if (respuesta === secreto.correcta) {
      const mensaje =
        secreto.correcta === 'equilibrio'
          ? `¡Exacto! Los dos platillos pesan ${secreto.totalIzquierda}: hay equilibrio.`
          : `¡Muy bien! Baja el lado que pesa más: ${Math.max(secreto.totalIzquierda, secreto.totalDerecha)} es más que ${Math.min(secreto.totalIzquierda, secreto.totalDerecha)}.`;
      return { correcto: true, mensaje, solucion };
    }
    if (secreto.correcta === 'equilibrio') {
      return {
        correcto: false,
        diagnostico: 'desequilibrio_falso',
        mensaje: `Los dos platillos pesan lo mismo: ${secreto.totalIzquierda}. Cuando pesan igual, la balanza queda derechita.`,
        solucion,
      };
    }
    if (respuesta === 'equilibrio') {
      return {
        correcto: false,
        diagnostico: 'equilibrio_falso',
        mensaje: `Casi: un lado pesa ${secreto.totalIzquierda} y el otro ${secreto.totalDerecha}. No pesan lo mismo, así que no hay equilibrio.`,
        solucion,
      };
    }
    return {
      correcto: false,
      diagnostico: 'direccion_opuesta',
      mensaje: 'En una balanza, el lado más pesado es el que BAJA, y el más liviano sube.',
      solucion,
    };
  },

  solucion(publico, secreto) {
    const izq = textoPlatillo(publico.izquierda);
    const der = textoPlatillo(publico.derecha);
    const { totalIzquierda: l, totalDerecha: r, correcta } = secreto;
    let simbolico: string;
    if (correcta === 'equilibrio') simbolico = `${izq} = ${der}`;
    else if (publico.usaSignos) simbolico = `${izq} ${signoEntre(l, r)} ${der}`;
    else simbolico = `${izq} y ${der} no pesan lo mismo`;
    const explicacion =
      correcta === 'equilibrio'
        ? `Ambos platillos pesan ${l}: equilibrio.`
        : `El platillo ${nombreLado(correcta)} pesa ${Math.max(l, r)} y el otro ${Math.min(l, r)}: baja el platillo ${nombreLado(correcta)}.`;
    return { simbolico, explicacion, respuesta: correcta };
  },

  pistas(publico) {
    const soloPesas = publico.izquierda.every((o) => o.tipo === 'pesa') && publico.derecha.every((o) => o.tipo === 'pesa');
    return [
      {
        nivel: 1,
        texto:
          publico.representacion === 'simbolica'
            ? '¡No necesitas sumar todo! Busca las pesas que se repiten en los dos lados y compara solo lo distinto.'
            : 'Averigua cuánto pesa cada platillo. El lado que pesa más es el que baja.',
      },
      soloPesas
        ? { nivel: 2, texto: 'Cambiamos las pesas por cubos: cada cubo pesa 1. ¿Qué lado tiene más cubos?', ayudaVisual: 'convertirACubos' }
        : { nivel: 2, texto: 'Ordenamos los cubos en torres de 5. Cuenta de a 5 y luego suma los que sobran.', ayudaVisual: 'agrupar5' },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: 'Un platillo tiene 7 y el otro tiene 4 + 2.',
          pasos: ['4 + 2 pesa 6.', '7 es más que 6.', 'Baja el platillo que tiene 7.'],
        },
      },
    ];
  },
};
