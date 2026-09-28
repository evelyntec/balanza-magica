/**
 * "El cuaderno de Gatito" — registrar simbólicamente una balanza en equilibrio.
 * OA MA01-12: describir y registrar la igualdad (…) en forma concreta,
 * pictórica y simbólica del 0 al 20, usando el símbolo igual (=).
 *
 * Incluye a propósito igualdades como 8 = 5 + 3 o 6 = 6, que desafían la
 * idea de que "=" significa "ahora escribe el resultado".
 */

import type { Azar } from '../azar';
import { objetosDesde, pesoPlatillo, vozPlatillo } from '../balanza';
import type { Objeto } from '../tipos';
import { arregloDeEnteros, descomponer, type ItemGenerado, type Mecanica } from './mecanica';

export interface PublicoRegistrar {
  izquierda: Objeto[];
  derecha: Objeto[];
}

export interface SecretoRegistrar {
  izquierda: number[];
  derecha: number[];
}

export interface RespuestaRegistrar {
  izquierda: number[];
  derecha: number[];
}

function grupos(nivel: number, azar: Azar): [number[], number[]] {
  switch (nivel) {
    case 1: {
      const a = azar.entero(2, 10);
      return [[a], [a]];
    }
    case 2: {
      const c = azar.entero(3, 10);
      return [descomponer(c, 2, azar), [c]];
    }
    case 3: {
      const c = azar.entero(6, 20);
      return [[c], descomponer(c, 2, azar)];
    }
    case 4: {
      const t = azar.entero(6, 20);
      const izq = descomponer(t, 2, azar);
      let der = descomponer(t, 2, azar);
      let guardia = 0;
      while (guardia++ < 20 && [...der].sort().join() === [...izq].sort().join()) der = descomponer(t, 2, azar);
      return azar.probabilidad(0.5) ? [izq, der] : [der, izq];
    }
    default: {
      const t = azar.entero(9, 20);
      const izq = descomponer(t, 3, azar);
      const der = azar.probabilidad(0.5) ? descomponer(t, 2, azar) : [t];
      return azar.probabilidad(0.5) ? [izq, der] : [der, izq];
    }
  }
}

const texto = (valores: readonly number[]): string => valores.join(' + ');

export const registrar: Mecanica<PublicoRegistrar, SecretoRegistrar, RespuestaRegistrar> = {
  tipo: 'registrar',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoRegistrar, SecretoRegistrar> {
    const [izq, der] = grupos(nivel, azar);
    // Colores distintos por grupo, continuando entre platillos.
    const izquierda = objetosDesde(izq, 'cubos');
    const derecha = objetosDesde(der, 'cubos').map((o, i) => (o.tipo === 'cubos' ? { ...o, color: izq.length + i } : o));
    return {
      tipo: 'registrar',
      nivel,
      consigna: 'La balanza está en equilibrio. Escribe con números lo que ves.',
      voz:
        `La balanza está en equilibrio. En el platillo izquierdo hay ${vozPlatillo(izquierda)}. ` +
        `En el platillo derecho hay ${vozPlatillo(derecha)}. Cada color es un grupo. Escribe los números en el cuaderno de Gatito.`,
      publico: { izquierda, derecha },
      secreto: { izquierda: izq, derecha: der },
    };
  },

  validarRespuesta(r: unknown, publico): RespuestaRegistrar | null {
    if (typeof r !== 'object' || r === null) return null;
    const { izquierda, derecha } = r as Record<string, unknown>;
    const izq = arregloDeEnteros(izquierda, publico.izquierda.length, 0, 20);
    const der = arregloDeEnteros(derecha, publico.derecha.length, 0, 20);
    return izq && der ? { izquierda: izq, derecha: der } : null;
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    const igual = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);
    if (igual(respuesta.izquierda, secreto.izquierda) && igual(respuesta.derecha, secreto.derecha)) {
      return { correcto: true, mensaje: `¡Perfecto! ${solucion.simbolico}. Los dos lados pesan lo mismo.`, solucion };
    }
    if (
      secreto.izquierda.length === secreto.derecha.length &&
      igual(respuesta.izquierda, secreto.derecha) &&
      igual(respuesta.derecha, secreto.izquierda)
    ) {
      return {
        correcto: false,
        diagnostico: 'lados_invertidos',
        mensaje: 'Escribiste los lados al revés. Lo de la izquierda del cuaderno va con el platillo izquierdo.',
        solucion,
      };
    }
    const todos = [...respuesta.izquierda, ...respuesta.derecha];
    const correctos = [...secreto.izquierda, ...secreto.derecha];
    const cerca = todos.every((v, i) => Math.abs(v - (correctos[i] ?? 0)) <= 1);
    if (cerca) {
      return {
        correcto: false,
        diagnostico: 'conteo',
        mensaje: '¡Casi! Algún grupo tiene un cubo más o uno menos. Cuenta tocando cada cubo una sola vez.',
        solucion,
      };
    }
    const sumaIzq = respuesta.izquierda.reduce((s, v) => s + v, 0);
    const sumaDer = respuesta.derecha.reduce((s, v) => s + v, 0);
    return {
      correcto: false,
      diagnostico: 'generico',
      mensaje:
        sumaIzq !== sumaDer
          ? `Lo que escribiste no está en equilibrio: ${texto(respuesta.izquierda)} no es igual a ${texto(respuesta.derecha)}. Cuenta otra vez cada grupo.`
          : 'Cuenta otra vez los cubos de cada color.',
      solucion,
    };
  },

  solucion(publico, secreto) {
    const total = pesoPlatillo(publico.izquierda);
    return {
      simbolico: `${texto(secreto.izquierda)} = ${texto(secreto.derecha)}`,
      explicacion: `Cada platillo pesa ${total}. Por eso escribimos el signo igual.`,
      respuesta: secreto,
    };
  },

  pistas() {
    return [
      { nivel: 1, texto: 'Cada color es un grupo. Cuenta los cubos de un color, tocando cada cubo una sola vez.' },
      { nivel: 2, texto: 'Los cubos están en torres de 5. Cuenta de a 5 y luego los que sobran.', ayudaVisual: 'agrupar5' },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: 'A la izquierda hay 6 cubos rojos. A la derecha hay 4 azules y 2 amarillos.',
          pasos: ['Izquierda: 6', 'Derecha: 4 + 2', 'Escribimos: 6 = 4 + 2'],
        },
      },
    ];
  },
};
