/**
 * "Collares de frutas" — patrones repetitivos.
 * OA MA01-11: reconocer, describir, crear y continuar patrones repetitivos.
 *
 * Error típico (ReFIP / Bojorque y Gonzales 2021): no identificar la unidad
 * que se repite. Por eso hay preguntas de "¿qué grupo se repite?" y de
 * posiciones lejanas, que no se resuelven copiando el último elemento.
 */

import type { Azar } from '../azar';
import type { Figura } from '../tipos';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export const FIGURAS: readonly Figura[] = ['manzana', 'pera', 'uva', 'platano', 'naranja', 'frutilla', 'flor', 'hoja'];

export const NOMBRE_FIGURA: Record<Figura, string> = {
  manzana: 'manzana',
  pera: 'pera',
  uva: 'uva',
  platano: 'plátano',
  naranja: 'naranja',
  frutilla: 'frutilla',
  flor: 'flor',
  hoja: 'hoja',
};

export type ModoPatronFiguras = 'siguiente' | 'faltante' | 'nucleo' | 'posicion';

export interface PublicoPatronFiguras {
  modo: ModoPatronFiguras;
  secuencia: (Figura | null)[];
  /** Opciones: una figura cada una, o un grupo de figuras (modo núcleo). */
  opciones: Figura[][];
  /** Posición (desde 1) por la que se pregunta en modo "posicion". */
  posicion?: number;
}

export interface SecretoPatronFiguras {
  nucleo: Figura[];
  correcta: number;
  /** Tipo de cada opción incorrecta, para diagnosticar. */
  tipoOpcion: ('correcta' | 'corto' | 'largo' | 'ultimo' | 'vecino' | 'otra')[];
}

/** Estructuras de núcleo: cada letra es una figura distinta. */
const ESTRUCTURAS: Record<string, number[]> = {
  AB: [0, 1],
  AAB: [0, 0, 1],
  ABB: [0, 1, 1],
  ABC: [0, 1, 2],
  AABB: [0, 0, 1, 1],
  ABCD: [0, 1, 2, 3],
};

function crearNucleo(estructura: string, azar: Azar): Figura[] {
  const forma = ESTRUCTURAS[estructura] as number[];
  const distintas = Math.max(...forma) + 1;
  const figuras = azar.barajar(FIGURAS).slice(0, distintas);
  return forma.map((i) => figuras[i] as Figura);
}

const repetir = (nucleo: Figura[], largo: number): Figura[] => Array.from({ length: largo }, (_, i) => nucleo[i % nucleo.length] as Figura);

const nombres = (figs: readonly Figura[]): string => figs.map((f) => NOMBRE_FIGURA[f]).join(', ');

/** Opciones de una figura: las del núcleo más una distractora. */
function opcionesSimples(
  nucleo: Figura[],
  correcta: Figura,
  azar: Azar,
  ultima: Figura | null,
  vecinas: Figura[],
): { opciones: Figura[][]; correcta: number; tipoOpcion: SecretoPatronFiguras['tipoOpcion'] } {
  const distintas = [...new Set(nucleo)];
  const fuera = azar.elegir(FIGURAS.filter((f) => !distintas.includes(f)));
  const lista = azar.barajar([...distintas, fuera]);
  const tipoOpcion = lista.map((f) => {
    if (f === correcta) return 'correcta' as const;
    if (ultima !== null && f === ultima) return 'ultimo' as const;
    if (vecinas.includes(f)) return 'vecino' as const;
    return 'otra' as const;
  });
  return { opciones: lista.map((f) => [f]), correcta: lista.indexOf(correcta), tipoOpcion };
}

