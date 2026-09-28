/**
 * "Ecuaciones de lava" — ax = b, x/a = b y sus inecuaciones.
 * OA MA07-9: ecuaciones e inecuaciones lineales de la forma ax = b;
 * x/a = b; ax < b; ax > b; x/a < b; x/a > b (a, b ∈ N; a ≠ 0).
 *
 * Igual que en "Espejismos" (5°), se escribe el borde y se elige cómo se
 * dibuja la solución: ahora con multiplicación y división, y con la
 * operación inversa como error típico.
 */

import type { Azar } from '../azar';
import type { RespuestaGrafico, SecretoGrafico, TipoGrafico } from './graficoSolucion';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export type FormaMult = 'ax=b' | 'x/a=b' | 'ax<b' | 'ax>b' | 'x/a<b' | 'x/a>b' | 'b<ax' | 'b>x/a';

export interface PublicoMult {
  forma: FormaMult;
  a: number;
  b: number;
  letra: string;
  /** Texto de la ecuación o inecuación, listo para mostrar. */
  texto: string;
  desde: number;
  hasta: number;
  marca: number;
}

export const divide = (f: FormaMult) => f.includes('/');

export function textoMult(forma: FormaMult, a: number, b: number, L: string, x?: number): string {
  const s = x === undefined ? L : String(x);
  const ax = x === undefined ? `${a}${L}` : `${a} · ${x}`;
  const xa = `${s}/${a}`;
  switch (forma) {
    case 'ax=b':
      return `${ax} = ${b}`;
    case 'x/a=b':
      return `${xa} = ${b}`;
    case 'ax<b':
      return `${ax} < ${b}`;
    case 'ax>b':
      return `${ax} > ${b}`;
    case 'x/a<b':
      return `${xa} < ${b}`;
    case 'x/a>b':
      return `${xa} > ${b}`;
    case 'b<ax':
      return `${b} < ${ax}`;
    case 'b>x/a':
      return `${b} > ${xa}`;
  }
}

export function resolverMult(forma: FormaMult, a: number, b: number): SecretoGrafico {
  const borde = divide(forma) ? a * b : b / a;
  const tipo: TipoGrafico = forma.includes('=') ? 'punto' : forma === 'ax<b' || forma === 'x/a<b' || forma === 'b>x/a' ? 'izquierda' : 'derecha';
  return { borde, tipo };
}

