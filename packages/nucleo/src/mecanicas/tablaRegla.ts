/**
 * "La máquina de reglas" — patrones numéricos en tablas con una operación.
 * OA MA04-13: identificar y describir patrones numéricos en tablas que
 * involucren una operación.
 *
 * Error típico (Cetina-Vázquez y Cabañas-Sánchez 2022): mirar solo la columna
 * de salida y seguirla "hacia abajo" (estrategia recursiva) en vez de
 * relacionar cada entrada con su salida. Desde el nivel 3 las entradas vienen
 * desordenadas: la estrategia recursiva deja de funcionar y se diagnostica.
 */

import type { Azar } from '../azar';
import { arregloDeEnteros, type ItemGenerado, type Mecanica } from './mecanica';

export type Operacion = '+' | '−' | '×' | '÷';

export interface FilaTabla {
  entrada: number | null;
  salida: number | null;
}

export interface PublicoTablaRegla {
  modo: 'completar' | 'regla' | 'inversa';
  filas: FilaTabla[];
  opcionesRegla?: string[];
}

export interface SecretoTablaRegla {
  op: Operacion;
  k: number;
  completas: { entrada: number; salida: number }[];
  regla: string;
}

export interface RespuestaTablaRegla {
  valores: number[];
  regla?: string;
}

export const textoReglaTabla = (op: Operacion, k: number): string => `${op} ${k}`;

export function aplicar(op: Operacion, k: number, n: number): number {
  switch (op) {
    case '+':
      return n + k;
    case '−':
      return n - k;
    case '×':
      return n * k;
    case '÷':
      return n / k;
  }
}

/** Entradas válidas para la operación (salidas enteras entre 0 y 100). */
function entradasPosibles(op: Operacion, k: number): number[] {
  const todas = Array.from({ length: 101 }, (_, i) => i);
  return todas.filter((n) => {
    const s = aplicar(op, k, n);
    if (!Number.isInteger(s) || s < 0 || s > 100) return false;
    if (op === '÷') return n > 0;
    if (op === '×') return n <= 12;
    return n >= 1;
  });
}

function elegirOperacion(nivel: number, azar: Azar): { op: Operacion; k: number } {
  if (nivel === 1) return { op: azar.elegir(['+', '−'] as const), k: azar.entero(2, 20) };
  if (nivel === 2) return { op: '×', k: azar.entero(2, 10) };
  const op = azar.elegir(['+', '−', '×', '÷'] as const);
  const k = op === '×' || op === '÷' ? azar.entero(2, 10) : azar.entero(3, 30);
  return { op, k };
}

/** Posiciones de huecos: lista de [fila, columna]. */
type Hueco = [number, 'entrada' | 'salida'];

