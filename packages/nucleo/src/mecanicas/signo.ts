/**
 * "El signo que falta" — comparar con =, < y >.
 * OA MA02-13: demostrar, explicar y registrar la igualdad y la desigualdad
 * en forma concreta y pictórica del 0 al 20, usando el símbolo igual (=) y
 * los símbolos no igual (>, <).
 *
 * Progresión: cubos → pesas → solo símbolos → comparar sin calcular
 * (pensamiento relacional) → expresiones con resta (sin balanza, porque el
 * modelo de balanza no representa bien la sustracción; Vlassis 2002).
 */

import type { Azar } from '../azar';
import { mas, menos, objetosDesde, signoEntre, suma, textoExpresion, valorExpresion, vozExpresion, vozSigno } from '../balanza';
import type { Expresion, Objeto, Representacion, Signo } from '../tipos';
import { descomponer, type ItemGenerado, type Mecanica } from './mecanica';

export interface PublicoSigno {
  izquierda: Expresion;
  derecha: Expresion;
  representacion: Representacion;
  /** Objetos para dibujar en la balanza (concreta/pictórica). */
  objetosIzquierda?: Objeto[];
  objetosDerecha?: Objeto[];
}

export interface SecretoSigno {
  correcto: Signo;
  valorIzquierda: number;
  valorDerecha: number;
}

const SIGNOS: readonly Signo[] = ['<', '=', '>'];

function par(resultado: Signo, min: number, max: number, azar: Azar, difMax = 5): [number, number] {
  if (resultado === '=') {
    const t = azar.entero(min, max);
    return [t, t];
  }
  const dif = azar.entero(1, difMax);
  const mayor = azar.entero(min + dif, max);
  return resultado === '>' ? [mayor, mayor - dif] : [mayor - dif, mayor];
}

function relacional(resultado: Signo, azar: Azar): [Expresion, Expresion] {
  if (resultado === '=') {
    if (azar.probabilidad(0.5)) {
      const a = azar.entero(3, 12);
      const b = azar.entero(2, 20 - a);
      return [suma(a, b), suma(b, a)];
    }
    const a = azar.entero(3, 12);
    const b = azar.entero(3, 20 - a);
    const k = azar.entero(1, 2);
    return [suma(a, b), suma(a + k, b - k)];
  }
  // a + b  ?  a + c   (el primer término se repite)
  const a = azar.entero(4, 12);
  let b = azar.entero(1, 20 - a);
  let c = azar.entero(1, 20 - a);
  while (b === c) c = azar.entero(1, 20 - a);
  if ((resultado === '>' && b < c) || (resultado === '<' && b > c)) [b, c] = [c, b];
  return [suma(a, b), azar.probabilidad(0.5) ? suma(a, c) : suma(c, a)];
}

function conResta(resultado: Signo, azar: Azar): [Expresion, Expresion] {
  // a − b  ?  c    o    a − b  ?  c + d
  const a = azar.entero(8, 20);
  const b = azar.entero(1, a - 2);
  const v = a - b;
  const izq: Expresion = [mas(a), menos(b)];
  let objetivo: number;
  if (resultado === '=') objetivo = v;
  else if (resultado === '>') objetivo = Math.max(0, v - azar.entero(1, 3));
  else objetivo = Math.min(20, v + azar.entero(1, 3));
  if (signoEntre(v, objetivo) !== resultado) objetivo = resultado === '>' ? v - 1 : v + 1;
  const der: Expresion = objetivo >= 4 && azar.probabilidad(0.5) ? suma(...descomponer(objetivo, 2, azar)) : suma(objetivo);
  return azar.probabilidad(0.5) ? [izq, der] : [der, izq];
}

