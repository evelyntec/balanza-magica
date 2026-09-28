/**
 * "Rectas del castillo" — la función afín f(x) = mx + n.
 * OA MA08-10: generalizar la función afín como la suma de una constante con
 * una función lineal; trasladar funciones lineales en el plano; determinar el
 * cambio constante de un intervalo a otro; relacionarla con el interés
 * simple; resolver problemas.
 *
 * Se lee la regla desde un gráfico, desde una tabla con saltos distintos de 1
 * (el cambio constante es Δy ÷ Δx), desde la traslación de una lineal o desde
 * una situación de interés simple. Errores típicos (Leinhardt, Zaslavsky y
 * Stein, 1990): usar Δy como pendiente sin dividir por Δx, equivocar el signo
 * de la pendiente y confundir el primer valor de la tabla con f(0).
 */

import type { Azar } from '../azar';
import { lineal, num, numP } from './lineal';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export type ModoAfin = 'grafico' | 'tabla' | 'traslacion' | 'interes';

export interface PublicoAfin {
  modo: ModoAfin;
  /** Dos puntos marcados sobre la recta (gráfico y traslación). */
  puntos?: [number, number][];
  ventana?: { xmin: number; xmax: number; ymin: number; ymax: number };
  /** Pendiente de la función lineal que se traslada. */
  base?: number;
  tabla?: { x: number; y: number }[];
  contexto?: string;
  columnas?: [string, string];
  evaluarEn?: number;
}

export interface SecretoAfin {
  m: number;
  n: number;
  resultado?: number;
}

export interface RespuestaAfin {
  m: number;
  n: number;
  resultado?: number;
}

function ventanaPara(puntos: [number, number][], m: number, n: number, xmin: number, xmax: number) {
  const ys = [m * xmin + n, m * xmax + n, 0, ...puntos.map(([, y]) => y)];
  const ymin = Math.min(...ys, -1);
  const ymax = Math.max(...ys, 1);
  return { xmin, xmax, ymin: Math.floor(ymin - 1), ymax: Math.ceil(ymax + 1) };
}