export const patronFiguras: Mecanica<PublicoPatronFiguras, SecretoPatronFiguras, number> = {
  tipo: 'patron_figuras',
  modo: 'eleccion',
  maxIntentos: 1,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoPatronFiguras, SecretoPatronFiguras> {
    switch (nivel) {
      case 1:
      case 2: {
        const estructura = nivel === 1 ? 'AB' : azar.elegir(['AAB', 'ABB', 'ABC']);
        const nucleo = crearNucleo(estructura, azar);
        const largo = nivel === 1 ? 6 : azar.entero(nucleo.length * 2, nucleo.length * 2 + 2);
        const secuencia = repetir(nucleo, largo);
        const correctaFig = nucleo[largo % nucleo.length] as Figura;
        const { opciones, correcta, tipoOpcion } = opcionesSimples(nucleo, correctaFig, azar, secuencia[largo - 1] as Figura, []);
        return {
          tipo: 'patron_figuras',
          nivel,
          consigna: '¿Qué fruta sigue en el collar?',
          voz: `Mira el collar: ${nombres(secuencia)}. ¿Qué fruta sigue?`,
          publico: { modo: 'siguiente', secuencia: [...secuencia, null], opciones },
          secreto: { nucleo, correcta, tipoOpcion },
        };
      }
      case 3: {
        const estructura = azar.elegir(['AB', 'ABC', 'AAB', 'ABB']);
        const nucleo = crearNucleo(estructura, azar);
        const largo = nucleo.length * 3;
        const completa = repetir(nucleo, largo);
        const hueco = azar.entero(2, largo - 2);
        const correctaFig = completa[hueco] as Figura;
        const secuencia: (Figura | null)[] = completa.map((f, i) => (i === hueco ? null : f));
        const vecinas = [completa[hueco - 1], completa[hueco + 1]].filter((f): f is Figura => f !== undefined && f !== correctaFig);
        const { opciones, correcta, tipoOpcion } = opcionesSimples(nucleo, correctaFig, azar, null, vecinas);
        return {
          tipo: 'patron_figuras',
          nivel,
          consigna: 'Al collar se le cayó una fruta. ¿Cuál falta?',
          voz: '¡Al collar se le cayó una fruta! Mira el patrón y descubre qué fruta falta en el espacio vacío.',
          publico: { modo: 'faltante', secuencia, opciones },
          secreto: { nucleo, correcta, tipoOpcion },
        };
      }
      case 4: {
        const estructura = azar.elegir(['AAB', 'ABB', 'ABC', 'AABB']);
        const nucleo = crearNucleo(estructura, azar);
        const secuencia = repetir(nucleo, nucleo.length * 3);
        const corto = nucleo.slice(0, -1);
        const largo = [...nucleo, nucleo[0] as Figura];
        const grupos: [Figura[], 'correcta' | 'corto' | 'largo'][] = azar.barajar([
          [nucleo, 'correcta'],
          [corto, 'corto'],
          [largo, 'largo'],
        ]);
        return {
          tipo: 'patron_figuras',
          nivel,
          consigna: '¿Qué grupo de frutas se repite una y otra vez?',
          voz: `Mira el collar: ${nombres(secuencia)}. ¿Cuál es el grupo que se repite?`,
          publico: { modo: 'nucleo', secuencia, opciones: grupos.map(([g]) => g) },
          secreto: { nucleo, correcta: grupos.findIndex(([, t]) => t === 'correcta'), tipoOpcion: grupos.map(([, t]) => t) },
        };
      }
      default: {
        const estructura = azar.elegir(['AB', 'ABC', 'AAB', 'ABB', 'AABB']);
        const nucleo = crearNucleo(estructura, azar);
        const visibles = nucleo.length * 2;
        const posicion = azar.entero(visibles + 3, Math.min(visibles + 9, 16));
        const correctaFig = nucleo[(posicion - 1) % nucleo.length] as Figura;
        const secuencia: (Figura | null)[] = [...repetir(nucleo, visibles), ...Array<null>(posicion - visibles).fill(null)];
        const antes = nucleo[(posicion - 2) % nucleo.length] as Figura;
        const despues = nucleo[posicion % nucleo.length] as Figura;
        const vecinas = [antes, despues].filter((f) => f !== correctaFig);
        const { opciones, correcta, tipoOpcion } = opcionesSimples(nucleo, correctaFig, azar, null, vecinas);
        return {
          tipo: 'patron_figuras',
          nivel,
          consigna: `Si el collar sigue igual, ¿qué fruta irá en el lugar ${posicion}?`,
          voz: `El collar sigue con el mismo patrón. ¿Qué fruta irá en el lugar número ${posicion}?`,
          publico: { modo: 'posicion', secuencia, opciones, posicion },
          secreto: { nucleo, correcta, tipoOpcion },
        };
      }
    }
  },

  validarRespuesta(r: unknown, publico): number | null {
    return esEnteroEn(r, 0, publico.opciones.length - 1) ? r : null;
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    if (respuesta === secreto.correcta) {
      return { correcto: true, mensaje: `¡Sí! El grupo que se repite es: ${nombres(secreto.nucleo)}.`, solucion };
    }
    const tipo = secreto.tipoOpcion[respuesta];
    switch (tipo) {
      case 'corto':
        return {
          correcto: false,
          diagnostico: 'patron_nucleo_corto',
          mensaje: 'A ese grupo le falta una fruta. Si lo repites, ¿se forma el mismo collar?',
          solucion,
        };
      case 'largo':
        return {
          correcto: false,
          diagnostico: 'patron_nucleo_largo',
          mensaje: 'Ese grupo tiene una fruta de más. Busca el grupo más pequeño que se repite.',
          solucion,
        };
      case 'ultimo':
        return {
          correcto: false,
          diagnostico: 'patron_repite_ultimo',
          mensaje: 'No siempre se repite la última fruta. Busca el grupo que se repite y sigue su orden.',
          solucion,
        };
      case 'vecino':
        return {
          correcto: false,
          diagnostico: 'patron_posicion',
          mensaje: '¡Casi! Esa fruta está justo al lado. Cuenta con cuidado los lugares usando el grupo que se repite.',
          solucion,
        };
      default:
        return {
          correcto: false,
          diagnostico: 'generico',
          mensaje: 'Esa fruta no está en el grupo que se repite. Mira el collar desde el principio.',
          solucion,
        };
    }
  },

  solucion(publico, secreto) {
    const correcta = publico.opciones[secreto.correcta] ?? [];
    const extra =
      publico.modo === 'posicion'
        ? ` El grupo tiene ${secreto.nucleo.length} frutas: se repite cada ${secreto.nucleo.length} lugares.`
        : '';
    return {
      simbolico: nombres(correcta),
      explicacion: `El grupo que se repite es: ${nombres(secreto.nucleo)}.${extra}`,
      respuesta: secreto.correcta,
    };
  },

  pistas(publico, secreto) {
    const k = secreto.nucleo.length;
    const texto3 =
      publico.modo === 'posicion'
        ? {
            texto: 'Ejemplo: en el collar manzana, pera, manzana, pera…',
            pasos: [
              'El grupo que se repite es manzana, pera (2 frutas).',
              'Los lugares 1, 3, 5, 7, 9… son manzana.',
              'Los lugares 2, 4, 6, 8, 10… son pera.',
            ],
          }
        : {
            texto: 'Ejemplo: uva, uva, flor, uva, uva, flor…',
            pasos: ['El grupo que se repite es: uva, uva, flor.', 'Después de flor vuelve a empezar: uva.'],
          };
    return [
      { nivel: 1, texto: 'Lee el collar en voz alta desde el principio. ¿Cuándo vuelve a empezar?' },
      { nivel: 2, texto: `Marcamos el grupo que se repite. Tiene ${k} frutas.`, ayudaVisual: 'resaltarNucleo', valor: k },
      { nivel: 3, texto: 'Mira este ejemplo parecido.', ayudaVisual: 'ejemplo', ejemplo: texto3 },
    ];
  },
};