export const ecuacionMult: Mecanica<PublicoMult, SecretoGrafico, RespuestaGrafico> = {
  tipo: 'ecuacion_mult',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoMult, SecretoGrafico> {
    const formas: FormaMult[][] = [
      ['ax=b', 'x/a=b'],
      ['ax=b', 'x/a=b', 'ax<b', 'ax>b'],
      ['ax=b', 'x/a=b', 'ax<b', 'ax>b', 'x/a<b', 'x/a>b'],
      ['ax<b', 'ax>b', 'x/a<b', 'x/a>b', 'b<ax', 'b>x/a', 'ax=b'],
      ['ax=b', 'x/a=b', 'ax<b', 'ax>b', 'x/a<b', 'x/a>b', 'b<ax', 'b>x/a'],
    ];
    const forma = azar.elegir(formas[nivel - 1]!);
    const letra = nivel <= 2 ? 'x' : azar.elegir(['x', 'y', 'n', 'm', 't']);
    const [aMax, xMax] = nivel <= 2 ? [9, 12] : nivel <= 4 ? [12, 30] : [25, 40];
    const a = azar.entero(2, aMax);
    let b: number;
    if (divide(forma)) b = azar.entero(2, Math.min(xMax, Math.floor(1000 / a)));
    else b = a * azar.entero(2, xMax);
    const { borde, tipo } = resolverMult(forma, a, b);
    const marca = borde <= 60 ? 5 : borde <= 150 ? 10 : borde <= 400 ? 50 : 100;
    const k = azar.entero(1, 8);
    const desde = Math.max(0, (Math.floor(borde / marca) - k) * marca);
    const texto = textoMult(forma, a, b, letra);
    return {
      tipo: 'ecuacion_mult',
      nivel,
      consigna: '¿Un solo número o muchos? Escribe el borde y elige cómo se dibuja la solución.',
      voz: `Resuelve ${texto.replace('/', ' dividido por ')}. ¿Es un solo número o son muchos? Escribe el borde y elige cómo se dibuja la solución.`,
      publico: { forma, a, b, letra, texto, desde, hasta: desde + 10 * marca, marca },
      secreto: { borde, tipo },
      relacional: forma.startsWith('b'),
    };
  },

  validarRespuesta(r: unknown): RespuestaGrafico | null {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    const { valor, tipo } = r as Record<string, unknown>;
    if (!esEnteroEn(valor, 0, 99999)) return null;
    if (tipo !== 'punto' && tipo !== 'izquierda' && tipo !== 'derecha') return null;
    return { valor, tipo };
  },

  evaluar(publico, secreto, r) {
    const solucion = this.solucion(publico, secreto);
    const { borde, tipo } = secreto;
    const L = publico.letra;
    if (r.valor === borde && r.tipo === tipo) {
      return {
        correcto: true,
        mensaje:
          tipo === 'punto'
            ? `¡Exacto! ${L} = ${borde}. Comprobamos: ${textoMult(publico.forma, publico.a, publico.b, L, borde)} ✔`
            : `¡Muy bien! ${L} ${tipo === 'izquierda' ? '<' : '>'} ${borde}: todos los números ${tipo === 'izquierda' ? 'menores' : 'mayores'} que ${borde} (círculo vacío).`,
        solucion,
      };
    }
    if (r.valor === borde) {
      if (r.tipo === 'punto') return { correcto: false, diagnostico: 'inecuacion_igualdad', mensaje: `${borde} es el borde, pero no es "=": hay muchas soluciones. Círculo vacío y flecha.`, solucion };
      if (tipo === 'punto') return { correcto: false, diagnostico: 'ecuacion_rayo', mensaje: 'Es una ecuación: una sola solución, punto lleno.', solucion };
      return { correcto: false, diagnostico: 'inecuacion_direccion', mensaje: `El borde está bien, pero la flecha va al otro lado. Prueba con ${borde + 1}: ¿cumple?`, solucion };
    }
    const inversa = divide(publico.forma) ? publico.b / publico.a : publico.a * publico.b;
    if (r.valor === inversa) {
      return {
        correcto: false,
        diagnostico: 'operacion_inversa',
        mensaje: divide(publico.forma)
          ? `Dividiste, pero ${L} está DIVIDIDO por ${publico.a}: para despejarlo hay que multiplicar.`
          : `Multiplicaste, pero ${L} está MULTIPLICADO por ${publico.a}: para despejarlo hay que dividir.`,
        solucion,
      };
    }
    return { correcto: false, diagnostico: 'generico', mensaje: `Busca el número que haría verdadera la igualdad. Comprueba reemplazándolo en ${publico.texto}.`, solucion };
  },

  solucion(publico, secreto) {
    const { borde, tipo } = secreto;
    const L = publico.letra;
    const op = divide(publico.forma) ? `${publico.b} · ${publico.a}` : `${publico.b} ÷ ${publico.a}`;
    return {
      simbolico: `${publico.texto}  →  ${L} ${tipo === 'punto' ? '=' : tipo === 'izquierda' ? '<' : '>'} ${op} = ${borde}`,
      explicacion:
        tipo === 'punto'
          ? `Una sola solución: ${L} = ${borde}.`
          : `Todos los números ${tipo === 'izquierda' ? 'menores' : 'mayores'} que ${borde}: círculo vacío en ${borde} y flecha hacia la ${tipo}.`,
      respuesta: { valor: borde, tipo },
    };
  },

  pistas(publico, secreto) {
    const L = publico.letra;
    return [
      {
        nivel: 1,
        texto: divide(publico.forma)
          ? `${L} está dividido por ${publico.a}. ¿Qué operación lo deshace?`
          : `${L} está multiplicado por ${publico.a}. ¿Qué operación lo deshace?`,
      },
      {
        nivel: 2,
        texto: `El borde es ${divide(publico.forma) ? `${publico.b} · ${publico.a}` : `${publico.b} ÷ ${publico.a}`}. Después mira el signo.`,
        ayudaVisual: 'mostrarTotales',
        valor: secreto.borde,
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: { texto: 'x/4 > 6', pasos: ['Multiplicamos por 4 ambos lados: x > 24.', 'Con 25: 25/4 = 6,25 > 6 ✔. Con 24: 6 > 6 ✘.', 'Círculo vacío en 24 y flecha a la derecha.'] },
      },
    ];
  },
};