export const tablaRegla: Mecanica<PublicoTablaRegla, SecretoTablaRegla, RespuestaTablaRegla> = {
  tipo: 'tabla_regla',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoTablaRegla, SecretoTablaRegla> {
    for (let intento = 0; intento < 300; intento++) {
      const { op, k } = elegirOperacion(nivel, azar);
      const posibles = entradasPosibles(op, k);
      if (posibles.length < 8) continue;
      let entradas: number[];
      if (nivel <= 2) {
        // Entradas seguidas (1, 2, 3… o desde un inicio).
        const inicio = azar.elegir(posibles.slice(0, Math.max(1, posibles.length - 5)));
        entradas = Array.from({ length: 5 }, (_, i) => inicio + i);
        if (!entradas.every((e) => posibles.includes(e))) continue;
      } else {
        entradas = azar.barajar(posibles).slice(0, 5);
        // Desordenadas de verdad: no deben quedar en orden creciente.
        if (entradas.every((e, i) => i === 0 || e > (entradas[i - 1] as number))) continue;
      }
      const completas = entradas.map((entrada) => ({ entrada, salida: aplicar(op, k, entrada) }));
      if (new Set(completas.map((f) => f.salida)).size < 5) continue;

      const modo: PublicoTablaRegla['modo'] = nivel === 3 ? 'regla' : nivel === 5 ? 'inversa' : 'completar';
      let huecos: Hueco[];
      if (nivel === 1) huecos = [[3, 'salida'], [4, 'salida']];
      else if (nivel === 2) huecos = azar.barajar([1, 2, 3, 4]).slice(0, 2).map((f) => [f, 'salida'] as Hueco);
      else if (nivel === 3) huecos = [[azar.entero(2, 4), 'salida']];
      else if (nivel === 4) huecos = azar.barajar([1, 2, 3, 4]).slice(0, 3).map((f) => [f, 'salida'] as Hueco);
      else {
        const filas = azar.barajar([1, 2, 3, 4]);
        huecos = [[filas[0] as number, 'entrada'], [filas[1] as number, 'entrada'], [filas[2] as number, 'salida']];
      }
      huecos.sort((a, b) => a[0] - b[0] || (a[1] === 'entrada' ? -1 : 1));
      const filas: FilaTabla[] = completas.map((f, i) => ({
        entrada: huecos.some(([h, c]) => h === i && c === 'entrada') ? null : f.entrada,
        salida: huecos.some(([h, c]) => h === i && c === 'salida') ? null : f.salida,
      }));
      const regla = textoReglaTabla(op, k);
      const publico: PublicoTablaRegla = { modo, filas };
      if (modo === 'regla') {
        // Distractores: regla recursiva (diferencia entre salidas vecinas) y regla aditiva que sirve solo para la primera fila.
        const f0 = completas[0] as { entrada: number; salida: number };
        const f1 = completas[1] as { entrada: number; salida: number };
        const candidatas = new Set<string>([regla]);
        const dif = f0.salida - f0.entrada;
        if (op !== '+' && op !== '−' && dif !== 0) candidatas.add(dif > 0 ? textoReglaTabla('+', dif) : textoReglaTabla('−', -dif));
        const recursiva = f1.salida - f0.salida;
        if (recursiva !== 0) candidatas.add(recursiva > 0 ? textoReglaTabla('+', Math.abs(recursiva)) : textoReglaTabla('−', Math.abs(recursiva)));
        candidatas.add(op === '×' ? textoReglaTabla('+', k) : op === '+' ? textoReglaTabla('×', Math.max(2, Math.min(10, k))) : op === '−' ? textoReglaTabla('÷', 2) : textoReglaTabla('−', k));
        let extra = 2;
        while (candidatas.size < 4) candidatas.add(textoReglaTabla(op, k + extra++));
        publico.opcionesRegla = azar.barajar([...candidatas].slice(0, 4));
        if (!publico.opcionesRegla.includes(regla)) continue;
      }
      return {
        tipo: 'tabla_regla',
        nivel,
        consigna:
          modo === 'regla'
            ? 'La máquina aplica siempre la misma regla. ¿Cuál es? Elige la regla y completa la tabla.'
            : modo === 'inversa'
              ? 'Completa la tabla. ¡Ojo! A veces falta el número que ENTRA a la máquina.'
              : 'La máquina aplica siempre la misma regla. Completa los números que faltan.',
        voz: 'Cada número que entra a la máquina sale transformado con la misma regla. Descubre la regla mirando cada entrada con su salida, y completa la tabla.',
        publico,
        secreto: { op, k, completas, regla },
        relacional: nivel >= 3,
      };
    }
    throw new Error('No se pudo generar la tabla');
  },

  validarRespuesta(r: unknown, publico): RespuestaTablaRegla | null {
    if (typeof r !== 'object' || r === null) return null;
    const { valores, regla } = r as Record<string, unknown>;
    const n = publico.filas.reduce((s, f) => s + (f.entrada === null ? 1 : 0) + (f.salida === null ? 1 : 0), 0);
    const v = arregloDeEnteros(valores, n, 0, 999);
    if (!v) return null;
    if (publico.modo === 'regla') {
      if (typeof regla !== 'string' || !publico.opcionesRegla?.includes(regla)) return null;
      return { valores: v, regla };
    }
    return { valores: v };
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    const esperados = publico.filas.flatMap((f, i) => {
      const c = secreto.completas[i] as { entrada: number; salida: number };
      return [...(f.entrada === null ? [c.entrada] : []), ...(f.salida === null ? [c.salida] : [])];
    });
    const reglaOk = publico.modo !== 'regla' || respuesta.regla === secreto.regla;
    if (reglaOk && respuesta.valores.every((v, i) => v === esperados[i])) {
      return { correcto: true, mensaje: `¡Sí! La regla de la máquina es ${secreto.regla}.`, solucion };
    }
    if (!reglaOk) {
      return {
        correcto: false,
        diagnostico: 'patron_regla',
        mensaje: 'Esa regla no sirve para todas las filas. Prueba la regla con cada entrada: ¿da la salida que muestra la tabla?',
        solucion,
      };
    }
    // ¿Siguió la columna de salida hacia abajo (estrategia recursiva)?
    const salidas = publico.filas.map((f) => f.salida);
    const conocidas = salidas.flatMap((s, i) => (s === null ? [] : [[i, s] as const]));
    if (conocidas.length >= 2) {
      const [[i0, s0], [i1, s1]] = conocidas as [readonly [number, number], readonly [number, number]];
      const paso = (s1 - s0) / (i1 - i0);
      const recursivos = publico.filas.flatMap((f, i) => (f.salida === null && f.entrada !== null ? [s0 + paso * (i - i0)] : []));
      const dados = respuesta.valores.slice(-recursivos.length);
      if (recursivos.length > 0 && Number.isInteger(paso) && recursivos.every((v, k) => v === dados[k]) && publico.filas.some((f, i) => i > 0 && (f.entrada ?? 0) < (publico.filas[i - 1]?.entrada ?? 0))) {
        return {
          correcto: false,
          diagnostico: 'regla_recursiva',
          mensaje: 'Seguiste la columna de salida hacia abajo, pero las entradas no están en orden. Mira cada fila: ¿qué le hace la máquina a SU número de entrada?',
          solucion,
        };
      }
    }
    // ¿Usó una regla de suma que solo sirve para la primera fila?
    const f0 = secreto.completas[0] as { entrada: number; salida: number };
    const dif = f0.salida - f0.entrada;
    const aditivos = publico.filas.flatMap((f, i) => {
      const c = secreto.completas[i] as { entrada: number; salida: number };
      return [...(f.entrada === null ? [c.salida - dif] : []), ...(f.salida === null ? [c.entrada + dif] : [])];
    });
    if ((secreto.op === '×' || secreto.op === '÷') && aditivos.every((v, i) => v === respuesta.valores[i])) {
      return {
        correcto: false,
        diagnostico: 'regla_operacion',
        mensaje: `Sumar ${Math.abs(dif)} solo funciona en la primera fila. Revisa las demás: ¿la máquina suma, resta, multiplica o divide?`,
        solucion,
      };
    }
    return {
      correcto: false,
      diagnostico: 'generico',
      mensaje: 'Algún número no cumple la regla. Revisa fila por fila: entrada → regla → salida.',
      solucion,
    };
  },

  solucion(_publico, secreto) {
    return {
      simbolico: secreto.completas.map((f) => `${f.entrada} ${secreto.regla} = ${f.salida}`).join('\n'),
      explicacion: `La máquina aplica ${secreto.regla} a cada número que entra.`,
      respuesta: secreto.completas,
    };
  },

  pistas(publico) {
    return [
      { nivel: 1, texto: 'Mira una fila completa: ¿qué operación transforma la entrada en la salida? Pruébala en otra fila.' },
      {
        nivel: 2,
        texto:
          publico.modo === 'inversa'
            ? 'Para encontrar la entrada, haz la operación inversa: si la máquina suma, tú restas; si multiplica, tú divides.'
            : 'Mostramos flechas de cada entrada a su salida. ¡Cuidado! Las entradas pueden estar desordenadas.',
        ayudaVisual: 'mostrarSaltos',
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: 'Entradas 3, 7, 5 → salidas 12, 28, 20',
          pasos: ['3 + 9 = 12, pero 7 + 9 = 16, no 28: no es +9.', '3 × 4 = 12, 7 × 4 = 28, 5 × 4 = 20 ✔', 'La regla es × 4.'],
        },
      },
    ];
  },
};
