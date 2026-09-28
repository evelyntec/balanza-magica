/**
 * "Huellas en la arena" y "Torres de palitos" — descubrir la regla de una
 * sucesión y usarla para PREDECIR.
 * OA MA05-14: descubrir alguna regla que explique una sucesión dada y que
 * permita hacer predicciones.
 *
 * Se pregunta por términos lejanos (la posición 40), por la posición de un
 * número y por sucesiones no lineales, de modo que seguir contando de a uno
 * no alcanza: hay que pasar de la regla recursiva ("suma 3") a la regla
 * funcional ("multiplica la posición por 3 y suma 1").
 *
 * Errores típicos (Stacey, 1989; Radford, 2008; ReFIP 5°): suponer
 * proporcionalidad (la figura 20 tiene el doble que la 10), olvidar el
 * término inicial (3 × 20) y contar un salto de más o de menos.
 */

import type { Azar } from '../azar';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export type FiguraLineal = 'cuadrados' | 'triangulos' | 'casas' | 'pentagonos' | 'rejilla';
export type FiguraBaldosas = 'baldosas_cuadrado' | 'baldosas_escalera' | 'baldosas_rectangulo' | 'baldosas_ancho';
export type FiguraSucesion = FiguraLineal | FiguraBaldosas;
export type ReglaSucesion = 'lineal' | 'doble' | 'triple' | 'diferencias' | 'cuadrados' | 'escalera' | 'rectangulo' | 'ancho';
export type ModoSucesion = 'numerica' | 'figuras';

export type PreguntaSucesion = { tipo: 'termino'; posicion: number } | { tipo: 'posicion'; valor: number } | { tipo: 'siguientes'; cantidad: 2 };

export interface PublicoSucesion {
  modo: ModoSucesion;
  figura?: FiguraSucesion;
  /** Términos visibles. En figuras, el valor es deducible contando el dibujo. */
  terminos: { posicion: number; valor: number }[];
  pregunta: PreguntaSucesion;
  /** Reglas funcionales para elegir (nivel 3). */
  opcionesRegla?: string[];
  /** "palitos", "baldosas" o "" en las numéricas. */
  unidad: string;
}

export interface SecretoSucesion {
  tipoRegla: ReglaSucesion;
  /** Primer término (o parámetro base). */
  a: number;
  /** Diferencia (lineal) o primera diferencia (diferencias crecientes). */
  d: number;
  /** Aumento de las diferencias (solo "diferencias"). */
  e: number;
  respuesta: number[];
  reglaCorrecta?: number;
}

export interface RespuestaSucesion {
  valores: number[];
  regla?: number;
}

/** Filas de figuras de palitos que comparten lados: palitos = d × n + 1 (la rejilla, 5 × n + 2). */
export const FIGURAS_LINEALES: Record<FiguraLineal, { a: number; d: number; nombre: string }> = {
  cuadrados: { a: 4, d: 3, nombre: 'cuadrados de palitos' },
  triangulos: { a: 3, d: 2, nombre: 'triángulos de palitos' },
  casas: { a: 6, d: 5, nombre: 'casitas de palitos' },
  pentagonos: { a: 5, d: 4, nombre: 'pentágonos de palitos' },
  rejilla: { a: 7, d: 5, nombre: 'rejilla de dos pisos' },
};

const FIGURA_A_REGLA: Record<FiguraBaldosas, ReglaSucesion> = {
  baldosas_cuadrado: 'cuadrados',
  baldosas_escalera: 'escalera',
  baldosas_rectangulo: 'rectangulo',
  baldosas_ancho: 'ancho',
};

/** Término n (n ≥ 1) de la sucesión. */
export function termino(s: Pick<SecretoSucesion, 'tipoRegla' | 'a' | 'd' | 'e'>, n: number): number {
  switch (s.tipoRegla) {
    case 'lineal':
      return s.a + s.d * (n - 1);
    case 'doble':
      return s.a * 2 ** (n - 1);
    case 'triple':
      return s.a * 3 ** (n - 1);
    case 'diferencias':
      return s.a + s.d * (n - 1) + (s.e * (n - 1) * (n - 2)) / 2;
    case 'cuadrados':
      return n * n + s.a;
    case 'escalera':
      return (n * (n + 1)) / 2;
    case 'rectangulo':
      return n * (n + 1);
    case 'ancho':
      return n * (n + 2);
  }
}

