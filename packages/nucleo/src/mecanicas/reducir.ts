/**
 * "Globos y sacos" — reducir expresiones reuniendo términos semejantes.
 * OA MA07-7: reducir expresiones algebraicas, reuniendo términos semejantes
 * para obtener expresiones de la forma ax + by + cz (a, b, c ∈ Z).
 *
 * Representación pictórica: cada x, y, z positiva es un saco que pesa; cada
 * término negativo es un globo que tira hacia arriba. Un saco y un globo de la
 * misma letra se anulan (par cero). Errores típicos (Booth, 1984; Kieran,
 * 1992): juntar términos no semejantes (3x + 2y = 5xy), ignorar el signo
 * menos y equivocar el signo del resultado.
 */

import type { Azar } from '../azar';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export interface TerminoAlgebraico {
  coef: number;
  /** "" para un término constante. */
  variable: string;
}

export interface PublicoReducir {
  terminos: TerminoAlgebraico[];
  variables: string[];
  conConstante: boolean;
  /** Se dibujan sacos y globos (coeficientes chicos). */
  pictorico: boolean;
}

export interface SecretoReducir {
  coefs: number[];
  constante: number;
}

export interface RespuestaReducir {
  coefs: number[];
  constante?: number;
}

export function textoTermino(t: TerminoAlgebraico, primero: boolean): string {
  const abs = Math.abs(t.coef);
  const cuerpo = t.variable === '' ? String(abs) : abs === 1 ? t.variable : `${abs}${t.variable}`;
  if (primero) return t.coef < 0 ? `−${cuerpo}` : cuerpo;
  return `${t.coef < 0 ? '−' : '+'} ${cuerpo}`;
}

export const textoAlgebraico = (ts: TerminoAlgebraico[]): string => ts.map((t, i) => textoTermino(t, i === 0)).join(' ');

export function textoReducida(variables: string[], coefs: number[], constante: number, conConstante: boolean): string {
  const ts: TerminoAlgebraico[] = variables.map((v, i) => ({ coef: coefs[i]!, variable: v })).filter((t) => t.coef !== 0);
  if (conConstante && constante !== 0) ts.push({ coef: constante, variable: '' });
  return ts.length === 0 ? '0' : textoAlgebraico(ts);
}

function coeficiente(azar: Azar, max: number, negativos: boolean): number {
  const v = azar.entero(1, max);
  return negativos && azar.probabilidad(0.4) ? -v : v;
}

