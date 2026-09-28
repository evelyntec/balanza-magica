/**
 * "Ríos proporcionales" — proporcionalidad directa, inversa… o ninguna.
 * OA MA07-8: comprender las proporciones directas e inversas: tablas de
 * valores, gráficos, características de la gráfica y problemas de la vida
 * diaria.
 *
 * Se clasifica la relación y se completan valores de la tabla; el gráfico se
 * dibuja con los puntos. Se incluyen relaciones afines (y = 2x + 3) que
 * crecen pero NO son proporcionales. Errores típicos (Hart, 1984; Modestou y
 * Gagatsis, 2007): la estrategia aditiva (sumar en vez de multiplicar), tratar
 * una inversa como directa y creer que "si ambas crecen, es directa".
 */

import type { Azar } from '../azar';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export type TipoProporcion = 'directa' | 'inversa' | 'ninguna';

export interface PublicoProporcion {
  filas: { x: number; y: number | null }[];
  columnaX: string;
  columnaY: string;
  contexto?: string;
}

export interface SecretoProporcion {
  tipo: TipoProporcion;
  /** directa: y = k · x; inversa: x · y = k; ninguna: y = k · x + c. */
  k: number;
  c: number;
  completas: number[];
}

export interface RespuestaProporcion {
  tipo: TipoProporcion;
  valores: number[];
}

export const valorProporcion = (s: Pick<SecretoProporcion, 'tipo' | 'k' | 'c'>, x: number): number =>
  s.tipo === 'directa' ? s.k * x : s.tipo === 'inversa' ? s.k / x : s.k * x + s.c;

const CONSTANTES_INVERSAS = [24, 36, 48, 60, 72, 90, 120, 144, 180, 240, 360];
const divisores = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);

interface Contexto {
  tipo: TipoProporcion;
  texto: (k: number, c: number) => string;
  x: string;
  y: string;
  k: [number, number];
  paso?: number;
  c?: [number, number];
  /** Solo inversas: constantes posibles y rango razonable de x. */
  constantes?: number[];
  rangoX?: [number, number];
}

const CONTEXTOS: Contexto[] = [
  { tipo: 'directa', texto: (k) => `En la feria del volcán, cada kilo de manzanas cuesta $${k}.`, x: 'Kilos', y: 'Precio ($)', k: [600, 1500], paso: 100 },
  { tipo: 'directa', texto: (k) => `Una impresora imprime ${k} páginas por minuto.`, x: 'Minutos', y: 'Páginas', k: [12, 40] },
  { tipo: 'directa', texto: (k) => `Un auto recorre ${k} km con cada litro de bencina.`, x: 'Litros', y: 'Kilómetros', k: [9, 18] },
  { tipo: 'inversa', texto: (k) => `Hay ${k} dulces para repartir en partes iguales.`, x: 'Estudiantes', y: 'Dulces para cada uno', k: [0, 0], constantes: [60, 72, 90, 120, 144], rangoX: [2, 36] },
  { tipo: 'inversa', texto: (k) => `Un bus debe recorrer ${k} km hasta el volcán.`, x: 'Velocidad (km/h)', y: 'Horas de viaje', k: [0, 0], constantes: [120, 180, 240, 360], rangoX: [20, 120] },
  { tipo: 'inversa', texto: (k) => `Pintar la muralla del colegio requiere ${k} horas de trabajo en total, repartidas en partes iguales.`, x: 'Personas', y: 'Horas cada una', k: [0, 0], constantes: [24, 36, 48, 60, 72], rangoX: [2, 12] },
  { tipo: 'ninguna', texto: (k, c) => `Un taxi cobra $${c} al subir y $${k} por cada kilómetro.`, x: 'Kilómetros', y: 'Precio ($)', k: [300, 600], paso: 50, c: [400, 900] },
  { tipo: 'ninguna', texto: (k, c) => `Arrendar una bicicleta cuesta $${c} de garantía más $${k} por hora.`, x: 'Horas', y: 'Precio ($)', k: [500, 1500], paso: 100, c: [1000, 3000] },
];

function redondo(azar: Azar, [min, max]: [number, number], paso = 1) {
  return azar.entero(Math.ceil(min / paso), Math.floor(max / paso)) * paso;
}