export const afin: Mecanica<PublicoAfin, SecretoAfin, RespuestaAfin> = {
  tipo: 'afin',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoAfin, SecretoAfin> {
    const modo: ModoAfin =
      nivel === 1 || nivel === 3 ? 'grafico' : nivel === 2 ? 'tabla' : nivel === 4 ? azar.elegir(['traslacion', 'interes'] as const) : azar.elegir(['grafico', 'tabla', 'interes'] as const);
    let m: number;
    let n: number;
    const publico: PublicoAfin = { modo };
    if (modo === 'interes') {
      const capital = azar.entero(10, 100) * 1000;
      const tasa = azar.entero(1, 5);
      m = (capital * tasa) / 100;
      n = capital;
      const meses = azar.entero(6, 24);
      publico.contexto = `Gatito deposita $${capital} en el banco del castillo con un ${tasa}% de interés simple mensual: cada mes gana el ${tasa}% del dinero que depositó.`;
      publico.columnas = ['Meses (t)', 'Dinero ($)'];
      publico.tabla = [0, 1, 2].map((t) => ({ x: t, y: n + m * t }));
      publico.evaluarEn = meses;
      return {
        tipo: 'afin',
        nivel,
        consigna: `Escribe la función del dinero según los meses y calcula cuánto habrá a los ${meses} meses.`,
        voz: `${publico.contexto} Escribe la función f de t y calcula cuánto dinero habrá a los ${meses} meses.`,
        publico,
        secreto: { m, n, resultado: n + m * meses },
      };
    }
    if (modo === 'tabla') {
      m = nivel === 2 ? azar.entero(2, 6) : azar.elegir([-5, -4, -3, -2, 2, 3, 4, 5]);
      n = nivel === 2 ? azar.entero(1, 12) : azar.entero(-12, 12);
      const paso = azar.entero(2, 3);
      const inicio = nivel === 2 ? azar.entero(1, 3) : azar.entero(-4, 2);
      // Saltos distintos de 1 (y uno irregular): el cambio constante es Δy ÷ Δx. La tabla no incluye x = 0.
      const xs = [inicio, inicio + paso, inicio + 2 * paso, inicio + 4 * paso].filter((x) => x !== 0);
      if (xs.length < 4) xs.push(inicio + 5 * paso);
      publico.tabla = xs.map((x) => ({ x, y: m * x + n }));
      publico.columnas = ['x', 'f(x)'];
      if (nivel === 5) publico.evaluarEn = azar.elegir([-10, 10, 15, 20]);
    } else {
      m = nivel === 1 ? azar.entero(1, 3) : azar.elegir([-3, -2, -1, 1, 2, 3]);
      n = nivel === 1 ? azar.entero(1, 5) : azar.entero(-6, 6);
      if (modo === 'traslacion' && n === 0) n = 3;
      const xmin = nivel === 1 ? 0 : -6;
      const xmax = 6;
      // Dos puntos enteros de la recta (en el nivel 1 uno de ellos puede ser el corte con el eje y).
      const opciones = Array.from({ length: xmax - xmin + 1 }, (_, i) => xmin + i).filter((x) => nivel === 1 || x !== 0);
      const [x1, x2] = azar.barajar(opciones).slice(0, 2).sort((a, b) => a - b) as [number, number];
      publico.puntos = [
        [x1, m * x1 + n],
        [x2, m * x2 + n],
      ];
      publico.ventana = ventanaPara(publico.puntos, m, n, xmin, xmax);
      if (modo === 'traslacion') publico.base = m;
      if (nivel === 5) publico.evaluarEn = azar.elegir([-10, 10, 20]);
    }
    const secreto: SecretoAfin = { m, n };
    if (publico.evaluarEn !== undefined) secreto.resultado = m * publico.evaluarEn + n;
    const consigna =
      modo === 'traslacion'
        ? `La recta punteada es y = ${lineal(m, 0, 'x')}. La recta sólida es la misma, trasladada. Escribe su función.`
        : `Escribe la función afín f(x) = mx + n${publico.evaluarEn !== undefined ? ` y calcula f(${num(publico.evaluarEn)})` : ''}.`;
    return {
      tipo: 'afin',
      nivel,
      consigna,
      voz: `${consigna} Recuerda: m es el cambio constante y n es el valor cuando x es cero.`,
      publico,
      secreto,
    };
  },

  validarRespuesta(r: unknown, publico): RespuestaAfin | null {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    const { m, n, resultado } = r as Record<string, unknown>;
    if (!esEnteroEn(m, -99999, 99999) || !esEnteroEn(n, -999999, 999999)) return null;
    if (publico.evaluarEn !== undefined) {
      if (!esEnteroEn(resultado, -9999999, 9999999)) return null;
      return { m, n, resultado };
    }
    if (resultado !== undefined) return null;
    return { m, n };
  },

  evaluar(publico, secreto, r) {
    const solucion = this.solucion(publico, secreto);
    const funcionBien = r.m === secreto.m && r.n === secreto.n;
    const valorBien = secreto.resultado === undefined || r.resultado === secreto.resultado;
    const f = `f(x) = ${lineal(secreto.m, secreto.n, 'x')}`;
    if (funcionBien && valorBien) {
      return {
        correcto: true,
        mensaje: `¡Exacto! ${f}: cambia ${num(secreto.m)} por cada unidad y parte en ${num(secreto.n)}.${secreto.resultado !== undefined ? ` Con ${num(publico.evaluarEn!)}: ${num(secreto.resultado)}.` : ''}`,
        solucion,
      };
    }
    if (funcionBien) {
      return { correcto: false, diagnostico: 'formula_evaluacion', mensaje: `La función está bien; revisa el cálculo: ${secreto.m} · ${numP(publico.evaluarEn!)} ${secreto.n < 0 ? '−' : '+'} ${Math.abs(secreto.n)}.`, solucion };
    }
    const t = publico.tabla;
    if (publico.modo === 'tabla' && t && t.length >= 2) {
      const dx = t[1]!.x - t[0]!.x;
      if (r.m === secreto.m * dx && dx !== 1) {
        return {
          correcto: false,
          diagnostico: 'afin_pendiente_paso',
          mensaje: `Ese es el cambio cuando x aumenta ${dx}, no 1. El cambio constante es Δy ÷ Δx = ${num(secreto.m * dx)} ÷ ${dx}.`,
          solucion,
        };
      }
    }
    if (r.m === -secreto.m && secreto.m !== 0) {
      return { correcto: false, diagnostico: 'afin_signo', mensaje: `Si al avanzar hacia la derecha la recta ${secreto.m > 0 ? 'sube' : 'baja'}, la pendiente es ${secreto.m > 0 ? 'positiva' : 'negativa'}.`, solucion };
    }
    if (r.m === secreto.m) {
      const primero = t?.[0]?.y ?? publico.puntos?.[0]?.[1];
      if (r.n === 0 && secreto.n !== 0) return { correcto: false, diagnostico: 'formula_proporcional', mensaje: `No es proporcional: la recta no pasa por el origen. ¿Cuánto vale f(0)?`, solucion };
      return {
        correcto: false,
        diagnostico: 'afin_intercepto',
        mensaje: `La pendiente está bien. n es el valor cuando x = 0${primero !== undefined && r.n === primero ? ', no el primer valor que aparece' : ''}: retrocede hasta x = 0.`,
        solucion,
      };
    }
    return { correcto: false, diagnostico: 'generico', mensaje: 'Calcula el cambio constante (Δy ÷ Δx) entre dos puntos y después el valor en x = 0.', solucion };
  },

  solucion(publico, secreto) {
    return {
      simbolico: `f(x) = ${lineal(secreto.m, secreto.n, 'x')}${secreto.resultado !== undefined ? `;  f(${num(publico.evaluarEn!)}) = ${num(secreto.resultado)}` : ''}`,
      explicacion:
        publico.modo === 'interes'
          ? `Cada mes se ganan $${secreto.m} (el interés) y se parte con $${secreto.n} (el capital).`
          : publico.modo === 'traslacion'
            ? `Es y = ${lineal(secreto.m, 0, 'x')} trasladada ${Math.abs(secreto.n)} ${secreto.n > 0 ? 'hacia arriba' : 'hacia abajo'}: se suma ${num(secreto.n)}.`
            : `Pendiente ${num(secreto.m)} (cambio por cada unidad de x) y coeficiente de posición ${num(secreto.n)} (f(0)).`,
      respuesta: { m: secreto.m, n: secreto.n, ...(secreto.resultado !== undefined ? { resultado: secreto.resultado } : {}) },
    };
  },

  pistas(publico, secreto) {
    return [
      { nivel: 1, texto: 'm es cuánto cambia y cuando x aumenta en 1 (Δy ÷ Δx). n es el valor de y cuando x = 0.' },
      {
        nivel: 2,
        texto:
          publico.modo === 'interes'
            ? `Cada mes el dinero aumenta en $${secreto.m}. Al inicio (t = 0) hay $${secreto.n}.`
            : `La pendiente es ${num(secreto.m)}. Ahora busca dónde la recta corta al eje y.`,
        ayudaVisual: 'mostrarSaltos',
        valor: secreto.m,
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: { texto: 'x: 1 → 7, 3 → 13', pasos: ['Δy ÷ Δx = (13 − 7) ÷ (3 − 1) = 3: m = 3.', 'Retrocedemos a x = 0: 7 − 3 = 4: n = 4.', 'f(x) = 3x + 4.'] },
      },
    ];
  },
};