export const signo: Mecanica<PublicoSigno, SecretoSigno, Signo> = {
  tipo: 'signo',
  modo: 'eleccion',
  maxIntentos: 1,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoSigno, SecretoSigno> {
    // Por la simetría de la resta, en nivel 5 el resultado se ajusta después.
    const buscado = azar.elegir(SIGNOS);
    let izquierda: Expresion;
    let derecha: Expresion;
    let representacion: Representacion;
    let esRelacional = false;

    switch (nivel) {
      case 1: {
        const [a, b] = par(buscado, 1, 12, azar, 4);
        izquierda = suma(a);
        derecha = suma(b);
        representacion = 'concreta';
        break;
      }
      case 2: {
        const [a, b] = par(buscado, 3, 20, azar, 3);
        izquierda = suma(...descomponer(a, 2, azar));
        derecha = suma(b);
        if (azar.probabilidad(0.5)) [izquierda, derecha] = [derecha, izquierda];
        representacion = 'pictorica';
        break;
      }
      case 3: {
        const [a, b] = par(buscado, 4, 20, azar, 3);
        izquierda = suma(...descomponer(a, 2, azar));
        derecha = suma(...descomponer(b, 2, azar));
        representacion = 'simbolica';
        break;
      }
      case 4: {
        // Si al invertir los lados cambia el signo, se recalcula al final.
        [izquierda, derecha] = relacional(buscado, azar);
        representacion = 'simbolica';
        esRelacional = true;
        break;
      }
      default: {
        [izquierda, derecha] = conResta(buscado, azar);
        representacion = 'simbolica';
      }
    }

    const valorIzquierda = valorExpresion(izquierda);
    const valorDerecha = valorExpresion(derecha);
    const correcto = signoEntre(valorIzquierda, valorDerecha);
    const publico: PublicoSigno = { izquierda, derecha, representacion };
    if (representacion !== 'simbolica') {
      const como = representacion === 'concreta' ? 'cubos' : 'pesa';
      publico.objetosIzquierda = objetosDesde(izquierda.map((t) => t.valor), como);
      publico.objetosDerecha = objetosDesde(derecha.map((t) => t.valor), como);
    }

    return {
      tipo: 'signo',
      nivel,
      consigna: '¿Qué signo va en el círculo: <, = o >?',
      voz: `A la izquierda: ${vozExpresion(izquierda)}. A la derecha: ${vozExpresion(derecha)}. ¿Qué signo va entre los dos lados: menor que, igual o mayor que?`,
      publico,
      secreto: { correcto, valorIzquierda, valorDerecha },
      relacional: esRelacional,
    };
  },

  validarRespuesta(r: unknown): Signo | null {
    return typeof r === 'string' && (SIGNOS as readonly string[]).includes(r) ? (r as Signo) : null;
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    const { valorIzquierda: l, valorDerecha: r, correcto } = secreto;
    if (respuesta === correcto) {
      return { correcto: true, mensaje: `¡Correcto! ${solucion.simbolico}: ${l} ${vozSigno(correcto)} ${r}.`, solucion };
    }
    if (correcto === '=') {
      return {
        correcto: false,
        diagnostico: 'desequilibrio_falso',
        mensaje: `Los dos lados valen ${l}. Cuando valen lo mismo usamos el signo igual (=).`,
        solucion,
      };
    }
    if (respuesta === '=') {
      return {
        correcto: false,
        diagnostico: 'equilibrio_falso',
        mensaje: `Un lado vale ${l} y el otro ${r}: no son iguales. Usa < o >.`,
        solucion,
      };
    }
    return {
      correcto: false,
      diagnostico: 'signo_invertido',
      mensaje: 'Elegiste el signo al revés. La parte abierta del signo mira al número mayor, y la punta al menor.',
      solucion,
    };
  },

  solucion(publico, secreto) {
    const simbolico = `${textoExpresion(publico.izquierda)} ${secreto.correcto} ${textoExpresion(publico.derecha)}`;
    return {
      simbolico,
      explicacion: `A la izquierda hay ${secreto.valorIzquierda} y a la derecha ${secreto.valorDerecha}.`,
      respuesta: secreto.correcto,
    };
  },

  pistas(publico) {
    const esRelacional =
      publico.representacion === 'simbolica' &&
      publico.izquierda.length === 2 &&
      publico.derecha.length === 2 &&
      publico.izquierda.every((t) => t.signo === 1) &&
      publico.derecha.every((t) => t.signo === 1);
    return [
      {
        nivel: 1,
        texto: esRelacional
          ? 'Antes de sumar, mira: ¿hay un número que se repite en los dos lados? Compara solo lo que cambia.'
          : '¿Cuánto vale cada lado? El signo < o > abre su boca hacia el lado que vale más.',
      },
      publico.representacion === 'simbolica'
        ? { nivel: 2, texto: 'Ponemos los números en la balanza: cada pesa vale su número.', ayudaVisual: 'convertirACubos' }
        : { nivel: 2, texto: 'Ordenamos los cubos en torres de 5 para contarlos mejor.', ayudaVisual: 'agrupar5' },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: '6 + 3  ○  8',
          pasos: ['6 + 3 = 9', '9 es mayor que 8', 'Escribimos 6 + 3 > 8 (la boca mira al 9)'],
        },
      },
    ];
  },
};
