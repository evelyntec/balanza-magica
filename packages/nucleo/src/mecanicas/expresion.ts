/**
 * "La fábrica de fórmulas" y "Letras que generalizan" — de la tabla, la figura
 * o la situación a la expresión con letras.
 * OA MA06-9: relación entre los valores de una tabla; formular una regla con
 * lenguaje matemático. OA MA06-10: representar generalizaciones usando
 * expresiones con letras.
 *
 * La fórmula se ESCRIBE (coeficiente, signo y constante): no se elige entre
 * alternativas. Errores típicos (Stacey, 1989; MacGregor y Stacey, 1993):
 * la regla recursiva escrita como fórmula (n + 3), la proporcional (4 · n
 * para 3 · n + 1) y olvidar la constante.
 */

import type { Azar } from '../azar';
import { FIGURAS_LINEALES, type FiguraLineal } from './sucesion';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export type ModoExpresion = 'tabla' | 'figura' | 'situacion';
export type SignoFormula = '+' | '-';

export interface SituacionExpresion {
  texto: string;
  columnaN: string;
  columnaValor: string;
}

export interface PublicoExpresion {
  modo: ModoExpresion;
  letra: string;
  /** Filas visibles (en figuras, el valor es deducible contando). */
  filas: { n: number; valor: number }[];
  figura?: FiguraLineal;
  situacion?: SituacionExpresion;
  /** Si existe, además se pide el valor para este n. */
  evaluarEn?: number;
}

export interface SecretoExpresion {
  a: number;
  b: number;
  signo: SignoFormula;
  resultado?: number;
}

export interface RespuestaExpresion {
  a: number;
  b: number;
  signo: SignoFormula;
  resultado?: number;
}

export const LETRAS = ['n', 'x', 'p', 't', 'm'] as const;

export const valorFormula = (a: number, b: number, signo: SignoFormula, n: number): number => (signo === '+' ? a * n + b : a * n - b);

export function textoFormula(a: number, b: number, signo: SignoFormula, letra: string): string {
  const base = a === 1 ? letra : `${a} · ${letra}`;
  return b === 0 ? base : `${base} ${signo === '+' ? '+' : '−'} ${b}`;
}

interface Plantilla {
  a: [number, number];
  b: [number, number];
  signo: SignoFormula;
  paso?: number;
  texto: (a: number, b: number) => SituacionExpresion;
}

/** Situaciones de la ciudad. `paso` redondea a y b (precios en pesos). */
const SITUACIONES: Plantilla[] = [
  { a: [2, 2], b: [2, 2], signo: '+', texto: () => ({ texto: 'Mesas cuadradas en fila: en cada lado largo se sienta una persona por mesa y hay una en cada punta.', columnaN: 'Mesas', columnaValor: 'Personas' }) },
  { a: [4, 4], b: [6, 6], signo: '+', texto: () => ({ texto: 'Un tren tiene una locomotora con 6 ruedas y cada vagón tiene 4 ruedas.', columnaN: 'Vagones', columnaValor: 'Ruedas' }) },
  {
    a: [100, 300],
    b: [300, 900],
    signo: '+',
    paso: 50,
    texto: (a, b) => ({ texto: `Un taxi cobra $${b} al subir y $${a} por cada tramo recorrido.`, columnaN: 'Tramos', columnaValor: 'Precio ($)' }),
  },
  {
    a: [200, 500],
    b: [500, 2000],
    signo: '+',
    paso: 100,
    texto: (a, b) => ({ texto: `Sofía tiene $${b} ahorrados y guarda $${a} cada semana.`, columnaN: 'Semanas', columnaValor: 'Ahorro ($)' }),
  },
  { a: [1, 1], b: [20, 40], signo: '+', texto: (_a, b) => ({ texto: `La profesora Evelyn tiene ${b} años más que su sobrino.`, columnaN: 'Edad del sobrino', columnaValor: 'Edad de Evelyn' }) },
  { a: [6, 6], b: [1, 3], signo: '-', texto: (_a, b) => ({ texto: `Cada caja trae 6 huevos. Al llegar a casa se ${b === 1 ? 'rompe 1 huevo' : `rompen ${b} huevos`}.`, columnaN: 'Cajas', columnaValor: 'Huevos sanos' }) },
  { a: [5, 5], b: [2, 4], signo: '-', texto: (_a, b) => ({ texto: `Cada bolsa trae 5 manzanas. Para la colación se sacan ${b} manzanas en total.`, columnaN: 'Bolsas', columnaValor: 'Manzanas que quedan' }) },
];

function redondear(v: number, paso = 1) {
  return Math.round(v / paso) * paso;
}

/** Filas visibles: ordenadas desde 1 o desordenadas. */
function filasDe(a: number, b: number, signo: SignoFormula, ns: number[]) {
  return ns.map((n) => ({ n, valor: valorFormula(a, b, signo, n) }));
}