export const proporcion: Mecanica<PublicoProporcion, SecretoProporcion, RespuestaProporcion> = {
  tipo: 'proporcion',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoProporcion, SecretoProporcion> {
    const conContexto = nivel >= 4;
    let tipo: TipoProporcion = nivel === 1 ? 'directa' : nivel === 2 ? azar.elegir(['directa', 'inversa'] as const) : azar.elegir(['directa', 'inversa', 'ninguna'] as const);
    let k: number;
    let c = 0;
    let contexto: string | undefined;
    let columnaX = 'x';
    let columnaY = 'y';
    let rangoX: [number, number] = [2, 60];
    if (conContexto) {
      const ctx = azar.elegir(CONTEXTOS);
      tipo = ctx.tipo;
      k = tipo === 'inversa' ? azar.elegir(ctx.constantes!) : redondo(azar, ctx.k, ctx.paso);
      if (ctx.rangoX) rangoX = ctx.rangoX;
      if (ctx.c) c = redondo(azar, ctx.c, ctx.paso);
      contexto = ctx.texto(k, c);
      columnaX = ctx.x;
      columnaY = ctx.y;
    } else if (tipo === 'inversa') k = azar.elegir(CONSTANTES_INVERSAS);
    else {
      k = azar.entero(2, 12);
      if (tipo === 'ninguna') c = azar.entero(1, 15);
    }

    // Valores de x: en la inversa, divisores de k (para que y sea entero).
    const candidatos =
      tipo === 'inversa' ? divisores(k).filter((d) => d >= rangoX[0] && d <= Math.min(k / 2, rangoX[1])) : Array.from({ length: 12 }, (_, i) => i + 1);
    const cantidad = nivel <= 2 ? 4 : 5;
    let xs = azar.barajar(candidatos).slice(0, cantidad);
    xs = nivel === 5 ? xs : [...xs].sort((a, b) => a - b);
    const s = { tipo, k, c };
    const completas = xs.map((x) => valorProporcion(s, x));
    // Faltan 1 (niveles 1–2) o 2 valores, nunca la primera fila (se necesita al menos una fila completa arriba).
    const faltan = nivel <= 2 ? 1 : 2;
    const indices = azar.barajar(xs.map((_, i) => i).slice(1)).slice(0, faltan).sort((a, b) => a - b);
    const filas = xs.map((x, i) => ({ x, y: indices.includes(i) ? null : completas[i]! }));

    const publico: PublicoProporcion = { filas, columnaX, columnaY };
    if (contexto) publico.contexto = contexto;
    return {
      tipo: 'proporcion',
      nivel,
      consigna: '¿Es proporcional directa, inversa o ninguna? Completa la tabla.',
      voz: `${contexto ?? ''} Mira la tabla. ¿La relación es proporcional directa, proporcional inversa o ninguna de las dos? Después completa los valores que faltan.`,
      publico,
      secreto: { tipo, k, c, completas },
    };
  },

  validarRespuesta(r: unknown, publico): RespuestaProporcion | null {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    const { tipo, valores } = r as Record<string, unknown>;
    if (tipo !== 'directa' && tipo !== 'inversa' && tipo !== 'ninguna') return null;
    const faltan = publico.filas.filter((f) => f.y === null).length;
    if (!Array.isArray(valores) || valores.length !== faltan || !valores.every((v) => esEnteroEn(v, 0, 999999))) return null;
    return { tipo, valores: valores as number[] };
  },

  evaluar(publico, secreto, r) {
    const solucion = this.solucion(publico, secreto);
    const huecos = publico.filas.map((f, i) => (f.y === null ? i : -1)).filter((i) => i >= 0);
    const esperados = huecos.map((i) => secreto.completas[i]!);
    const valoresBien = r.valores.every((v, k) => v === esperados[k]);
    const tipoBien = r.tipo === secreto.tipo;
    if (tipoBien && valoresBien) {
      const que =
        secreto.tipo === 'directa'
          ? `Es directa: el cociente ${publico.columnaY.toLowerCase()} ÷ ${publico.columnaX.toLowerCase()} es siempre ${secreto.k}, y su gráfico es una recta que pasa por el origen.`
          : secreto.tipo === 'inversa'
            ? `Es inversa: el producto es siempre ${secreto.k}; si uno se duplica, el otro se reduce a la mitad.`
            : 'No es proporcional: crece, pero el cociente no es constante (su recta no pasa por el origen).';
      return { correcto: true, mensaje: `¡Exacto! ${que}`, solucion };
    }
    const conocidas = publico.filas.filter((f) => f.y !== null) as { x: number; y: number }[];
    // Estrategia aditiva: sumar a y lo mismo que aumentó x.
    const aditiva = huecos.some((i, k) => conocidas.some((f) => r.valores[k] === f.y + (publico.filas[i]!.x - f.x) && r.valores[k] !== esperados[k]));
    if (!valoresBien && secreto.tipo !== 'ninguna' && aditiva) {
      return {
        correcto: false,
        diagnostico: 'proporcion_aditiva',
        mensaje: 'Sumaste lo mismo que aumentó la otra columna. En la proporcionalidad se MULTIPLICA (o se divide) por el mismo número.',
        solucion,
      };
    }
    if (secreto.tipo === 'inversa' && !valoresBien) {
      const comoDirecta = huecos.some((i, k) => conocidas.some((f) => (f.y * publico.filas[i]!.x) % f.x === 0 && r.valores[k] === (f.y * publico.filas[i]!.x) / f.x));
      if (comoDirecta || r.tipo === 'directa') {
        return {
          correcto: false,
          diagnostico: 'proporcion_inversa_directa',
          mensaje: 'Cuando una cantidad aumenta, la otra DISMINUYE: es inversa. Multiplica cada par de la tabla: ¿qué número se repite?',
          solucion,
        };
      }
    }
    if (secreto.tipo === 'ninguna' && r.tipo === 'directa') {
      return {
        correcto: false,
        diagnostico: 'proporcion_afin',
        mensaje: `Que ambas crezcan no basta. Divide ${publico.columnaY.toLowerCase()} ÷ ${publico.columnaX.toLowerCase()} en cada fila: si no da siempre lo mismo, no es proporcional.`,
        solucion,
      };
    }
    if (!tipoBien) {
      return {
        correcto: false,
        diagnostico: 'proporcion_tipo',
        mensaje: 'Revisa el tipo: en la directa el cociente es constante; en la inversa, el producto.',
        solucion,
      };
    }
    return { correcto: false, diagnostico: 'generico', mensaje: 'El tipo está bien; revisa los valores con la constante de la tabla.', solucion };
  },

  solucion(publico, secreto) {
    const regla =
      secreto.tipo === 'directa'
        ? `y = ${secreto.k} · x`
        : secreto.tipo === 'inversa'
          ? `x · y = ${secreto.k}`
          : `y = ${secreto.k} · x + ${secreto.c}`;
    const huecos = publico.filas.map((f, i) => (f.y === null ? i : -1)).filter((i) => i >= 0);
    return {
      simbolico: `${secreto.tipo === 'ninguna' ? 'No proporcional' : `Proporcional ${secreto.tipo}`}: ${regla}`,
      explicacion: `Valores que faltaban: ${huecos.map((i) => `${publico.filas[i]!.x} → ${secreto.completas[i]}`).join(', ')}.`,
      respuesta: { tipo: secreto.tipo, valores: huecos.map((i) => secreto.completas[i]) },
    };
  },

  pistas(publico, secreto) {
    const f = publico.filas.find((x) => x.y !== null)!;
    return [
      { nivel: 1, texto: 'Calcula en cada fila el cociente (y ÷ x) y el producto (x · y). ¿Alguno se repite siempre?' },
      {
        nivel: 2,
        texto:
          secreto.tipo === 'directa'
            ? `El cociente se repite: ${f.y} ÷ ${f.x} = ${secreto.k} en todas las filas.`
            : secreto.tipo === 'inversa'
              ? `El producto se repite: ${f.x} · ${f.y} = ${secreto.k} en todas las filas.`
              : 'Ni el cociente ni el producto se repiten. Pero la diferencia entre filas sí sigue un patrón.',
        ayudaVisual: 'mostrarTotales',
        valor: secreto.k,
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: 'Personas 2, 4, 8 → horas 12, 6, 3',
          pasos: ['Cocientes: 6, 1,5, 0,375: no se repiten.', 'Productos: 24, 24, 24: ¡se repite!', 'Es inversa: con 6 personas, 24 ÷ 6 = 4 horas.'],
        },
      },
    ];
  },
};