/** Texto de la regla funcional d × n + c (c = a − d puede ser negativo). */
export function textoReglaFuncional(d: number, c: number, sujeto: string): string {
  const ajuste = c > 0 ? ` y suma ${c}` : c < 0 ? ` y resta ${-c}` : '';
  return `Multiplica ${sujeto} por ${d}${ajuste}`;
}

function describirRegla(s: SecretoSucesion): string {
  switch (s.tipoRegla) {
    case 'lineal': {
      const c = s.a - s.d;
      return `término = ${s.d} × posición ${c > 0 ? `+ ${c}` : c < 0 ? `− ${-c}` : ''}`.trim();
    }
    case 'doble':
      return 'cada término es el doble del anterior';
    case 'triple':
      return 'cada término es el triple del anterior';
    case 'diferencias':
      return `las diferencias crecen de ${s.e} en ${s.e}: +${s.d}, +${s.d + s.e}, +${s.d + 2 * s.e}…`;
    case 'cuadrados':
      return s.a === 0 ? 'término = posición × posición' : `término = posición × posición + ${s.a}`;
    case 'escalera':
      return 'cada figura agrega una fila con una baldosa más que la anterior';
    case 'rectangulo':
      return 'término = posición × (posición + 1)';
    case 'ancho':
      return 'término = posición × (posición + 2)';
  }
}

interface Plan {
  s: Omit<SecretoSucesion, 'respuesta' | 'reglaCorrecta'>;
  figura?: FiguraSucesion;
  visibles: number;
  pregunta: PreguntaSucesion;
  conRegla: boolean;
}

function planNumerico(nivel: number, azar: Azar): Plan {
  const lineal = (a: number, d: number): Plan['s'] => ({ tipoRegla: 'lineal', a, d, e: 0 });
  switch (nivel) {
    case 1:
      return { s: lineal(azar.entero(2, 20), azar.entero(2, 9)), visibles: 4, pregunta: { tipo: 'termino', posicion: azar.entero(8, 12) }, conRegla: false };
    case 2:
      return { s: lineal(azar.entero(1, 30), azar.entero(3, 12)), visibles: 4, pregunta: { tipo: 'termino', posicion: azar.entero(15, 25) }, conRegla: false };
    case 3: {
      const d = azar.entero(4, 15);
      let a = azar.entero(5, 50);
      if (a === d) a += 1;
      return { s: lineal(a, d), visibles: 4, pregunta: { tipo: 'termino', posicion: azar.entero(30, 60) }, conRegla: true };
    }
    case 4: {
      const s = lineal(azar.entero(3, 40), azar.entero(3, 12));
      return { s, visibles: 4, pregunta: { tipo: 'posicion', valor: termino(s, azar.entero(12, 40)) }, conRegla: false };
    }
    default: {
      const tipo = azar.elegir(['doble', 'triple', 'diferencias', 'cuadrados'] as const);
      const s: Plan['s'] =
        tipo === 'doble'
          ? { tipoRegla: 'doble', a: azar.entero(1, 9), d: 0, e: 0 }
          : tipo === 'triple'
            ? { tipoRegla: 'triple', a: azar.entero(1, 4), d: 0, e: 0 }
            : tipo === 'diferencias'
              ? { tipoRegla: 'diferencias', a: azar.entero(1, 20), d: azar.entero(1, 5), e: azar.entero(1, 3) }
              : { tipoRegla: 'cuadrados', a: azar.entero(0, 10), d: 0, e: 0 };
      return { s, visibles: tipo === 'triple' ? 4 : 5, pregunta: { tipo: 'siguientes', cantidad: 2 }, conRegla: false };
    }
  }
}

function planFiguras(nivel: number, azar: Azar): Plan {
  if (nivel >= 5) {
    const figura = azar.elegir(['baldosas_cuadrado', 'baldosas_escalera', 'baldosas_rectangulo', 'baldosas_ancho'] as const);
    return { s: { tipoRegla: FIGURA_A_REGLA[figura], a: 0, d: 0, e: 0 }, figura, visibles: 4, pregunta: { tipo: 'termino', posicion: azar.entero(6, 15) }, conRegla: false };
  }
  const figura = azar.elegir(['cuadrados', 'triangulos', 'casas', 'pentagonos', 'rejilla'] as const);
  const { a, d } = FIGURAS_LINEALES[figura];
  const s: Plan['s'] = { tipoRegla: 'lineal', a, d, e: 0 };
  const pregunta: PreguntaSucesion =
    nivel === 1
      ? { tipo: 'termino', posicion: azar.entero(5, 7) }
      : nivel === 2
        ? { tipo: 'termino', posicion: azar.entero(10, 25) }
        : nivel === 3
          ? { tipo: 'termino', posicion: azar.entero(20, 50) }
          : { tipo: 'posicion', valor: termino(s, azar.entero(8, 30)) };
  return { s, figura, visibles: 3, pregunta, conRegla: nivel === 3 };
}