export function generarExpresion(nivel: number, azar: Azar, contexto: boolean): ItemGenerado<PublicoExpresion, SecretoExpresion> {
  let a: number;
  let b: number;
  let signo: SignoFormula = '+';
  let modo: ModoExpresion = 'tabla';
  let figura: FiguraLineal | undefined;
  let situacion: SituacionExpresion | undefined;
  let ns: number[];
  let evaluarEn: number | undefined;
  const letra = nivel <= 2 ? 'n' : azar.elegir(LETRAS);
  const desordenadas = () => azar.barajar(Array.from({ length: 12 }, (_, i) => i + 1)).slice(0, 4);

  if (!contexto) {
    switch (nivel) {
      case 1:
        a = azar.entero(2, 9);
        b = azar.probabilidad(0.4) ? 0 : azar.entero(1, 9);
        ns = [1, 2, 3, 4];
        break;
      case 2:
        a = azar.entero(2, 12);
        b = azar.entero(1, 20);
        ns = [1, 2, 3, 4];
        break;
      case 3:
        a = azar.entero(2, 12);
        b = azar.entero(1, 30);
        ns = desordenadas();
        break;
      case 4:
        a = azar.entero(3, 12);
        signo = azar.elegir(['+', '-'] as const);
        b = signo === '-' ? azar.entero(1, a - 1) : azar.entero(1, 30);
        ns = desordenadas();
        break;
      default:
        a = azar.entero(3, 15);
        signo = azar.elegir(['+', '-'] as const);
        b = signo === '-' ? azar.entero(1, a - 1) : azar.entero(1, 40);
        ns = desordenadas();
        evaluarEn = azar.elegir([20, 25, 50, 100]);
    }
  } else if (nivel === 3 || ((nivel === 1 || nivel === 5) && azar.probabilidad(0.5))) {
    modo = 'figura';
    figura = azar.elegir(Object.keys(FIGURAS_LINEALES) as FiguraLineal[]);
    const f = FIGURAS_LINEALES[figura];
    a = f.d;
    b = f.a - f.d;
    ns = [1, 2, 3];
    if (nivel >= 3) evaluarEn = azar.entero(nivel === 3 ? 10 : 30, nivel === 3 ? 40 : 99);
  } else {
    modo = 'situacion';
    const pl = azar.elegir(nivel <= 2 ? SITUACIONES.filter((s) => s.signo === '+') : SITUACIONES);
    a = redondear(azar.entero(pl.a[0], pl.a[1]), pl.paso);
    b = redondear(azar.entero(pl.b[0], pl.b[1]), pl.paso);
    signo = pl.signo;
    situacion = pl.texto(a, b);
    ns = nivel <= 2 ? [1, 2, 3, 4] : azar.barajar([1, 2, 3, 4, 5, 6]).slice(0, 4).sort((x, y) => x - y);
    if (nivel >= 4) {
      const tope = Math.floor((9999 - b) / a);
      evaluarEn = Math.min(tope, azar.entero(10, 30));
    }
  }

  const publico: PublicoExpresion = { modo, letra, filas: filasDe(a, b, signo, ns) };
  if (figura) publico.figura = figura;
  if (situacion) publico.situacion = situacion;
  if (evaluarEn !== undefined) publico.evaluarEn = evaluarEn;
  const secreto: SecretoExpresion = { a, b, signo };
  if (evaluarEn !== undefined) secreto.resultado = valorFormula(a, b, signo, evaluarEn);

  const que =
    modo === 'figura'
      ? `los palitos de la figura ${letra}`
      : modo === 'situacion'
        ? `${situacion!.columnaValor.replace(/ \(\$\)/, '').toLowerCase()} según ${situacion!.columnaN.toLowerCase()} (${letra})`
        : `el valor según ${letra}`;
  const consigna = `Escribe la fórmula para ${que}.${evaluarEn !== undefined ? ` Después calcula el valor cuando ${letra} = ${evaluarEn}.` : ''}`;
  return {
    tipo: 'expresion',
    nivel,
    consigna,
    voz: `${situacion ? situacion.texto + ' ' : ''}${consigna} Completa: coeficiente por ${letra}, más o menos, un número.`,
    publico,
    secreto,
  };
}

