/**
 * "¿Verdadero o falso?" — igualdades para pensar el signo igual como relación.
 * OA MA02-13 (explicar la igualdad y la desigualdad).
 *
 * Diseñado contra la visión operacional del "=" (Castro y Molina 2007;
 * Falkner, Levi y Carpenter 1999):
 *  - 8 = 5 + 3 es VERDADERA (el resultado puede ir a la izquierda).
 *  - 7 = 7 es VERDADERA.
 *  - 8 + 4 = 12 + 5 es FALSA (error de "encadenar" cálculos).
 * Se clasifican varias igualdades a la vez: no conviene adivinar.
 */

import type { Azar } from '../azar';
import { mas, menos, suma, textoExpresion, valorExpresion } from '../balanza';
import type { CodigoDiagnostico, Expresion } from '../tipos';
import { descomponer, type ItemGenerado, type Mecanica } from './mecanica';

export type FormaVF =
  | 'normal'
  | 'invertida'
  | 'identidad'
  | 'conmutativa'
  | 'compensacion'
  | 'encadenada'
  | 'casi'
  | 'resta_v'
  | 'resta_f';

export interface Afirmacion {
  izquierda: Expresion;
  derecha: Expresion;
}

export interface PublicoVerdaderoFalso {
  afirmaciones: Afirmacion[];
}

export interface SecretoVerdaderoFalso {
  valores: boolean[];
  formas: FormaVF[];
}

const VERDADERAS: readonly FormaVF[] = ['normal', 'invertida', 'identidad', 'conmutativa', 'compensacion', 'resta_v'];

function construir(forma: FormaVF, azar: Azar): Afirmacion {
  switch (forma) {
    case 'normal': {
      const c = azar.entero(5, 20);
      return { izquierda: suma(...descomponer(c, 2, azar)), derecha: suma(c) };
    }
    case 'invertida': {
      const c = azar.entero(5, 20);
      return { izquierda: suma(c), derecha: suma(...descomponer(c, 2, azar)) };
    }
    case 'identidad': {
      const a = azar.entero(2, 20);
      return { izquierda: suma(a), derecha: suma(a) };
    }
    case 'conmutativa': {
      const a = azar.entero(2, 12);
      let b = azar.entero(2, 20 - a);
      if (b === a) b = a === 2 ? 3 : a - 1;
      return { izquierda: suma(a, b), derecha: suma(b, a) };
    }
    case 'compensacion': {
      const a = azar.entero(3, 12);
      const b = azar.entero(3, 20 - a);
      const k = azar.entero(1, 2);
      return { izquierda: suma(a, b), derecha: suma(a + k, b - k) };
    }
    case 'encadenada': {
      // a + b = (a + b) + c   ← "8 + 4 = 12 + 5"
      const a = azar.entero(2, 9);
      const b = azar.entero(2, Math.min(9, 17 - a));
      const c = azar.entero(1, Math.min(9, 20 - a - b));
      return { izquierda: suma(a, b), derecha: suma(a + b, c) };
    }
    case 'casi': {
      const t = azar.entero(6, 19);
      const otro = t + (azar.probabilidad(0.5) ? 1 : -1);
      const derecha = otro >= 4 && azar.probabilidad(0.5) ? suma(...descomponer(otro, 2, azar)) : suma(otro);
      return azar.probabilidad(0.5)
        ? { izquierda: suma(...descomponer(t, 2, azar)), derecha }
        : { izquierda: derecha, derecha: suma(...descomponer(t, 2, azar)) };
    }
    case 'resta_v': {
      const a = azar.entero(6, 20);
      const b = azar.entero(1, a - 1);
      const izq: Expresion = [mas(a), menos(b)];
      return azar.probabilidad(0.5) ? { izquierda: izq, derecha: suma(a - b) } : { izquierda: suma(a - b), derecha: izq };
    }
    case 'resta_f': {
      const a = azar.entero(6, 20);
      const b = azar.entero(2, a - 2);
      // Error típico: a − b = b − a o confundir con a + b. Usamos resultado ± 1 o la suma.
      const falso = azar.probabilidad(0.4) && a + b <= 20 ? a + b : a - b + (azar.probabilidad(0.5) ? 1 : -1);
      return { izquierda: [mas(a), menos(b)], derecha: suma(falso) };
    }
  }
}

const FORMAS_POR_NIVEL: Record<number, { formas: FormaVF[]; cantidad: number }> = {
  1: { formas: ['normal', 'invertida', 'casi'], cantidad: 3 },
  2: { formas: ['normal', 'invertida', 'identidad', 'conmutativa', 'casi'], cantidad: 3 },
  3: { formas: ['invertida', 'conmutativa', 'compensacion', 'encadenada', 'casi'], cantidad: 3 },
  4: { formas: ['compensacion', 'encadenada', 'resta_v', 'resta_f', 'invertida'], cantidad: 3 },
  5: { formas: ['compensacion', 'encadenada', 'resta_v', 'resta_f', 'identidad', 'conmutativa'], cantidad: 4 },
};

const DIAGNOSTICO: Record<FormaVF, CodigoDiagnostico> = {
  normal: 'generico',
  invertida: 'vf_invertida',
  identidad: 'vf_identidad',
  conmutativa: 'vf_conmutativa',
  compensacion: 'vf_compensacion',
  encadenada: 'vf_encadenada',
  casi: 'vf_casi',
  resta_v: 'vf_resta',
  resta_f: 'vf_resta',
};