export const reducir: Mecanica<PublicoReducir, SecretoReducir, RespuestaReducir> = {
  tipo: 'reducir',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoReducir, SecretoReducir> {
    const cfg = [
      { variables: ['x', 'y'], cantidad: 4, max: 5, negativos: false, constante: false },
      { variables: ['x', 'y'], cantidad: 5, max: 5, negativos: true, constante: false },
      { variables: ['x', 'y', 'z'], cantidad: 6, max: 5, negativos: true, constante: false },
      { variables: ['x', 'y'], cantidad: 6, max: 9, negativos: true, constante: true },
      { variables: ['x', 'y', 'z'], cantidad: 7, max: 12, negativos: true, constante: true },
    ][nivel - 1]!;
    for (let intento = 0; intento < 500; intento++) {
      const lista = [...cfg.variables, ...(cfg.constante ? [''] : [])];
      // Cada letra (y la constante) aparece al menos dos veces: siempre hay algo que reunir.
      const variablesTerminos = [...lista, ...lista];
      while (variablesTerminos.length < cfg.cantidad) variablesTerminos.push(azar.elegir(lista));
      const terminos = azar.barajar(variablesTerminos.slice(0, Math.max(cfg.cantidad, variablesTerminos.length))).map((v) => ({
        variable: v,
        coef: coeficiente(azar, cfg.max, cfg.negativos),
      }));
      // No empezar con dos términos de la misma letra seguidos (sería demasiado directo).
      if (terminos.some((t, i) => i > 0 && t.variable === terminos[i - 1]!.variable)) continue;
      const coefs = cfg.variables.map((v) => terminos.filter((t) => t.variable === v).reduce((s, t) => s + t.coef, 0));
      const constante = terminos.filter((t) => t.variable === '').reduce((s, t) => s + t.coef, 0);
      if (nivel >= 2 && !coefs.some((c) => c < 0) && !terminos.some((t) => t.coef < 0)) continue;
      const publico: PublicoReducir = { terminos, variables: cfg.variables, conConstante: cfg.constante, pictorico: nivel <= 3 };
      const texto = textoAlgebraico(terminos);
      return {
        tipo: 'reducir',
        nivel,
        consigna: 'Reduce la expresión: reúne los términos semejantes.',
        voz: `Reduce la expresión ${texto}. Junta las ${cfg.variables.join(', ')}${cfg.constante ? ' y los números solos' : ''}. Recuerda: un globo anula un saco.`,
        publico,
        secreto: { coefs, constante },
      };
    }
    throw new Error('No se pudo generar la expresión');
  },

  validarRespuesta(r: unknown, publico): RespuestaReducir | null {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    const { coefs, constante } = r as Record<string, unknown>;
    if (!Array.isArray(coefs) || coefs.length !== publico.variables.length || !coefs.every((c) => esEnteroEn(c, -999, 999))) return null;
    if (publico.conConstante) {
      if (!esEnteroEn(constante, -999, 999)) return null;
      return { coefs: coefs as number[], constante };
    }
    if (constante !== undefined) return null;
    return { coefs: coefs as number[] };
  },

  evaluar(publico, secreto, r) {
    const solucion = this.solucion(publico, secreto);
    const constanteBien = !publico.conConstante || r.constante === secreto.constante;
    const coefsBien = r.coefs.every((c, i) => c === secreto.coefs[i]);
    if (coefsBien && constanteBien) {
      return { correcto: true, mensaje: `¡Reducida! ${solucion.simbolico}`, solucion };
    }
    const todas = [...publico.variables, ...(publico.conConstante ? [''] : [])];
    const correctas = [...secreto.coefs, ...(publico.conConstante ? [secreto.constante] : [])];
    const dadas = [...r.coefs, ...(publico.conConstante ? [r.constante ?? 0] : [])];
    const sumaAbs = todas.map((v) => publico.terminos.filter((t) => t.variable === v).reduce((s, t) => s + Math.abs(t.coef), 0));
    const malas = todas.map((_, i) => i).filter((i) => dadas[i] !== correctas[i]);
    const nombre = (i: number) => (todas[i] === '' ? 'los números solos' : `las ${todas[i]}`);

    const total = publico.terminos.reduce((s, t) => s + t.coef, 0);
    if (dadas.filter((d) => d !== 0).length === 1 && dadas.reduce((s, d) => s + d, 0) === total && todas.length > 1) {
      return {
        correcto: false,
        diagnostico: 'reducir_mezcla',
        mensaje: `Juntaste términos que NO son semejantes. Un saco x y un saco y son distintos: solo se reúnen las mismas letras.`,
        solucion,
      };
    }
    if (malas.some((i) => dadas[i] === sumaAbs[i] && sumaAbs[i] !== correctas[i])) {
      const i = malas.find((k) => dadas[k] === sumaAbs[k])!;
      return {
        correcto: false,
        diagnostico: 'reducir_signo',
        mensaje: `En ${nombre(i)} sumaste todo, pero los términos con "−" son globos: restan. Cada globo anula un saco.`,
        solucion,
      };
    }
    if (malas.some((i) => dadas[i] === -correctas[i]!)) {
      const i = malas.find((k) => dadas[k] === -correctas[k]!)!;
      return {
        correcto: false,
        diagnostico: 'reducir_signo_resultado',
        mensaje: `En ${nombre(i)} el número está bien, pero el signo no: ¿hay más sacos o más globos?`,
        solucion,
      };
    }
    return {
      correcto: false,
      diagnostico: 'generico',
      mensaje: `Revisa ${malas.map(nombre).join(' y ')}: agrupa los términos de la misma letra y súmalos con su signo.`,
      solucion,
    };
  },

  solucion(publico, secreto) {
    const reducida = textoReducida(publico.variables, secreto.coefs, secreto.constante, publico.conConstante);
    const detalle = publico.variables
      .map((v, i) => {
        const ts = publico.terminos.filter((t) => t.variable === v);
        return `${textoAlgebraico(ts)} = ${textoReducida([v], [secreto.coefs[i]!], 0, false)}`;
      })
      .join(';  ');
    return {
      simbolico: `${textoAlgebraico(publico.terminos)} = ${reducida}`,
      explicacion: `Se reúnen las mismas letras: ${detalle}.`,
      respuesta: publico.conConstante ? { coefs: secreto.coefs, constante: secreto.constante } : { coefs: secreto.coefs },
    };
  },

  pistas(publico, secreto) {
    const v = publico.variables[0]!;
    const ts = publico.terminos.filter((t) => t.variable === v);
    return [
      { nivel: 1, texto: `Solo se juntan términos con la misma letra. Empieza por las ${v}: ${textoAlgebraico(ts)}.` },
      {
        nivel: 2,
        texto: `Ordena por letra: ${publico.variables.map((x) => textoAlgebraico(publico.terminos.filter((t) => t.variable === x))).join('  |  ')}${publico.conConstante ? `  |  ${textoAlgebraico(publico.terminos.filter((t) => t.variable === ''))}` : ''}. Las ${v} dan ${secreto.coefs[0]}.`,
        ayudaVisual: 'resaltarNucleo',
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: { texto: '4x − y − 6x + 3y', pasos: ['Las x: 4x − 6x = −2x (4 sacos y 6 globos: sobran 2 globos).', 'Las y: −y + 3y = 2y.', 'Resultado: −2x + 2y.'] },
      },
    ];
  },
};