export const expresion: Mecanica<PublicoExpresion, SecretoExpresion, RespuestaExpresion> = {
  tipo: 'expresion',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel, azar) {
    return generarExpresion(nivel, azar, azar.probabilidad(0.5));
  },

  validarRespuesta(r: unknown, publico): RespuestaExpresion | null {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    const { a, b, signo, resultado } = r as Record<string, unknown>;
    if (!esEnteroEn(a, 0, 9999) || !esEnteroEn(b, 0, 9999) || (signo !== '+' && signo !== '-')) return null;
    if (publico.evaluarEn !== undefined) {
      if (!esEnteroEn(resultado, 0, 999999)) return null;
      return { a, b, signo, resultado };
    }
    if (resultado !== undefined) return null;
    return { a, b, signo };
  },

  evaluar(publico, secreto, r) {
    const solucion = this.solucion(publico, secreto);
    const L = publico.letra;
    const formulaBien = r.a === secreto.a && r.b === secreto.b && (r.signo === secreto.signo || secreto.b === 0);
    const resultadoBien = secreto.resultado === undefined || r.resultado === secreto.resultado;
    const escrita = textoFormula(r.a, r.b, r.signo, L);
    const correcta = textoFormula(secreto.a, secreto.b, secreto.signo, L);
    if (formulaBien && resultadoBien) {
      return {
        correcto: true,
        mensaje: `¡Fórmula perfecta! ${correcta}${secreto.resultado !== undefined ? `, y con ${L} = ${publico.evaluarEn} da ${secreto.resultado}` : ''}.`,
        solucion,
      };
    }
    if (formulaBien) {
      return {
        correcto: false,
        diagnostico: 'formula_evaluacion',
        mensaje: `Tu fórmula ${escrita} está bien, pero revisa el cálculo: reemplaza ${L} por ${publico.evaluarEn}. Primero multiplica, después ${secreto.signo === '+' ? 'suma' : 'resta'}.`,
        solucion,
      };
    }
    const f1 = publico.filas.find((f) => f.n === 1)?.valor ?? valorFormula(secreto.a, secreto.b, secreto.signo, 1);
    const prueba = publico.filas[1] ?? publico.filas[0]!;
    const comprobar = `Prueba tu fórmula con ${L} = ${prueba.n}: ${escrita.replace(new RegExp(`\\b${L}\\b`), String(prueba.n))} = ${valorFormula(r.a, r.b, r.signo, prueba.n)}, y debería dar ${prueba.valor}.`;
    if (secreto.b !== 0 && r.a === 1 && r.b === secreto.a && r.signo === '+') {
      return {
        correcto: false,
        diagnostico: 'formula_recursiva',
        mensaje: `"${L} + ${secreto.a}" dice "súmale ${secreto.a} a ${L}", no "aumenta de ${secreto.a} en ${secreto.a}". Si aumenta ${secreto.a} cada vez, ${L} se multiplica por ${secreto.a}. ${comprobar}`,
        solucion,
      };
    }
    if (secreto.b !== 0 && r.a === f1 && r.b === 0) {
      return {
        correcto: false,
        diagnostico: 'formula_proporcional',
        mensaje: `${escrita} funciona para ${L} = 1, pero no para los demás: no es proporcional. ¿Cuánto aumenta de uno al siguiente? ${comprobar}`,
        solucion,
      };
    }
    if (r.a === secreto.a && r.b === 0 && secreto.b !== 0) {
      return { correcto: false, diagnostico: 'formula_sin_constante', mensaje: `El ${secreto.a} · ${L} está muy bien, ¡pero falta algo! ${comprobar}`, solucion };
    }
    if (r.a === secreto.a) {
      return { correcto: false, diagnostico: 'formula_constante', mensaje: `El coeficiente ${secreto.a} está bien; revisa el número que ${secreto.signo === '+' ? 'se suma' : 'se resta'}. ${comprobar}`, solucion };
    }
    return { correcto: false, diagnostico: 'generico', mensaje: `¿Cuánto aumenta el valor cada vez que ${L} aumenta en 1? Ese es el número que multiplica a ${L}. ${comprobar}`, solucion };
  },

  solucion(publico, secreto) {
    const f = textoFormula(secreto.a, secreto.b, secreto.signo, publico.letra);
    const ev = publico.evaluarEn;
    return {
      simbolico: ev === undefined ? f : `${f};  ${f.replace(new RegExp(`\\b${publico.letra}\\b`), `${ev}`)} = ${secreto.resultado}`,
      explicacion: `Cada vez que ${publico.letra} aumenta en 1, el valor aumenta ${secreto.a}: por eso ${secreto.a === 1 ? publico.letra : `${secreto.a} · ${publico.letra}`}${secreto.b === 0 ? '' : `, y se ajusta ${secreto.signo === '+' ? 'sumando' : 'restando'} ${secreto.b}`}.`,
      respuesta: { a: secreto.a, b: secreto.b, signo: secreto.signo, ...(secreto.resultado !== undefined ? { resultado: secreto.resultado } : {}) },
    };
  },

  pistas(publico, secreto) {
    const L = publico.letra;
    return [
      { nivel: 1, texto: `¿Cuánto aumenta el valor cuando ${L} aumenta en 1? ¡Cuidado si la tabla está desordenada!` },
      {
        nivel: 2,
        texto: `Aumenta ${secreto.a} cada vez, así que la fórmula empieza con ${secreto.a === 1 ? L : `${secreto.a} · ${L}`}. Calcula ${secreto.a} · ${publico.filas[0]!.n} y compáralo con ${publico.filas[0]!.valor}: ¿cuánto hay que sumar o restar?`,
        ayudaVisual: 'mostrarSaltos',
        valor: secreto.a,
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: 'n: 1, 2, 3 → 7, 11, 15',
          pasos: ['Aumenta de 4 en 4: la fórmula empieza con 4 · n.', 'Con n = 1: 4 · 1 = 4, pero debe dar 7. Falta sumar 3.', 'Fórmula: 4 · n + 3. Comprobamos: 4 · 3 + 3 = 15 ✔'],
        },
      },
    ];
  },
};