function mensajePara(forma: FormaVF, a: Afirmacion): string {
  const texto = `${textoExpresion(a.izquierda)} = ${textoExpresion(a.derecha)}`;
  const l = valorExpresion(a.izquierda);
  const r = valorExpresion(a.derecha);
  switch (forma) {
    case 'invertida':
      return `${texto} es verdadera. El signo igual dice que los dos lados valen lo mismo, ¡el resultado puede ir a la izquierda!`;
    case 'identidad':
      return `${texto} es verdadera: un número siempre es igual a sí mismo. La balanza queda en equilibrio.`;
    case 'conmutativa':
      return `${texto} es verdadera: sumar en otro orden da lo mismo. ¡No hacía falta calcular!`;
    case 'compensacion':
      return `${texto} es verdadera: lo que sube un número lo baja el otro. Ambos lados valen ${l}.`;
    case 'encadenada':
      return `${texto} es falsa. El lado izquierdo vale ${l} y el derecho vale ${r}. El signo igual no es "y ahora sigo calculando".`;
    case 'casi':
      return `${texto} es falsa por muy poco: un lado vale ${l} y el otro ${r}.`;
    case 'resta_v':
    case 'resta_f':
      return `En ${texto}, el lado izquierdo vale ${l} y el derecho ${r}: es ${l === r ? 'verdadera' : 'falsa'}.`;
    default:
      return `${texto}: el lado izquierdo vale ${l} y el derecho ${r}.`;
  }
}

export const verdaderoFalso: Mecanica<PublicoVerdaderoFalso, SecretoVerdaderoFalso, boolean[]> = {
  tipo: 'verdadero_falso',
  modo: 'eleccion',
  maxIntentos: 1,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoVerdaderoFalso, SecretoVerdaderoFalso> {
    const { formas, cantidad } = FORMAS_POR_NIVEL[Math.min(Math.max(nivel, 1), 5)] as { formas: FormaVF[]; cantidad: number };
    const verdaderas = formas.filter((f) => VERDADERAS.includes(f));
    const falsas = formas.filter((f) => !VERDADERAS.includes(f));
    // Siempre hay al menos una verdadera y una falsa: "todo verdadero" no funciona.
    const elegidas: FormaVF[] = [azar.elegir(verdaderas), azar.elegir(falsas)];
    while (elegidas.length < cantidad) {
      const candidata = azar.elegir(formas);
      if (elegidas.filter((f) => f === candidata).length < 2) elegidas.push(candidata);
    }
    const orden = azar.barajar(elegidas);
    const afirmaciones = orden.map((f) => construir(f, azar));
    const valores = afirmaciones.map((a) => valorExpresion(a.izquierda) === valorExpresion(a.derecha));
    return {
      tipo: 'verdadero_falso',
      nivel,
      consigna: 'Marca cada igualdad: ¿es verdadera o falsa?',
      voz: 'Lee cada igualdad y decide si es verdadera o falsa. Recuerda: el signo igual significa que los dos lados valen lo mismo.',
      publico: { afirmaciones },
      secreto: { valores, formas: orden },
      relacional: nivel >= 3,
    };
  },

  validarRespuesta(r: unknown, publico): boolean[] | null {
    if (!Array.isArray(r) || r.length !== publico.afirmaciones.length) return null;
    return r.every((v) => typeof v === 'boolean') ? (r as boolean[]) : null;
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    const mal = respuesta.findIndex((v, i) => v !== secreto.valores[i]);
    if (mal === -1) return { correcto: true, mensaje: '¡Todas bien! Eres una mente relacional.', solucion };
    const forma = secreto.formas[mal] as FormaVF;
    const afirmacion = publico.afirmaciones[mal] as Afirmacion;
    return { correcto: false, diagnostico: DIAGNOSTICO[forma], mensaje: mensajePara(forma, afirmacion), solucion };
  },

  solucion(publico, secreto) {
    const lineas = publico.afirmaciones.map(
      (a, i) => `${textoExpresion(a.izquierda)} = ${textoExpresion(a.derecha)} → ${secreto.valores[i] ? 'verdadera' : 'falsa'}`,
    );
    return { simbolico: lineas.join('\n'), explicacion: 'Una igualdad es verdadera si los dos lados valen lo mismo.', respuesta: secreto.valores };
  },

  pistas() {
    return [
      { nivel: 1, texto: 'Para cada igualdad, pregúntate: ¿los dos lados valen lo mismo? El resultado puede estar a cualquier lado.' },
      { nivel: 2, texto: 'Ponemos cada lado en una balanza: si queda derecha, es verdadera.', ayudaVisual: 'convertirACubos' },
      {
        nivel: 3,
        texto: 'Mira estos ejemplos.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: '9 = 4 + 5   y   6 + 2 = 8 + 3',
          pasos: ['9 = 4 + 5: el lado izquierdo vale 9 y el derecho también. ✔ Verdadera', '6 + 2 = 8 + 3: el izquierdo vale 8 y el derecho 11. ✘ Falsa'],
        },
      },
    ];
  },
};