/** Genera una sucesión numérica o de figuras. */
export function generarSucesion(nivel: number, azar: Azar, modo: ModoSucesion): ItemGenerado<PublicoSucesion, SecretoSucesion> {
  const plan = modo === 'figuras' ? planFiguras(nivel, azar) : planNumerico(nivel, azar);
  const { s, visibles, pregunta } = plan;
  const terminos = Array.from({ length: visibles }, (_, i) => ({ posicion: i + 1, valor: termino(s, i + 1) }));
  let respuesta: number[];
  if (pregunta.tipo === 'termino') respuesta = [termino(s, pregunta.posicion)];
  else if (pregunta.tipo === 'posicion') {
    let p = 1;
    while (termino(s, p) < pregunta.valor) p++;
    respuesta = [p];
  } else respuesta = [termino(s, visibles + 1), termino(s, visibles + 2)];

  const unidad = plan.figura ? (plan.figura.startsWith('baldosas') ? 'baldosas' : 'palitos') : '';
  const publico: PublicoSucesion = { modo, terminos, pregunta, unidad };
  if (plan.figura) publico.figura = plan.figura;
  const secreto: SecretoSucesion = { ...s, respuesta };

  if (plan.conRegla) {
    const sujeto = modo === 'figuras' ? 'el número de la figura' : 'la posición';
    const c = s.a - s.d;
    const opciones = azar.barajar([
      [textoReglaFuncional(s.d, c, sujeto), true],
      [textoReglaFuncional(s.d, 0, sujeto), false], // olvida el término inicial
      [textoReglaFuncional(s.a, 0, sujeto), false], // proporcional: "4 palitos por cuadrado"
    ] as [string, boolean][]);
    publico.opcionesRegla = opciones.map(([t]) => t);
    secreto.reglaCorrecta = opciones.findIndex(([, ok]) => ok);
  }

  let consigna: string;
  if (pregunta.tipo === 'termino') {
    consigna =
      unidad === 'palitos'
        ? `¿Cuántos palitos tendrá la figura ${pregunta.posicion}?`
        : unidad === 'baldosas'
          ? `¿Cuántas baldosas tendrá la figura ${pregunta.posicion}?`
          : `¿Qué número va en la posición ${pregunta.posicion}?`;
  } else if (pregunta.tipo === 'posicion') {
    consigna = modo === 'figuras' ? `¿Qué número de figura se arma con ${pregunta.valor} ${unidad}?` : `¿En qué posición aparece el número ${pregunta.valor}?`;
  } else consigna = '¿Cuáles son los dos números que siguen?';
  if (plan.conRegla) consigna += ' Elige también la regla.';

  const voz =
    modo === 'figuras'
      ? `Mira cómo crecen las figuras. ${consigna}`
      : `La sucesión empieza así: ${terminos.map((t) => t.valor).join(', ')}. ${consigna}`;
  return { tipo: 'sucesion', nivel, consigna, voz, publico, secreto };
}

export const sucesion: Mecanica<PublicoSucesion, SecretoSucesion, RespuestaSucesion> = {
  tipo: 'sucesion',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel, azar) {
    return generarSucesion(nivel, azar, azar.probabilidad(0.5) ? 'figuras' : 'numerica');
  },

  validarRespuesta(r: unknown, publico): RespuestaSucesion | null {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    const { valores, regla } = r as Record<string, unknown>;
    const cantidad = publico.pregunta.tipo === 'siguientes' ? publico.pregunta.cantidad : 1;
    if (!Array.isArray(valores) || valores.length !== cantidad || !valores.every((v) => esEnteroEn(v, 0, 99999))) return null;
    if (publico.opcionesRegla) {
      if (!esEnteroEn(regla, 0, publico.opcionesRegla.length - 1)) return null;
      return { valores: valores as number[], regla };
    }
    if (regla !== undefined) return null;
    return { valores: valores as number[] };
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    const valoresBien = respuesta.valores.every((v, i) => v === secreto.respuesta[i]);
    const reglaBien = secreto.reglaCorrecta === undefined || respuesta.regla === secreto.reglaCorrecta;
    if (valoresBien && reglaBien) {
      const extra = publico.pregunta.tipo === 'siguientes' ? '' : ` La regla: ${describirRegla(secreto)}.`;
      return { correcto: true, mensaje: `¡Predicción perfecta!${extra}`, solucion };
    }
    if (valoresBien) {
      return {
        correcto: false,
        diagnostico: 'sucesion_regla',
        mensaje: 'Tu número está bien, pero esa regla no sirve para todos los términos. Pruébala con la posición 1 y con la 2.',
        solucion,
      };
    }
    const { a, d } = secreto;
    const T = (n: number) => termino(secreto, n);
    const v = respuesta.valores[0]!;
    const comprobar = 'Comprueba tu regla con los términos que ya conoces.';

    if (publico.pregunta.tipo === 'termino' && secreto.tipoRegla === 'lineal') {
      const p = publico.pregunta.posicion;
      if (v === T(p - 1) || v === T(p + 1)) {
        return {
          correcto: false,
          diagnostico: 'sucesion_desfase',
          mensaje: `Te corriste un lugar. Desde la posición 1 hasta la ${p} hay ${p - 1} saltos, no ${p}. ${comprobar}`,
          solucion,
        };
      }
      const k = publico.terminos.find((t) => p % t.posicion === 0 && v === t.valor * (p / t.posicion));
      if (k) {
        return {
          correcto: false,
          diagnostico: 'sucesion_proporcional',
          mensaje: `Multiplicaste ${k.valor} × ${p / k.posicion}, pero si la posición se multiplica, el término NO se multiplica igual: el comienzo no se repite. ${comprobar}`,
          solucion,
        };
      }
      if (a !== d && v === d * p) {
        return {
          correcto: false,
          diagnostico: 'sucesion_sin_inicio',
          mensaje: `Usaste ${d} × ${p}, pero la sucesión no empieza en ${d}: empieza en ${a}. ¿Cuánto hay que ajustar? ${comprobar}`,
          solucion,
        };
      }
    }
    if (publico.pregunta.tipo === 'posicion' && secreto.tipoRegla === 'lineal') {
      const p = secreto.respuesta[0]!;
      const V = publico.pregunta.valor;
      if (v === p - 1 || v === p + 1) {
        return { correcto: false, diagnostico: 'sucesion_desfase', mensaje: `¡Casi! Te corriste un lugar. Calcula el término de tu posición y compáralo con ${V}.`, solucion };
      }
      if ((V % d === 0 && v === V / d) || (V % a === 0 && v === V / a)) {
        return {
          correcto: false,
          diagnostico: V % d === 0 && v === V / d ? 'sucesion_sin_inicio' : 'sucesion_proporcional',
          mensaje: `Dividiste ${V} directamente, pero la sucesión no empieza en ${d}: empieza en ${a}. Calcula el término de la posición ${v} para comprobar.`,
          solucion,
        };
      }
    }
    if (publico.pregunta.tipo === 'siguientes' && publico.terminos.length >= 2) {
      const t = publico.terminos;
      const ultimo = t[t.length - 1]!.valor;
      const dif = ultimo - t[t.length - 2]!.valor;
      if (v === ultimo + dif) {
        return {
          correcto: false,
          diagnostico: 'sucesion_aditiva',
          mensaje: `Sumaste siempre ${dif}, pero en esta sucesión los saltos no son iguales. Mira todas las diferencias (o si se multiplica).`,
          solucion,
        };
      }
    }
    return { correcto: false, diagnostico: 'generico', mensaje: `No es ese número. ${comprobar}`, solucion };
  },

  solucion(publico, secreto) {
    const r = secreto.respuesta;
    let simbolico: string;
    const pr = publico.pregunta;
    if (pr.tipo === 'termino' && secreto.tipoRegla === 'lineal') {
      const c = secreto.a - secreto.d;
      simbolico = `${secreto.d} × ${pr.posicion}${c > 0 ? ` + ${c}` : c < 0 ? ` − ${-c}` : ''} = ${r[0]}`;
    } else if (pr.tipo === 'termino') simbolico = `Figura ${pr.posicion}: ${r[0]} ${publico.unidad}`;
    else if (pr.tipo === 'posicion') simbolico = `${pr.valor} está en la posición ${r[0]}`;
    else simbolico = `…, ${publico.terminos.at(-1)!.valor}, ${r[0]}, ${r[1]}`;
    return {
      simbolico,
      explicacion: `La regla: ${describirRegla(secreto)}.${secreto.reglaCorrecta !== undefined ? ` (${publico.opcionesRegla![secreto.reglaCorrecta]}.)` : ''}`,
      respuesta: secreto.reglaCorrecta !== undefined ? { valores: r, regla: secreto.reglaCorrecta } : { valores: r },
    };
  },

  pistas(publico, secreto) {
    const figuras = publico.modo === 'figuras';
    if (secreto.tipoRegla !== 'lineal') {
      const texto2 =
        secreto.tipoRegla === 'doble' || secreto.tipoRegla === 'triple'
          ? `Los saltos no son iguales: cada término es el ${secreto.tipoRegla} del anterior.`
          : secreto.tipoRegla === 'diferencias'
            ? `Mira las diferencias: +${secreto.d}, +${secreto.d + secreto.e}, +${secreto.d + 2 * secreto.e}… ¡Crecen de ${secreto.e} en ${secreto.e}!`
            : secreto.tipoRegla === 'escalera'
              ? 'Cada figura agrega una fila con una baldosa más: +2, +3, +4…'
              : secreto.tipoRegla === 'rectangulo'
                ? 'La figura 3 es un rectángulo de 3 por 4. ¿Cómo será la figura 6?'
                : secreto.tipoRegla === 'ancho'
                  ? 'La figura 3 es un rectángulo de 3 por 5. ¿Cómo será la figura 6?'
                : secreto.a === 0
                  ? 'La figura 3 es un cuadrado de 3 por 3. ¿Cómo será la figura 7?'
                  : `Compara cada término con posición × posición: 1, 4, 9, 16… ¿qué le sumaron?`;
      return [
        { nivel: 1, texto: figuras ? 'Cuenta las baldosas de cada figura. ¿Cómo está armada cada una?' : 'Calcula la diferencia entre cada par de números seguidos. ¿Son todas iguales?' },
        { nivel: 2, texto: texto2, ayudaVisual: 'mostrarSaltos' },
        {
          nivel: 3,
          texto: 'Mira este ejemplo parecido.',
          ayudaVisual: 'ejemplo',
          ejemplo: { texto: '2, 3, 5, 8, 12, …', pasos: ['Diferencias: +1, +2, +3, +4.', 'Las siguientes son +5 y +6.', '12 + 5 = 17 y 17 + 6 = 23.'] },
        },
      ];
    }
    const { a, d } = secreto;
    const texto1 = figuras
      ? `¿Cuántos palitos se agregan de una figura a la siguiente? ¿Y cuántos tiene la figura 1?`
      : '¿Cuánto aumenta de un término al siguiente? ¿Cuántos saltos hay desde la posición 1?';
    const texto2 =
      publico.pregunta.tipo === 'posicion'
        ? `Cada vez se suman ${d}. Desde ${a} hasta ${publico.pregunta.valor}, ¿cuántos saltos de ${d} hay? La posición es un número más que los saltos.`
        : `Cada vez se suman ${d}. Desde la posición 1 hasta la ${publico.pregunta.tipo === 'termino' ? publico.pregunta.posicion : 'que buscas'} hay un salto menos que la posición.`;
    return [
      { nivel: 1, texto: texto1 },
      { nivel: 2, texto: texto2, ayudaVisual: 'mostrarSaltos', valor: d },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: figuras
          ? {
              texto: 'Cuadrados de palitos: 4, 7, 10…',
              pasos: ['El primer cuadrado usa 4 palitos; cada cuadrado nuevo agrega 3.', 'Figura 20: 4 + 19 × 3 = 61.', 'O también: 3 × 20 + 1 = 61. ¡No 4 × 20!'],
            }
          : {
              texto: '5, 9, 13, 17, … ¿posición 30?',
              pasos: ['Se suma 4 cada vez: la regla es 4 × posición + 1.', 'Comprobamos: posición 1 → 4 × 1 + 1 = 5 ✔', 'Posición 30: 4 × 30 + 1 = 121.'],
            },
      },
    ];
  },
};
